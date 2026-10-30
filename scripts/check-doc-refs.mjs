#!/usr/bin/env node
/**
 * Verifies the cross-document references of the governance documents.
 *
 * `AGENTS.md` and `docs/agreements/*.md` bind implementation: a stale citation
 * misleads an implementer who has authority to close a decision with it. This
 * gate checks, for those documents:
 *
 *   1. every cited `docs/**.md` path exists;
 *   2. every `§N` / `§N.M` resolves to a numbered heading of the document it
 *      points to (a reference inherits the last document named on its line);
 *   3. every `RN-nn`, `HU n`, `AD-nn`/`A-nn`/`P-nn`/`S-nn`, `D-nn` and `DW-nn`
 *      exists in its catalogue document;
 *   4. no `file.md:LINE` citation is used. A line number rots on the next edit
 *      and rots silently: cite the document plus a verbatim quote, or the
 *      stable identifier of the rule, story or screen.
 *
 * Known limit: existence is not meaning. A `§` that still exists but now covers
 * another topic passes this gate. When a claim depends on what a section says,
 * cite the normative identifier (`RN-nn`, `HU n`) or quote the sentence.
 *
 * Modes:
 *   (default)  report every broken reference and fail
 *
 * Document mentions are accepted with or without backticks; backticks are the
 * house style and the only form that can carry a file name with spaces.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const AGENTS = 'AGENTS.md';
const AGREEMENTS_DIR = 'docs/agreements';
const RULES_DOC = 'docs/dominio/Reglas de negocio.md';
const STORIES_DOC = 'docs/dominio/User Stories.md';
const SCREENS_DOC = 'docs/dominio/Arquitectura de pantallas.md';
const DECISIONS_DOC = 'docs/dominio/Decisiones abiertas.md';

/** Artifacts created by an OpenSpec change; they do not exist until it runs. */
const OPENSPEC_ARTIFACTS = new Set(['spec.md', 'design.md', 'tasks.md', 'proposal.md']);

const problems = [];
const stats = { references: 0, documents: 0 };

function read(relative) {
  return readFileSync(join(ROOT, relative), 'utf8');
}

