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

    // ЖОҒАРҒЫ ВКЛАДКАЛАРДЫ АУЫСТЫРУ
    buttons.forEach((button) => {
        if (button.dataset.tab === target) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });

    // ТӨМЕНГІ КАРТОЧКАЛАРДЫҢ ACTIVE КҮЙІ
    cards.forEach((card) => {
        if (card.dataset.tab === target) {
            card.classList.add("active");
        } else {
            card.classList.remove("active");
        }
    });

    // АҚПАРАТТЫҚ БӨЛІМДІ АУЫСТЫРУ
    panels.forEach((panel) => {
        if (panel.id === target) {
            panel.classList.add("active");
        } else {
            panel.classList.remove("active");
        }
    });

    // ТӨМЕНГІ КАРТОЧКАЛАРДЫ КӨРСЕТУ / ЖАСЫРУ
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


// ==========================================
// DOM ТАПСЫРМАЛАРЫ
// ==========================================

(() => {

    // 1 тапсырма: ID бойынша мәтінді өзгерту.
    const target = document.getElementById("target-element");

    // Удаляем старый элемент, только если он существует.
    document.querySelector("#task1 .old-element")?.remove();

    // ==========================================
    // ПОКАЗ ПРИВЕТСТВИЯ ПРИ НАЖАТИИ КНОПКИ
    // ==========================================

    const showGreetingButton = document.getElementById("show-greeting");

    if (target && showGreetingButton) {
        const colors = ["#38bdf8", "#fda4af", "#34d399", "#fbbf24", "#a78bfa"];
        let colorIndex = 0;

        function changeGreetingColor() {
            colorIndex = (colorIndex + 1) % colors.length;
            target.style.setProperty("color", colors[colorIndex], "important");
            target.style.setProperty("-webkit-text-fill-color", colors[colorIndex], "important");
        }

        target.addEventListener("click", changeGreetingColor);
        target.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                changeGreetingColor();
            }
        });

        showGreetingButton.addEventListener("click", () => {
            target.hidden = false;
            target.textContent = "Сәлем, әлем!";
            showGreetingButton.setAttribute("aria-expanded", "true");
        });
    }


    // ==========================================
    // АУЫСПАЛЫ АБЗАЦ
    // ==========================================

    const paragraph = document.createElement("p");

    paragraph.id = "changing-paragraph";
    paragraph.textContent = "Бұл ауыспалы абзац";
    paragraph.tabIndex = 0;

    paragraph.setAttribute("role", "button");
    paragraph.setAttribute("aria-pressed", "false");

    document.getElementById("task1-content").appendChild(paragraph);

    let changed = false;

    function changeParagraphStyle() {
        changed = !changed;

        paragraph.style.color = changed ? "var(--demo-changed)" : "";
        paragraph.style.fontSize = changed ? "26px" : "";

        paragraph.setAttribute("aria-pressed", String(changed));
    }

    paragraph.addEventListener("click", changeParagraphStyle);

    paragraph.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            changeParagraphStyle();
        }
    });

})();


// ==========================================
// ЖАҢА DIV ЭЛЕМЕНТІН ҚОСУ
// ==========================================

// Тапсырма шарты бойынша div тікелей body соңына қосылады.
const newDiv = document.createElement("div");

newDiv.className = "new-div";
newDiv.id = "new-element";
newDiv.textContent = "Мен жаңа элементпін";
newDiv.hidden = true;

document.body.appendChild(newDiv);


// Бұл нәтиже тек 1 тапсырма вкладкасында көрсетіледі.
const task1 = document.getElementById("task1");
const showNewElementButton = document.getElementById("show-new-element");
let newElementShown = false;

function syncTask1Result() {
    newDiv.hidden = !newElementShown || !task1.classList.contains("active");
}

showNewElementButton.addEventListener("click", () => {
    newElementShown = true;
    showNewElementButton.setAttribute("aria-expanded", "true");
    syncTask1Result();
});

new MutationObserver(syncTask1Result).observe(task1, {
    attributes: true,
    attributeFilter: ["class"]
});

syncTask1Result();


// ==========================================
// 2 ТАПСЫРМА: ACTIVE КЛАСЫН АУЫСТЫРУ
// ЖӘНЕ БАРЛЫҚ КЛАСТАРДЫ ШЫҒАРУ
// ==========================================

const classElement = document.getElementById("class-element");
const toggleButton = document.getElementById("toggle-active");
const classListParagraph = document.getElementById("class-list");

function showClasses() {
    const classes = Array.from(classElement.classList);

    console.log("Элементтің барлық кластары:", classes);

    classListParagraph.textContent =
        "Барлық кластар: " + classes.join(", ");
}

