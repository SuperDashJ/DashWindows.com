import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const css = readFileSync("styles.css", "utf8");
const js = readFileSync("script.js", "utf8");

const requiredText = [
  "Berkeley Student Windows",
  "By Dash",
  "$75",
  "No inside access needed",
  "Address",
  "Number of first-floor windows",
  "sanchezjacksondashiell@gmail.com",
  "Text or call: (510) 559-0578"
];

const missing = requiredText.filter((text) => !html.toLowerCase().includes(text.toLowerCase()));

if (missing.length) {
  console.error(`Missing required copy: ${missing.join(", ")}`);
  process.exit(1);
}

if (!css.includes("--navy") || !css.includes("--blue")) {
  console.error("Missing core color theme.");
  process.exit(1);
}

if (!js.includes("FULLY_BLOCKED_DATES") || !js.includes("BUSY_WINDOWS")) {
  console.error("Expected calendar availability rules.");
  process.exit(1);
}

for (const text of [
  "AVAILABILITY_BY_DAY",
  "BOOKING_DAYS_AHEAD = 21",
  "2026-06-06",
  '2: { start: "15:30", end: "18:30" }',
  '3: { start: "15:30", end: "18:30" }',
  '5: { start: "15:30", end: "18:30" }',
  '6: { start: "09:00", end: "18:30" }',
  '0: { start: "09:00", end: "18:30" }'
]) {
  if (!js.includes(text)) {
    console.error(`Expected calendar cadence rule missing: ${text}`);
    process.exit(1);
  }
}

if (!html.includes("formsubmit.co/sanchezjacksondashiell@gmail.com")) {
  console.error("Expected form email destination.");
  process.exit(1);
}

if (html.includes("Local Berkeley Student") || html.includes("dashwindows-com.vercel.app")) {
  console.error("Old brand text or URL still present.");
  process.exit(1);
}

const noAccessCount = html.match(/No inside access needed/g)?.length ?? 0;
if (noAccessCount !== 1) {
  console.error(`Expected "No inside access needed" to appear once, found ${noAccessCount}.`);
  process.exit(1);
}

if (html.includes("hero-logo") || html.includes("card-price")) {
  console.error("Old logo or service-card price markup still present.");
  process.exit(1);
}

console.log("Page content check passed.");
