import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "./productsApi.js";
import {
  translateProduct,
  translateReviewText,
} from "./productTranslations.js";

const PLACEHOLDER = "./assets/placeholder.svg";
const categoryNames = {
  beauty: "Красота",
  fragrances: "Парфюмерия",
  furniture: "Мебель",
  groceries: "Продукты",
  "home-decoration": "Для дома",
  "kitchen-accessories": "Для кухни",
  laptops: "Ноутбуки",
  "mens-shirts": "Мужские рубашки",
  "mens-shoes": "Мужская обувь",
  "mens-watches": "Мужские часы",
  "mobile-accessories": "Аксессуары для телефонов",
  motorcycle: "Мототовары",
  "skin-care": "Уход за кожей",
  smartphones: "Смартфоны",
  "sports-accessories": "Спорт",
  sunglasses: "Солнцезащитные очки",
  tablets: "Планшеты",
  tops: "Топы",
  vehicle: "Автотовары",
  "womens-bags": "Женские сумки",
  "womens-dresses": "Платья",
  "womens-jewellery": "Украшения",
  "womens-shoes": "Женская обувь",
  "womens-watches": "Женские часы",
};
const priceFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "USD",
});
const numberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});
const collator = new Intl.Collator("ru", {
  numeric: true,
  sensitivity: "base",
});

// DummyJSON не сохраняет изменения: всё состояние живёт в этой вкладке.
const state = {
  products: [],
  status: "loading",
  error: "",
  search: "",
  category: "",
  sort: "featured",
  localCounter: 0,
  locks: new Set(),
  cart: new Map(),
  galleryIndices: new Map(),
  editingId: null,
  deletingId: null,
  formSaving: false,
  deleteSaving: false,
  catalogScroll: 0,
  previousView: "catalog",
};
const element = (id) => document.getElementById(id);
const dom = {
  search: element("search-input"),
  clearSearch: element("clear-search"),
  productCount: element("stat-products"),
  categoryCount: element("stat-categories"),
  stockValue: element("stat-value"),
  catalog: element("catalog-view"),
  product: element("product-view"),
  chips: element("category-chips"),
  category: element("category-select"),
  sort: element("sort-select"),
  results: element("results-count"),
  filterLabel: element("active-filter-label"),
  reset: element("reset-filters"),
  status: element("catalog-status"),
  grid: element("product-grid"),
  add: element("add-product"),
  formDialog: element("product-dialog"),
  form: element("product-form"),
  formTitle: element("form-title"),
  formDescription: element("form-description"),
  formError: element("form-error"),
  fields: element("form-fields"),
  save: element("save-product"),
  categoryOptions: element("category-options"),
  preview: element("form-image-preview"),
  deleteDialog: element("delete-dialog"),
  deleteName: element("delete-name"),
  deleteError: element("delete-error"),
  confirmDelete: element("confirm-delete"),
  aboutDialog: element("about-dialog"),
  openCart: element("open-cart"),
  cartCount: element("cart-count"),
  cartDialog: element("cart-dialog"),
  cartItems: element("cart-items"),
  cartSummary: element("cart-summary"),
  cartTotal: element("cart-total"),
  cartQuantity: element("cart-quantity"),
  clearCart: element("clear-cart"),
  cartEmpty: element("cart-empty"),
  cartNote: element("cart-note"),
  toasts: element("toasts"),
};

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function categoryLabel(category) {
  return Object.hasOwn(categoryNames, category)
    ? categoryNames[category]
    : category || "Без категории";
}

function formatPrice(value) {
  return priceFormatter.format(Number(value) || 0);
}

function plural(number, one, few, many) {
  const value = Math.abs(number) % 100;
  if (value >= 11 && value <= 19) return many;
  const lastDigit = value % 10;
  return lastDigit === 1 ? one : lastDigit >= 2 && lastDigit <= 4 ? few : many;
}

function getProduct(id) {
  return state.products.find((product) => String(product.id) === String(id));
}

function productUrl(id) {
  return `#product/${encodeURIComponent(id)}`;
}

function safeImageSource(value) {
  if (value === PLACEHOLDER) return PLACEHOLDER;
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : PLACEHOLDER;
  } catch {
    return PLACEHOLDER;
  }
}

function getImages(product) {
  const images = (Array.isArray(product.images) ? product.images : [])
    .map(safeImageSource)
    .filter((source) => source !== PLACEHOLDER);
  return images.length
    ? [...new Set(images)]
    : [safeImageSource(product.thumbnail)];
}

