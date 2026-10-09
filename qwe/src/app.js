import { getProducts, createProduct, updateProduct, deleteProduct } from "./productsApi.js";

const categoryLabels = {
  beauty: "Красота и косметика", fragrances: "Парфюмерия", furniture: "Мебель",
  groceries: "Продукты питания", "home-decoration": "Декор для дома",
  "kitchen-accessories": "Кухонные принадлежности", laptops: "Ноутбуки",
  "mens-shirts": "Мужские рубашки", "mens-shoes": "Мужская обувь",
  "mens-watches": "Мужские часы", "mobile-accessories": "Аксессуары для телефонов",
  motorcycle: "Мотоциклы", "skin-care": "Уход за кожей", smartphones: "Смартфоны",
  "sports-accessories": "Спортивные принадлежности", sunglasses: "Солнцезащитные очки",
  tablets: "Планшеты", tops: "Топы", vehicle: "Автомобили",
  "womens-bags": "Женские сумки", "womens-dresses": "Женские платья",
  "womens-jewellery": "Женские украшения", "womens-shoes": "Женская обувь",
  "womens-watches": "Женские часы", uncategorized: "Без категории"
};

const elements = {
  search: document.querySelector("#search-input"),
  categoryFilter: document.querySelector("#category-filter"),
  sort: document.querySelector("#sort-select"),
  reset: document.querySelector("#reset-filters"),
  grid: document.querySelector("#product-grid"),
  template: document.querySelector("#product-card-template"),
  state: document.querySelector("#catalog-state"),
  stateTitle: document.querySelector("#state-title"),
  stateDescription: document.querySelector("#state-description"),
  spinner: document.querySelector(".spinner"),
  retry: document.querySelector("#retry-load"),
  visibleCount: document.querySelector("#visible-count"),
  totalProducts: document.querySelector("#total-products"),
  totalCategories: document.querySelector("#total-categories"),
  totalValue: document.querySelector("#total-value"),
  add: document.querySelector("#add-product"),
  notification: document.querySelector("#notification"),
  notificationText: document.querySelector("#notification-text"),
  closeNotification: document.querySelector("#close-notification"),
  productDialog: document.querySelector("#product-dialog"),
  form: document.querySelector("#product-form"),
  formTitle: document.querySelector("#form-title"),
  formError: document.querySelector("#form-error"),
  save: document.querySelector("#save-product"),
  closeForm: document.querySelector("#close-product-dialog"),
  cancelForm: document.querySelector("#cancel-product-dialog"),
  deleteDialog: document.querySelector("#delete-dialog"),
  deleteDescription: document.querySelector("#delete-description"),
  deleteError: document.querySelector("#delete-error"),
  confirmDelete: document.querySelector("#confirm-delete"),
  cancelDelete: document.querySelector("#cancel-delete")
};

const money = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "USD" });
const number = new Intl.NumberFormat("ru-RU");

// Массив — единственный источник данных. Фильтры не загружают каталог заново.
let products = [];
let isLoading = true;
let loadError = "";
let isMutating = false;
let editingProductId = null;
let deletingProductId = null;
let nextLocalId = 1;

function categoryName(category) {
  return categoryLabels[category] || category;
}

function getCategories() {
  return [...new Set(products.map(product => product.category))]
    .sort((first, second) => categoryName(first).localeCompare(categoryName(second), "ru"));
}

function fillCategories(select, categories, currentValue, includeAll = false) {
  select.replaceChildren();
  if (includeAll) {
    select.append(new Option("Все категории", ""));
  }
  for (const category of categories) {
    select.append(new Option(categoryName(category), category));
  }
  select.value = currentValue;
}

function renderSummary() {
  if (isLoading || loadError) {
    elements.totalProducts.textContent = "—";
    elements.totalCategories.textContent = "—";
    elements.totalValue.textContent = "—";
    return;
  }
  elements.totalProducts.textContent = number.format(products.length);
  elements.totalCategories.textContent = number.format(getCategories().length);
  const totalValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  elements.totalValue.textContent = money.format(totalValue);
}

