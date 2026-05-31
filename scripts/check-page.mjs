import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const css = readFileSync("styles.css", "utf8");
const js = readFileSync("script.js", "utf8");

const requiredText = [
  "Dash's Windows",
  "$75",
  "First-Floor Exterior Cleaning",
  "Local Berkeley High School Student",
  "first-floor exterior windows only",
  "No inside access needed",
  "Number of first-floor windows",
  "Text WINDOWS to [PHONE NUMBER]",
  "[WEBSITE LINK]"
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

if ((js.match(/day:/g) || []).length < 8) {
  console.error("Expected visible available calendar slots.");
  process.exit(1);
}

console.log("Page content check passed.");
