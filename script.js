// ==========================================
// ЭЛЕМЕНТТЕРДІ АЛУ
// ==========================================


// Жоғарғы вкладкалар
const buttons = document.querySelectorAll(".tab-button");


// Төменгі карточкалар
const cards = document.querySelectorAll(".team-card");


// Барлық ақпараттық бөлімдер
const panels = document.querySelectorAll(".tab-panel");


// ==========================================
// ВКЛАДКАНЫ АШУ ФУНКЦИЯСЫ
// ==========================================

function openTab(target) {

  // ----------------------------------------
  // ЖОҒАРҒЫ ВКЛАДКАЛАРДЫ АУЫСТЫРУ
  // ----------------------------------------

  buttons.forEach((button) => {

    if (button.dataset.tab === target) {

      button.classList.add("active");

    } else {

      button.classList.remove("active");

    }

  });


  // ----------------------------------------
  // ТӨМЕНГІ КАРТОЧКАЛАРДЫ АУЫСТЫРУ
  // ----------------------------------------

  cards.forEach((card) => {

    if (card.dataset.tab === target) {

      card.classList.add("active");

    } else {

      card.classList.remove("active");

    }

  });


  // ----------------------------------------
  // АҚПАРАТТЫҚ БӨЛІМДІ АУЫСТЫРУ
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
// ЖОҒАРҒЫ ВКЛАДКАЛАРДЫ БАСУ
// ==========================================

buttons.forEach((button) => {

  button.addEventListener("click", () => {

    // Батырманың data-tab мәнін аламыз

    const target = button.dataset.tab;


    // Сол бөлімді ашамыз

    openTab(target);

  });

});


// ==========================================
// ТӨМЕНГІ КАРТОЧКАЛАРДЫ БАСУ
// ==========================================

cards.forEach((card) => {

  card.addEventListener("click", () => {

    // Карточканың data-tab мәнін аламыз

    const target = card.dataset.tab;


    // Сәйкес вкладканы ашамыз

    openTab(target);

  });

});


// ==========================================
// БАСТАПҚЫ БӨЛІМ
// ==========================================

// Сайт ашылған кезде
// "Басты Бет" автоматты түрде ашыладыfrfrf

openTab("home");