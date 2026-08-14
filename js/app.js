// ---------- Application State ----------
const AppState = {
  step: 1,
  food: null,
  date: null, // Gregorian YYYY-MM-DD
  time: null,

  // Persian calendar
  calMonth: 1,
  calYear: 1405,
};

// ---------- DOM References ----------
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const pages = {
  1: $("#page1"),
  2: $("#page2"),
  3: $("#page3"),
  4: $("#page4"),
};

const dots = $$(".progress-dots .dot");
const foodItems = $$(".food-item");
const foodNextBtn = $("#foodNextBtn");
const foodError = $("#foodError");
const dateSetBtn = $("#dateSetBtn");
const dateError = $("#dateError");
const calendarGrid = $("#calendarGrid");
const calMonthYear = $("#calMonthYear");
const calPrev = $("#calPrev");
const calNext = $("#calNext");
const timeGrid = $("#timeGrid");
const confirmDate = $("#confirmDate");
const confirmTime = $("#confirmTime");
const confirmFood = $("#confirmFood");
const resetBtn = $("#resetBtn");
const noBtn = $("#noBtn");
const noMessage = $("#noMessage");
const yesBtn = $("#yesBtn");
const confettiOverlay = $("#confettiOverlay");
const heartsContainer = $("#heartsContainer");

// ---------- Constants ----------

const TIME_SLOTS = [
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
];

const DAYS_SHORT = [
  "یکشنبه",
  "دوشنبه",
  "سه شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

const MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

// ============================================================
// PERSIAN / JALALI CALENDAR
// ============================================================

// Gregorian -> Jalali
function gregorianToJalali(gy, gm, gd) {
  const gDaysInMonth = [
    31, 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31
  ];

  const jDaysInMonth = [
    31, 31, 31, 31, 31, 31,
    30, 30, 30, 30, 30, 29
  ];

  let gy2 = gm > 2 ? gy + 1 : gy;

  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd;

  for (let i = 0; i < gm - 1; i++) {
    days += gDaysInMonth[i];
  }

  let jy = -1595 + 33 * Math.floor(days / 12053);

  days %= 12053;

  jy += 4 * Math.floor(days / 1461);

  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm;
  let jd;

  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return [jy, jm, jd];
}

// Jalali -> Gregorian
function jalaliToGregorian(jy, jm, jd) {
  jy += 1595;

  let days =
    -355668 +
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    jd;

  for (let i = 1; i < jm; i++) {
    days += i <= 6 ? 31 : 30;
  }

  let gy = 400 * Math.floor(days / 146097);

  days %= 146097;

  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);

    days %= 36524;

    if (days >= 365) {
      days++;
    }
  }

  gy += 4 * Math.floor(days / 1461);

  days %= 1461;

  if (days > 365) {
    gy += Math.floor((days - 1) / 365);

    days = (days - 1) % 365;
  }

  let gd = days + 1;

  const salA = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) ||
    gy % 400 === 0
      ? 29
      : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  let gm = 1;

  while (gd > salA[gm]) {
    gd -= salA[gm];
    gm++;
  }

  return [gy, gm, gd];
}

// Number of days in Jalali month
function getJalaliMonthDays(year, month) {
  if (month <= 6) {
    return 31;
  }

  if (month <= 11) {
    return 30;
  }

  // Esfand
  const [gy1, gm1, gd1] = jalaliToGregorian(
    year,
    1,
    1
  );

  const [gy2, gm2, gd2] = jalaliToGregorian(
    year + 1,
    1,
    1
  );

  const date1 = new Date(gy1, gm1 - 1, gd1);
  const date2 = new Date(gy2, gm2 - 1, gd2);

  const difference =
    Math.round((date2 - date1) / 86400000);

  return difference === 366 ? 30 : 29;
}

// Today's Jalali date
function getTodayJalali() {
  const today = new Date();

  return gregorianToJalali(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );
}

// Jalali date -> Gregorian string
function jalaliDateToGregorianString(
  jy,
  jm,
  jd
) {
  const [gy, gm, gd] = jalaliToGregorian(
    jy,
    jm,
    jd
  );

  return `${gy}-${String(gm).padStart(2, "0")}-${String(
    gd
  ).padStart(2, "0")}`;
}

// Gregorian string -> Jalali
function getSelectedJalaliDate(dateString) {
  if (!dateString) return null;

  const [gy, gm, gd] =
    dateString.split("-").map(Number);

  return gregorianToJalali(gy, gm, gd);
}

