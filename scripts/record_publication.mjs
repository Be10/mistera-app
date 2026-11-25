#!/usr/bin/env node
/* Appends approved gift days after a successful PRD deployment; no D1 changes. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const historyFile = path.join(root, 'scripts', 'published-history.json');
const sourceFile = path.join(root, 'public', 'content', 'sorpresas-2026.json');
const source = JSON.parse(fs.readFileSync(sourceFile,'utf8'));
const original = fs.existsSync(historyFile) ? JSON.parse(fs.readFileSync(historyFile,'utf8')) : {days:[1,2]};
const previous = new Set(original.days || []);
for (const day of source.days || []) if (day.publicationStatus === 'PUBLICADO') previous.add(day.day);
original.days = [...previous].sort((a,b) => a-b);
fs.writeFileSync(historyFile, JSON.stringify(original, null, 2) + '\n');
console.log('Historial de publicaciones:', original.days.join(', '));
