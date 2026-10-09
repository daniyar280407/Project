// Адрес учебного API.
const API = "https://dummyjson.com";
const category = document.querySelector("#category");
const idInput = document.querySelector("#product-id");
const titleInput = document.querySelector("#title");
const products = document.querySelector("#products");
const status = document.querySelector("#status");
const result = document.querySelector("#result");
const info = document.querySelector("#info");
const buttons = document.querySelectorAll("button");

// Ошибка ввода: HTTP-запрос ещё не отправлен.
function inputError(text) {
  status.textContent = "Запрос не отправлен";
  info.textContent = text;
  result.textContent = "";
}

function getId() {
  const id = Number(idInput.value);
  if (!Number.isInteger(id) || id < 1) {
    inputError("Введи целый ID больше нуля.");
    return null;
  }
  return id;
}

function getBody() {
  const title = titleInput.value.trim();
  if (!title) {
    inputError("Введи название товара.");
    return null;
  }
  return { title };
}

// Одна функция отправляет запрос и показывает статус и JSON.
async function request(path, method = "GET", body) {
  buttons.forEach(button => button.disabled = true);
  status.textContent = method + " " + API + path;
  info.textContent = "Загрузка...";
  result.textContent = "";

  try {
    const options = { method };
    if (body) {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(body);
    }

    const response = await fetch(API + path, options);
    const data = await response.json();
    status.textContent = method + " " + path + " — HTTP " + response.status;
    result.textContent = JSON.stringify(data, null, 2);

    if (!response.ok) {
      info.textContent = "Ошибка сервера: " + (data.message || response.status);
      return null;
    }

    info.textContent = method === "GET"
      ? "Данные получены."
      : "Операция имитируется. Изменения на сервере не сохраняются.";
    return data;
  } catch (error) {
    status.textContent = "Не удалось получить ответ";
    info.textContent = "Ошибка сети или чтения ответа: " + error.message;
    return null;
  } finally {
    buttons.forEach(button => button.disabled = false);
  }
}

// READ: получить список товаров из выбранной категории.
document.querySelector("#load").addEventListener("click", async () => {
  products.replaceChildren();
  const path = category.value
    ? "/products/category/" + encodeURIComponent(category.value) + "?limit=10"
    : "/products?limit=10";
  const data = await request(path);
  if (!data) return;

  for (const product of data.products) {
    const li = document.createElement("li");
    li.textContent = "ID " + product.id + ": " + product.title + " — $" + product.price;
    products.append(li);
  }
});

// READ: получить один товар.
document.querySelector("#read").addEventListener("click", async () => {
  const id = getId();
  if (id === null) return;
  const data = await request("/products/" + id);
  if (data) titleInput.value = data.title;
});

// CREATE: добавить товар. Полученный новый ID не сохраняется в API.
document.querySelector("#create").addEventListener("click", () => {
  const body = getBody();
  if (body) request("/products/add", "POST", body);
});

// UPDATE: изменить название существующего товара.
document.querySelector("#update").addEventListener("click", () => {
  const id = getId();
  if (id === null) return;
  const body = getBody();
  if (body) request("/products/" + id, "PATCH", body);
});

// DELETE: удалить существующий товар.
document.querySelector("#remove").addEventListener("click", () => {
  const id = getId();
  if (id !== null) request("/products/" + id, "DELETE");
});

// Специальный маршрут для проверки HTTP-ошибки 404.
document.querySelector("#test-error").addEventListener("click", () => {
  request("/http/404");
});

// При открытии страницы загрузить названия категорий.
async function loadCategories() {
  const data = await request("/products/category-list");
  if (!data) return;
  for (const name of data) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    category.append(option);
  }
}
loadCategories();

