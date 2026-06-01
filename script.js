// ─── Rolling availability rules ──────────────────────────────────────────────
// Days of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const AVAILABILITY_BY_DAY = {
  0: { start: "09:00", end: "18:30" },
  2: { start: "15:30", end: "18:30" },
  3: { start: "15:30", end: "18:30" },
  5: { start: "15:30", end: "18:30" },
  6: { start: "09:00", end: "18:30" }
};
const SLOT_MINUTES = 60;
const SLOT_STEP_MINUTES = 15;
const BOOKING_DAYS_AHEAD = 21;

const FULLY_BLOCKED_DATES = ["2026-06-06"];
const BUSY_WINDOWS = [];

function buildSlots() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayKey = toISODate(today);
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const slots = [];

  for (let d = 0; d < BOOKING_DAYS_AHEAD; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);

    const dow = date.getDay();
    const dateKey = toISODate(date);

    if (FULLY_BLOCKED_DATES.includes(dateKey)) continue;

    const availability = AVAILABILITY_BY_DAY[dow];
    if (!availability) continue;

    const startMin = timeStrToMin(availability.start);
    const endMin = timeStrToMin(availability.end);
    const times = [];

    for (let m = startMin; m + SLOT_MINUTES <= endMin; m += SLOT_STEP_MINUTES) {
      const slotEnd = m + SLOT_MINUTES;
      if (dateKey === todayKey && m <= currentMinute) continue;
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
const CONFIRMATION_STORAGE_KEY = "berkeleyStudentWindowsRequest";
let selectedSlot = null;

function scrollToBooking() {
  const booking = document.querySelector("#booking");
  if (!booking) return;

  window.scrollTo({
    top: booking.getBoundingClientRect().top + window.scrollY,
    left: 0,
    behavior: "instant"
  });
  history.replaceState(null, "", "#booking");
}

document.querySelector("[data-booking-link]")?.addEventListener("click", (event) => {
  event.preventDefault();
  scrollToBooking();
});

if (window.location.hash === "#booking") {
  requestAnimationFrame(scrollToBooking);
}

const daySlots = buildSlots();

if (new URLSearchParams(window.location.search).get("request") === "sent") {
  formStatus.textContent = "Request sent. Dash will follow up by text or email.";
}

if (daySlots.length === 0) {
  calendarGrid.innerHTML = '<p class="no-slots">No available times in the next 3 weeks. Check back soon!</p>';
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
requestForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!requestForm.reportValidity()) {
    return;
  }

  if (!selectedSlot) {
    formStatus.textContent = "Please choose a day and time first.";
    return;
  }

  const data = Object.fromEntries(new FormData(requestForm).entries());
  const selectedTime = `${selectedSlot.label} at ${selectedSlot.time}`;

  selectedTimeInput.value = selectedTime;
  const requestSummary = [
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    `Address: ${data.address}`,
    `Windows: ${data.windows}`,
    `Requested time: ${selectedTime}`
  ].join("\n");

  requestSummaryInput.value = requestSummary;

  submitButton.disabled = true;
  submitButton.textContent = "Sending request...";
  formStatus.textContent = "";

  try {
    const response = await fetch("/api/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...data, selectedTime })
    });

    if (!response.ok) {
      throw new Error("Email request failed.");
    }

    sessionStorage.setItem(
      CONFIRMATION_STORAGE_KEY,
      JSON.stringify({
        ...data,
        selectedTime,
        submittedAt: new Date().toISOString()
      })
    );
    window.location.assign("/requested");
  } catch {
    formStatus.textContent = "Something went wrong. Text or call (510) 559-0578.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Request selected time";
  }
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