// ============================================================
// FLOATING HEARTS
// ============================================================

function initFloatingHearts() {
  const emojis = [
    "❤️",
    "💕",
    "💖",
    "✨",
    "🌸",
    "💗",
    "🥰",
  ];

  for (let i = 0; i < 18; i++) {
    const el = document.createElement("span");

    el.className = "heart-float";
    el.textContent = emojis[i % emojis.length];

    el.style.left =
      Math.random() * 100 + "%";

    el.style.fontSize =
      0.8 + Math.random() * 1.2 + "rem";

    el.style.animationDuration =
      8 + Math.random() * 12 + "s";

    el.style.animationDelay =
      Math.random() * 10 + "s";

    heartsContainer.appendChild(el);
  }
}

// ============================================================
// PAGE NAVIGATION
// ============================================================

function goToStep(step) {
  AppState.step = step;

  Object.keys(pages).forEach((k) => {
    pages[k].classList.toggle(
      "active",
      parseInt(k) === step
    );
  });

  dots.forEach((dot, idx) => {
    const num = idx + 1;

    dot.classList.toggle(
      "active",
      num === step
    );

    dot.classList.toggle(
      "done",
      num < step
    );
  });

  const card = $("#appCard");

  if (card) {
    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  if (step === 4) {
    launchConfetti();
  }
}

// ============================================================
// FOOD SELECTION
// ============================================================

foodItems.forEach((item) => {
  item.addEventListener("click", () => {
    foodItems.forEach((el) =>
      el.classList.remove("selected")
    );

    item.classList.add("selected");

    AppState.food =
      item.dataset.food;

    foodNextBtn.disabled = false;

    foodError.classList.add("hidden");
  });
});

foodNextBtn.addEventListener("click", () => {
  if (!AppState.food) {
    foodError.classList.remove("hidden");
    return;
  }

  goToStep(3);

  renderCalendar();
  renderTimes();
});

// ============================================================
// PERSIAN CALENDAR
// ============================================================

function renderCalendar() {
  const {
    calMonth,
    calYear,
  } = AppState;

  // Header
  calMonthYear.textContent =
    `${MONTHS[calMonth]} ${calYear}`;

  // First day of this Persian month
  const [gy, gm, gd] =
    jalaliToGregorian(
      calYear,
      calMonth + 1,
      1
    );

  const firstDay =
    new Date(
      gy,
      gm - 1,
      gd
    ).getDay();

  const daysInMonth =
    getJalaliMonthDays(
      calYear,
      calMonth + 1
    );

  const today =
    getTodayJalali();

  let html = "";

  // Day names
  DAYS_SHORT.forEach((day) => {
    html += `
      <div class="day-label">
        ${day}
      </div>
    `;
  });

  // Empty cells
  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    html += `
      <div class="day empty"></div>
    `;
  }

  // Days
  for (
    let d = 1;
    d <= daysInMonth;
    d++
  ) {
    const dateStr =
      jalaliDateToGregorianString(
        calYear,
        calMonth + 1,
        d
      );

    // Past date?
    const isPast =
      calYear < today[0] ||
      (
        calYear === today[0] &&
        calMonth + 1 < today[1]
      ) ||
      (
        calYear === today[0] &&
        calMonth + 1 === today[1] &&
        d < today[2]
      );

    // Today?
    const isToday =
      calYear === today[0] &&
      calMonth + 1 === today[1] &&
      d === today[2];

    // Selected?
    const isSelected =
      AppState.date === dateStr;

    let classes = "day";

    if (isPast) {
      classes += " empty";
    }

    if (isToday) {
      classes += " today";
    }

    if (isSelected) {
      classes += " selected";
    }

    const clickable =
      !isPast
        ? `data-date="${dateStr}"`
        : "";

    html += `
      <div
        class="${classes}"
        ${clickable}
      >
        ${d}
      </div>
    `;
  }

  calendarGrid.innerHTML = html;

  // Click events
  calendarGrid
    .querySelectorAll(
      ".day:not(.empty)"
    )
    .forEach((el) => {
      el.addEventListener(
        "click",
        () => {
          const dateStr =
            el.dataset.date;

          if (!dateStr) return;

          calendarGrid
            .querySelectorAll(".day")
            .forEach((d) =>
              d.classList.remove(
                "selected"
              )
            );

          el.classList.add(
            "selected"
          );

          AppState.date =
            dateStr;

          checkDateTime();
        }
      );
    });
}

