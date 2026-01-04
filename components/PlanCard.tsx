import React from 'react';
import { WorshipService, SongData, teamLabels, TeamField } from '../types';
import { Users, Music, ChevronRight, Edit2, Copy, CheckCircle2, CircleDashed, Calendar } from 'lucide-react';

interface PlanCardProps {
  service: WorshipService;
  onSelect: (id: string) => void;
  onDuplicate: (service: WorshipService) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ service, onSelect, onDuplicate }) => {
  const dateObj = new Date(service.date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString('default', { month: 'short' });
  const weekday = dateObj.toLocaleString('default', { weekday: 'short' });
  
  // FIX: Cast `song` to `SongData` to access its properties.
  const filledSongs = Object.entries(service.songs).filter(([_, song]) => (song as SongData).title.trim() !== '');
  // FIX: Cast `name` to `string` to use string methods.
  const filledTeam = Object.entries(service.team).filter(([_, name]) => (name as string).trim() !== '' && (name as string).toLowerCase() !== 'none');

  const songCount = filledSongs.length;
  const teamCount = filledTeam.length;
  const totalFields = 12; // 6 songs + 6 roles
  const progress = Math.round(((songCount + teamCount) / totalFields) * 100);

  const isConfirmed = service.status === 'confirmed';

  return (
    <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col h-full ring-1 ring-black/5">
      <div className="p-5 flex-1 flex flex-col gap-4 cursor-pointer" onClick={() => onSelect(service.id)}>
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl shadow-inner border ${isConfirmed ? 'bg-emerald-50 dark:bg-emerald-900/50 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{month}</span>
              <span className="text-xl font-bold leading-none">{day}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{weekday} Service</span>
                {isConfirmed && <CheckCircle2 size={12} className="text-emerald-500" />}
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1" title={service.theme}>
                {service.theme || <span className="text-slate-400 dark:text-slate-500 italic font-normal">No Theme Set</span>}
              </h3>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 overflow-y-auto max-h-[300px]">
           {/* Setlist Section */}
           <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2"><Music size={12} /> Setlist ({songCount}/6)</h4>
                <div className="space-y-1.5 text-sm">
                    {filledSongs.length > 0 ? (
                        filledSongs.map(([key, songData]) => {
                            // FIX: Cast `songData` to `SongData` to access its properties.
                            const song = songData as SongData;
                            return (
                              <div key={key} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                  <span className="font-medium truncate pr-2" title={song.title}>{song.title}</span>
                                  {song.key && (
                                      <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 flex-shrink-0">
                                          {song.key}
                                      </span>
                                  )}
                              </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">No songs planned.</p>
                    )}
                </div>
            </div>
            {/* Team Section */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2"><Users size={12} /> Team ({teamCount}/6)</h4>
                <div className="space-y-1.5 text-sm">
                    {filledTeam.length > 0 ? (
                        filledTeam.map(([key, name]) => (
                            <div key={key} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{teamLabels[key as TeamField]}</span>
                                <span className="font-medium">{name as string}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">Team not assigned.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50 px-4 py-3 flex justify-between items-center backdrop-blur-sm mt-auto">
         <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${progress}%` }} 
                />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{progress}% Ready</span>
         </div>
         
         <button 
           onClick={(e) => {
             e.stopPropagation();
             onDuplicate(service);
           }}
           className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
         >
           <Copy size={12} /> 
           <span>Duplicate</span>
         </button>
      </div>
    </div>
  );
};
