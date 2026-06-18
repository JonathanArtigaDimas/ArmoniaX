import {SONG_MAPPING} from './songMapping';

export type FolderInfo = {
  id: string;
  name: string;
  createdAt: number;
};

export type SongInfo = {
  name: string;
  cantoNumber: number;
  pages: number[];
  folderId?: string;
};

export const SONGS: SongInfo[] = Object.entries(SONG_MAPPING).map(([name, data]) => ({
  name,
  cantoNumber: data.cantoNumber,
  pages: data.pages,
}));
