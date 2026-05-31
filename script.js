const availableSlots = [
  { day: "Mon, Jun 1", time: "3:30 PM" },
  { day: "Tue, Jun 2", time: "3:30 PM" },
  { day: "Tue, Jun 2", time: "5:00 PM" },
  { day: "Wed, Jun 3", time: "3:30 PM" },
  { day: "Thu, Jun 4", time: "3:30 PM" },
  { day: "Fri, Jun 5", time: "5:15 PM" },
  { day: "Sat, Jun 6", time: "10:00 AM" },
  { day: "Sat, Jun 6", time: "12:00 PM" },
  { day: "Sun, Jun 7", time: "10:00 AM" },
  { day: "Sun, Jun 7", time: "12:00 PM" },
  { day: "Tue, Jun 9", time: "3:30 PM" },
  { day: "Thu, Jun 11", time: "5:00 PM" }
];

const calendarGrid = document.querySelector("#calendarGrid");
const submitButton = document.querySelector("#submitRequest");
let selectedSlot = null;

availableSlots.forEach((slot, index) => {
  const button = document.createElement("button");
  button.className = "slot";
  button.type = "button";
  button.setAttribute("aria-pressed", "false");
  button.innerHTML = `<strong>${slot.day}</strong><span>${slot.time}</span>`;

  button.addEventListener("click", () => {
    document.querySelectorAll(".slot").forEach((item) => item.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");
    selectedSlot = slot;
  });

  if (index === 0) {
    button.setAttribute("aria-pressed", "true");
    selectedSlot = slot;
  }

  calendarGrid.append(button);
});

submitButton.addEventListener("click", () => {
  const form = document.querySelector(".request-form");

  if (!form.reportValidity()) {
    return;
  }

  const requestText = selectedSlot
    ? `Requested: ${selectedSlot.day} at ${selectedSlot.time}`
    : "Choose a time above.";

  submitButton.textContent = requestText;
});