function getThumbnail(product) {
  const thumbnail = safeImageSource(product.thumbnail);
  return thumbnail !== PLACEHOLDER ? thumbnail : getImages(product)[0];
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function ratingText(product) {
  return hasValue(product.rating) && Number.isFinite(Number(product.rating))
    ? numberFormatter.format(Number(product.rating))
    : "Нет оценок";
}

function normalizeProduct(product) {
  return {
    ...product,
    title: String(product.title || "Товар без названия"),
    category: String(product.category || ""),
    price: Math.max(0, Number(product.price) || 0),
    stock: Math.max(0, Math.floor(Number(product.stock) || 0)),
  };
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icon(type === "error" ? "info" : "check")}<span>${escapeHtml(message)}</span>
    <button class="icon-button" type="button" aria-label="Закрыть уведомление">${icon("close")}</button>`;
  toast.querySelector("button").addEventListener("click", () => toast.remove());
  // Быстрые добавления в корзину не должны закрывать уведомлениями весь экран.
  while (dom.toasts.children.length >= 3) dom.toasts.firstElementChild.remove();
  dom.toasts.append(toast);
  window.setTimeout(() => toast.remove(), type === "error" ? 8000 : 4500);
}

function errorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function cartQuantity(productId) {
  return state.cart.get(String(productId)) || 0;
}

function cartButtonMarkup(product, detail = false) {
  const quantity = cartQuantity(product.id);
  const disabled =
    state.locks.has(String(product.id)) || quantity >= product.stock;
  const label =
    product.stock === 0
      ? "Нет в наличии"
      : quantity > 0
        ? `В корзине: ${numberFormatter.format(quantity)}`
        : "В корзину";
  return `<button type="button" class="button button-primary add-to-cart${detail ? " detail-cart-button" : ""}"
    data-action="add-to-cart" data-product-id="${escapeHtml(product.id)}"
    aria-label="${escapeHtml(`${quantity ? "Добавить ещё в корзину" : "Добавить в корзину"}: ${product.title}${quantity ? `. В корзине: ${quantity} шт.` : ""}`)}"${disabled ? " disabled" : ""}>
    ${icon("cart")}<span>${label}</span></button>`;
}

function updateCartButtons() {
  document.querySelectorAll('[data-action="add-to-cart"]').forEach((button) => {
    const product = getProduct(button.dataset.productId);
    if (!product) return;
    const quantity = cartQuantity(product.id);
    button.disabled =
      state.locks.has(String(product.id)) || quantity >= product.stock;
    button.querySelector("span").textContent =
      product.stock === 0
        ? "Нет в наличии"
        : quantity > 0
          ? `В корзине: ${numberFormatter.format(quantity)}`
          : "В корзину";
    button.setAttribute(
      "aria-label",
      `${quantity ? "Добавить ещё в корзину" : "Добавить в корзину"}: ${product.title}${quantity ? `. В корзине: ${quantity} шт.` : ""}`,
    );
  });
}

function reconcileCart() {
  let changed = false;
  // Храним только ID и количество, поэтому цена и название всегда актуальны.
  for (const [id, quantity] of state.cart) {
    const product = getProduct(id);
    if (!product || product.stock === 0) {
      state.cart.delete(id);
      changed = true;
    } else if (quantity > product.stock) {
      state.cart.set(id, product.stock);
      changed = true;
    }
  }
  if (changed) {
    const message = "Корзина обновлена с учётом наличия товаров на складе.";
    dom.cartNote.textContent = message;
    showToast(message);
  }
}

function renderCart() {
  const focused = document.activeElement;
  const focusId = focused?.closest("[data-cart-id]")?.dataset.cartId;
  const focusAction = focused?.dataset.action;
  const wasClearFocused = focused === dom.clearCart;
  let totalQuantity = 0;
  let totalCents = 0;
  const items = [];
  for (const [id, quantity] of state.cart) {
    const product = getProduct(id);
    if (!product) continue;
    const busy = state.locks.has(id);
    // Считаем в центах, чтобы избежать погрешностей при сложении цен.
    const lineCents = Math.round(product.price * 100) * quantity;
    totalQuantity += quantity;
    totalCents += lineCents;
    const title = escapeHtml(product.title);
    items.push(`<article class="cart-item" data-cart-id="${escapeHtml(id)}">
      <a class="cart-item-image" href="${productUrl(id)}" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(getThumbnail(product))}" alt="" width="88" height="88"></a>
      <div class="cart-item-info"><a class="cart-item-title" href="${productUrl(id)}">${title}</a>
        <span class="cart-item-price">${formatPrice(product.price)} / шт.</span>
        <span class="cart-item-stock">На складе: ${numberFormatter.format(product.stock)} шт.</span></div>
      <div class="cart-item-controls">
        <div class="cart-quantity-control" role="group" aria-label="Количество: ${title}">
          <button type="button" data-action="cart-decrease" data-product-id="${escapeHtml(id)}" aria-label="Уменьшить количество в корзине: ${title}"${busy ? " disabled" : ""}>${icon("minus")}</button>
          <output aria-label="В корзине, штук">${numberFormatter.format(quantity)}</output>
          <button type="button" data-action="cart-increase" data-product-id="${escapeHtml(id)}" aria-label="Увеличить количество в корзине: ${title}"${busy || quantity >= product.stock ? " disabled" : ""}>${icon("plus")}</button>
        </div>
        <strong class="cart-item-total">${formatPrice(lineCents / 100)}</strong>
        <button type="button" class="icon-button danger-icon cart-remove" data-action="cart-remove" data-product-id="${escapeHtml(id)}" aria-label="Убрать из корзины: ${title}">${icon("trash")}</button>
      </div>
    </article>`);
  }
  dom.cartItems.innerHTML = items.join("");
  dom.cartCount.textContent = numberFormatter.format(totalQuantity);
  dom.openCart.disabled = state.status !== "ready";
  dom.openCart.setAttribute(
    "aria-label",
    `Корзина: ${numberFormatter.format(totalQuantity)} ${plural(totalQuantity, "товар", "товара", "товаров")}`,
  );
  dom.cartTotal.textContent = formatPrice(totalCents / 100);
  dom.cartQuantity.textContent = `${numberFormatter.format(totalQuantity)} ${plural(totalQuantity, "товар", "товара", "товаров")}`;
  dom.cartEmpty.hidden = items.length > 0;
  dom.cartSummary.hidden = items.length === 0;
  dom.clearCart.hidden = items.length === 0;
  dom.clearCart.disabled = items.length === 0;
  if (dom.cartDialog.open && (focusId || wasClearFocused)) {
    const row = [...dom.cartItems.querySelectorAll("[data-cart-id]")].find(
      (item) => item.dataset.cartId === focusId,
    );
    const sameAction = [...(row?.querySelectorAll("button") || [])].find(
      (button) => button.dataset.action === focusAction && !button.disabled,
    );
    const target =
      sameAction ||
      row?.querySelector("button:not(:disabled), .cart-item-title") ||
      dom.cartItems.querySelector(".cart-item-title") ||
      dom.cartEmpty.querySelector("[data-close-dialog]");
    target?.focus({ preventScroll: true });
  }
}

function changeCartQuantity(id, change, announce = false) {
  const product = getProduct(id);
  const key = String(id);
  if (!product || state.status !== "ready" || state.locks.has(key)) return;
  const quantity = cartQuantity(key) + change;
  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 0 ||
    quantity > product.stock
  )
    return;
  if (quantity === 0) state.cart.delete(key);
  else state.cart.set(key, quantity);
  dom.cartNote.textContent =
    quantity === 0
      ? `${product.title}: товар убран из корзины.`
      : `${product.title}: в корзине ${numberFormatter.format(quantity)} шт.`;
  renderCart();
  updateCartButtons();
  if (announce) showToast(`${product.title} — добавлено в корзину.`);
}

function removeFromCart(id) {
  const key = String(id);
  if (!state.cart.has(key)) return;
  const product = getProduct(key);
  state.cart.delete(key);
  dom.cartNote.textContent = `${product?.title || "Товар"}: убран из корзины.`;
  renderCart();
  updateCartButtons();
}

function clearCart() {
  state.cart.clear();
  dom.cartNote.textContent = "Корзина очищена.";
  renderCart();
  updateCartButtons();
}

function allCategories() {
  return [
    ...new Set(
      state.products.map((product) => product.category).filter(Boolean),
    ),
  ].sort((first, second) =>
    first === "groceries"
      ? -1
      : second === "groceries"
        ? 1
        : collator.compare(categoryLabel(first), categoryLabel(second)),
  );
}

function renderStatistics() {
  const loading = state.status !== "ready";
  dom.productCount.textContent = loading
    ? "—"
    : numberFormatter.format(state.products.length);
  dom.categoryCount.textContent = loading
    ? "—"
    : numberFormatter.format(allCategories().length);
  const total = state.products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0,
  );
  dom.stockValue.textContent = loading ? "—" : formatPrice(total);
  dom.add.disabled = loading;
}

function renderCategoryControls() {
  const categories = allCategories();
  // Не сбрасываем выбранную категорию, даже если последний товар в ней удалён.
  if (state.category && !categories.includes(state.category))
    categories.push(state.category);
  const options = categories
    .map(
      (category) =>
        `<option value="${escapeHtml(category)}">${escapeHtml(categoryLabel(category))}</option>`,
    )
    .join("");
  dom.category.innerHTML = `<option value="">Все категории</option>${options}`;
  dom.category.value = state.category;
  dom.categoryOptions.innerHTML = categories
    .map(
      (category) =>
        `<option value="${escapeHtml(categoryLabel(category))}"></option>`,
    )
    .join("");
  const popular = [
    "groceries",
    "kitchen-accessories",
    "home-decoration",
    "beauty",
    "fragrances",
  ].filter((category) => categories.includes(category));
  if (state.category && !popular.includes(state.category))
    popular.push(state.category);
  dom.chips.innerHTML = [
    { value: "", label: "Все товары" },
    ...popular.map((category) => ({
      value: category,
      label: categoryLabel(category),
    })),
  ]
    .map(
      ({
        value,
        label,
      }) => `<button type="button" class="category-chip${state.category === value ? " active" : ""}"
    data-category="${escapeHtml(value)}" aria-pressed="${state.category === value}">
    ${value === "groceries" ? icon("leaf") : value === "" ? icon("grid") : ""}${escapeHtml(label)}</button>`,
    )
    .join("");
}

function filteredProducts() {
  const query = state.search.trim().toLocaleLowerCase("ru");
  const products = state.products.filter(
    (product) =>
      (!state.category || product.category === state.category) &&
      product.title.toLocaleLowerCase("ru").includes(query),
  );
  const rating = (product) =>
    hasValue(product.rating) ? Number(product.rating) : -1;
  const sorters = {
    "title-asc": (a, b) => collator.compare(a.title, b.title),
    "title-desc": (a, b) => collator.compare(b.title, a.title),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "rating-desc": (a, b) => rating(b) - rating(a),
    "rating-asc": (a, b) => rating(a) - rating(b),
    featured: (a, b) =>
      Number(Boolean(b.__local)) - Number(Boolean(a.__local)) ||
      (b.__createdOrder || 0) - (a.__createdOrder || 0) ||
      Number(b.category === "groceries") - Number(a.category === "groceries"),
  };
  return products.sort(sorters[state.sort] || sorters.featured);
}

function cardMarkup(product, compact = false) {
  const id = escapeHtml(product.id);
  const title = escapeHtml(product.title);
  const busy = state.locks.has(String(product.id));
  const discount = Number(product.discountPercentage);
  const isRated = hasValue(product.rating);
  if (compact) {
    return `<a class="related-card" href="${productUrl(product.id)}">
      <div class="related-image-wrap"><img src="${escapeHtml(getThumbnail(product))}" alt="${title}" loading="lazy" width="180" height="160"></div>
      <span class="product-category">${escapeHtml(categoryLabel(product.category))}</span>
      <h3>${title}</h3><span class="product-price">${formatPrice(product.price)}</span>
    </a>`;
  }
  return `<article class="product-card" data-product-id="${id}" tabindex="0" aria-label="Открыть товар: ${title}">
    <div class="product-image-wrap">
      ${discount > 0 ? `<span class="discount-badge">−${numberFormatter.format(discount)}%</span>` : ""}
      <img class="product-image" src="${escapeHtml(getThumbnail(product))}" alt="${title}" loading="lazy" width="260" height="220">
    </div>
    <div class="product-info">
      <span class="product-category">${escapeHtml(categoryLabel(product.category))}</span>
      <h3 class="product-title"><a href="${productUrl(product.id)}">${title}</a></h3>
      <p class="product-brand"${product.brand ? "" : ' aria-hidden="true"'}>${product.brand ? escapeHtml(product.brand) : "&nbsp;"}</p>
      <div class="product-rating">${icon("star")}<span>${ratingText(product)}</span>${isRated && Array.isArray(product.reviews) ? `<span class="muted">· ${product.reviews.length} ${plural(product.reviews.length, "отзыв", "отзыва", "отзывов")}</span>` : ""}</div>
      <div class="product-price-row"><span class="product-price">${formatPrice(product.price)}</span></div>
      <div class="stock-row">
        <span class="stock-label${product.stock === 0 ? " out-of-stock" : ""}">${product.stock === 0 ? "Нет в наличии" : `На складе: <b>${numberFormatter.format(product.stock)}</b>`}</span>
        <div class="stock-controls" aria-label="Количество на складе">
          <button type="button" data-action="decrease-stock" data-product-id="${id}" aria-label="Уменьшить запас: ${title}"${busy || product.stock === 0 ? " disabled" : ""}>${icon("minus")}</button>
          <button type="button" data-action="increase-stock" data-product-id="${id}" aria-label="Увеличить запас: ${title}"${busy || product.stock >= Number.MAX_SAFE_INTEGER ? " disabled" : ""}>${icon("plus")}</button>
        </div>
      </div>
      ${cartButtonMarkup(product)}
      <div class="card-actions">
        <a class="details-link" href="${productUrl(product.id)}">Подробнее ${icon("arrow-right")}</a>
        <button class="icon-button" type="button" data-action="edit" data-product-id="${id}" title="Редактировать товар" aria-label="Редактировать: ${title}"${busy ? " disabled" : ""}>${icon("edit")}</button>
        <button class="icon-button danger-icon" type="button" data-action="delete" data-product-id="${id}" title="Удалить товар" aria-label="Удалить: ${title}"${busy ? " disabled" : ""}>${icon("trash")}</button>
      </div>
    </div>
  </article>`;
}

function renderCatalog() {
  dom.search.value = state.search;
  dom.clearSearch.hidden = !state.search;
  dom.sort.value = state.sort;
  renderCategoryControls();
  const isFiltered = Boolean(
    state.search || state.category || state.sort !== "featured",
  );
  dom.reset.hidden = !isFiltered;
  dom.filterLabel.textContent = state.category
    ? categoryLabel(state.category)
    : "Всё, что нужно каждый день";
  dom.status.hidden = state.status === "ready";
  dom.grid.hidden = state.status !== "ready";
  if (state.status === "loading") {
    dom.results.textContent = "Загружаем товары…";
    dom.status.innerHTML = `<div class="empty-state"><span class="loading-spinner" aria-hidden="true"></span><h2>Собираем свежую подборку</h2><p>Загружаем товары, фотографии и цены.</p></div>`;
    dom.status.setAttribute("aria-busy", "true");
    return;
  }
  dom.status.removeAttribute("aria-busy");
  if (state.status === "error") {
    dom.results.textContent = "Каталог недоступен";
    dom.status.innerHTML = `<div class="empty-state">${icon("info")}<h2>Не удалось загрузить каталог</h2><p>${escapeHtml(state.error)}</p>
      <button class="button button-primary" type="button" data-action="retry">Попробовать снова</button></div>`;
    return;
  }
  const products = filteredProducts();
  dom.results.textContent = `${numberFormatter.format(products.length)} ${plural(products.length, "товар", "товара", "товаров")}`;
  if (!products.length) {
    dom.status.hidden = false;
    dom.grid.hidden = true;
    dom.grid.innerHTML = "";
    dom.status.innerHTML = `<div class="empty-state">${icon("search")}<h2>${state.products.length ? "Товары не найдены" : "Пока нет товаров"}</h2>
      <p>${state.products.length ? "Попробуйте другое название или выберите другую категорию." : "Добавьте первый товар, чтобы начать наполнять магазин."}</p>
      <button class="button button-primary" type="button" data-action="${state.products.length ? "reset-filters" : "add"}">${state.products.length ? "Сбросить фильтры" : "Добавить товар"}</button></div>`;
    return;
  }
  dom.grid.innerHTML = products.map((product) => cardMarkup(product)).join("");
}

function translateService(value) {
  const text = String(value || "");
  const known = {
    "No warranty": "Без гарантии",
    "Lifetime warranty": "Пожизненная гарантия",
    "No return policy": "Возврат не предусмотрен",
    "Ships overnight": "Доставка на следующий день",
    "Free shipping": "Бесплатная доставка",
  };
  if (Object.hasOwn(known, text)) return known[text];
  let match = text.match(/^(\d+) (day|week|month|year)s? warranty$/i);
  if (match) {
    const units = {
      day: ["день", "дня", "дней"],
      week: ["неделю", "недели", "недель"],
      month: ["месяц", "месяца", "месяцев"],
      year: ["год", "года", "лет"],
    };
    return `Гарантия на ${match[1]} ${plural(Number(match[1]), ...units[match[2].toLowerCase()])}`;
  }
  match = text.match(
    /^Ships in (\d+)(?:-(\d+))? (business day|day|week|month)s?$/i,
  );
  if (match) {
    const units = {
      "business day": ["рабочий день", "рабочих дня", "рабочих дней"],
      day: ["день", "дня", "дней"],
      week: ["неделю", "недели", "недель"],
      month: ["месяц", "месяца", "месяцев"],
    };
    const number = Number(match[2] || match[1]);
    return `Доставка через ${match[1]}${match[2] ? `–${match[2]}` : ""} ${plural(number, ...units[match[3].toLowerCase()])}`;
  }
  match = text.match(/^(\d+) days? return policy$/i);
  if (match)
    return `Возврат в течение ${match[1]} ${plural(Number(match[1]), "дня", "дней", "дней")}`;
  return text;
}

function specificationRows(product) {
  const rows = [];
  const add = (label, value) => {
    if (hasValue(value)) rows.push([label, value]);
  };
  add("Категория", product.category ? categoryLabel(product.category) : "");
  add("Бренд", product.brand);
  add("Артикул (SKU)", product.sku);
  add("Цена", formatPrice(product.price));
  add("Количество на складе", `${numberFormatter.format(product.stock)} шт.`);
  if (hasValue(product.rating)) add("Рейтинг", `${ratingText(product)} / 5`);
  if (Number(product.discountPercentage) > 0)
    add("Скидка", `${numberFormatter.format(product.discountPercentage)}%`);
  add("Вес (единица API не указана)", product.weight);
  if (product.dimensions && typeof product.dimensions === "object") {
    const dimensions = [
      ["width", "ширина"],
      ["height", "высота"],
      ["depth", "глубина"],
    ]
      .filter(([key]) => hasValue(product.dimensions[key]))
      .map(
        ([key, label]) =>
          `${label}: ${numberFormatter.format(product.dimensions[key])}`,
      )
      .join(" · ");
    add("Размеры (единицы API не указаны)", dimensions);
  }
  add("Гарантия", translateService(product.warrantyInformation));
  add("Доставка", translateService(product.shippingInformation));
  add("Условия возврата", translateService(product.returnPolicy));
  add("Минимальное количество в заказе", product.minimumOrderQuantity);
  if (hasValue(product.meta?.barcode)) add("Штрихкод", product.meta.barcode);
  return rows
    .map(
      ([label, value]) =>
        `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join("");
}

