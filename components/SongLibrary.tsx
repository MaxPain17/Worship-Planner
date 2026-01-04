import React, { useState } from 'react';
import { SongStats } from '../types';
import { Search, Music, ArrowUpDown, Clock } from 'lucide-react';

interface SongLibraryProps {
  stats: SongStats[];
}

export const SongLibrary: React.FC<SongLibraryProps> = ({ stats }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'title' | 'playCount' | 'lastPlayed'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filtered = stats.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    
    // Handle nulls for dates
    if (sortField === 'lastPlayed') {
       valA = valA || '1970-01-01';
       valB = valB || '1970-01-01';
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: 'title' | 'playCount' | 'lastPlayed') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'title' ? 'asc' : 'desc'); // Default desc for stats
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100" />;
    return <ArrowUpDown size={12} className={`text-indigo-600 dark:text-indigo-400 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return <span className="text-xs text-slate-400 dark:text-slate-500 italic">Never</span>;
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-slate-700 overflow-hidden flex flex-col h-full animate-fadeIn">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
         <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search songs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all dark:placeholder:text-slate-500"
            />
         </div>
         <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {filtered.length} of {stats.length} songs
         </div>
      </div>

      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
          <thead className="bg-slate-50/80 dark:bg-slate-800/80">
            <tr>
              <th onClick={() => handleSort('title')} className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><div className="flex items-center gap-2">Song Title {getSortIcon('title')}</div></th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Default Key</th>
              <th onClick={() => handleSort('playCount')} className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><div className="flex items-center gap-2">Frequency {getSortIcon('playCount')}</div></th>
              <th onClick={() => handleSort('lastPlayed')} className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><div className="flex items-center gap-2">Last Played {getSortIcon('lastPlayed')}</div></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white/40 dark:bg-slate-800/40">
            {sorted.map((song, idx) => (
              <tr key={idx} className="hover:bg-white/80 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center flex-shrink-0"><Music size={14} /></div><span className="font-bold text-slate-800 dark:text-slate-100">{song.title}</span></div></td>
                <td className="px-6 py-4 whitespace-nowrap">{song.defaultKey ? <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-slate-600 dark:text-slate-300">{song.defaultKey}</span> : <span className="text-slate-400 dark:text-slate-600">-</span>}</td>
                <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-2"><div className="flex-1 w-24 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden"><div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.min(song.playCount * 10, 100)}%` }}></div></div><span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-6 text-right">{song.playCount}</span></div></td>
                <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Clock size={14} className="text-slate-400 dark:text-slate-500" />{formatDate(song.lastPlayed)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50 p-2 space-y-2">
        {sorted.map((song, idx) => (
          <div key={idx} className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center flex-shrink-0"><Music size={14} /></div>
               <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{song.title}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 dark:text-slate-500 font-semibold mb-1">Key</p>
                {song.defaultKey ? <p className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-slate-600 dark:text-slate-300 inline-block">{song.defaultKey}</p> : <p className="text-slate-400 dark:text-slate-500">-</p>}
              </div>
               <div>
                <p className="text-slate-400 dark:text-slate-500 font-semibold mb-1">Frequency</p>
                <p className="font-medium text-slate-600 dark:text-slate-300">{song.playCount} plays</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 dark:text-slate-500 font-semibold mb-1">Last Played</p>
                <p className="font-medium text-slate-600 dark:text-slate-300">{formatDate(song.lastPlayed)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
       {(sorted.length === 0 || stats.length === 0) && (
           <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-300 dark:text-slate-600 mb-4">
                <Music size={32} />
             </div>
             <h4 className="font-bold text-slate-600 dark:text-slate-300">
               {stats.length === 0 ? "Your Library is Empty" : "No Songs Found"}
             </h4>
             <p className="text-xs max-w-xs mx-auto mt-1">
                {stats.length === 0 ? "Start by creating a new service plan. Songs you add will automatically appear here." : "Try adjusting your search term."}
             </p>
           </div>
        )}

    </div>
  );
};
