// fairtable-core on fair-agent-core 8.0.0. Written by tools/port-family.mjs from this
// package's own former core: the names, reading rules and data below are the ones it had.
// Everything this package shares with the other Fair families now comes from the engine.
import * as core from 'fair-agent-core';
import { EXPORTS as exportsData, EXPORTS_BASIS_NOTE as exportsNote } from './data/exports.js';
import { COLUMN_WORDS as columnWords, FIELD_CONCEPTS as fieldConcepts } from './data/columns.js';

export const FAMILY_PROFILE = core.defineFamily({
  id: "fairtable", brand: "Fairtable", corePkg: "fairtable-core", approveBin: "fairtable-approve", icsProdId: "-//Fairtable//fairtable-core//EN",
  // How this family reads files where the families differ (see fair-agent-core/src/family.js).
  dialect: { units: true, ownName: 'rekey', decimals: 'file', groupedEvidence: true, monthHeaders: false, legalTails: 'extended', localValues: false, aliasSkipsTaken: false, emptyMarks: false, percentWord: false },
  previewHidden: /secret|token|password|key|tin|ssn|card|iban|account|email|phone|dob|birth/i,
  limits: {"pathChars":1024,"nameChars":null},
  prefixPattern: /^[a-z][a-z0-9_]{1,30}$/,
  exports: exportsData, exportsNote, columnWords, fieldConcepts,
  memoryExample: "Subsidiary US01 posts in USD", prefixHint: ", e.g. \"tips\"",
});

const api = core.bindApi(core, FAMILY_PROFILE, {
  EXPORTS: exportsData, EXPORTS_BASIS_NOTE: exportsNote, COLUMN_WORDS: columnWords, FIELD_CONCEPTS: fieldConcepts,
  SOURCES_FILE: FAMILY_PROFILE.sourcesFile, LICENSE_PREFIX: FAMILY_PROFILE.licensePrefix,
  SOURCES_CONFIG_SCHEMA: core.sourcesConfigSchema(FAMILY_PROFILE), CORE_TEXT: core.coreCatalog(FAMILY_PROFILE),
  NOTE_KIND: core.noteKind(FAMILY_PROFILE), MAX_PATH_CHARS: FAMILY_PROFILE.limits.pathChars, MAX_NAME_CHARS: FAMILY_PROFILE.limits.nameChars, KNOWN_HEADER_WORDS: core.inFamily(FAMILY_PROFILE, core.knownHeaderWords),
});

export const {
  AgentRuntime, ApprovalStore, AuditLog, COLUMN_LANGUAGES, COLUMN_WORDS, CORE_TEXT, DECISIONS, DEFAULT_CAPS, DEFAULT_UNITS, DomainMemory, ENCODINGS,
  EXPORTS, EXPORTS_BASIS_NOTE, FAIR, FAMILY, FIELD_CONCEPTS, FIELD_TYPES, HTML_LANG, INSPECT_SCHEMA, KINDS, KNOWN_HEADER_WORDS, LANGS, LANG_NAMES,
  LICENSE_FILE, LICENSE_PREFIX, LICENSE_PUBLIC_KEYS, LICENSE_REVOKED_IDS, MAX_NAME_CHARS, MAX_PATH_CHARS, MEMORY_CATEGORY, MEMORY_DIR, MODES,
  ManifestError, NOTE_KIND, ONE_CLICK_CATEGORIES, P, PolicyEngine, SOURCES_CONFIG_SCHEMA, SOURCES_FILE, STATE_KINDS, StateKeyError, TABLE_EXTENSIONS,
  TIERS, UNITS, UsageStore, ValidationError, W, accessibleTables, adaptRecords, annotationsFor, appendStateLine, applyUnifiedDiff, approvalIdFor,
  argDocsProblems, assertValid, bindApi, canonical, capHit, carryGroup, checkLicense, cleanAmount, columnShape, compareEvals, conceptOf,
  convertStateFile, coreCatalog, coreText, createMcpHandler, decimalEvidence, decodeText, defineFamily, defineManifest, demoRuntime, describeSources,
  documentSchema, docxText, encodingName, encodingWarning, envSeal, escapeHtml, evalReportHtml, excelSerialToIso, exportCatalogue, exportEntry,
  exportProfile, familyOf, findHeaderRow, firstRowPer, foldText, friendlyError, fullName, generateSigningKey, generateStateKey, htmlPage, inFamily,
  inferDateOrder, inferDecimal, injectionSignals, isDateFormat, isEmptyMark, isLang, isSealed, issueLicense, jaroWinkler, keyId, kindsByArg,
  knownHeaderWords, levenshtein, licenseHas, licenseKeyMap, licenseView, loadPublicKeys, loadSigner, loadSourceOverrides, main, makeText, maskValue,
  matchRule, memoryFile, memoryTools, memoryValueProblem, mergeCatalogs, nameSimilarity, namesFor, neutraliseFormula, normHeader, normLang,
  normalizeAddress, normalizeName, noteKind, numberReader, openLine, overrideFor, parseAnyDate, parseCsv, parseCsvRows, parseFlags, parseLicense,
  parseStateKey, periodKey, printStep, readAudit, readLicenseToken, readNumber, readRecords, readStateJson, readStateLines, readTable, readXlsx,
  readYesNo, readZip, resolveSeal, round2, rowsToRecords, runCli, runEvalFile, runEvals, runtimeFromFlags, safeFileName, safeMarkdown, safePath,
  sealLine, serveApprovals, serveStdio, sha256, sha256File, shannonEntropy, signWebhook, slugify, sniffDelimiter, sourcesConfigSchema, stateSeal,
  stripLegalForms, stripLegalTail, stripUnit, toCsv, toIcs, toNumber, toSarif, tokenSetSimilarity, translatedNames, trustedLicenseKeys, undocumentedArgs,
  unifiedDiff, uniqueNames, unitInHeader, validate, validateIcs, validateSarif, verifyChain, verifySignature, verifyWebhook, writeEvalReport,
  writeStateJson, writeXlsx, writeZip, xlsxSheets
} = api;