// Previous month
calPrev.addEventListener("click", () => {
  if (AppState.calMonth === 0) {
    AppState.calMonth = 11;
    AppState.calYear--;
  } else {
    AppState.calMonth--;
  }

  renderCalendar();
});

// Next month
calNext.addEventListener("click", () => {
  if (AppState.calMonth === 11) {
    AppState.calMonth = 0;
    AppState.calYear++;
  } else {
    AppState.calMonth++;
  }

  renderCalendar();
});

// ============================================================
// TIME SELECTION
// ============================================================

function renderTimes() {
  let html = "";

  TIME_SLOTS.forEach((t) => {
    const selected =
      AppState.time === t
        ? "selected"
        : "";

    html += `
      <div
        class="time-item ${selected}"
        data-time="${t}"
      >
        ${t}
      </div>
    `;
  });

  timeGrid.innerHTML = html;

  timeGrid
    .querySelectorAll(".time-item")
    .forEach((el) => {
      el.addEventListener(
        "click",
        () => {
          timeGrid
            .querySelectorAll(
              ".time-item"
            )
            .forEach((e) =>
              e.classList.remove(
                "selected"
              )
            );

          el.classList.add(
            "selected"
          );

          AppState.time =
            el.dataset.time;

          checkDateTime();
        }
      );
    });
}

// ============================================================
// DATE + TIME
// ============================================================

function checkDateTime() {
  if (
    AppState.date &&
    AppState.time
  ) {
    dateSetBtn.disabled = false;

    dateError.classList.add(
      "hidden"
    );
  } else {
    dateSetBtn.disabled = true;
  }
}

dateSetBtn.addEventListener("click", () => {
  if (
    !AppState.date ||
    !AppState.time
  ) {
    dateError.classList.remove(
      "hidden"
    );

    return;
  }

  // Convert selected Gregorian date
  // back to Jalali
  const [
    jy,
    jm,
    jd,
  ] = getSelectedJalaliDate(
    AppState.date
  );

  // Gregorian date for weekday
  const [
    gy,
    gm,
    gd,
  ] = jalaliToGregorian(
    jy,
    jm,
    jd
  );

  const date =
    new Date(
      gy,
      gm - 1,
      gd
    );

  const dayName =
    DAYS_SHORT[
      date.getDay()
    ];

  // Confirmation
  confirmDate.textContent =
    `${dayName}، ${MONTHS[jm - 1]} ${jd} ${jy}`;

  confirmTime.textContent =
    AppState.time;

  confirmFood.textContent =
    AppState.food || "Pasta";

  goToStep(4);
});

// ============================================================
// CONFETTI
// ============================================================

function launchConfetti() {
  const container =
    confettiOverlay;

  container.innerHTML = "";

  const colors = [
    "#ff6b9d",
    "#ffd700",
    "#8b5cf6",
    "#ff4d6d",
    "#fbbf24",
    "#34d399",
    "#f472b6",
    "#60a5fa",
  ];

  const emojis = [
    "❤️",
    "💕",
    "✨",
    "🎉",
    "🌸",
    "💖",
    "🥳",
    "🎊",
  ];

  for (let i = 0; i < 80; i++) {
    const piece =
      document.createElement(
        "div"
      );

    piece.className =
      "confetti-piece";

    const isEmoji =
      Math.random() > 0.5;

    if (isEmoji) {
      piece.textContent =
        emojis[
          Math.floor(
            Math.random() *
              emojis.length
          )
        ];

      piece.style.fontSize =
        0.8 +
        Math.random() * 1.2 +
        "rem";

      piece.style.width =
        "auto";

      piece.style.height =
        "auto";

      piece.style.background =
        "transparent";
    } else {
      piece.style.background =
        colors[
          Math.floor(
            Math.random() *
              colors.length
          )
        ];

      piece.style.width =
        6 +
        Math.random() * 10 +
        "px";

      piece.style.height =
        6 +
        Math.random() * 10 +
        "px";

      piece.style.borderRadius =
        Math.random() > 0.5
          ? "50%"
          : "2px";
    }

    piece.style.left =
      Math.random() * 100 +
      "%";

    piece.style.top =
      "-20px";

    piece.style.animationDuration =
      1.5 +
      Math.random() * 2.5 +
      "s";

    piece.style.animationDelay =
      Math.random() * 1.5 +
      "s";

    piece.style.opacity =
      0.7 +
      Math.random() * 0.3;

    container.appendChild(
      piece
    );
  }

  setTimeout(() => {
    container.innerHTML = "";
  }, 5000);
}