function getVisibleProducts() {
  const search = elements.search.value.trim().toLocaleLowerCase("ru");
  const category = elements.categoryFilter.value;
  const visible = products.filter(product =>
    product.title.toLocaleLowerCase("ru").includes(search) &&
    (!category || product.category === category)
  );

  const [field, direction] = elements.sort.value.split("-");
  visible.sort((first, second) => {
    const comparison = field === "title"
      ? first.title.localeCompare(second.title, "ru")
      : first[field] - second[field];
    return direction === "desc" ? -comparison : comparison;
  });
  return visible;
}

function showState(title, description, retry = false) {
  elements.state.hidden = false;
  elements.stateTitle.textContent = title;
  elements.stateDescription.textContent = description;
  elements.retry.hidden = !retry;
  elements.spinner.hidden = !isLoading;
}

function renderProducts() {
  // После изменения количества сохраняем фокус на кнопке этой же карточки.
  const activeButton = document.activeElement.closest?.("[data-action]");
  const activeId = activeButton?.closest("[data-product-id]")?.dataset.productId;
  const activeAction = activeButton?.dataset.action;

  elements.grid.replaceChildren();
  elements.grid.setAttribute("aria-busy", String(isLoading));

  if (isLoading) {
    elements.visibleCount.textContent = "Загрузка каталога…";
    showState("Загружаем товары", "Подождите немного.");
    return;
  }
  if (loadError) {
    elements.visibleCount.textContent = "Каталог недоступен";
    showState("Не удалось загрузить каталог", loadError, true);
    return;
  }

  const visible = getVisibleProducts();
  elements.visibleCount.textContent = "Показано " + number.format(visible.length) + " из " + number.format(products.length);
  elements.state.hidden = visible.length > 0;
  if (!visible.length) {
    showState(
      products.length ? "Товары не найдены" : "В каталоге пока нет товаров",
      products.length ? "Измените запрос или сбросьте фильтры." : "Добавьте первый товар с помощью кнопки выше."
    );
  }

  const fragment = document.createDocumentFragment();
  for (const product of visible) {
    const card = elements.template.content.firstElementChild.cloneNode(true);
    card.dataset.productId = String(product.id);
    card.querySelector(".product-category").textContent = categoryName(product.category);
    card.querySelector(".product-price").textContent = money.format(product.price);
    card.querySelector(".product-title").textContent = product.title;
    card.querySelector(".product-title").title = product.title;
    card.querySelector(".product-brand").textContent = "Бренд: " + (product.brand || "Не указан");
    card.querySelector(".product-rating").textContent = product.isLocal ? "Нет оценок" : "★ " + number.format(product.rating);
    card.querySelector(".product-stock").textContent = number.format(product.stock);

    const image = card.querySelector("img");
    const placeholder = card.querySelector(".image-placeholder");
    image.alt = product.title;
    if (product.thumbnail) {
      image.src = product.thumbnail;
      image.addEventListener("error", () => { image.hidden = true; placeholder.hidden = false; }, { once: true });
    } else {
      image.hidden = true;
      placeholder.hidden = false;
    }

    for (const button of card.querySelectorAll("button")) {
      button.disabled = isMutating || (button.dataset.action === "decrease-stock" && product.stock === 0);
      const actionLabels = { edit: "Редактировать", delete: "Удалить", "increase-stock": "Увеличить количество", "decrease-stock": "Уменьшить количество" };
      button.setAttribute("aria-label", actionLabels[button.dataset.action] + ": " + product.title);
    }
    fragment.append(card);
  }
  elements.grid.append(fragment);

  if (activeId && activeAction) {
    const card = [...elements.grid.children].find(item => item.dataset.productId === activeId);
    const button = card?.querySelector('[data-action="' + activeAction + '"]');
    if (button && !button.disabled) button.focus({ preventScroll: true });
  }
}

function renderCatalog() {
  const selectedCategory = elements.categoryFilter.value;
  const categories = getCategories();
  // Если последний товар выбранной категории удалён, фильтр всё равно сохраняется.
  if (selectedCategory && !categories.includes(selectedCategory)) categories.push(selectedCategory);
  fillCategories(elements.categoryFilter, categories, selectedCategory, true);
  renderSummary();
  renderProducts();
  elements.add.disabled = isLoading || Boolean(loadError) || isMutating;
}

function showNotification(message, isError = false) {
  elements.notificationText.textContent = message;
  elements.notification.classList.toggle("error", isError);
  elements.notification.hidden = false;
}

function resetFilters() {
  elements.search.value = "";
  elements.categoryFilter.value = "";
  elements.sort.value = "price-asc";
  renderProducts();
}

