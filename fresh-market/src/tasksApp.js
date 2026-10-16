import { getTasks, getAuthors, getAuthor, getAuthorTasks, addTask, updateTask, deleteTask, clearAuthorCache } from "./tasksApi.js";
import { selectTasks, mergeTasks, readChanges } from "./tasksModel.js";

const PAGE_SIZE = 10;
const $ = (id) => document.getElementById(id);
const state = {
  tasks: [], serverTasks: [], authors: new Map(), fullAuthors: new Set(), changes: null,
  query: "", status: "all", author: "", sort: "id-asc", page: 1,
  loading: false, loaded: false, busy: new Set(), saving: false, editing: null, deleting: null,
  profileId: null, profileRequest: 0, profileTasks: [], profileLoaded: false,
  profileQuery: "", profileStatus: "all", profileSort: "id-asc",
};
let toastTimer;

function escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}
function notify(message) {
  clearTimeout(toastTimer);
  const target = $("profile-dialog").open ? $("profile-notice") : $("toast");
  $("toast").hidden = true;
  $("profile-notice").hidden = true;
  target.textContent = message;
  target.hidden = false;
  toastTimer = setTimeout(() => { target.hidden = true; }, 4500);
}
function showError(id, error) {
  $(id).textContent = error.message || "Что-то пошло не так. Попробуйте ещё раз.";
  $(id).hidden = false;
}
function initials(user, id) {
  return user?.firstName ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase() : String(id).slice(-2);
}
function avatar(user, id, large = false) {
  return `<span class="avatar${large ? " profile-avatar" : ""}" data-tone="${id % 4}" aria-hidden="true">${escape(initials(user, id))}</span>`;
}
function authorMarkup(id) {
  const user = state.authors.get(id);
  return `${avatar(user, id)}<span class="author-name">${user?.username ? `@${escape(user.username)}` : `Пользователь #${id}`}</span>${icon("arrow")}`;
}
function taskRow(task) {
  return `<article class="task-row${task.completed ? " is-complete" : ""}" data-task-id="${task.id}">
    <div class="task-main"><input class="task-checkbox" type="checkbox" data-toggle="${task.id}" ${task.completed ? "checked" : ""} ${state.busy.has(task.id) || state.loading ? "disabled" : ""} aria-label="${escape(`${task.completed ? "Вернуть в работу" : "Выполнить"}: ${task.todo}`)}"/><div><div class="task-meta">ЗАДАЧА #${task.id}</div><h3 class="task-title">${escape(task.todo)}</h3></div></div>
    <button class="author-button" data-author="${task.userId}" aria-haspopup="dialog" aria-controls="profile-dialog" aria-label="${escape(`Открыть профиль ${state.authors.get(task.userId)?.username ?? `пользователя ${task.userId}`}`)}">${authorMarkup(task.userId)}</button>
    <span class="status-pill${task.completed ? " done" : ""}">${task.completed ? "Выполнено" : "В работе"}</span>
    <div class="task-actions"><button class="icon-button" data-edit="${task.id}" aria-label="${escape(`Редактировать задачу: ${task.todo}`)}" title="Редактировать" ${state.busy.has(task.id) ? "disabled" : ""}>${icon("edit")}</button><button class="icon-button delete-button" data-delete="${task.id}" aria-label="${escape(`Удалить задачу: ${task.todo}`)}" title="Удалить" ${state.busy.has(task.id) ? "disabled" : ""}>${icon("trash")}</button></div>
  </article>`;
}
function filters() {
  return { query: state.query, status: state.status, author: state.author, sort: state.sort };
}
function updateStats() {
  const total = state.tasks.length;
  const done = state.tasks.filter((task) => task.completed).length;
  $("stat-total").textContent = total;
  $("stat-active").textContent = total - done;
  $("stat-done").textContent = done;
  $("stat-authors").textContent = new Set(state.tasks.map((task) => task.userId)).size;
  // Счётчики вкладок учитывают поиск и автора, но не выбранный статус.
  const base = selectTasks(state.tasks, { ...filters(), status: "all" }, state.authors);
  const baseDone = base.filter((task) => task.completed).length;
  $("tab-all").textContent = base.length;
  $("tab-active").textContent = base.length - baseDone;
  $("tab-done").textContent = baseDone;
}
function renderTasks() {
  if (!state.loaded) return;
  updateStats();
  const selected = selectTasks(state.tasks, filters(), state.authors);
  const pages = Math.max(1, Math.ceil(selected.length / PAGE_SIZE));
  state.page = Math.min(Math.max(1, state.page), pages);
  const offset = (state.page - 1) * PAGE_SIZE;
  const visible = selected.slice(offset, offset + PAGE_SIZE);
  $("task-list").innerHTML = visible.length ? visible.map(taskRow).join("") :
    `<div class="empty-state"><h3>${state.tasks.length ? "Ничего не нашлось" : "Пока ни одной задачи"}</h3><p>${state.tasks.length ? "Попробуйте другой запрос или сбросьте фильтры." : "Добавьте первую задачу для вашей команды."}</p><button class="button secondary" ${state.tasks.length ? 'data-reset="true"' : 'data-add="true"'}>${state.tasks.length ? "Сбросить фильтры" : "Новая задача"}</button></div>`;
  $("results-count").textContent = selected.length;
  $("results-description").textContent = `Найдено: ${selected.length} из ${state.tasks.length} · Нажмите на ник, чтобы открыть профиль`;
  $("pagination").hidden = selected.length === 0;
  $("page-summary").textContent = `${offset + 1}–${Math.min(offset + PAGE_SIZE, selected.length)} из ${selected.length} задач`;
  $("page-number").textContent = `${state.page} / ${pages}`;
  $("previous-page").disabled = state.page === 1;
  $("next-page").disabled = state.page === pages;
  $("reset-filters").hidden = !state.query && !state.author && state.status === "all" && state.sort === "id-asc";
  document.querySelectorAll("[data-status]").forEach((button) => {
    const active = button.dataset.status === state.status;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
  // GET /users/{userId}: сначала только авторы видимых задач, до 5 запросов одновременно.
  hydrateAuthors([...new Set(visible.map((task) => task.userId))]);
}
async function hydrateAuthors(ids) {
  const queue = ids.filter((id) => !state.fullAuthors.has(id));
  await Promise.all(Array.from({ length: Math.min(5, queue.length) }, async () => {
    while (queue.length) {
      const id = queue.shift();
      try {
        const author = await getAuthor(id);
        state.authors.set(id, author);
        state.fullAuthors.add(id);
        document.querySelectorAll(`[data-author="${id}"]`).forEach((button) => {
          button.innerHTML = authorMarkup(id);
          button.setAttribute("aria-label", `Открыть профиль ${author.username}`);
        });
      } catch {
        // Одна недоступная карточка автора не блокирует остальные задачи.
      }
    }
  }));
}
function populateAuthors() {
  const ids = new Set([...state.authors.keys(), ...state.tasks.map((task) => task.userId)]);
  const sorted = [...ids].sort((a, b) => (state.authors.get(a)?.username ?? String(a)).localeCompare(state.authors.get(b)?.username ?? String(b), "en", { numeric: true }));
  const options = sorted.map((id) => `<option value="${id}">${escape(state.authors.get(id)?.username ? `@${state.authors.get(id).username}` : `Пользователь #${id}`)}</option>`).join("");
  $("author-filter").innerHTML = `<option value="">Все авторы</option>${options}`;
  $("author-filter").value = state.author;
  $("task-author").innerHTML = options;
}
function persist() {
  state.tasks = mergeTasks(state.serverTasks, state.changes);
  try {
    localStorage.setItem("fresh-market.tasks.v1", JSON.stringify(state.changes));
  } catch {
    notify("Изменения доступны в этой вкладке. Браузер не разрешил сохранить их после перезагрузки.");
  }
}
function saveLocalTask(task) {
  const index = state.changes.added.findIndex((item) => item.id === task.id);
  if (index >= 0) state.changes.added[index] = task;
  else state.changes.updated[task.id] = { todo: task.todo, completed: task.completed, userId: task.userId };
  persist();
}
function isLocal(id) {
  return state.changes.added.some((task) => task.id === id);
}
async function loadTasks() {
  if (state.loading) return;
  state.loading = true;
  if (state.loaded) { renderTasks(); renderProfileTasks(); }
  $("reload-tasks").disabled = true;
  $("add-task").disabled = true;
  $("task-list").setAttribute("aria-busy", "true");
  if (!state.loaded) $("task-list").innerHTML = '<div class="loading-state"><span class="spinner"></span><p>Загружаем задачи…</p></div>';
  const [tasks, users] = await Promise.allSettled([getTasks(), getAuthors()]);
  state.loading = false;
  if (users.status === "fulfilled") {
    users.value.forEach((user) => state.authors.set(user.id, { ...user, ...state.authors.get(user.id) }));
    $("authors-warning").hidden = true;
  } else {
    $("authors-warning").textContent = "Список авторов недоступен. Профили можно открыть по ID; повторите загрузку, чтобы восстановить поиск по всем никам.";
    $("authors-warning").hidden = false;
  }
  if (tasks.status === "fulfilled") {
    state.serverTasks = tasks.value;
    state.tasks = mergeTasks(state.serverTasks, state.changes);
    state.loaded = true;
    populateAuthors();
    renderTasks();
    $("add-task").disabled = false;
  } else if (state.loaded) {
    renderTasks();
    notify(tasks.reason.message);
    $("add-task").disabled = false;
  } else {
    $("task-list").innerHTML = `<div class="empty-state"><h3>Не удалось загрузить задачи</h3><p>${escape(tasks.reason.message)}</p><button class="button secondary" data-retry="true">Попробовать ещё раз</button></div>`;
    $("results-description").textContent = "Проверьте подключение к интернету и повторите запрос.";
  }
  $("task-list").setAttribute("aria-busy", "false");
  $("reload-tasks").disabled = false;
  renderProfileTasks();
}
function resetFilters() {
  Object.assign(state, { query: "", status: "all", author: "", sort: "id-asc", page: 1 });
  $("task-search").value = "";
  $("author-filter").value = "";
  $("task-sort").value = "id-asc";
  renderTasks();
}
function detail(label, value, wide = false) {
  return value === undefined || value === null || value === "" ? "" : `<div class="detail${wide ? " wide" : ""}"><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`;
}
function address(value) {
  return value ? [value.address, value.city, value.state, value.postalCode, value.country].filter(Boolean).join(", ") : "";
}
function birthDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ru-RU");
}
function renderProfile(user, tasksResult) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
  $("profile-content").innerHTML = `<div class="profile-body">
    <div class="profile-identity">${avatar(user, user.id, true)}<div><h2 id="profile-title">${escape(name)}</h2><p class="profile-nick">@${escape(user.username)}</p><span class="profile-id">Пользователь #${user.id}</span></div></div>
    <section class="profile-section"><h3>Контакты</h3><dl class="details-grid">${detail("Электронная почта", user.email)}${detail("Телефон", user.phone)}${detail("Адрес", address(user.address), true)}</dl></section>
    <section class="profile-section"><h3>О пользователе</h3><dl class="details-grid">${detail("Возраст", user.age ? `${user.age} лет` : "")}${detail("Дата рождения", birthDate(user.birthDate))}${detail("Пол", ({ male: "Мужской", female: "Женский" })[user.gender] ?? user.gender)}${detail("Роль", ({ admin: "Администратор", moderator: "Модератор", user: "Пользователь" })[user.role] ?? user.role)}${detail("Университет", user.university, true)}${detail("Компания", user.company?.name)}${detail("Должность", user.company?.title)}${detail("Отдел", user.company?.department)}${detail("Адрес компании", address(user.company?.address), true)}</dl></section>
    <div class="profile-tasks-heading"><h3>Задачи автора <span class="count" id="profile-task-count">—</span></h3><button class="text-button" data-show-author="${user.id}">В общем списке ${icon("arrow")}</button></div>
    <label class="search-field profile-task-search">${icon("search")}<span class="sr-only">Поиск в задачах автора</span><input id="profile-search" type="search" placeholder="Найти задачу автора…" autocomplete="off"/></label>
    <div class="profile-task-controls"><select id="profile-status" aria-label="Статус задач автора"><option value="all">Все статусы</option><option value="active">В работе</option><option value="done">Выполнено</option></select><select id="profile-sort" aria-label="Сортировка задач автора"><option value="id-asc">Сначала старые</option><option value="id-desc">Сначала новые</option><option value="title-asc">Название: А → Я</option><option value="title-desc">Название: Я → А</option></select></div>
    <div id="profile-task-list" class="profile-task-list" aria-live="polite"></div>
  </div>`;
  if (tasksResult.status === "fulfilled") {
    state.profileTasks = tasksResult.value;
    state.profileLoaded = true;
    renderProfileTasks();
  } else {
    $("profile-task-list").innerHTML = `<div class="empty-state"><h3>Задачи недоступны</h3><p>${escape(tasksResult.reason.message)}</p><button class="button secondary" data-retry-profile="${user.id}">Повторить запрос</button></div>`;
  }
}
function renderProfileTasks() {
  if (!$("profile-task-list") || !state.profileLoaded) return;
  // Учитываем изменения, включая перенос задачи от одного автора к другому.
  const byId = new Map(mergeTasks(state.profileTasks, state.changes).map((task) => [task.id, task]));
  state.tasks.filter((task) => task.userId === state.profileId).forEach((task) => byId.set(task.id, task));
  const all = [...byId.values()].filter((task) => task.userId === state.profileId);
  const tasks = selectTasks(all, { query: state.profileQuery, status: state.profileStatus, sort: state.profileSort }, state.authors);
  $("profile-task-count").textContent = `${tasks.length} / ${all.length}`;
  $("profile-task-list").innerHTML = tasks.length ? tasks.map((task) => `<article class="profile-task${task.completed ? " is-complete" : ""}"><input type="checkbox" class="task-checkbox" data-toggle="${task.id}" ${task.completed ? "checked" : ""} ${state.busy.has(task.id) || state.loading ? "disabled" : ""} aria-label="${escape(`${task.completed ? "Вернуть в работу" : "Выполнить"}: ${task.todo}`)}"/><div><p class="profile-task-title">${escape(task.todo)}</p><div class="profile-task-meta"><span>#${task.id}</span><span class="status-pill${task.completed ? " done" : ""}">${task.completed ? "Выполнено" : "В работе"}</span></div></div></article>`).join("") : '<div class="empty-state"><p>Задач с такими условиями нет.</p></div>';
}
async function openProfile(id) {
  const request = ++state.profileRequest;
  Object.assign(state, { profileId: id, profileTasks: [], profileLoaded: false, profileQuery: "", profileStatus: "all", profileSort: "id-asc" });
  $("profile-content").innerHTML = '<h2 id="profile-title" class="sr-only">Информация о пользователе</h2><div class="loading-state"><span class="spinner"></span><p>Загружаем профиль и задачи автора…</p></div>';
  $("profile-notice").hidden = true;
  if (!$("profile-dialog").open) $("profile-dialog").showModal();
  $("profile-dialog").scrollTop = 0;
  const [user, tasks] = await Promise.allSettled([getAuthor(id), getAuthorTasks(id)]);
  if (request !== state.profileRequest || !$("profile-dialog").open) return;
  if (user.status === "fulfilled") {
    state.authors.set(id, user.value);
    state.fullAuthors.add(id);
    renderProfile(user.value, tasks);
  } else {
    $("profile-content").innerHTML = `<div class="empty-state profile-error"><h2 id="profile-title">Профиль недоступен</h2><p>${escape(user.reason.message)}</p><button class="button secondary" data-retry-profile="${id}">Попробовать ещё раз</button></div>`;
  }
}
async function toggleTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  if (state.busy.has(id) || state.loading) {
    document.querySelectorAll(`[data-toggle="${id}"]`).forEach((input) => { input.checked = task.completed; });
    return;
  }
  const focused = document.activeElement;
  const restoreFocus = focused?.matches(`[data-toggle="${id}"]`);
  const focusRegion = $("profile-dialog").contains(focused) ? "profile-task-list" : "task-list";
  state.busy.add(id);
  renderTasks();
  renderProfileTasks();
  try {
    const changes = { completed: !task.completed };
    // Добавленные задачи у DummyJSON не сохраняются: их меняем локально.
    if (!isLocal(id)) await updateTask(id, changes);
    saveLocalTask({ ...task, ...changes });
    notify(changes.completed ? "Задача выполнена. Так держать!" : "Задача возвращена в работу");
  } catch (error) {
    notify(error.message);
  } finally {
    state.busy.delete(id);
    renderTasks();
    renderProfileTasks();
    if (restoreFocus && [document.body, $("profile-dialog")].includes(document.activeElement)) {
      $(focusRegion)?.querySelector(`[data-toggle="${id}"]`)?.focus({ preventScroll: true });
    }
  }
}
function openTaskForm(id = null) {
  if (!state.loaded || state.loading) return;
  const task = state.tasks.find((item) => item.id === id);
  state.editing = task?.id ?? null;
  $("task-form").reset();
  $("form-error").hidden = true;
  $("task-form-title").textContent = task ? "Редактировать задачу" : "Новая задача";
  $("save-task").textContent = task ? "Сохранить" : "Создать задачу";
  $("task-title").value = task?.todo ?? "";
  $("task-author").value = String(task?.userId ?? (state.author ? Number(state.author) : state.tasks[0]?.userId ?? state.authors.keys().next().value ?? ""));
  $("task-completed").checked = task?.completed ?? false;
  $("task-dialog").showModal();
  $("task-title").focus();
}
async function submitTask(event) {
  event.preventDefault();
  if (state.saving) return;
  const todo = $("task-title").value.trim();
  const userId = Number($("task-author").value);
  if (todo.length < 2 || todo.length > 300 || !Number.isSafeInteger(userId) || userId < 1) {
    showError("form-error", new Error("Укажите текст от 2 до 300 символов и выберите автора."));
    return;
  }
  const changes = { todo, userId, completed: $("task-completed").checked };
  state.saving = true;
  $("form-error").hidden = true;
  Array.from($("task-form").elements).forEach((control) => { control.disabled = true; });
  $("save-task").textContent = "Сохраняем…";
  try {
    if (state.editing !== null) {
      if (!isLocal(state.editing)) await updateTask(state.editing, changes);
      saveLocalTask({ id: state.editing, ...changes });
    } else {
      await addTask(changes);
      // API каждый раз возвращает один и тот же новый ID; браузер назначает уникальный.
      const id = Math.max(Date.now(), ...state.tasks.map((task) => task.id + 1));
      state.changes.added.push({ id, ...changes });
      persist();
      resetFilters();
      state.sort = "id-desc";
      $("task-sort").value = "id-desc";
    }
    $("task-dialog").close();
    populateAuthors();
    renderTasks();
    renderProfileTasks();
    notify(state.editing !== null ? "Задача обновлена" : "Новая задача добавлена");
  } catch (error) {
    showError("form-error", error);
  } finally {
    state.saving = false;
    Array.from($("task-form").elements).forEach((control) => { control.disabled = false; });
    $("save-task").textContent = state.editing !== null ? "Сохранить" : "Создать задачу";
  }
}
function openDelete(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task || state.busy.has(id) || state.loading) return;
  state.deleting = id;
  $("delete-description").textContent = `«${task.todo}» будет удалена из списка в этом браузере.`;
  $("delete-error").hidden = true;
  $("delete-dialog").showModal();
}
async function confirmDelete() {
  const id = state.deleting;
  if (id === null || state.busy.has(id)) return;
  state.busy.add(id);
  $("delete-dialog").querySelectorAll("button").forEach((button) => { button.disabled = true; });
  $("confirm-delete").textContent = "Удаляем…";
  try {
    if (!isLocal(id)) await deleteTask(id);
    state.changes.added = state.changes.added.filter((task) => task.id !== id);
    if (!state.changes.deleted.includes(id)) state.changes.deleted.push(id);
    delete state.changes.updated[id];
    persist();
    $("delete-dialog").close();
    renderTasks();
    renderProfileTasks();
    notify("Задача удалена");
  } catch (error) {
    showError("delete-error", error);
  } finally {
    state.busy.delete(id);
    $("delete-dialog").querySelectorAll("button").forEach((button) => { button.disabled = false; });
    $("confirm-delete").textContent = "Удалить";
  }
}
function bindEvents() {
  $("filters").addEventListener("submit", (event) => event.preventDefault());
  $("task-search").addEventListener("input", (event) => { state.query = event.target.value; state.page = 1; renderTasks(); });
  $("author-filter").addEventListener("change", (event) => { state.author = event.target.value; state.page = 1; renderTasks(); });
  $("task-sort").addEventListener("change", (event) => { state.sort = event.target.value; state.page = 1; renderTasks(); });
  $("reset-filters").addEventListener("click", resetFilters);
  $("previous-page").addEventListener("click", () => { state.page--; renderTasks(); });
  $("next-page").addEventListener("click", () => { state.page++; renderTasks(); });
  $("reload-tasks").addEventListener("click", () => { if (state.busy.size || state.saving) return; clearAuthorCache(); state.fullAuthors.clear(); loadTasks(); });
  $("add-task").addEventListener("click", () => openTaskForm());
  $("task-form").addEventListener("submit", submitTask);
  $("confirm-delete").addEventListener("click", confirmDelete);
  document.addEventListener("input", (event) => {
    if (event.target.id === "profile-search") { state.profileQuery = event.target.value; renderProfileTasks(); }
  });
  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-toggle]")) toggleTask(Number(event.target.dataset.toggle));
    if (event.target.id === "profile-status") { state.profileStatus = event.target.value; renderProfileTasks(); }
    if (event.target.id === "profile-sort") { state.profileSort = event.target.value; renderProfileTasks(); }
  });
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    const data = button.dataset;
    if (data.author) openProfile(Number(data.author));
    else if (data.retryProfile) openProfile(Number(data.retryProfile));
    else if (data.showAuthor) {
      state.author = data.showAuthor; state.query = ""; state.status = "all"; state.page = 1;
      $("task-search").value = ""; $("author-filter").value = state.author;
      $("profile-dialog").close(); renderTasks();
    } else if (data.edit) openTaskForm(Number(data.edit));
    else if (data.delete) openDelete(Number(data.delete));
    else if (data.add) openTaskForm();
    else if (data.status) { state.status = data.status; state.page = 1; renderTasks(); }
    else if (data.reset) resetFilters();
    else if (data.retry) loadTasks();
    else if (data.close) {
      if ((data.close === "task-dialog" && state.saving) || (data.close === "delete-dialog" && state.busy.has(state.deleting))) return;
      $(data.close).close();
    }
  });
  [$("profile-dialog"), $("task-dialog"), $("delete-dialog")].forEach((dialog) => {
    const pending = () => (dialog.id === "task-dialog" && state.saving) || (dialog.id === "delete-dialog" && state.busy.has(state.deleting));
    dialog.addEventListener("cancel", (event) => { if (pending()) event.preventDefault(); });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog || pending()) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  });
  $("profile-dialog").addEventListener("close", () => { state.profileRequest++; state.profileId = null; state.profileLoaded = false; });
}

export function startTasksApp() {
  try { state.changes = readChanges(localStorage); }
  catch { state.changes = { added: [], updated: {}, deleted: [] }; }
  bindEvents();
  return loadTasks();
}
