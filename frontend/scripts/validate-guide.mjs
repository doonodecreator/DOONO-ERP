import { readFileSync } from "node:fs";

const architecture = readFileSync(new URL("../src/config/architectureModules.js", import.meta.url), "utf8");
const knowledge = readFileSync(new URL("../src/config/guideKnowledge.js", import.meta.url), "utf8");
const guide = readFileSync(new URL("../src/components/feedback/DONOGuide.jsx", import.meta.url), "utf8");
const failures = [];
const moduleKeys = [...architecture.matchAll(/^\s{2}([a-zA-Z0-9_]+):\s*\{/gm)].map((match) => match[1]);
const roleKeys = [...knowledge.matchAll(/^\s{2}([a-zA-Z0-9_]+):\s*\{/gm)].map((match) => match[1]).filter((key) => !["MODULE_DETAILS"].includes(key));

if (moduleKeys.length < 40) failures.push(`expected-at-least-40-modules:${moduleKeys.length}`);
if (roleKeys.length < 20) failures.push(`expected-at-least-20-role-guides:${roleKeys.length}`);
for (const required of ["moduleGuide", "roleGuide", "GUIDE_MODULE_KEYS", "ARCHITECTURE_MODULES", "This page", "My role", "Explore a module"]) {
  if (!knowledge.includes(required) && !guide.includes(required)) failures.push(`missing:${required}`);
}
if (!knowledge.includes("return {\n    key,")) failures.push("missing-module-fallback");
if (!guide.includes("setPage(selected.page)")) failures.push("missing-module-navigation");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Guide source coverage verified: ${moduleKeys.length} registered modules and ${roleKeys.length} role guide entries.`);
