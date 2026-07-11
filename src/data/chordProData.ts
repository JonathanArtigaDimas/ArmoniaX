import {extractedCache} from '../utils/chordProExtractor';
import {normalize} from '../utils/textUtils';

let _chordProData: Record<string, string> | null = null;

function getChordProData(): Record<string, string> {
  if (_chordProData) {
    return _chordProData;
  }
  const DATA: Array<{name: string; chordPro: string}> = require('../../cancionero.js');
  _chordProData = {};
  for (const entry of DATA) {
    _chordProData[normalize(entry.name)] = entry.chordPro;
  }
  return _chordProData;
}

export function lookupChordPro(songName: string): string | null {
  const key = normalize(songName);

  const data = getChordProData();
  if (data[key]) {
    return data[key];
  }

  if (extractedCache[key]) {
    return extractedCache[key];
  }

  return null;
}
