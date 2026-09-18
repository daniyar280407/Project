// ==========================================
// ПОЛУЧАЕМ ЭЛЕМЕНТЫ СО СТРАНИЦЫ
// ==========================================


// Верхние вкладки
const buttons = document.querySelectorAll(".tab-button");


// Нижние карточки
const cards = document.querySelectorAll(".team-card");


// Все информационные блоки
const panels = document.querySelectorAll(".tab-panel");


// ==========================================
// ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ
// ==========================================

function openTab(target) {

  // ----------------------------------------
  // Верхние кнопки
  // ----------------------------------------

  buttons.forEach((button) => {

    if (button.dataset.tab === target) {

      button.classList.add("active");

    } else {

      button.classList.remove("active");

    }

  });


  // ----------------------------------------
  // Нижние карточки
  // ----------------------------------------

  cards.forEach((card) => {

    if (card.dataset.tab === target) {

      card.classList.add("active");

    } else {

      card.classList.remove("active");

    }

  });


  // ----------------------------------------
  // Информационные панели
  // ----------------------------------------

  panels.forEach((panel) => {

    if (panel.id === target) {

      panel.classList.add("active");

    } else {

      panel.classList.remove("active");

    }

  });

}


// ==========================================
// КЛИК ПО ВЕРХНИМ ВКЛАДКАМ
// ==========================================

buttons.forEach((button) => {

  button.addEventListener("click", () => {

    // Получаем значение data-tab
    //
    // Например:
    // data-tab="ivan"
    //
    // target будет:
    // "ivan"

    const target = button.dataset.tab;


    // Открываем вкладку

    openTab(target);

  });

});


// ==========================================
// КЛИК ПО НИЖНИМ КАРТОЧКАМ
// ==========================================

cards.forEach((card) => {

  card.addEventListener("click", () => {

    // Получаем data-tab карточки

    const target = card.dataset.tab;


    // Открываем соответствующую вкладку

    openTab(target);

  });

});


// ==========================================
// НАЧАЛЬНАЯ ВКЛАДКА
// ==========================================

// При загрузке страницы сразу открываем Марию

openTab("masha");