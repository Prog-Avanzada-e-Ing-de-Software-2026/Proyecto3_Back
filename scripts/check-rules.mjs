#!/usr/bin/env node
/**
 * Enforces the business rule coverage indicator.
 *
 * The rules catalogue is read from the normative document, so there is no
 * second copy to keep in sync. A test declares the rules it verifies in its
 * name: `it('[RN-09] no permite solapamientos', ...)`.
 *
 * Modes:
 *   (default)      report only, never fails
 *   --require ...  fail if any required rule has no passing test
 *   --all          fail unless the 42 rules are covered
 *
 * For pull requests the required rules are read from the PR body:
 *   Reglas: RN-01, RN-05, RN-09
 */
import { existsSync, readFileSync } from 'node:fs';
import { appendFileSync } from 'node:fs';

const RULES_DOC = 'docs/dominio/Reglas de negocio.md';
const REPORT = process.env.VITEST_RESULTS ?? '.vitest-results.json';
const TAG = /\[(RN-\d{2})\]/g;

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = { require: [], all: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--all') options.all = true;
    else if (argv[index] === '--require') {
      const value = argv[index + 1] ?? '';
      options.require.push(...(value.match(/RN-\d{2}/g) ?? []));
      index += 1;
    }
  }
  return options;
}

function knownRules() {
  if (!existsSync(RULES_DOC)) fail(`No se encontro ${RULES_DOC}.`);
  const ids = new Set();
  for (const line of readFileSync(RULES_DOC, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\|\s*(RN-\d{2})\s*\|/);
    if (match) ids.add(match[1]);
  }
  if (ids.size === 0) fail(`No se pudo leer ninguna regla desde ${RULES_DOC}.`);
  return ids;
}

function readReport() {
  if (!existsSync(REPORT)) fail(`No se encontro el reporte de Vitest en ${REPORT}.`);
  const report = JSON.parse(readFileSync(REPORT, 'utf8'));
  return report.testResults ?? [];
}

function declaredFromEvent() {
  const path = process.env.GITHUB_EVENT_PATH;
  if (!path || !existsSync(path)) return [];
  const event = JSON.parse(readFileSync(path, 'utf8'));
  const body = event.pull_request?.body ?? '';
  const match = body.match(/^\s*(?:Reglas|Rules)\s*:\s*(.+)$/im);
  return match ? (match[1].match(/RN-\d{2}/g) ?? []) : [];
}

const known = knownRules();
const options = parseArgs(process.argv.slice(2));
const declared = declaredFromEvent();
const required = [...new Set([...options.require, ...declared])];

const covered = new Set();
const unknown = new Set();
let assertions = 0;

for (const file of readReport()) {
  for (const assertion of file.assertionResults ?? []) {
    assertions += 1;
    const name = assertion.fullName ?? assertion.title ?? '';
    for (const match of name.matchAll(TAG)) {
      const id = match[1];
      if (!known.has(id)) unknown.add(id);
      else if (assertion.status === 'passed') covered.add(id);
    }
  }
}

const total = known.size;
const percentage = Math.round((covered.size / total) * 1000) / 10;
const missing = [...known].filter((id) => !covered.has(id)).sort();
const missingRequired = required.filter((id) => !covered.has(id));

console.log(`Reglas documentadas: ${total}`);
console.log(`Exportadas por Vitest: ${assertions}`);
console.log(`Cubiertas por un test que pasa: ${covered.size}/${total} (${percentage}%)`);
if (required.length > 0) console.log(`Requeridas por este cambio: ${required.join(', ')}`);
if (missing.length > 0) console.log(`Sin test: ${missing.join(', ')}`);

const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary) {
  appendFileSync(
    summary,
    [
      '## Cobertura de reglas de negocio',
      '',
      `- Documentadas: **${total}**`,
      `- Cubiertas: **${covered.size}** (${percentage}%)`,
      required.length > 0 ? `- Requeridas por el cambio: ${required.join(', ')}` : '',
      missing.length > 0 ? `- Sin test: ${missing.join(', ')}` : '',
      '',
    ]
      .filter(Boolean)
      .join('\n'),
  );
}

if (unknown.size > 0) {
  fail(`Identificadores inexistentes en los tests: ${[...unknown].join(', ')}. Revisar ${RULES_DOC}.`);
}
if (missingRequired.length > 0) {
  fail(
    `Reglas declaradas sin test que pase: ${missingRequired.join(', ')}.\n` +
      'Agregue el test con el tag correspondiente o corrija la declaracion "Reglas:" del Pull Request.',
  );
}
if (options.all && covered.size < total) {
  fail(`El 100% de las ${total} reglas se exige antes del despliegue final. Faltan ${missing.length}.`);
}

console.log('\nGate de reglas: OK');