toggleButton.addEventListener("click", () => {
    const isActive = classElement.classList.toggle("active");

    toggleButton.setAttribute(
        "aria-pressed",
        String(isActive)
    );

    showClasses();
});

showClasses();

// ==========================================
// 3 ТАПСЫРМА: КЕСТЕ ҚҰРУ ЖӘНЕ ТҮСТЕРДІ САНАУ
// ==========================================

const cellColors = {
  red: 'Қызыл',
  blue: 'Көк',
  green: 'Жасыл',
  yellow: 'Сары',
  empty: 'Боялмаған'
};
const tableContainer = document.getElementById('table-container');
const tableForm = document.getElementById('table-form');
const rowInput = document.getElementById('table-rows');
const columnInput = document.getElementById('table-columns');
const paintColor = document.getElementById('paint-color');
const countColor = document.getElementById('count-color');
const tableError = document.getElementById('table-error');

function isValidTableSize(size) {
  return Number.isInteger(size) && size >= 1 && size <= 50;
}

function setCellColor(cell, color) {
  cell.dataset.color = color;
  cell.setAttribute('aria-pressed', String(color !== 'empty'));
  cell.setAttribute('aria-label', `${cell.dataset.row} жол, ${cell.dataset.column} баған: ${cellColors[color]}`);
}

// Кесте толық дайын болған соң ғана бұрынғы кестені ауыстырады.
function createTable(rows, columns) {
  if (!isValidTableSize(rows) || !isValidTableSize(columns)) {
    throw new RangeError('Жолдар мен бағандар санын 1–50 аралығындағы бүтін санмен енгізіңіз.');
  }

  const table = document.createElement('table');
  table.id = 'generated-table';
  table.className = 'interactive-table';
  const caption = table.createCaption();
  caption.textContent = `${rows} жол × ${columns} баған`;
  const body = table.createTBody();

  for (let row = 1; row <= rows; row++) {
    const tableRow = body.insertRow();
    for (let column = 1; column <= columns; column++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell-button';
      cell.dataset.row = String(row);
      cell.dataset.column = String(column);
      cell.textContent = `${row}, ${column}`;
      setCellColor(cell, 'empty');
      tableRow.insertCell().appendChild(cell);
    }
  }

  tableContainer.replaceChildren(table);
  document.getElementById('table-summary').textContent = `Барлығы: ${rows * columns} ұяшық.`;
  updateCellCount();
  return table;
}

// Түсті атауы бойынша санайды: red, blue, green, yellow немесе empty.
function countCellsByColor(color) {
  return Array.from(tableContainer.querySelectorAll('.cell-button'))
    .filter((cell) => cell.dataset.color === color).length;
}

function updateCellCount() {
  const color = countColor.value;
  document.getElementById('cell-count').textContent = `${cellColors[color]} ұяшықтар саны: ${countCellsByColor(color)}`;
}

tableForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const rows = Number(rowInput.value);
  const columns = Number(columnInput.value);
  rowInput.setAttribute('aria-invalid', String(!isValidTableSize(rows)));
  columnInput.setAttribute('aria-invalid', String(!isValidTableSize(columns)));

  try {
    createTable(rows, columns);
    tableError.hidden = true;
    tableError.textContent = '';
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    tableError.textContent = error.message;
    tableError.hidden = false;
    (isValidTableSize(rows) ? columnInput : rowInput).focus();
  }
});

// Бір өңдеуші жаңадан құрылған кестелермен де жұмыс істейді.
tableContainer.addEventListener('click', (event) => {
  const cell = event.target.closest('.cell-button');
  if (!cell || !tableContainer.contains(cell)) return;
  const color = cell.dataset.color === paintColor.value ? 'empty' : paintColor.value;
  setCellColor(cell, color);
  updateCellCount();
});

countColor.addEventListener('change', updateCellCount);
document.getElementById('count-cells').addEventListener('click', updateCellCount);
createTable(Number(rowInput.value), Number(columnInput.value));

// ==========================================
// 4 ТАПСЫРМА: АШЫҚ / ҚАРАҢҒЫ ТАҚЫРЫП
// ==========================================

const themeToggle = document.getElementById('theme-toggle');

function setTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.textContent = isDark ? 'Ашық тақырыпты қосу' : 'Қараңғы тақырыпты қосу';
  document.getElementById('theme-status').textContent = `Қазіргі режим: ${isDark ? 'қараңғы' : 'ашық'} тақырып.`;
}

let savedTheme = 'light';
try {
  savedTheme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
} catch {
  // Браузер сақтауға рұқсат бермесе де, қосқыш жұмыс істейді.
}
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Сақтау мүмкін болмаған жағдайда таңдау осы бетте қолданылады.
  }
});
