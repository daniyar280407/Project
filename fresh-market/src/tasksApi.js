const API_URL = "https://dummyjson.com";
const REQUEST_TIMEOUT = 15000;
const authorCache = new Map();

class ApiError extends Error {}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isId(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function requireId(value) {
  const id = typeof value === "string" && /^\d+$/.test(value)
    ? Number(value)
    : value;
  if (!isId(id)) throw new ApiError("Некорректный ID пользователя или задачи.");
  return id;
}

// Один помощник задаёт тайм-аут и безопасные сообщения для всех запросов.
async function request(path, { method = "GET", body } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError("Задача или пользователь не найдены.");
      }
      if (response.status === 429) {
        throw new ApiError("Слишком много запросов. Повторите попытку немного позже.");
      }
      throw new ApiError("Сервис задач временно недоступен. Повторите попытку.");
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw new ApiError("Сервис вернул некорректный ответ. Повторите попытку.");
    }
    if (!isObject(data)) {
      throw new ApiError("Сервис вернул некорректные данные. Повторите попытку.");
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error?.name === "AbortError") {
      throw new ApiError("Сервис долго не отвечает. Повторите попытку.");
    }
    throw new ApiError("Не удалось связаться с сервисом. Проверьте подключение к интернету.");
  } finally {
    clearTimeout(timeout);
  }
}

function isTask(task) {
  return isObject(task) && isId(task.id) && typeof task.todo === "string"
    && typeof task.completed === "boolean" && isId(task.userId);
}

function readTask(task) {
  if (!isTask(task)) {
    throw new ApiError("Не удалось прочитать задачу из ответа сервера.");
  }
  return {
    id: task.id,
    todo: task.todo,
    completed: task.completed,
    userId: task.userId,
  };
}

function readTasks(data, userId) {
  if (!Array.isArray(data.todos) || !data.todos.every(isTask)
    || (userId !== undefined && data.todos.some((task) => task.userId !== userId))) {
    throw new ApiError("Не удалось прочитать список задач. Повторите загрузку.");
  }
  return data.todos.map(readTask);
}

function isAuthor(author) {
  return isObject(author) && isId(author.id)
    && typeof author.username === "string"
    && typeof author.firstName === "string"
    && typeof author.lastName === "string";
}

function pick(source, keys) {
  return Object.fromEntries(keys
    .filter((key) => source[key] !== undefined)
    .map((key) => [key, source[key]]));
}

function readAddress(address) {
  if (!isObject(address)) return undefined;
  const result = pick(address, ["address", "city", "state", "stateCode", "postalCode", "country"]);
  if (isObject(address.coordinates)) {
    result.coordinates = pick(address.coordinates, ["lat", "lng"]);
  }
  return result;
}

// Белый список не пропускает пароли, банковские данные и служебные поля API.
function readAuthor(author) {
  if (!isAuthor(author)) {
    throw new ApiError("Не удалось прочитать профиль пользователя. Повторите загрузку.");
  }
  const result = pick(author, [
    "id", "username", "firstName", "lastName", "maidenName", "age", "gender",
    "email", "phone", "birthDate", "image", "bloodGroup", "height", "weight",
    "eyeColor", "university", "role",
  ]);
  if (isObject(author.hair)) result.hair = pick(author.hair, ["color", "type"]);
  if (isObject(author.address)) result.address = readAddress(author.address);
  if (isObject(author.company)) {
    result.company = pick(author.company, ["department", "name", "title"]);
    if (isObject(author.company.address)) {
      result.company.address = readAddress(author.company.address);
    }
  }
  return result;
}

export async function getTasks() {
  return readTasks(await request("/todos?limit=0", { method: "GET" }));
}

export function getAuthor(value) {
  let id;
  try {
    id = requireId(value);
  } catch (error) {
    return Promise.reject(error);
  }
  if (authorCache.has(id)) return authorCache.get(id);

  // Повторные карточки автора используют один общий запрос.
  const promise = request(`/users/${id}`, { method: "GET" })
    .then((data) => {
      const author = readAuthor(data);
      if (author.id !== id) throw new ApiError("Сервис вернул профиль другого пользователя.");
      return author;
    })
    .catch((error) => {
      if (authorCache.get(id) === promise) authorCache.delete(id);
      throw error;
    });
  authorCache.set(id, promise);
  return promise;
}

export async function getAuthorTasks(value) {
  const id = requireId(value);
  return readTasks(await request(`/todos/user/${id}?limit=0`, { method: "GET" }), id);
}

export async function getAuthors() {
  const data = await request("/users?limit=0&select=id,username,firstName,lastName,image", { method: "GET" });
  if (!Array.isArray(data.users) || !data.users.every(isAuthor)) {
    throw new ApiError("Не удалось прочитать список авторов. Повторите загрузку.");
  }
  return data.users.map((author) => pick(author, ["id", "username", "firstName", "lastName", "image"]));
}

function taskChanges(value, partial = false) {
  if (!isObject(value)) throw new ApiError("Проверьте данные задачи.");
  const changes = pick(value, ["todo", "userId", "completed"]);
  if ((!partial || "todo" in changes)
    && (typeof changes.todo !== "string" || !changes.todo.trim())) {
    throw new ApiError("Введите текст задачи.");
  }
  if ((!partial || "userId" in changes) && !isId(changes.userId)) {
    throw new ApiError("Выберите автора задачи.");
  }
  if ((!partial || "completed" in changes) && typeof changes.completed !== "boolean") {
    throw new ApiError("Укажите корректный статус задачи.");
  }
  if (!Object.keys(changes).length) throw new ApiError("Нет изменений для сохранения.");
  return changes;
}

// DummyJSON имитирует запись: интерфейс хранит подтверждённые изменения сам.
export async function addTask(task) {
  return readTask(await request("/todos/add", { method: "POST", body: taskChanges(task) }));
}

export async function updateTask(value, changes) {
  const id = requireId(value);
  const task = readTask(await request(`/todos/${id}`, { method: "PATCH", body: taskChanges(changes, true) }));
  if (task.id !== id) throw new ApiError("Сервис вернул другую задачу. Повторите попытку.");
  return task;
}

export async function deleteTask(value) {
  const id = requireId(value);
  const task = readTask(await request(`/todos/${id}`, { method: "DELETE" }));
  if (task.id !== id) throw new ApiError("Сервис вернул другую задачу. Повторите попытку.");
  return task;
}

export function clearAuthorCache() {
  authorCache.clear();
}