function reviewMarkup(review) {
  const date = review.date ? new Date(review.date) : null;
  const validDate = date && !Number.isNaN(date.getTime());
  const stars =
    hasValue(review.rating) && Number.isFinite(Number(review.rating))
      ? `${numberFormatter.format(review.rating)} / 5`
      : "Нет оценки";
  return `<article class="review-card">
    <div class="review-header"><div class="review-author">${escapeHtml(review.reviewerName || "Покупатель")}</div>
      <span class="review-rating">${icon("star")}${escapeHtml(stars)}</span></div>
    ${validDate ? `<time datetime="${date.toISOString()}">${date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</time>` : ""}
    ${hasValue(review.comment) ? `<p>${escapeHtml(translateReviewText(review.comment))}</p>` : ""}
  </article>`;
}

function renderDetail(id, shouldFocus = false) {
  if (state.status === "loading") {
    dom.product.innerHTML = `<div class="empty-state"><span class="loading-spinner" aria-hidden="true"></span><h1 tabindex="-1">Загружаем товар…</h1></div>`;
    return;
  }
  if (state.status === "error") {
    dom.product.innerHTML = `<div class="empty-state">${icon("info")}<h1 tabindex="-1">Не удалось загрузить товар</h1>
      <p>${escapeHtml(state.error)}</p><div class="status-actions"><button type="button" class="button button-primary" data-action="retry">Попробовать снова</button>
      <a class="button button-secondary" href="#catalog">Назад к каталогу</a></div></div>`;
    return;
  }
  const product = getProduct(id);
  if (!product) {
    document.title = "Товар не найден — Свежий Маркет";
    dom.product.innerHTML = `<div class="empty-state">${icon("box")}<h1 tabindex="-1">Товар не найден</h1>
      <p>Возможно, товар уже удалён. Товары, добавленные в этой вкладке, доступны только до перезагрузки страницы.</p>
      <a class="button button-primary" href="#catalog">Назад к каталогу</a></div>`;
    if (shouldFocus)
      dom.product.querySelector("h1").focus({ preventScroll: true });
    return;
  }
  document.title = `${product.title} — Свежий Маркет`;
  const images = getImages(product);
  const selectedIndex = Math.min(
    state.galleryIndices.get(String(product.id)) || 0,
    images.length - 1,
  );
  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const related = state.products
    .filter(
      (other) =>
        other.category === product.category &&
        String(other.id) !== String(product.id),
    )
    .slice(0, 4);
  const busy = state.locks.has(String(product.id));
  const title = escapeHtml(product.title);
  dom.product.innerHTML = `<nav class="breadcrumb" aria-label="Навигационная цепочка">
      <a href="#catalog">Каталог</a><span aria-hidden="true">/</span><a href="#catalog" data-category="${escapeHtml(product.category)}">${escapeHtml(categoryLabel(product.category))}</a><span aria-hidden="true">/</span><span>${title}</span>
    </nav>
    <a class="back-link" href="#catalog">${icon("arrow-left")}Назад к каталогу</a>
    <div class="detail-layout">
      <section class="gallery" aria-label="Фотографии товара">
        <div class="gallery-main">${Number(product.discountPercentage) > 0 ? `<span class="discount-badge">−${numberFormatter.format(product.discountPercentage)}%</span>` : ""}
          <img id="detail-main-image" src="${escapeHtml(images[selectedIndex])}" alt="${title}" width="640" height="600"></div>
        <div class="gallery-thumbnails">${images
          .map(
            (
              source,
              index,
            ) => `<button type="button" class="gallery-thumb${index === selectedIndex ? " active" : ""}"
          data-action="select-image" data-product-id="${escapeHtml(product.id)}" data-image-index="${index}" aria-label="Фотография ${index + 1}" aria-pressed="${index === selectedIndex}">
          <img src="${escapeHtml(source)}" alt="" width="88" height="88"></button>`,
          )
          .join("")}</div>
      </section>
      <div class="detail-summary">
        <span class="eyebrow">${escapeHtml(categoryLabel(product.category))}</span>
        <h1 class="detail-heading" tabindex="-1">${title}</h1>
        <div class="detail-meta">${product.brand ? `<span>Бренд: <b>${escapeHtml(product.brand)}</b></span>` : ""}
          <span class="product-rating">${icon("star")}${ratingText(product)}${reviews.length ? ` <a href="#reviews" data-action="show-reviews">· ${reviews.length} ${plural(reviews.length, "отзыв", "отзыва", "отзывов")}</a>` : ""}</span></div>
        <div class="detail-price-row"><span class="detail-price">${formatPrice(product.price)}</span></div>
        <p class="detail-stock${product.stock === 0 ? " out-of-stock" : ""}">${icon(product.stock > 0 ? "check" : "box")}${product.stock > 0 ? `В наличии · ${numberFormatter.format(product.stock)} шт. на складе` : "Нет в наличии"}</p>
        ${product.description ? `<p class="detail-description">${escapeHtml(product.description)}</p>` : '<p class="detail-description muted">Описание пока не добавлено.</p>'}
        ${product.sku ? `<p class="detail-sku muted">Артикул: ${escapeHtml(product.sku)}</p>` : ""}
        ${cartButtonMarkup(product, true)}
        <div class="detail-actions">
          <button type="button" class="button button-primary" data-action="edit" data-product-id="${escapeHtml(product.id)}"${busy ? " disabled" : ""}>${icon("edit")}Редактировать товар</button>
          <button type="button" class="button button-secondary delete-product-button" data-action="delete" data-product-id="${escapeHtml(product.id)}"${busy ? " disabled" : ""}>${icon("trash")}Удалить товар</button>
        </div>
        ${
          product.shippingInformation || product.warrantyInformation
            ? `<div class="service-notes">
          ${product.shippingInformation ? `<div class="service-note">${icon("truck")}<div><strong>Доставка</strong><span>${escapeHtml(translateService(product.shippingInformation))}</span></div></div>` : ""}
          ${product.warrantyInformation ? `<div class="service-note">${icon("shield")}<div><strong>Гарантия</strong><span>${escapeHtml(translateService(product.warrantyInformation))}</span></div></div>` : ""}
        </div>`
            : ""
        }
      </div>
    </div>
    <section class="detail-section"><div class="section-heading"><span class="eyebrow">Всё о товаре</span><h2>Характеристики товара</h2></div>
      <div class="specifications-wrap"><table class="specifications"><caption class="sr-only">Характеристики: ${title}</caption><tbody>${specificationRows(product)}</tbody></table></div>
    </section>
    ${
      reviews.length
        ? `<section class="detail-section" id="product-reviews"><div class="section-heading"><span class="eyebrow">Мнения покупателей</span><h2>Отзывы покупателей <span class="muted">(${reviews.length})</span></h2></div>
      <div class="reviews-grid">${reviews.map(reviewMarkup).join("")}</div></section>`
        : ""
    }
    ${
      related.length
        ? `<section class="detail-section"><div class="section-heading"><span class="eyebrow">Вам может понравиться</span><h2>Похожие товары</h2></div>
      <div class="related-grid">${related.map((item) => cardMarkup(item, true)).join("")}</div></section>`
        : ""
    }`;
  if (shouldFocus)
    dom.product.querySelector("h1").focus({ preventScroll: true });
}

function getRoute() {
  const hash = window.location.hash;
  if (!hash || hash === "#catalog" || hash === "#catalog-heading")
    return { view: "catalog" };
  if (hash.startsWith("#product/")) {
    try {
      return { view: "product", id: decodeURIComponent(hash.slice(9)) };
    } catch {
      return { view: "product", id: "" };
    }
  }
  return { view: "product", id: "" };
}

function renderRoute({ navigation = false } = {}) {
  const route = getRoute();
  reconcileCart();
  renderCart();
  const returningToCatalog =
    route.view === "catalog" && state.previousView === "product";
  dom.catalog.hidden = route.view !== "catalog";
  dom.product.hidden = route.view !== "product";
  renderStatistics();
  if (route.view === "product") {
    renderDetail(route.id, navigation);
    if (navigation) window.scrollTo({ top: 0, behavior: "instant" });
  } else {
    document.title = "Свежий Маркет — продукты и товары на каждый день";
    renderCatalog();
    if (returningToCatalog) {
      const savedScroll = state.catalogScroll;
      requestAnimationFrame(() =>
        window.scrollTo({ top: savedScroll, behavior: "instant" }),
      );
    }
  }
  state.previousView = route.view;
}

async function loadCatalog() {
  if (state.status === "loading" && loadCatalog.inProgress) return;
  state.status = "loading";
  state.error = "";
  loadCatalog.inProgress = true;
  renderRoute();
  try {
    const products = await getProducts();
    if (!Array.isArray(products))
      throw new Error(
        "Сервис вернул некорректный список товаров. Попробуйте ещё раз.",
      );
    state.products = products.map((product) =>
      normalizeProduct(translateProduct(product)),
    );
    state.status = "ready";
  } catch (error) {
    state.status = "error";
    state.error = errorMessage(
      error,
      "Проверьте подключение к интернету и попробуйте ещё раз.",
    );
  } finally {
    loadCatalog.inProgress = false;
    renderRoute();
  }
}

function clearFilters() {
  state.search = "";
  state.category = "";
  state.sort = "featured";
  dom.search.value = "";
  dom.clearSearch.hidden = true;
}

function updateCatalogFilters() {
  if (getRoute().view === "product") window.location.hash = "#catalog";
  else renderCatalog();
}

function restoreProductFocus(id, action = null, preventScroll = true) {
  const view = getRoute().view === "catalog" ? dom.catalog : dom.product;
  const button = action
    ? [...view.querySelectorAll("button[data-product-id]")].find(
        (node) =>
          node.dataset.productId === String(id) &&
          node.dataset.action === action &&
          !node.disabled,
      )
    : null;
  const card = [...view.querySelectorAll(".product-card")].find(
    (node) => node.dataset.productId === String(id),
  );
  const target =
    button ||
    card?.querySelector(".product-title a") ||
    view.querySelector("h1, h2") ||
    dom.add;
  if (!target.hasAttribute("tabindex") && ["H1", "H2"].includes(target.tagName))
    target.tabIndex = -1;
  target.focus({ preventScroll });
}

function field(name) {
  return dom.form.elements.namedItem(name);
}

function clearFormErrors() {
  dom.formError.textContent = "";
  dom.formError.hidden = true;
  dom.form.querySelectorAll("[data-error-for]").forEach((error) => {
    error.textContent = "";
  });
  for (const name of [
    "title",
    "price",
    "category",
    "brand",
    "description",
    "stock",
    "image",
  ]) {
    field(name).removeAttribute("aria-invalid");
  }
}

function setFieldError(name, message) {
  const error = element(`error-${name}`);
  if (error) error.textContent = message;
  field(name).setAttribute("aria-invalid", "true");
}

function setFormBusy(busy) {
  state.formSaving = busy;
  dom.fields.disabled = busy;
  dom.save.disabled = busy;
  dom.save.textContent = busy
    ? "Сохраняем…"
    : state.editingId === null
      ? "Добавить товар"
      : "Сохранить изменения";
  dom.formDialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.disabled = busy;
  });
  dom.form.setAttribute("aria-busy", String(busy));
}

