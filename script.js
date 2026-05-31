// ─── EmailJS configuration ───────────────────────────────────────────────────
// Replace these with your real EmailJS public key, service ID, and template ID
const EMAILJS_PUBLIC_KEY  = "YOUR_EMAILJS_PUBLIC_KEY";
const EMAILJS_SERVICE_ID  = "YOUR_EMAILJS_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

// ─── Availability rules ──────────────────────────────────────────────────────
// Days of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const WEEKDAY_START = { 2: "15:30", 3: "15:30", 5: "15:30" }; // Tue, Wed, Fri  3:30 PM
const WEEKEND_START = { 0: "09:00", 6: "09:00" };              // Sun, Sat       9:00 AM
const WEEKDAY_END   = "18:30";  // 6:30 PM
const WEEKEND_END   = "18:30";  // 6:30 PM

// Fully blocked dates (YYYY-MM-DD)
const BLOCKED_DATES = ["2026-06-06"];

// ─── Build available-slot calendar for the next 14 days ──────────────────────
function buildSlots() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slots = []; // { dateKey, label, times[] }

  for (let d = 1; d <= 14; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);

    const dow     = date.getDay();
    const dateKey = toISODate(date);

    if (BLOCKED_DATES.includes(dateKey)) continue;

    const startMap = { ...WEEKDAY_START, ...WEEKEND_START };
    if (!(dow in startMap)) continue;  // not an available day

    const startStr = startMap[dow];
    const endStr   = dow in WEEKDAY_START ? WEEKDAY_END : WEEKEND_END;
    const startMin = timeStrToMin(startStr);
    const endMin   = timeStrToMin(endStr);

    const times = [];
    for (let m = startMin; m + 60 <= endMin; m += 15) {
      times.push(minToTimeStr(m));
    }

    if (times.length === 0) continue;

    slots.push({
      dateKey,
      label: formatDateLabel(date),
      times,
    });
  }

  return slots;
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function timeStrToMin(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

function minToTimeStr(min) {
  const h    = Math.floor(min / 60);
  const m    = min % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDateLabel(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
  });
}

// ─── Render accordion calendar ────────────────────────────────────────────────
const calendarGrid = document.querySelector("#calendarGrid");
const submitButton = document.querySelector("#submitRequest");
let selectedSlot   = null; // { dateKey, label, time }

const daySlots = buildSlots();

if (daySlots.length === 0) {
  calendarGrid.innerHTML = '<p class="no-slots">No available times in the next 2 weeks. Check back soon!</p>';
} else {
  daySlots.forEach((day) => {
    const item = document.createElement("div");
    item.className = "accordion-item";

    const header = document.createElement("button");
    header.type = "button";
    header.className = "accordion-header";
    header.setAttribute("aria-expanded", "false");
    header.innerHTML = `<span class="accordion-day">${day.label}</span><span class="accordion-count">${day.times.length} slot${day.times.length !== 1 ? "s" : ""}</span><span class="accordion-arrow" aria-hidden="true"></span>`;

    const panel = document.createElement("div");
    panel.className = "accordion-panel";
    panel.setAttribute("hidden", "");

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

// ─── Submit handler ───────────────────────────────────────────────────────────
submitButton.addEventListener("click", async () => {
  const form = document.querySelector("#requestForm");

  if (!form.reportValidity()) return;

  if (!selectedSlot) {
    alert("Please select a time slot from the calendar.");
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());

  const message = [
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    `Address: ${data.address}`,
    `Windows: ${data.windows}`,
    `Requested time: ${selectedSlot.label} at ${selectedSlot.time}`,
  ].join("\n");

  submitButton.textContent = "Sending\u2026";
  submitButton.disabled    = true;

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      message,
    });

    submitButton.textContent = `\u2713 Requested: ${selectedSlot.label} at ${selectedSlot.time}`;
  } catch (err) {
    console.error("EmailJS error:", err);
    submitButton.textContent = "Send failed \u2014 try again";
    submitButton.disabled    = false;
  }
});

// ─── Scroll-fade-in (IntersectionObserver) ───────────────────────────────────
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