function abort(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function lines(relative) {
  return read(relative).split(/\r?\n/);
}

/**
 * Collects the identifiers of a catalogue document. An empty catalogue is a
 * hard failure: a silently unparsed document would disable the check.
 */
function catalogue(relative, pattern, key, label) {
  if (!existsSync(join(ROOT, relative))) abort(`No se encontro ${relative}.`);
  const found = new Set();
  for (const line of lines(relative)) {
    for (const match of line.matchAll(pattern)) found.add(key(match));
  }
  if (found.size === 0) {
    abort(
      `No se pudo leer ningun ${label} desde ${relative}. Revisar el formato del documento antes de confiar en esta verificacion.`,
    );
  }
  return found;
}

const KNOWN = {
  rule: catalogue(RULES_DOC, /\bRN-(\d{2})\b/g, (m) => `RN-${m[1]}`, 'identificador RN'),
  story: catalogue(STORIES_DOC, /\bHU ?(\d{1,2})\b/g, (m) => `HU ${Number(m[1])}`, 'identificador HU'),
  screen: catalogue(
    SCREENS_DOC,
    /\*\*(AD|A|P|S)-(\d{2})\*\*/g,
    (m) => `${m[1]}-${m[2]}`,
    'identificador de pantalla',
  ),
  decision: catalogue(DECISIONS_DOC, /\b(DW?)-(\d{2})\b/g, (m) => `${m[1]}-${m[2]}`, 'identificador de decision'),
};

/** Index of every markdown document, keyed by file name, to resolve bare mentions. */
const DOC_INDEX = new Map();
function indexDocuments(directory) {
  for (const entry of readdirSync(join(ROOT, directory))) {
    const relative = `${directory}/${entry}`;
    const absolute = join(ROOT, relative);
    if (statSync(absolute).isDirectory()) {
      indexDocuments(relative);
      continue;
    }
    if (!entry.endsWith('.md')) continue;
    if (!DOC_INDEX.has(entry)) DOC_INDEX.set(entry, []);
    DOC_INDEX.get(entry).push(relative);
  }
}
indexDocuments('docs');

const sectionCache = new Map();
function sectionsOf(relative) {
  if (!sectionCache.has(relative)) {
    const found = new Set();
    if (existsSync(join(ROOT, relative))) {
      for (const line of lines(relative)) {
        const match = line.match(/^#{2,4}\s+(\d+(?:\.\d+)?)\.?\s/);
        if (match) found.add(match[1]);
      }
    }
    sectionCache.set(relative, found);
  }
  return sectionCache.get(relative);
}

/** Resolves the document a citation points to, or null when it cannot. */
function resolveDocument(mention) {
  const clean = mention.replace(/`/g, '').trim();
  if (!clean.endsWith('.md')) return null;
  if (clean.startsWith('docs/')) return existsSync(join(ROOT, clean)) ? clean : { missing: clean };
  if (clean === AGENTS) return AGENTS;
  const candidates = DOC_INDEX.get(clean);
  if (!candidates || candidates.length === 0) return { missing: clean };
  if (candidates.length > 1) return { ambiguous: candidates };
  return candidates[0];
}

const TOKEN =
  /`[^`\n]+`|§\s?\d+(?:\.\d+)?(?:\s*[–—-]\s*§?\s?\d+(?:\.\d+)?)?|docs\/[^\s`,;:)]*\.md/g;

function report(relative, line, message) {
  problems.push(`${relative}:${line}: ${message}`);
}

function checkSection(relative, line, target, raw) {
  const numbers = [...raw.matchAll(/§\s?(\d+(?:\.\d+)?)/g)].map((m) => m[1]);
  const sections = sectionsOf(target);
  const own = target === relative ? sections : sectionsOf(relative);
  // A reference after a document mention normally points to that document, but
  // prose also cites its own sections later on the same line. Accept the local
  // section when the inherited document does not have it.
  for (const number of numbers) {
    stats.references += 1;
    if (sections.has(number) || own.has(number)) continue;
    if (sections.size === 0) {
      report(relative, line, `§${number} apunta a ${target}, que no tiene secciones numeradas`);
      continue;
    }
    report(relative, line, `§${number} no existe en ${target}`);
  }
}

function checkIdentifiers(relative, line, text) {
  for (const match of text.matchAll(/\bRN-(\d{2})\b/g)) {
    stats.references += 1;
    const id = `RN-${match[1]}`;
    if (!KNOWN.rule.has(id)) report(relative, line, `${id} no existe en ${RULES_DOC}`);
  }
  for (const match of text.matchAll(/\bHU ?(\d{1,2})\b/g)) {
    stats.references += 1;
    const id = `HU ${Number(match[1])}`;
    if (!KNOWN.story.has(id)) report(relative, line, `${id} no existe en ${STORIES_DOC}`);
  }
  for (const match of text.matchAll(/\b(AD|A|P|S)-(\d{2})\b/g)) {
    stats.references += 1;
    const id = `${match[1]}-${match[2]}`;
    if (!KNOWN.screen.has(id)) report(relative, line, `${id} no existe en ${SCREENS_DOC}`);
  }
  for (const match of text.matchAll(/\b(DW?)-(\d{2})\b/g)) {
    stats.references += 1;
    const id = `${match[1]}-${match[2]}`;
    if (!KNOWN.decision.has(id)) report(relative, line, `${id} no existe en ${DECISIONS_DOC}`);
  }
}

function checkDocument(relative) {
  stats.documents += 1;
  lines(relative).forEach((text, index) => {
    const line = index + 1;

    const lineCitations = [...text.matchAll(/([A-Za-z0-9_.\- ]+\.md):(\d+)/g)];
    for (const citation of lineCitations) {
      report(
        relative,
        line,
        `cita por numero de linea (${citation[1]}:${citation[2]}): citar el documento con la frase textual o el identificador estable`,
      );
    }

    let current = relative;
    for (const token of text.matchAll(TOKEN)) {
      const value = token[0];
      if (!value.startsWith('`') && !value.startsWith('docs/')) {
        checkSection(relative, line, current, value);
        continue;
      }
      const mention = value.replace(/`/g, '');
      if (!mention.endsWith('.md')) continue;
      const basename = mention.slice(mention.lastIndexOf('/') + 1);
      if (OPENSPEC_ARTIFACTS.has(basename)) continue;
      const resolved = resolveDocument(mention);
      if (resolved === null) continue;
      if (resolved.missing) {
        report(relative, line, `${mention} no existe`);
        continue;
      }
      if (resolved.ambiguous) {
        report(relative, line, `${mention} es ambiguo (${resolved.ambiguous.join(', ')})`);
        continue;
      }
      current = resolved;
    }

    checkIdentifiers(relative, line, text);
  });
}

function governanceDocuments() {
  const agreements = readdirSync(join(ROOT, AGREEMENTS_DIR))
    .filter((entry) => entry.endsWith('.md'))
    .sort()
    .map((entry) => `${AGREEMENTS_DIR}/${entry}`);
  return [AGENTS, ...agreements];
}

for (const document of governanceDocuments()) checkDocument(document);

if (problems.length > 0) {
  console.error(`\n${problems.length} referencia(s) rota(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('');
  process.exit(1);
}

console.log(
  `\nOK: ${stats.references} referencias verificadas en ${stats.documents} documentos de gobierno (${governanceDocuments().join(', ')}).\n`,
);
