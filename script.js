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

// DOM тапсырмалары
(() => {
    // 1 тапсырма: ID бойынша мәтінді өзгерту.
    const target = document.getElementById('target-element');
    target.textContent = 'Сәлем, әлем!';

    // Старый элемент удаляем только один раз
    document.querySelector('#task1 .old-element').remove();

    // При нажатии меняем цвет "Сәлем, әлем!"
    let colorChanged = false;

    target.addEventListener('click', () => {
        colorChanged = !colorChanged;
        target.style.color = colorChanged ? '#fda4af' : '';
    });


    // Ауыспалы абзац
    const paragraph = document.createElement('p');
    paragraph.id = 'changing-paragraph';
    paragraph.textContent = 'Бұл ауыспалы абзац';
    paragraph.tabIndex = 0;
    paragraph.setAttribute('role', 'button');
    paragraph.setAttribute('aria-pressed', 'false');

    document.getElementById('task1-content').appendChild(paragraph);

    let changed = false;

    function changeParagraphStyle() {
        changed = !changed;
        paragraph.style.color = changed ? '#fda4af' : '';
        paragraph.style.fontSize = changed ? '26px' : '';
        paragraph.setAttribute('aria-pressed', String(changed));
    }

    paragraph.addEventListener('click', changeParagraphStyle);

    paragraph.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            changeParagraphStyle();
        }
    });
})();


// Тапсырма шарты бойынша div тікелей body соңына қосылады.
const newDiv = document.createElement('div');
newDiv.className = 'new-div';
newDiv.textContent = 'Мен жаңа элементпін';
document.body.appendChild(newDiv);


// Бұл нәтиже тек 1 тапсырма вкладкасында көрсетіледі.
const task1 = document.getElementById('task1');

function syncTask1Result() {
    newDiv.hidden = !task1.classList.contains('active');
}

new MutationObserver(syncTask1Result).observe(task1, {
    attributes: true,
    attributeFilter: ['class']
});

syncTask1Result();


// 2 тапсырма: active класын ауыстыру және барлық кластарды шығару.
const classElement = document.getElementById('class-element');
const toggleButton = document.getElementById('toggle-active');
const classListParagraph = document.getElementById('class-list');

function showClasses() {
    const classes = Array.from(classElement.classList);

    console.log('Элементтің барлық кластары:', classes);

    classListParagraph.textContent =
        'Барлық кластар: ' + classes.join(', ');
}

toggleButton.addEventListener('click', () => {
    const isActive = classElement.classList.toggle('active');

    toggleButton.setAttribute(
        'aria-pressed',
        String(isActive)
    );

    showClasses();
});

showClasses();