#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'cantos de Resucito.json');
const OUTPUT = path.join(__dirname, '..', 'cancionero.js');

const SPANISH_CHORDS = [
  'Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si',
  'Dob', 'Reb', 'Mib', 'Fab', 'Solb', 'Lab', 'Sib',
];
const ENGLISH_CHORDS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cb', 'Db', 'Eb', 'Gb', 'Ab', 'Bb',
];
const ALL_ROOTS = [...SPANISH_CHORDS, ...ENGLISH_CHORDS];
const SUFFIXES = ['m', '-', 'm-', 'm7', 'm9', 'm11', 'm13', '7', '9', '11', '13',
  'aug', 'dim', 'sus2', 'sus4', 'maj7', 'M7', 'dom7', 'aum',
  '7+', '7b5', '7#5', '7b9', '7#9', '7#11', '7b13',
  'm7b5', 'mM7', 'add9', '6', 'm6', '6/9'];

function buildChordRegex() {
  const roots = ALL_ROOTS.map(r => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const suffix = SUFFIXES.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const rootsPattern = roots.join('|');
  return new RegExp(`^(${rootsPattern})(${suffix})*(?:\\s*/\\s*(${rootsPattern}))?$`, 'i');
}

const CHORD_RE = buildChordRegex();

function isChordToken(token) {
  const clean = token.replace(/[\[\]]/g, '').trim();
  if (clean.length === 0) return false;
  if (CHORD_RE.test(clean)) return true;
  if (/^F[ai]7?\s+aum$/i.test(clean)) return true;
  if (/^Si?b\d+$/i.test(clean)) return true;
  return false;
}

function isChordOnlyLine(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (/^\(CEJILLA/.test(trimmed)) return true;
  if (/^\*\*Modelo/.test(trimmed)) return true;
  if (trimmed === 'repeat' || trimmed === 'bis' || trimmed === 'column') return true;
  if (/^clamp\s*:/i.test(trimmed)) return true;

  const withoutSectionMarker = trimmed.replace(/^[SPAMNFR]\.\s+/, '');
  if (withoutSectionMarker.length === 0) return false;

  const tokens = withoutSectionMarker.split(/\s+/).filter(w => w.length > 0);
  if (tokens.length === 0) return false;
  return tokens.every(t => isChordToken(t));
}

function parseChordLine(line) {
  const chords = [];
  let i = 0;
  while (i < line.length) {
    const rest = line.substring(i);
    let matched = false;

    for (const root of ALL_ROOTS.sort((a, b) => b.length - a.length)) {
      const rootEsc = root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const allSuffixes = SUFFIXES.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const pattern = new RegExp(`^\\s*(${rootEsc})(${allSuffixes})*(?:\\s*/\\s*(${rootEsc}))?(?=\\s|$)`, 'i');
      const m = rest.match(pattern);
      if (m) {
        const chord = m[0].trim();
        if (chord.length > 0) {
          chords.push({ chord, position: i + m[0].indexOf(chord) });
        }
        i += m[0].length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      const special = rest.match(/^\s*(F[ai]7?\s+aum|Si7|Sib7|Re-9|La-9|Mi-9|Si-9|Re\s*m9|La\s*m9|Mi\s*m9)/i);
      if (special) {
        const chord = special[1].trim();
        chords.push({ chord, position: i + special[0].indexOf(chord) });
        i += special[0].length;
      } else {
        i++;
      }
    }
  }
  return chords;
}

function insertChordsIntoLyric(lyric, chords) {
  if (chords.length === 0) return lyric;
  if (lyric.trim().length === 0) return lyric;

  const lyricLen = lyric.length;
  if (lyricLen === 0) return lyric;

  const maxChordPos = Math.max(...chords.map(c => c.position + c.chord.length), 1);

  const targets = chords.map(c => {
    let targetPos = Math.round((c.position / maxChordPos) * lyricLen);
    targetPos = Math.min(targetPos, lyricLen);
    targetPos = Math.max(targetPos, 0);
    return { chord: c.chord, targetPos };
  });

  targets.sort((a, b) => a.targetPos - b.targetPos);

  const wordStarts = [];
  for (let i = 0; i < lyricLen; i++) {
    if (i === 0 || lyric[i - 1] === ' ' || lyric[i - 1] === '\t') {
      if (lyric[i] !== ' ' && lyric[i] !== '\t') {
        wordStarts.push(i);
      }
    }
  }

  for (const t of targets) {
    let bestPos = lyricLen;
    let bestDist = Infinity;
    for (const ws of wordStarts) {
      const dist = Math.abs(ws - t.targetPos);
      if (dist < bestDist) {
        bestDist = dist;
        bestPos = ws;
      }
    }
    t.finalPos = bestPos;
  }

  targets.sort((a, b) => a.finalPos - b.finalPos);

  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i];
    lyric = lyric.substring(0, t.finalPos) + '[' + t.chord + ']' + lyric.substring(t.finalPos);
  }

  return lyric;
}

function convertSong(source) {
  const lines = source.split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      output.push('');
      i++;
      continue;
    }

    if (/^clamp\s*:/i.test(trimmed)) {
      i++;
      continue;
    }
    if (trimmed === 'column') {
      i++;
      continue;
    }
    if (/^\*\*Modelo\s+\d/.test(trimmed)) {
      output.push(trimmed);
      i++;
      continue;
    }
    if (trimmed === 'repeat' || trimmed === 'bis') {
      i++;
      continue;
    }
    if (/^\(CEJILLA/.test(trimmed)) {
      output.push(trimmed);
      i++;
      continue;
    }

    if (isChordOnlyLine(trimmed)) {
      const chords = parseChordLine(trimmed);
      let nextLyricIdx = i + 1;
      while (nextLyricIdx < lines.length && lines[nextLyricIdx].trim().length === 0) {
        nextLyricIdx++;
      }
      if (nextLyricIdx < lines.length) {
        const nextTrimmed = lines[nextLyricIdx].trim();
        if (!isChordOnlyLine(nextTrimmed) || /^\(CEJILLA/.test(nextTrimmed)) {
          const lyricLine = lines[nextLyricIdx];
          const converted = insertChordsIntoLyric(lyricLine, chords);
          output.push(converted);
          i = nextLyricIdx + 1;
        } else {
          output.push(line);
          i++;
        }
      } else {
        i++;
      }
      continue;
    }

    output.push(line);
    i++;
  }

  while (output.length > 0 && output[output.length - 1].trim() === '') {
    output.pop();
  }

  return output.join('\n');
}

const rawData = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
const songs = Object.values(rawData);

const result = [];
const seenNames = new Set();
for (const song of songs) {
  const chordPro = convertSong(song.source);
  const shortName = song.name.includes(' - ')
    ? song.name.substring(0, song.name.indexOf(' - '))
    : song.name;
  const normalizedKey = shortName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (seenNames.has(normalizedKey)) {
    continue;
  }
  seenNames.add(normalizedKey);
  result.push({
    name: shortName,
    chordPro: chordPro,
  });
}

const output = 'module.exports = ' + JSON.stringify(result, null, 2) + ';\n';
fs.writeFileSync(OUTPUT, output, 'utf8');

console.log(`Converted ${result.length} songs`);
console.log(`Output: ${OUTPUT}`);

for (let idx = 0; idx < Math.min(3, result.length); idx++) {
  const sample = result[idx];
  console.log(`\n=== ${sample.name} ===`);
  console.log(sample.chordPro.substring(0, 600));
}
