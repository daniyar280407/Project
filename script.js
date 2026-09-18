// ==========================================
// ЭЛЕМЕНТТЕРДІ АЛУ
// ==========================================

// Жоғарғы вкладкалар
const buttons = document.querySelectorAll(".tab-button");

// Төменгі карточкалар
const cards = document.querySelectorAll(".team-card");

// Барлық ақпараттық бөлімдер
const panels = document.querySelectorAll(".tab-panel");

// Төменгі карточкалар блогы
const teamCards = document.querySelector(".team-cards");


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
  // ТӨМЕНГІ КАРТОЧКАЛАРДЫҢ ACTIVE КҮЙІ
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


  // ----------------------------------------
  // ТӨМЕНГІ КАРТОЧКАЛАРДЫ КӨРСЕТУ / ЖАСЫРУ
  // ----------------------------------------

  if (target === "home") {

    teamCards.style.display = "grid";

  } else {

    teamCards.style.display = "none";

  }

}


// ==========================================
// ЖОҒАРҒЫ ВКЛАДКАЛАРДЫ БАСУ
// ==========================================

buttons.forEach((button) => {

  button.addEventListener("click", () => {

    const target = button.dataset.tab;

    openTab(target);

  });

});


// ==========================================
// ТӨМЕНГІ КАРТОЧКАЛАРДЫ БАСУ
// ==========================================

cards.forEach((card) => {

  card.addEventListener("click", () => {

    const target = card.dataset.tab;

    openTab(target);

  });

});


// ==========================================
// БАСТАПҚЫ БӨЛІМ
// ==========================================

// Сайт ашылған кезде "Басты Бет" ашылады
// және төменгі карточкалар көрсетіледі

openTab("home");
