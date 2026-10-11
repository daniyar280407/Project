const API_URL = "https://dummyjson.com";
const REQUEST_TIMEOUT = 15000;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Товар не найден на сервере. Попробуйте другой товар.");
      }
      if (response.status === 429) {
        throw new Error(
          "Слишком много запросов. Подождите немного и повторите попытку.",
        );
      }
      throw new Error(
        "Сервис товаров временно недоступен. Попробуйте ещё раз.",
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      if (error.name === "AbortError") throw error;
      throw new Error("Сервис вернул некорректный ответ. Попробуйте ещё раз.");
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Сервис вернул некорректные данные. Попробуйте ещё раз.");
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Сервис долго не отвечает. Проверьте соединение и повторите попытку.",
      );
    }
    if (error instanceof TypeError) {
      throw new Error(
        "Не удалось связаться с сервисом товаров. Проверьте подключение к интернету.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getProducts() {
  const data = await request("/products?limit=0");
  const validProducts =
    Array.isArray(data.products) &&
    data.products.every(
      (product) =>
        product &&
        Number.isFinite(product.id) &&
        typeof product.title === "string",
    );

  if (!validProducts) {
    throw new Error(
      "Не удалось прочитать каталог. Попробуйте загрузить его ещё раз.",
    );
  }

  return data.products;
}

// DummyJSON подтверждает операции, а приложение хранит изменения у себя в памяти.
export function addProduct(product) {
  return request("/products/add", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export function updateProduct(id, changes) {
  return request(`/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export function deleteProduct(id) {
  return request(`/products/${encodeURIComponent(id)}`, { method: "DELETE" });
}