async function loadCatalog() {
  isLoading = true;
  loadError = "";
  elements.retry.disabled = true;
  renderCatalog();
  try {
    const data = await getProducts();
    products = data.map(product => ({
      ...product,
      title: String(product.title || "Без названия"),
      category: String(product.category || "uncategorized"),
      brand: String(product.brand || ""),
      description: String(product.description || ""),
      price: Number(product.price) || 0,
      stock: Math.max(0, Math.trunc(Number(product.stock) || 0)),
      rating: Number(product.rating) || 0,
      thumbnail: product.thumbnail || product.images?.[0] || "",
      isLocal: false
    }));
  } catch (error) {
    loadError = error.message;
  } finally {
    isLoading = false;
    elements.retry.disabled = false;
    renderCatalog();
  }
}

elements.search.addEventListener("input", renderProducts);
elements.categoryFilter.addEventListener("change", renderProducts);
elements.sort.addEventListener("change", renderProducts);
elements.reset.addEventListener("click", resetFilters);
elements.closeNotification.addEventListener("click", () => elements.notification.hidden = true);
elements.retry.addEventListener("click", loadCatalog);

loadCatalog();

// ---------------- Добавление, редактирование и удаление ----------------

function findProduct(id) {
  return products.find(product => String(product.id) === String(id));
}

function setMutationState(value) {
  isMutating = value;
  for (const control of elements.form.elements) control.disabled = value;
  elements.confirmDelete.disabled = value;
  elements.cancelDelete.disabled = value;
  elements.save.textContent = value ? "Сохранение…" : (editingProductId === null ? "Добавить товар" : "Сохранить изменения");
  elements.confirmDelete.textContent = value ? "Удаление…" : "Удалить";
  renderCatalog();
}

function openProductForm(product = null) {
  if (isMutating || isLoading || loadError) return;
  editingProductId = product ? product.id : null;
  elements.form.reset();
  elements.formError.hidden = true;
  for (const field of elements.form.querySelectorAll("[aria-invalid]")) field.removeAttribute("aria-invalid");

  const categories = [...new Set([...getCategories(), "groceries"])];
  if (product && !categories.includes(product.category)) categories.push(product.category);
  fillCategories(
    elements.form.elements.category,
    categories.sort((first, second) => categoryName(first).localeCompare(categoryName(second), "ru")),
    product ? product.category : "groceries"
  );

  const values = product || { title: "", price: "", stock: 0, brand: "", description: "" };
  for (const name of ["title", "price", "stock", "brand", "description"]) {
    elements.form.elements[name].value = values[name];
  }
  elements.formTitle.textContent = product ? "Редактировать товар" : "Добавить товар";
  elements.save.textContent = product ? "Сохранить изменения" : "Добавить товар";
  elements.productDialog.showModal();
  elements.form.elements.title.focus();
}

function showFormError(message, field) {
  elements.formError.textContent = message;
  elements.formError.hidden = false;
  if (field) {
    field.setAttribute("aria-invalid", "true");
    field.focus();
  }
  return null;
}

function readProductForm() {
  const fields = elements.form.elements;
  const title = fields.title.value.trim();
  const priceText = fields.price.value.trim();
  const stockText = fields.stock.value.trim();
  const price = Number(priceText);
  const stock = Number(stockText);

  elements.formError.hidden = true;
  for (const field of elements.form.querySelectorAll("[aria-invalid]")) field.removeAttribute("aria-invalid");

  if (!title) return showFormError("Введите название товара.", fields.title);
  if (!priceText || !Number.isFinite(price) || price <= 0) {
    return showFormError("Цена должна быть положительным числом.", fields.price);
  }
  if (!stockText || !Number.isSafeInteger(stock) || stock < 0) {
    return showFormError("Количество должно быть неотрицательным целым числом.", fields.stock);
  }
  if (!Number.isFinite(price * stock)) {
    return showFormError("Цена или количество слишком большие.", fields.price);
  }
  if (!fields.category.value) return showFormError("Выберите категорию.", fields.category);

  return {
    title,
    price,
    category: fields.category.value,
    brand: fields.brand.value.trim(),
    description: fields.description.value.trim(),
    stock
  };
}

