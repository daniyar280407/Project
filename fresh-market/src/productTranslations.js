const titleTranslations = {
  Apple: "Яблоки",
  "Beef Steak": "Говяжий стейк",
  "Cat Food": "Корм для кошек",
  "Chicken Meat": "Куриное мясо",
  "Cooking Oil": "Масло для готовки",
  Cucumber: "Огурцы",
  "Dog Food": "Корм для собак",
  Eggs: "Яйца",
  "Fish Steak": "Рыбный стейк",
  "Green Bell Pepper": "Зелёный сладкий перец",
  "Green Chili Pepper": "Зелёный перец чили",
  "Honey Jar": "Мёд в банке",
  "Ice Cream": "Мороженое",
  Juice: "Сок",
  Kiwi: "Киви",
  Lemon: "Лимоны",
  Milk: "Молоко",
  Mulberry: "Шелковица",
  "Nescafe Coffee": "Кофе Nescafe",
  Potatoes: "Картофель",
  "Protein Powder": "Протеиновый порошок",
  "Red Onions": "Красный лук",
  Rice: "Рис",
  "Soft Drinks": "Прохладительные напитки",
  Strawberry: "Клубника",
  "Tissue Paper Box": "Бумажные салфетки",
  Water: "Вода",
};

const descriptionTranslations = {
  "Fresh and crisp apples, perfect for snacking or incorporating into various recipes.":
    "Свежие хрустящие яблоки, которые отлично подходят для перекуса и приготовления различных блюд.",
  "High-quality beef steak, great for grilling or cooking to your preferred level of doneness.":
    "Качественный говяжий стейк, который отлично подходит для гриля или приготовления до желаемой степени прожарки.",
  "Nutritious cat food formulated to meet the dietary needs of your feline friend.":
    "Питательный корм для кошек, разработанный с учётом потребностей вашего питомца.",
  "Fresh and tender chicken meat, suitable for various culinary preparations.":
    "Свежее и нежное куриное мясо для приготовления различных блюд.",
  "Versatile cooking oil suitable for frying, sautéing, and various culinary applications.":
    "Универсальное масло для жарки, пассерования и приготовления различных блюд.",
  "Crisp and hydrating cucumbers, ideal for salads, snacks, or as a refreshing side.":
    "Хрустящие сочные огурцы, которые отлично подходят для салатов, перекусов или освежающего гарнира.",
  "Specially formulated dog food designed to provide essential nutrients for your canine companion.":
    "Специально разработанный корм, обеспечивающий вашего питомца необходимыми питательными веществами.",
  "Fresh eggs, a versatile ingredient for baking, cooking, or breakfast.":
    "Свежие яйца — универсальный ингредиент для выпечки, приготовления различных блюд или завтрака.",
  "Quality fish steak, suitable for grilling, baking, or pan-searing.":
    "Качественный рыбный стейк для приготовления на гриле, запекания или обжаривания на сковороде.",
  "Fresh and vibrant green bell pepper, perfect for adding color and flavor to your dishes.":
    "Свежий яркий зелёный сладкий перец, который добавит вашим блюдам цвет и вкус.",
  "Spicy green chili pepper, ideal for adding heat to your favorite recipes.":
    "Острый зелёный перец чили, который придаст пикантность вашим любимым блюдам.",
  "Pure and natural honey in a convenient jar, perfect for sweetening beverages or drizzling over food.":
    "Чистый натуральный мёд в удобной банке, который отлично подходит для подслащивания напитков или добавления к блюдам.",
  "Creamy and delicious ice cream, available in various flavors for a delightful treat.":
    "Нежное вкусное мороженое с разнообразными вкусами — приятное лакомство.",
  "Refreshing fruit juice, packed with vitamins and great for staying hydrated.":
    "Освежающий фруктовый сок, богатый витаминами и отлично утоляющий жажду.",
  "Nutrient-rich kiwi, perfect for snacking or adding a tropical twist to your dishes.":
    "Богатый питательными веществами киви, который отлично подходит для перекуса или придания блюдам тропических ноток.",
  "Zesty and tangy lemons, versatile for cooking, baking, or making refreshing beverages.":
    "Ароматные кислые лимоны для приготовления блюд, выпечки или освежающих напитков.",
  "Fresh and nutritious milk, a staple for various recipes and daily consumption.":
    "Свежее питательное молоко — базовый продукт для различных рецептов и ежедневного употребления.",
  "Sweet and juicy mulberries, perfect for snacking or adding to desserts and cereals.":
    "Сладкая сочная шелковица, которая отлично подходит для перекуса или добавления в десерты и каши.",
  "Quality coffee from Nescafe, available in various blends for a rich and satisfying cup.":
    "Качественный кофе Nescafe в различных смесях для приготовления насыщенного приятного напитка.",
  "Versatile and starchy potatoes, great for roasting, mashing, or as a side dish.":
    "Универсальный крахмалистый картофель, который отлично подходит для запекания, приготовления пюре или гарнира.",
  "Nutrient-packed protein powder, ideal for supplementing your diet with essential proteins.":
    "Богатый питательными веществами протеиновый порошок для дополнения рациона необходимыми белками.",
  "Flavorful and aromatic red onions, perfect for adding depth to your savory dishes.":
    "Ароматный красный лук с насыщенным вкусом, который сделает ваши несладкие блюда выразительнее.",
  "High-quality rice, a staple for various cuisines and a versatile base for many dishes.":
    "Качественный рис — основной продукт различных кухонь мира и универсальная основа для многих блюд.",
  "Assorted soft drinks in various flavors, perfect for refreshing beverages.":
    "Ассортимент освежающих прохладительных напитков с различными вкусами.",
  "Sweet and succulent strawberries, great for snacking, desserts, or blending into smoothies.":
    "Сладкая сочная клубника, которая отлично подходит для перекуса, десертов или смузи.",
  "Convenient tissue paper box for everyday use, providing soft and absorbent tissues.":
    "Удобная коробка мягких хорошо впитывающих бумажных салфеток для повседневного использования.",
  "Pure and refreshing bottled water, essential for staying hydrated throughout the day.":
    "Чистая освежающая бутилированная вода, необходимая для поддержания водного баланса в течение дня.",
};

