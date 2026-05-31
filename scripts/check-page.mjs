import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const css = readFileSync("styles.css", "utf8");
const js = readFileSync("script.js", "utf8");

const requiredText = [
  "Dash's Windows",
  "$75",
  "Local Berkeley Student",
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

if (!html.includes("formsubmit.co/sanchezjacksondashiell@gmail.com")) {
  console.error("Expected form email destination.");
  process.exit(1);
}

console.log("Page content check passed.");