function openProductForm(id = null) {
  if (state.status !== "ready" || state.formSaving) return;
  const product = id === null ? null : getProduct(id);
  if (id !== null && (!product || state.locks.has(String(id)))) return;
  state.editingId = product ? String(product.id) : null;
  dom.form.reset();
  clearFormErrors();
  renderCategoryControls();
  dom.formTitle.textContent = product
    ? "Редактировать товар"
    : "Новый товар в вашем магазине";
  dom.formDescription.textContent = product
    ? "Обновите информацию — изменения сразу появятся в каталоге."
    : "Заполните информацию, и товар сразу появится на витрине.";
  field("title").value = product?.title || "";
  field("price").value = product?.price ?? "";
  field("category").value = product
    ? categoryLabel(product.category)
    : state.category
      ? categoryLabel(state.category)
      : "Продукты";
  field("brand").value = product?.brand || "";
  field("description").value = product?.description || "";
  field("stock").value = product?.stock ?? 0;
  const source = product ? getImages(product)[0] : PLACEHOLDER;
  field("image").value = source === PLACEHOLDER ? "" : source;
  dom.preview.removeAttribute("data-fallback");
  dom.preview.src = source;
  dom.preview.alt = product ? product.title : "Предпросмотр изображения";
  setFormBusy(false);
  dom.formDialog.showModal();
  field("title").focus();
}

