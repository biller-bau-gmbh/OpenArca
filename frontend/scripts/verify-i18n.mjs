import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const enPath = path.join(sourceRoot, "i18n", "en.json");
const plPath = path.join(sourceRoot, "i18n", "pl.json");

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const pl = JSON.parse(fs.readFileSync(plPath, "utf8"));

function flatten(value, prefix = "") {
  return Object.entries(value).flatMap(([key, entry]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      return flatten(entry, nextKey);
    }
    return [[nextKey, entry]];
  });
}

function hasKey(value, key) {
  let current = value;
  for (const part of key.split(".")) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return false;
    }
    current = current[part];
  }
  return true;
}

function listSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "test") return [];
      return listSourceFiles(fullPath);
    }
    return /\.(jsx?|tsx?)$/.test(entry.name) ? [fullPath] : [];
  });
}

const enEntries = new Map(flatten(en));
const plEntries = new Map(flatten(pl));
const missingEn = [...plEntries.keys()].filter((key) => !enEntries.has(key));
const missingPl = [...enEntries.keys()].filter((key) => !plEntries.has(key));
const polishChars = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
const englishWithPolishChars = [...enEntries].filter(
  ([, value]) => typeof value === "string" && polishChars.test(value)
);

const runtimePolish = [];
const missingStaticKeys = [];
const staticKeyPattern = /\bt\(\s*["']([^"'`$]+)["']/g;

for (const filePath of listSourceFiles(sourceRoot)) {
  const relativePath = path.relative(root, filePath);
  const text = fs.readFileSync(filePath, "utf8");

  if (relativePath !== path.join("src", "i18n", "pl.json") && polishChars.test(text)) {
    runtimePolish.push(relativePath);
  }

  for (const match of text.matchAll(staticKeyPattern)) {
    const key = match[1];
    if (!hasKey(en, key) || !hasKey(pl, key)) {
      missingStaticKeys.push({ file: relativePath, key });
    }
  }
}

const failures = [];
if (missingEn.length) failures.push(`Missing English keys: ${missingEn.join(", ")}`);
if (missingPl.length) failures.push(`Missing Polish keys: ${missingPl.join(", ")}`);
if (englishWithPolishChars.length) {
  failures.push(
    `English translations contain Polish characters: ${englishWithPolishChars
      .map(([key]) => key)
      .join(", ")}`
  );
}
if (runtimePolish.length) {
  failures.push(`Runtime source contains hardcoded Polish text: ${runtimePolish.join(", ")}`);
}
if (missingStaticKeys.length) {
  failures.push(
    `Static t() keys missing from dictionaries: ${missingStaticKeys
      .map((item) => `${item.key} (${item.file})`)
      .join(", ")}`
  );
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`i18n guard passed: ${enEntries.size} English keys, ${plEntries.size} Polish keys`);
