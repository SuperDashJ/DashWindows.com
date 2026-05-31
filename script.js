// ─── Availability rules from Dash's current calendar snapshot ────────────────
// Days of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const WEEKDAY_START = { 2: "15:30", 3: "15:30", 5: "15:30" };
const WEEKEND_START = { 0: "09:00", 6: "09:00" };
const WEEKDAY_END = "18:30";
const WEEKEND_END = "18:30";
const SLOT_MINUTES = 60;
const SLOT_STEP_MINUTES = 15;

const FULLY_BLOCKED_DATES = ["2026-06-06", "2026-06-10"];

const BUSY_WINDOWS = [
  { date: "2026-06-01", start: "17:00", end: "20:30" },
  { date: "2026-06-04", start: "18:30", end: "19:30" },
  { date: "2026-06-05", start: "16:00", end: "17:00" },
  { date: "2026-06-07", start: "15:00", end: "17:30" },
  { date: "2026-06-08", start: "17:00", end: "21:30" },
  { date: "2026-06-11", start: "18:30", end: "19:30" },
  { date: "2026-06-12", start: "16:00", end: "21:30" },
  { date: "2026-06-13", start: "08:00", end: "09:00" }
];

function buildSlots() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slots = [];

  for (let d = 1; d <= 14; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);

    const dow = date.getDay();
    const dateKey = toISODate(date);

    if (FULLY_BLOCKED_DATES.includes(dateKey)) continue;

    const startMap = { ...WEEKDAY_START, ...WEEKEND_START };
    if (!(dow in startMap)) continue;

    const startMin = timeStrToMin(startMap[dow]);
    const endMin = timeStrToMin(dow in WEEKDAY_START ? WEEKDAY_END : WEEKEND_END);
    const times = [];

    for (let m = startMin; m + SLOT_MINUTES <= endMin; m += SLOT_STEP_MINUTES) {
      const slotEnd = m + SLOT_MINUTES;
      if (!isBusy(dateKey, m, slotEnd)) {
        times.push(minToTimeStr(m));
      }
    }

    if (times.length) {
      slots.push({
        dateKey,
        label: formatDateLabel(date),
        times
      });
    }
  }

  return slots;
}

function isBusy(dateKey, startMin, endMin) {
  return BUSY_WINDOWS.some((busy) => {
    if (busy.date !== dateKey) return false;
    return startMin < timeStrToMin(busy.end) && endMin > timeStrToMin(busy.start);
  });
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function timeStrToMin(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

function minToTimeStr(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDateLabel(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

// ─── Render accordion calendar ───────────────────────────────────────────────
const calendarGrid = document.querySelector("#calendarGrid");
const requestForm = document.querySelector("#requestForm");
const submitButton = document.querySelector("#submitRequest");
const selectedTimeInput = document.querySelector("#selectedTime");
const requestSummaryInput = document.querySelector("#requestSummary");
const formStatus = document.querySelector("#formStatus");
let selectedSlot = null;

const daySlots = buildSlots();

if (new URLSearchParams(window.location.search).get("request") === "sent") {
  formStatus.textContent = "Request sent. Dash will follow up by text or email.";
}

if (daySlots.length === 0) {
  calendarGrid.innerHTML = '<p class="no-slots">No available times in the next 2 weeks. Check back soon!</p>';
} else {
  daySlots.forEach((day, index) => {
    const item = document.createElement("div");
    item.className = "accordion-item";

    const header = document.createElement("button");
    header.type = "button";
    header.className = "accordion-header";
    header.setAttribute("aria-expanded", index === 0 ? "true" : "false");
    header.innerHTML = `<span class="accordion-day">${day.label}</span><span class="accordion-count">${day.times.length} slot${day.times.length !== 1 ? "s" : ""}</span><span class="accordion-arrow" aria-hidden="true"></span>`;

    const panel = document.createElement("div");
    panel.className = "accordion-panel";
    if (index !== 0) panel.setAttribute("hidden", "");

    day.times.forEach((time) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot";
      btn.setAttribute("aria-pressed", "false");
      btn.innerHTML = `<span class="slot-time">${time}</span><span class="slot-duration">1-hour job</span>`;

      btn.addEventListener("click", () => {
        document.querySelectorAll(".slot").forEach((s) => s.setAttribute("aria-pressed", "false"));
        btn.setAttribute("aria-pressed", "true");
        selectedSlot = { dateKey: day.dateKey, label: day.label, time };
        formStatus.textContent = `${day.label} at ${time} selected.`;
      });

      panel.appendChild(btn);
    });

    header.addEventListener("click", () => {
      const isOpen = header.getAttribute("aria-expanded") === "true";

      document.querySelectorAll(".accordion-header").forEach((h) => {
        h.setAttribute("aria-expanded", "false");
        h.nextElementSibling.setAttribute("hidden", "");
      });

      if (!isOpen) {
        header.setAttribute("aria-expanded", "true");
        panel.removeAttribute("hidden");
      }
    });

    item.appendChild(header);
    item.appendChild(panel);
    calendarGrid.appendChild(item);
  });
}

// ─── Submit handler ─────────────────────────────────────────────────────────
requestForm.addEventListener("submit", (event) => {
  if (!requestForm.reportValidity()) {
    event.preventDefault();
    return;
  }

  if (!selectedSlot) {
    event.preventDefault();
    formStatus.textContent = "Please choose a day and time first.";
    return;
  }

  const data = Object.fromEntries(new FormData(requestForm).entries());
  const selectedTime = `${selectedSlot.label} at ${selectedSlot.time}`;

  selectedTimeInput.value = selectedTime;
  requestSummaryInput.value = [
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    `Address: ${data.address}`,
    `Windows: ${data.windows}`,
    `Requested time: ${selectedTime}`
  ].join("\n");

  submitButton.textContent = "Sending request...";
});

// ─── Scroll-fade-in (IntersectionObserver) ──────────────────────────────────
const fadeEls = document.querySelectorAll(".fade-in");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

fadeEls.forEach((el) => observer.observe(el));