function categoryValue(input) {
  const value = input.trim();
  const known = Object.entries(categoryNames).find(
    ([key, label]) =>
      key.toLowerCase() === value.toLowerCase() ||
      label.toLocaleLowerCase("ru") === value.toLocaleLowerCase("ru"),
  );
  if (known) return known[0];
  return (
    allCategories().find(
      (category) =>
        category.toLocaleLowerCase("ru") === value.toLocaleLowerCase("ru"),
    ) || value
  );
}

function validateForm() {
  clearFormErrors();
  const title = field("title").value.trim();
  const priceInput = field("price").value.trim();
  const price = Number(priceInput);
  const stockInput = field("stock").value.trim();
  const stock = Number(stockInput);
  const category = categoryValue(field("category").value);
  const image = field("image").value.trim();
  const errors = [];
  if (!title) errors.push(["title", "Введите название товара."]);
  if (
    !priceInput ||
    !Number.isFinite(price) ||
    price < 0.01 ||
    Math.round(price * 100) / 100 !== price
  ) {
    errors.push([
      "price",
      "Укажите цену от 0,01 и не больше двух знаков после запятой.",
    ]);
  }
  if (!stockInput || !Number.isSafeInteger(stock) || stock < 0)
    errors.push([
      "stock",
      "Введите целое число от 0 до 9 007 199 254 740 991.",
    ]);
  if (!category)
    errors.push(["category", "Выберите категорию или введите новую."]);
  if (image && safeImageSource(image) === PLACEHOLDER)
    errors.push([
      "image",
      "Укажите полную ссылку, начинающуюся с https:// или http://.",
    ]);
  errors.forEach(([name, message]) => setFieldError(name, message));
  if (errors.length) {
    field(errors[0][0]).focus();
    return null;
  }
  const current = state.editingId === null ? null : getProduct(state.editingId);
  const thumbnail = image ? safeImageSource(image) : "";
  const currentImages =
    current && Array.isArray(current.images) ? current.images : [];
  return {
    title,
    price,
    category,
    stock,
    brand: field("brand").value.trim(),
    description: field("description").value.trim(),
    thumbnail,
    images: thumbnail
      ? [
          ...new Set([
            thumbnail,
            ...currentImages.filter(
              (source) => safeImageSource(source) !== PLACEHOLDER,
            ),
          ]),
        ]
      : [],
  };
}

