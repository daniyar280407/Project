const API_URL = "https://dummyjson.com";

async function requestProducts(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(API_URL + path, {
      ...options,
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Сервер не ответил за 15 секунд. Попробуйте ещё раз.");
    }
    if (error.message.startsWith("HTTP ")) {
      throw new Error("Сервер вернул ошибку " + error.message + ". Попробуйте ещё раз.");
    }
    throw new Error("Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function getProducts() {
  const data = await requestProducts("/products?limit=0");
  if (!Array.isArray(data.products)) {
    throw new Error("Сервер вернул некорректный список товаров.");
  }
  return data.products;
}

export function createProduct(product) {
  return requestProducts("/products/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  });
}

export function updateProduct(id, changes) {
  return requestProducts("/products/" + encodeURIComponent(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes)
  });
}

export function deleteProduct(id) {
  return requestProducts("/products/" + encodeURIComponent(id), {
    method: "DELETE"
  });
}