const reviewTranslations = {
  "Awesome product!": "Отличный товар!",
  "Disappointing product!": "Товар разочаровал!",
  "Excellent quality!": "Превосходное качество!",
  "Fast shipping!": "Быстрая доставка!",
  "Great product!": "Отличный товар!",
  "Great value for money!": "Хорошее соотношение цены и качества!",
  "Highly impressed!": "Очень впечатлён!",
  "Highly recommended!": "Очень рекомендую!",
  "Not as described!": "Не соответствует описанию!",
  "Not worth the price!": "Не стоит своих денег!",
  "Poor quality!": "Низкое качество!",
  "Very disappointed!": "Очень разочарован!",
  "Very dissatisfied!": "Очень недоволен!",
  "Very happy with my purchase!": "Очень доволен покупкой!",
  "Very pleased!": "Очень доволен!",
  "Very satisfied!": "Полностью доволен!",
  "Very unhappy with my purchase!": "Очень недоволен покупкой!",
  "Waste of money!": "Пустая трата денег!",
  "Would buy again!": "Куплю снова!",
  "Would not buy again!": "Больше не куплю!",
  "Would not recommend!": "Не рекомендую!",
};

// Переводим только известный текст API один раз при первоначальной загрузке.
export function translateProduct(product) {
  return {
    ...product,
    title: Object.hasOwn(titleTranslations, product.title)
      ? titleTranslations[product.title]
      : product.title,
    description: Object.hasOwn(descriptionTranslations, product.description)
      ? descriptionTranslations[product.description]
      : product.description,
  };
}

export function translateReviewText(text) {
  return Object.hasOwn(reviewTranslations, text)
    ? reviewTranslations[text]
    : text;
}