async function saveProduct(event) {
  event.preventDefault();
  if (state.formSaving) return;
  const values = validateForm();
  if (!values) return;
  const id = state.editingId;
  const product = id === null ? null : getProduct(id);
  if (id !== null && (!product || state.locks.has(id))) return;
  if (id !== null) state.locks.add(id);
  let savedId = null;
  setFormBusy(true);
  try {
    if (product) {
      if (!product.__local) await updateProduct(product.id, values);
      // Ответ API содержит старые поля: изменяем только отправленные значения.
      Object.assign(product, values);
      state.galleryIndices.set(String(product.id), 0);
      savedId = String(product.id);
      showToast("Изменения товара сохранены.");
    } else {
      const response = await addProduct(values);
      state.localCounter += 1;
      const localId = `local-${Date.now()}-${state.localCounter}`;
      savedId = localId;
      state.products.unshift(
        normalizeProduct({
          ...response,
          ...values,
          id: localId,
          __local: true,
          __createdOrder: state.localCounter,
        }),
      );
      clearFilters();
      state.catalogScroll = 0;
      if (getRoute().view !== "catalog")
        history.pushState(null, "", "#catalog");
      showToast("Новый товар добавлен в каталог.");
    }
    dom.formDialog.close();
  } catch (error) {
    dom.formError.hidden = false;
    dom.formError.textContent = errorMessage(
      error,
      "Не удалось сохранить товар. Проверьте подключение и повторите попытку.",
    );
  } finally {
    if (id !== null) state.locks.delete(id);
    setFormBusy(false);
    renderRoute();
    if (savedId !== null)
      requestAnimationFrame(() =>
        restoreProductFocus(savedId, product ? "edit" : null, Boolean(product)),
      );
  }
}

