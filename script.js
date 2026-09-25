// ==========================================
// ЭЛЕМЕНТТЕРДІ АЛУ
// ==========================================
const buttons = document.querySelectorAll(".tab-button");
const cards = document.querySelectorAll(".team-card");
const panels = document.querySelectorAll(".tab-panel");
const teamCards = document.querySelector(".team-cards");

// ==========================================
// ВКЛАДКАНЫ АШУ ФУНКЦИЯСЫ
// ==========================================
function openTab(target) {
  buttons.forEach((button) => {
    if (button.dataset.tab === target) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });

  cards.forEach((card) => {
    if (card.dataset.tab === target) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });

  panels.forEach((panel) => {
    if (panel.id === target) {
      panel.classList.add("active");
    } else {
      panel.classList.remove("active");
    }
  });

  function openTab(target) {
  buttons.forEach((button) => {
    if (button.dataset.tab === target) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });

  cards.forEach((card) => {
    if (card.dataset.tab === target) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });

  panels.forEach((panel) => {
    if (panel.id === target) {
      panel.classList.add("active");
    } else {
      panel.classList.remove("active");
    }
  });

  // new-div тек "1 тапсырма" вкладкасында көрінеді
  const newDivEl = document.getElementById("new-div-element");
  if (newDivEl) {
    newDivEl.style.display = target === "task1" ? "block" : "none";
  }

  if (target === "home") {
    teamCards.style.display = "grid";
  } else {
    teamCards.style.display = "none";
  }
}
  if (target === "home") {
    teamCards.style.display = "grid";
  } else {
    teamCards.style.display = "none";
  }
}

// Жоғарғы вкладкаларды басу
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    openTab(button.dataset.tab);
  });
});

// Төменгі карточкаларды басу
cards.forEach((card) => {
  card.addEventListener("click", () => {
    openTab(card.dataset.tab);
  });
});

// Бастапқы бөлімді ашу
openTab("home");


// ==========================================
// 1 ТАПСЫРМАҒА АРНАЛҒАН JAVASCRIPT ТАПСЫРМАЛАРЫ
// ==========================================

// 1. ID бойынша элементті тауып, оның мәтінін «Сәлем, әлем!» деп өзгерту
const targetEl = document.getElementById("target-element");
if (targetEl) {
  targetEl.textContent = "Сәлем, әлем!";
}



// 3. old-element класы бар элементті жою
const oldElement = document.querySelector(".old-element");
if (oldElement) {
  oldElement.remove();
}

// 2. new-div класымен жаңа <div> жасап, <body> соңына қосу
const newDiv = document.createElement("div");
newDiv.id = "new-div-element";
newDiv.className = "new-div";
newDiv.textContent = "Мен жаңа элементпін";
newDiv.style.display = "none"; // алдымен жасырамыз
document.body.appendChild(newDiv);


// 4. «Бұл ауыспалы абзац» мәтіні бар <p> элементін жасау
const toggleParagraph = document.createElement("p");
toggleParagraph.textContent = "Бұл ауыспалы абзац";
toggleParagraph.style.cssText = "cursor: pointer; margin-top: 15px; padding: 10px; background: rgba(56, 189, 248, 0.1); border-radius: 5px; transition: 0.3s; color: #fff;";

// 5. Абзацты басқан кезде мәтін түсін және қаріп өлшемін ауыстыру (toggle)
let isChanged = false;

toggleParagraph.addEventListener("click", () => {
  isChanged = !isChanged;

  if (isChanged) {
    toggleParagraph.style.color = "#10b981"; // Жасыл түс
    toggleParagraph.style.fontSize = "18px";
    toggleParagraph.style.fontWeight = "bold";
  } else {
    toggleParagraph.style.color = "#fff";
    toggleParagraph.style.fontSize = "16px";
    toggleParagraph.style.fontWeight = "normal";
  }
});


// Абзацты DOM-ға қосу (task1 бөліміне)
const task1Container = document.getElementById("task1-content");
if (task1Container) {
  task1Container.appendChild(toggleParagraph);
}



