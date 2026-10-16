// Чистые функции используются и в общем списке, и в задачах профиля.
export function selectTasks(tasks, { query = "", status = "all", author = "", sort = "id-asc" } = {}, authors = new Map()) {
  const search = query.trim().toLocaleLowerCase();
  const result = tasks.filter((task) => {
    const user = authors.get(task.userId);
    const haystack = `${task.todo} ${task.id} ${task.userId} ${user?.username ?? ""} ${user?.firstName ?? ""} ${user?.lastName ?? ""}`.toLocaleLowerCase();
    return (!search || haystack.includes(search)) &&
      (!author || task.userId === Number(author)) &&
      (status === "all" || (status === "done" ? task.completed : !task.completed));
  });
  const text = (a, b) => a.localeCompare(b, ["ru", "en"], { sensitivity: "base", numeric: true });
  result.sort((a, b) => {
    let order = 0;
    if (sort === "id-desc") order = b.id - a.id;
    else if (sort === "title-asc") order = text(a.todo, b.todo);
    else if (sort === "title-desc") order = text(b.todo, a.todo);
    else if (sort === "author-asc") order = text(authors.get(a.userId)?.username ?? String(a.userId), authors.get(b.userId)?.username ?? String(b.userId));
    else if (sort === "status") order = Number(a.completed) - Number(b.completed);
    else order = a.id - b.id;
    return order || a.id - b.id;
  });
  return result;
}

export function mergeTasks(serverTasks, changes) {
  const deleted = new Set(changes.deleted);
  return [...serverTasks, ...changes.added]
    .filter((task) => !deleted.has(task.id))
    .map((task) => ({ ...task, ...(changes.updated[task.id] ?? {}) }));
}

export function isTask(value) {
  return value && Number.isSafeInteger(value.id) && value.id > 0 &&
    typeof value.todo === "string" && value.todo.trim().length > 0 &&
    typeof value.completed === "boolean" && Number.isSafeInteger(value.userId) && value.userId > 0;
}

export function readChanges(storage) {
  const empty = { added: [], updated: {}, deleted: [] };
  try {
    const data = JSON.parse(storage.getItem("fresh-market.tasks.v1"));
    if (!data || !Array.isArray(data.added) || !Array.isArray(data.deleted) || !data.updated || typeof data.updated !== "object") return empty;
    const updated = {};
    for (const [id, value] of Object.entries(data.updated)) {
      if (isTask({ id: Number(id), ...value })) {
        updated[id] = { todo: value.todo, completed: value.completed, userId: value.userId };
      }
    }
    return {
      added: data.added.filter(isTask).map(({ id, todo, completed, userId }) => ({ id, todo, completed, userId })),
      updated,
      deleted: data.deleted.filter((id) => Number.isSafeInteger(id) && id > 0),
    };
  } catch {
    return empty;
  }
}