// ============================================================
// RESET
// ============================================================

function resetApp() {
  AppState.food = null;
  AppState.date = null;
  AppState.time = null;

  // Return calendar to current Persian month
  const today =
    getTodayJalali();

  AppState.calYear =
    today[0];

  AppState.calMonth =
    today[1] - 1;

  foodItems.forEach((el) =>
    el.classList.remove(
      "selected"
    )
  );

  foodNextBtn.disabled = true;

  foodError.classList.add(
    "hidden"
  );

  dateSetBtn.disabled = true;

  dateError.classList.add(
    "hidden"
  );

  confettiOverlay.innerHTML =
    "";

  goToStep(1);

  renderCalendar();
  renderTimes();
}

resetBtn.addEventListener(
  "click",
  resetApp
);

// ============================================================
// PLAYFUL NO BUTTON
// ============================================================

let noClickCount = 0;

const noBtnWrapper =
  noBtn.closest(
    ".btn-no-wrapper"
  );

const canHover =
  window.matchMedia(
    "(hover: hover)"
  ).matches;

noBtn.addEventListener(
  "mouseenter",
  () => {
    if (
      !noBtnWrapper ||
      !canHover
    )
      return;

    const maxX = 120;
    const maxY = 60;

    const dx =
      (Math.random() - 0.5) *
      maxX *
      2;

    const dy =
      (Math.random() - 0.5) *
      maxY *
      2;

    noBtnWrapper.style.transform =
      `translate(${dx}px, ${dy}px)`;

    noBtnWrapper.style.transition =
      "transform 0.15s cubic-bezier(0.23, 1, 0.32, 1)";
  }
);

noBtn.addEventListener(
  "click",
  (e) => {
    e.preventDefault();

    noClickCount++;

    noMessage.classList.remove(
      "hidden"
    );

    const messages = [
      "🥺 مطمئنی دوباره انتخاب کن... 💕",
      "گفتم فقط آره 😡!",
      "💀 نمیتونی از این فرار کنی!",
      "🥰 فقط آره رو انتخاب کن!",
      "💗 من بس نمیکنم...",
      "❤️ تنها جواب قابل قبول بله است!",
    ];

    noMessage.textContent =
      messages[
        Math.min(
          noClickCount - 1,
          messages.length - 1
        )
      ];

    if (noClickCount > 3) {
      noBtn.style.transform =
        "scale(0.7)";

      noBtn.style.opacity =
        "0.3";

      setTimeout(() => {
        noBtn.style.transform =
          "scale(1)";

        noBtn.style.opacity =
          "1";
      }, 600);
    }

    if (noClickCount > 6) {
      noMessage.textContent =
        "💖 باشه من خودم برات بله رو انتخاب میکنم! 💖";

      setTimeout(() => {
        yesBtn.click();
      }, 400);
    }
  }
);

// ============================================================
// YES BUTTON
// ============================================================

yesBtn.addEventListener(
  "click",
  () => {
    goToStep(2);
  }
);

// ============================================================
// KEYBOARD NAVIGATION
// ============================================================

document.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Enter") {
      const step =
        AppState.step;

      if (step === 1) {
        yesBtn.click();
      } else if (step === 2) {
        if (
          !foodNextBtn.disabled
        ) {
          foodNextBtn.click();
        }
      } else if (step === 3) {
        if (
          !dateSetBtn.disabled
        ) {
          dateSetBtn.click();
        }
      }
    }
  }
);

// ============================================================
// MOBILE VIEWPORT
// ============================================================

function adjustViewport() {
  const vh =
    window.innerHeight * 0.01;

  document.documentElement.style.setProperty(
    "--vh",
    `${vh}px`
  );
}

adjustViewport();

window.addEventListener(
  "resize",
  adjustViewport
);

window.addEventListener(
  "orientationchange",
  () => {
    setTimeout(
      adjustViewport,
      150
    );
  }
);

// ============================================================
// FINAL INITIALIZATION
// ============================================================

// Start from current Persian month
const todayJalali =
  getTodayJalali();

AppState.calYear =
  todayJalali[0];

AppState.calMonth =
  todayJalali[1] - 1;

initFloatingHearts();

renderCalendar();
renderTimes();

goToStep(1);

console.log(
  "💕 درست شده با عشق برای فردی خاص ✨"
);