function openDeleteDialog(id) {
  const product = getProduct(id);
  if (!product || state.locks.has(String(id)) || state.deleteSaving) return;
  state.deletingId = String(id);
  dom.deleteName.textContent = product.title;
  dom.deleteError.textContent = "";
  dom.deleteError.hidden = true;
  dom.deleteDialog.showModal();
  dom.deleteDialog.querySelector("[data-close-dialog]")?.focus();
}

function setDeleteBusy(busy) {
  state.deleteSaving = busy;
  dom.confirmDelete.disabled = busy;
  dom.confirmDelete.textContent = busy ? "Удаляем…" : "Удалить товар";
  dom.deleteDialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.disabled = busy;
  });
  dom.deleteDialog.setAttribute("aria-busy", String(busy));
}

async function confirmDelete() {
  if (state.deleteSaving || state.deletingId === null) return;
  const id = state.deletingId;
  const product = getProduct(id);
  if (!product || state.locks.has(id)) return;
  const visibleIds = [...dom.grid.querySelectorAll(".product-card")].map(
    (card) => card.dataset.productId,
  );
  const position = visibleIds.indexOf(id);
  const nextId = visibleIds[position + 1] || visibleIds[position - 1];
  let deleted = false;
  state.locks.add(id);
  setDeleteBusy(true);
  try {
    if (!product.__local) await deleteProduct(product.id);
    state.products = state.products.filter((item) => String(item.id) !== id);
    deleted = true;
    state.galleryIndices.delete(id);
    dom.deleteDialog.close();
    state.deletingId = null;
    if (getRoute().view === "product" && getRoute().id === id)
      history.pushState(null, "", "#catalog");
    showToast("Товар удалён из каталога.");
  } catch (error) {
    dom.deleteError.hidden = false;
    dom.deleteError.textContent = errorMessage(
      error,
      "Не удалось удалить товар. Попробуйте ещё раз.",
    );
  } finally {
    state.locks.delete(id);
    setDeleteBusy(false);
    renderRoute();
    if (deleted) restoreProductFocus(nextId, "delete");
  }
}

async function changeStock(id, change) {
  const product = getProduct(id);
  const key = String(id);
  if (!product || state.locks.has(key)) return;
  const stock = product.stock + change;
  if (!Number.isSafeInteger(stock) || stock < 0) return;
  const focusedElement = document.activeElement;
  const originalHash = window.location.hash;
  state.locks.add(key);
  // Блокируем только этот товар, чтобы соседние карточки оставались доступными.
  document.querySelectorAll("[data-product-id]").forEach((node) => {
    if (node.dataset.productId === key && node.tagName === "BUTTON")
      node.disabled = true;
  });
  try {
    if (!product.__local) await updateProduct(product.id, { stock });
    product.stock = stock;
    showToast(`Запас обновлён: ${numberFormatter.format(stock)} шт.`);
  } catch (error) {
    showToast(
      errorMessage(error, "Не удалось изменить количество товара."),
      "error",
    );
  } finally {
    const shouldRestoreFocus =
      window.location.hash === originalHash &&
      (document.activeElement === focusedElement ||
        document.activeElement === document.body);
    state.locks.delete(key);
    renderRoute();
    if (shouldRestoreFocus)
      restoreProductFocus(
        key,
        change > 0 || product.stock === 0 ? "increase-stock" : "decrease-stock",
      );
  }
}