async function saveProduct(event) {
  event.preventDefault();
  if (isMutating) return;
  const values = readProductForm();
  if (!values) return;

  const product = editingProductId === null ? null : findProduct(editingProductId);
  if (editingProductId !== null && !product) {
    showFormError("Товар больше не найден в каталоге.");
    return;
  }

  setMutationState(true);
  try {
    if (product) {
      if (!product.isLocal) await updateProduct(product.id, values);
      // Ответ DummyJSON содержит старые поля. Применяем только собственные изменения.
      Object.assign(product, values);
      showNotification("Изменения товара сохранены.");
    } else {
      await createProduct(values);
      // API возвращает один и тот же ID. Для новых товаров используем собственный счётчик.
      products.unshift({
        ...values,
        id: "local-" + nextLocalId++,
        isLocal: true,
        rating: 0,
        thumbnail: ""
      });
      showNotification("Товар добавлен в каталог.");
    }
    elements.productDialog.close();
  } catch (error) {
    showFormError(error.message);
  } finally {
    setMutationState(false);
  }
}

function openDeleteDialog(product) {
  if (isMutating) return;
  deletingProductId = product.id;
  elements.deleteDescription.textContent = "Вы собираетесь удалить «" + product.title + "».";
  elements.deleteError.hidden = true;
  elements.deleteDialog.showModal();
  elements.cancelDelete.focus();
}

async function confirmDeletion() {
  if (isMutating) return;
  const product = findProduct(deletingProductId);
  if (!product) {
    elements.deleteDialog.close();
    return;
  }

  setMutationState(true);
  try {
    if (!product.isLocal) await deleteProduct(product.id);
    products = products.filter(item => item.id !== product.id);
    elements.deleteDialog.close();
    showNotification("Товар удалён из каталога.");
  } catch (error) {
    elements.deleteError.textContent = error.message;
    elements.deleteError.hidden = false;
  } finally {
    setMutationState(false);
  }
}

function focusProductAction(id, action) {
  const card = [...elements.grid.children].find(item => item.dataset.productId === String(id));
  const button = card?.querySelector('[data-action="' + action + '"]');
  if (button && !button.disabled) button.focus({ preventScroll: true });
}

async function changeStock(id, difference) {
  if (isMutating) return;
  const product = findProduct(id);
  if (!product) return;
  const stock = product.stock + difference;
  if (!Number.isSafeInteger(stock) || stock < 0) return;

  setMutationState(true);
  try {
    if (!product.isLocal) await updateProduct(product.id, { stock });
    product.stock = stock;
    showNotification("Количество товара на складе обновлено.");
  } catch (error) {
    showNotification(error.message, true);
  } finally {
    setMutationState(false);
    focusProductAction(product.id, difference > 0 ? "increase-stock" : "decrease-stock");
  }
}

elements.add.addEventListener("click", () => openProductForm());
elements.form.addEventListener("submit", saveProduct);

elements.grid.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button || isMutating) return;
  const card = button.closest("[data-product-id]");
  const product = findProduct(card.dataset.productId);
  if (!product) return;
  const action = button.dataset.action;
  if (action === "edit") openProductForm(product);
  if (action === "delete") openDeleteDialog(product);
  if (action === "increase-stock") changeStock(product.id, 1);
  if (action === "decrease-stock") changeStock(product.id, -1);
});

function closeProductDialog() {
  if (!isMutating) elements.productDialog.close();
}
function closeDeleteDialog() {
  if (!isMutating) elements.deleteDialog.close();
}

elements.closeForm.addEventListener("click", closeProductDialog);
elements.cancelForm.addEventListener("click", closeProductDialog);
elements.cancelDelete.addEventListener("click", closeDeleteDialog);
elements.confirmDelete.addEventListener("click", confirmDeletion);

// Escape и щелчок по фону закрывают окно, если сохранение ещё не началось.
for (const dialog of [elements.productDialog, elements.deleteDialog]) {
  dialog.addEventListener("cancel", event => { if (isMutating) event.preventDefault(); });
  dialog.addEventListener("click", event => {
    if (event.target === dialog && !isMutating) {
      const bounds = dialog.getBoundingClientRect();
      const isOutside = event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (isOutside) dialog.close();
    }
  });
}
elements.productDialog.addEventListener("close", () => { editingProductId = null; });
elements.deleteDialog.addEventListener("close", () => { deletingProductId = null; });
