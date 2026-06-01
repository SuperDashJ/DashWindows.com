const CONFIRMATION_STORAGE_KEY = "berkeleyStudentWindowsRequest";
const MAX_CONFIRMATION_AGE_MS = 60 * 60 * 1000;

function redirectToBooking() {
  window.location.replace("/#booking");
}

function formatSubmittedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function addDetail(list, label, value) {
  if (!value) return;

  const term = document.createElement("dt");
  term.textContent = label;

  const description = document.createElement("dd");
  description.textContent = value;

  list.append(term, description);
}

const rawRequest = sessionStorage.getItem(CONFIRMATION_STORAGE_KEY);

if (!rawRequest) {
  redirectToBooking();
} else {
  try {
    const request = JSON.parse(rawRequest);
    const submittedAt = new Date(request.submittedAt).getTime();

    if (!submittedAt || Date.now() - submittedAt > MAX_CONFIRMATION_AGE_MS) {
      sessionStorage.removeItem(CONFIRMATION_STORAGE_KEY);
      redirectToBooking();
    } else {
      const details = document.querySelector("#confirmationDetails");

      addDetail(details, "Name", request.name);
      addDetail(details, "Phone", request.phone);
      addDetail(details, "Email", request.email);
      addDetail(details, "Address", request.address);
      addDetail(details, "Windows", request.windows);
      addDetail(details, "Requested time", request.selectedTime);
      addDetail(details, "Sent", formatSubmittedAt(request.submittedAt));
    }
  } catch {
    sessionStorage.removeItem(CONFIRMATION_STORAGE_KEY);
    redirectToBooking();
  }
}