function selectImage(button) {
  const product = getProduct(button.dataset.productId);
  if (!product) return;
  const index = Number(button.dataset.imageIndex);
  const images = getImages(product);
  if (!images[index]) return;
  state.galleryIndices.set(String(product.id), index);
  const mainImage = element("detail-main-image");
  mainImage.removeAttribute("data-fallback");
  mainImage.src = images[index];
  dom.product.querySelectorAll(".gallery-thumb").forEach((thumbnail) => {
    const active = Number(thumbnail.dataset.imageIndex) === index;
    thumbnail.classList.toggle("active", active);
    thumbnail.setAttribute("aria-pressed", String(active));
  });
}

function bindEvents() {
  dom.search.addEventListener("input", () => {
    state.search = dom.search.value;
    dom.clearSearch.hidden = !state.search;
    updateCatalogFilters();
  });
  dom.clearSearch.addEventListener("click", () => {
    state.search = "";
    updateCatalogFilters();
    dom.search.focus();
  });
  dom.category.addEventListener("change", () => {
    state.category = dom.category.value;
    updateCatalogFilters();
  });
  dom.sort.addEventListener("change", () => {
    state.sort = dom.sort.value;
    updateCatalogFilters();
  });
  dom.reset.addEventListener("click", () => {
    clearFilters();
    updateCatalogFilters();
  });
  dom.add.addEventListener("click", () => openProductForm());
  dom.openCart.addEventListener("click", () => {
    renderCart();
    dom.cartDialog.showModal();
  });
  dom.clearCart.addEventListener("click", clearCart);
  dom.form.addEventListener("submit", saveProduct);
  dom.confirmDelete.addEventListener("click", confirmDelete);
  element("about-button")?.addEventListener("click", () =>
    dom.aboutDialog.showModal(),
  );
  field("image").addEventListener("input", () => {
    dom.preview.removeAttribute("data-fallback");
    dom.preview.src = safeImageSource(field("image").value);
  });
  dom.form.addEventListener("input", (event) => {
    const name = event.target.name;
    if (name) {
      event.target.removeAttribute("aria-invalid");
      const error = element(`error-${name}`);
      if (error) error.textContent = "";
    }
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest(".skip-link")) {
      event.preventDefault();
      if (getRoute().view !== "catalog") {
        history.pushState(null, "", "#catalog");
        renderRoute();
      }
      const heading = element("catalog-heading");
      requestAnimationFrame(() => {
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ behavior: "instant", block: "start" });
      });
      return;
    }
    const closeButton = event.target.closest("[data-close-dialog]");
    if (closeButton) {
      const dialog = element(closeButton.dataset.closeDialog);
      if (
        (dialog === dom.formDialog && state.formSaving) ||
        (dialog === dom.deleteDialog && state.deleteSaving)
      )
        return;
      dialog?.close();
      return;
    }
    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton && !categoryButton.disabled) {
      event.preventDefault();
      state.category = categoryButton.dataset.category;
      updateCatalogFilters();
      if (categoryButton.id === "hero-browse")
        element("category-chips").scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      return;
    }
    const action = event.target.closest("[data-action]");
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      if (action.disabled) return;
      const id = action.dataset.productId;
      switch (action.dataset.action) {
        case "add-to-cart":
          changeCartQuantity(id, 1, true);
          break;
        case "cart-increase":
          changeCartQuantity(id, 1);
          break;
        case "cart-decrease":
          changeCartQuantity(id, -1);
          break;
        case "cart-remove":
          removeFromCart(id);
          break;
        case "add":
          openProductForm();
          break;
        case "edit":
          openProductForm(id);
          break;
        case "delete":
          openDeleteDialog(id);
          break;
        case "increase-stock":
          changeStock(id, 1);
          break;
        case "decrease-stock":
          changeStock(id, -1);
          break;
        case "select-image":
          selectImage(action);
          break;
        case "retry":
          loadCatalog();
          break;
        case "reset-filters":
          clearFilters();
          updateCatalogFilters();
          break;
        case "show-reviews":
          element("product-reviews")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          break;
      }
      return;
    }
    const productLink = event.target.closest('a[href^="#product/"]');
    if (productLink && dom.cartDialog.contains(productLink)) {
      dom.cartDialog.close();
      if (productLink.hash === window.location.hash) {
        event.preventDefault();
        renderRoute({ navigation: true });
      }
    }
    if (productLink && getRoute().view === "catalog")
      state.catalogScroll = window.scrollY;
    const card = event.target.closest(".product-card[data-product-id]");
    if (card && !event.target.closest("button, a, input, select, textarea")) {
      state.catalogScroll = window.scrollY;
      window.location.hash = productUrl(card.dataset.productId);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.target.matches(".product-card") &&
      ["Enter", " "].includes(event.key)
    ) {
      event.preventDefault();
      state.catalogScroll = window.scrollY;
      window.location.hash = productUrl(event.target.dataset.productId);
    }
  });
  // Событие error у изображений не всплывает, поэтому используем capture.
  document.addEventListener(
    "error",
    (event) => {
      const image = event.target;
      if (
        image instanceof HTMLImageElement &&
        image.dataset.fallback !== "true"
      ) {
        image.dataset.fallback = "true";
        image.src = PLACEHOLDER;
      }
    },
    true,
  );
  for (const dialog of [
    dom.formDialog,
    dom.deleteDialog,
    dom.aboutDialog,
    dom.cartDialog,
  ]) {
    dialog.addEventListener("cancel", (event) => {
      if (
        (dialog === dom.formDialog && state.formSaving) ||
        (dialog === dom.deleteDialog && state.deleteSaving)
      )
        event.preventDefault();
    });
    dialog.addEventListener("click", (event) => {
      if (
        event.target !== dialog ||
        (dialog === dom.formDialog && state.formSaving) ||
        (dialog === dom.deleteDialog && state.deleteSaving)
      )
        return;
      const bounds = dialog.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        dialog.close();
    });
  }
  window.addEventListener("hashchange", () =>
    renderRoute({ navigation: true }),
  );
  window.addEventListener(
    "scroll",
    () => {
      if (getRoute().view === "catalog" && state.previousView === "catalog")
        state.catalogScroll = window.scrollY;
    },
    { passive: true },
  );
}

export function startApp() {
  if ("scrollRestoration" in window.history)
    window.history.scrollRestoration = "manual";
  bindEvents();
  return loadCatalog();
}
