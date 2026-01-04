export interface SongData {
  title: string;
  key: string;
  notes: string;
}

export interface SongStats {
  title: string;
  defaultKey: string;
  playCount: number;
  lastPlayed: string | null;
}

export interface WorshipService {
  id: string;
  status: 'draft' | 'confirmed';
  date: string;
  theme: string;
  songs: {
    praise1: SongData;
    praise2: SongData;
    worship1: SongData;
    worship2: SongData;
    response: SongData;
    closing: SongData;
  };
  team: {
    songLead: string;
    backup: string;
    guitar: string;
    bass: string;
    drums: string;
    piano: string;
  };
}

export type SongField = keyof WorshipService['songs'];
export type TeamField = keyof WorshipService['team'];

export const songLabels: Record<SongField, string> = {
  praise1: "1st Praise",
  praise2: "2nd Praise",
  worship1: "1st Worship",
  worship2: "2nd Worship",
  response: "Response",
  closing: "Closing"
};

export const teamLabels: Record<TeamField, string> = {
  songLead: "Song Lead",
  backup: "Back-Up Vocals",
  guitar: "Guitar",
  bass: "Bass",
  drums: "Drums",
  piano: "Piano/Keys"
};