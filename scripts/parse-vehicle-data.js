/**
 * Parser for the custom vehicle data format.
 * Reads vehicle-data.json.txt and outputs structured JSON to client/public/vehicle-data.json
 *
 * Usage: node scripts/parse-vehicle-data.js [input-file]
 */

const fs = require('fs');
const path = require('path');

const INPUT = process.argv[2] || path.resolve('C:/Users/Admin/Desktop/vehicle-data.json.txt');
const OUTPUT = path.resolve(__dirname, '../client/public/vehicle-data.json');

let raw = fs.readFileSync(INPUT, 'utf-8');
// Fix known malformed entries: {power) should be (power)
raw = raw.replace(/\{power\)/g, '(power)');

// Line-based tokenizer: commas at end of lines are separators, commas within content are kept
function tokenize(input) {
  const tokens = [];
  const lines = input.split('\n');

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Check for trailing comma (separator between siblings)
    let trailingComma = false;
    if (line.endsWith(',')) {
      // But not inside brackets like "ecus [" - only trailing commas on closing braces/brackets or values
      trailingComma = true;
      line = line.slice(0, -1).trim();
    }

    // Now parse the line for tokens
    let i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === ' ' || ch === '\t') { i++; continue; }

      if (ch === '{' || ch === '}' || ch === '[' || ch === ']') {
        tokens.push(ch);
        i++;
        continue;
      }

      // Everything else is a string value - read until a bracket
      let str = '';
      while (i < line.length) {
        const c = line[i];
        if (c === '{' || c === '}' || c === '[' || c === ']') break;
        str += c;
        i++;
      }
      str = str.trim();
      if (str) tokens.push(str);
    }

    if (trailingComma) tokens.push(',');
  }

  return tokens;
}

// Parser
let pos = 0;
let tokens = [];

function peek() { return tokens[pos]; }
function next() { return tokens[pos++]; }
function expect(t) {
  const got = next();
  if (got !== t) {
    // Show context for debugging
    const context = tokens.slice(Math.max(0, pos - 5), pos + 5);
    throw new Error(`Expected '${t}' but got '${got}' at position ${pos - 1}. Context: ${JSON.stringify(context)}`);
  }
}

function skipComma() {
  if (peek() === ',') next();
}

// Parse top-level: { Brand { ... }, Brand { ... } }
function parseTopLevel() {
  expect('{');
  const result = {};
  while (peek() !== '}') {
    const brandName = next();
    expect('{');
    result[brandName] = parseBrandContent();
    expect('}');
    skipComma();
  }
  expect('}');
  return result;
}

// Inside a brand: Model { ... }, Model { ... }
function parseBrandContent() {
  const models = {};
  while (peek() !== '}') {
    const modelName = next();
    expect('{');
    models[modelName] = parseModelContent();
    expect('}');
    skipComma();
  }
  return models;
}

// Inside a model: generations { GenName { engines { ... } } }
function parseModelContent() {
  const generations = {};
  if (peek() === 'generations') {
    next();
    expect('{');
    while (peek() !== '}') {
      const genName = next();
      expect('{');
      const engines = parseGenerationContent();
      expect('}');
      generations[genName] = engines;
      skipComma();
    }
    expect('}');
  }
  return generations;
}

// Inside a generation: engines { EngineName { ecus [...] } }
function parseGenerationContent() {
  const engines = {};
  if (peek() === 'engines') {
    next();
    expect('{');
    while (peek() !== '}') {
      const engineName = next();
      expect('{');
      const engineData = parseEngineContent(engineName);
      expect('}');
      engines[engineName] = engineData;
      skipComma();
    }
    expect('}');
  }
  return engines;
}

// Inside an engine: ecus [ ECU1, ECU2 ]
function parseEngineContent(engineName) {
  const hpMatch = engineName.match(/(\d+)\s*hp/i);
  const hp = hpMatch ? parseInt(hpMatch[1], 10) : null;

  const ecus = [];
  if (peek() === 'ecus') {
    next();
    expect('[');
    while (peek() !== ']') {
      ecus.push(next());
      skipComma();
    }
    expect(']');
  }

  return { hp, ecus };
}

console.log('Parsing vehicle data...');
tokens = tokenize(raw);
console.log(`Tokenized: ${tokens.length} tokens`);

pos = 0;
const data = parseTopLevel();

// Count stats
const brands = Object.keys(data);
let modelCount = 0;
let engineCount = 0;
for (const brand of brands) {
  const models = Object.keys(data[brand]);
  modelCount += models.length;
  for (const model of models) {
    const gens = Object.keys(data[brand][model]);
    for (const gen of gens) {
      engineCount += Object.keys(data[brand][model][gen]).length;
    }
  }
}

console.log(`Parsed: ${brands.length} brands, ${modelCount} models, ${engineCount} engines`);

// Filter out empty brands (no models)
const filtered = {};
for (const [brand, models] of Object.entries(data)) {
  if (Object.keys(models).length > 0) {
    filtered[brand] = models;
  }
}
const filteredBrands = Object.keys(filtered);
console.log(`After filtering empty: ${filteredBrands.length} brands`);

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(filtered));
const size = fs.statSync(OUTPUT).size;
console.log(`Written to: ${OUTPUT} (${(size / 1024).toFixed(0)} KB)`);
