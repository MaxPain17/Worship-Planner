import { WorshipService } from './types';

export const INITIAL_DATA: WorshipService[] = [
  {
    id: '1',
    status: 'confirmed',
    date: '2026-01-04',
    theme: 'New Year Celebration',
    songs: {
      praise1: { title: 'Pista', key: 'G', notes: 'High energy intro' },
      praise2: { title: 'Pinagdiriwang Ka', key: 'D', notes: '' },
      worship1: { title: 'Sukdulang Biyaya', key: 'C', notes: 'Slow build up' },
      worship2: { title: 'Pusong Dalisay', key: 'E', notes: 'Altar call' },
      response: { title: '', key: '', notes: '' },
      closing: { title: '', key: '', notes: '' },
    },
    team: {
      songLead: 'Almera',
      backup: 'Love',
      guitar: 'Ate Lianne',
      bass: 'Faith',
      drums: 'Adrian',
      piano: 'None',
    },
  }
];
