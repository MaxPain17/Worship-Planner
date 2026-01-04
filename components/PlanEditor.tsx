import React, { useState, useRef, useEffect } from 'react';
import { WorshipService, songLabels, teamLabels, SongField, TeamField, SongData, SongStats } from '../types';
import { ArrowLeft, Save, Trash2, Calendar, Music, Mic2, Copy, Check, Printer, CheckCircle2, CircleDashed, Activity, MoreVertical } from 'lucide-react';

interface PlanEditorProps {
  service: WorshipService;
  songLibrary: SongStats[];
  onSave: (updatedService: WorshipService) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

// Internal Autocomplete Component
const AutocompleteInput = ({ 
  value, 
  onChange, 
  onSelect, 
  suggestions, 
  placeholder, 
  className 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  onSelect: (song: SongStats) => void,
  suggestions: SongStats[],
  placeholder?: string,
  className?: string
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = value 
    ? suggestions.filter(s => s.title.toLowerCase().includes(value.toLowerCase()) && s.title !== value).slice(0, 5)
    : [];

  const formatDate = (dateString: string | null) => {
     if (!dateString) return 'Never';
     const d = new Date(dateString);
     return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-50 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl mt-2 max-h-56 overflow-y-auto ring-1 ring-black/5">
          {filtered.map((song, idx) => (
            <div 
              key={idx}
              className="px-4 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 cursor-pointer text-sm text-slate-700 flex justify-between items-center group transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0"
              onClick={() => {
                onSelect(song);
                setShowSuggestions(false);
              }}
            >
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-100">{song.title}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  Played {song.playCount}x • Last: {formatDate(song.lastPlayed)}
                </span>
              </div>
              <div className="flex gap-1">
                 {song.defaultKey && <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 group-hover:bg-white dark:group-hover:bg-slate-600">{song.defaultKey}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PlanEditor: React.FC<PlanEditorProps> = ({ service, songLibrary, onSave, onDelete, onCancel }) => {
  const [formData, setFormData] = useState<WorshipService>({ ...service });
  const [copied, setCopied] = useState(false);
  const [isActionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setActionsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSongChange = (field: SongField, key: keyof SongData, value: string) => {
    setFormData(prev => ({
      ...prev,
      songs: { 
        ...prev.songs, 
        [field]: { ...prev.songs[field], [key]: value } 
      }
    }));
  };

  const handleSongSelect = (field: SongField, song: SongStats) => {
    setFormData(prev => ({
      ...prev,
      songs: {
        ...prev.songs,
        [field]: { 
          ...prev.songs[field],
          title: song.title,
          key: prev.songs[field].key || song.defaultKey,
        } 
      }
    }));
  };

  const handleTeamChange = (field: TeamField, value: string) => {
    setFormData(prev => ({
      ...prev,
      team: { ...prev.team, [field]: value }
    }));
  };

  const toggleStatus = () => {
    setFormData(prev => ({
      ...prev,
      status: prev.status === 'confirmed' ? 'draft' : 'confirmed'
    }));
  };

  const copyToClipboard = () => {
    const lines = [
      `*${formData.theme || 'Sunday Service'}*`,
      `Date: ${new Date(formData.date).toLocaleDateString()}`,
      `Lead: ${formData.team.songLead || 'TBD'}`,
      '',
      '*SETLIST*',
      ...Object.entries(formData.songs).map(([key, song]) => {
         const s = song as SongData;
         const label = songLabels[key as SongField];
         if (!s.title) return null;
         return `${label}: ${s.title} ${s.key ? `(${s.key})` : ''} ${s.notes ? `- ${s.notes}` : ''}`;
      }).filter(Boolean),
      '',
      '*TEAM*',
      ...Object.entries(formData.team).map(([key, member]) => {
        if (!member) return null;
        return `${teamLabels[key as TeamField]}: ${member}`;
      }).filter(Boolean)
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900 min-h-screen flex flex-col print:bg-white print:h-auto">
      {/* Header Toolbar (Hidden on Print) */}
      <div className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 px-4 py-3 shadow-sm flex justify-between items-center print:hidden">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="hidden sm:block">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate">Edit Plan</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleStatus}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm ${
              formData.status === 'confirmed' 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20' 
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
            }`}
          >
            {formData.status === 'confirmed' ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
            <span className="hidden sm:inline">{formData.status === 'confirmed' ? 'Confirmed' : 'Draft'}</span>
          </button>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
          
          <button 
            onClick={copyToClipboard}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-colors flex items-center gap-2"
            title="Copy to Clipboard"
          >
            {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
          </button>

          {/* Actions Dropdown for Mobile */}
          <div className="relative sm:hidden" ref={actionsMenuRef}>
            <button onClick={() => setActionsMenuOpen(prev => !prev)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
              <MoreVertical size={18} />
            </button>
            {isActionsMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 ring-1 ring-black/5 z-50">
                <button onClick={handlePrint} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <Printer size={16} /> Print
                </button>
                <button onClick={() => onDelete(service.id)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                  <Trash2 size={16} /> Delete Plan
                </button>
              </div>
            )}
          </div>
          
          {/* Desktop Buttons */}
           <button 
            onClick={handlePrint}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 rounded-full transition-colors hidden sm:block"
            title="Print Run Sheet"
          >
            <Printer size={18} />
          </button>
          <button 
            onClick={() => onDelete(service.id)}
            className="p-2 text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-colors hidden sm:block"
            title="Delete Plan"
          >
            <Trash2 size={18} />
          </button>

          <button 
            onClick={() => onSave(formData)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
          >
            <Save size={16} />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 flex flex-col lg:flex-row gap-8 print:p-0 print:block">
        
        {/* Main Content: The Spreadsheet / Run Sheet */}
        <div className="flex-1 space-y-6">
          
          {/* Metadata Bar */}
          <div className="bg-white dark:bg-slate-800/50 p-4 sm:p-6 rounded-2xl border border-white dark:border-slate-700/50 shadow-sm flex flex-col sm:flex-row gap-6 print:shadow-none print:border-none print:p-0 print:mb-8">
             <div className="flex-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block">Date</label>
                <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-500/20 transition-all print:bg-transparent print:p-0 print:border-none">
                  <Calendar size={18} className="text-indigo-500 print:hidden" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="bg-transparent w-full text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none print:text-xl print:font-bold print:text-black"
                  />
                </div>
             </div>
             <div className="flex-[2]">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block">Theme / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Thanksgiving, Faith, Victory..."
                  value={formData.theme}
                  onChange={(e) => setFormData({...formData, theme: e.target.value})}
                  className="w-full bg-slate-50/50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 print:bg-transparent print:p-0 print:text-xl print:font-bold print:text-black print:border-none"
                />
             </div>
          </div>

          {/* Song Sheet (Spreadsheet Style) */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-white dark:border-slate-700/50 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">
            <div className="bg-indigo-50/30 dark:bg-indigo-500/10 p-4 border-b border-indigo-50 dark:border-indigo-500/10 flex justify-between items-center print:hidden">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Music size={16} className="text-indigo-600 dark:text-indigo-400"/> Worship Setlist
              </h3>
            </div>

            {/* Table Header (Hidden on mobile, visible on desktop & print) */}
            <div className="hidden md:grid print:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700/50 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider print:bg-white print:border-b-2 print:border-black print:text-black">
              <div className="col-span-2">Segment</div>
              <div className="col-span-6">Song Title</div>
              <div className="col-span-1">Key</div>
              <div className="col-span-3">Notes</div>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-700/50 print:divide-slate-300">
              {(Object.keys(songLabels) as SongField[]).map((key) => (
                <div key={key} className="p-4 md:px-6 md:py-3 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group print:hover:bg-white">
                  
                  {/* Label Column */}
                  <div className="col-span-1 md:col-span-2 flex items-center gap-3 md:block">
                     <span className="md:hidden text-xs font-bold text-slate-400 uppercase w-16 print:hidden">Slot</span>
                     <span className="text-xs font-bold text-indigo-600/80 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md md:bg-transparent md:dark:bg-transparent md:px-0 md:py-0 md:text-slate-500 md:dark:text-slate-400 print:text-black print:bg-transparent">
                       {songLabels[key]}
                     </span>
                  </div>

                  {/* Title Column with Autocomplete */}
                  <div className="col-span-1 md:col-span-6">
                    <AutocompleteInput 
                      value={formData.songs[key].title}
                      onChange={(val) => handleSongChange(key, 'title', val)}
                      onSelect={(song) => handleSongSelect(key, song)}
                      suggestions={songLibrary}
                      placeholder="Enter song title..."
                      className="w-full text-base md:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent border-0 border-b border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-600 focus:border-indigo-500 focus:ring-0 p-0 transition-all print:text-black"
                    />
                  </div>

                  {/* Key Column */}
                  <div className="col-span-1 md:col-span-1 flex items-center gap-3 md:block">
                     <span className="md:hidden text-xs font-bold text-slate-400 uppercase w-16 print:hidden">Key</span>
                     <input
                      type="text"
                      value={formData.songs[key].key}
                      onChange={(e) => handleSongChange(key, 'key', e.target.value)}
                      placeholder="Key"
                      className="w-full text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 md:bg-transparent md:dark:bg-transparent rounded px-2 py-1 md:p-0 md:border-0 md:border-b md:border-transparent md:group-hover:border-slate-200 dark:md:group-hover:border-slate-600 focus:border-indigo-500 focus:ring-0 transition-all print:text-black print:bg-transparent print:p-0"
                     />
                  </div>

                  {/* Notes Column */}
                  <div className="col-span-1 md:col-span-3 flex items-center gap-3 md:block">
                     <span className="md:hidden text-xs font-bold text-slate-400 uppercase w-16 print:hidden">Notes</span>
                     <input
                      type="text"
                      value={formData.songs[key].notes}
                      onChange={(e) => handleSongChange(key, 'notes', e.target.value)}
                      placeholder="Add note..."
                      className="w-full text-xs text-slate-500 dark:text-slate-400 italic bg-transparent border-0 border-b border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-600 focus:border-indigo-500 focus:ring-0 p-0 transition-all print:text-black"
                     />
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Team Assignments */}
        <div className="w-full lg:w-80 space-y-6 print:w-full print:mt-6">
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-white dark:border-slate-700/50 shadow-sm sticky top-24 print:static print:shadow-none print:border-none print:p-0">
             <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 print:border-b print:border-black print:pb-2">
               <Mic2 size={18} className="text-emerald-500 print:hidden"/> Team Roles
             </h3>
             
             <div className="space-y-5 print:grid print:grid-cols-3 print:gap-6 print:space-y-0">
                {/* FIX: Corrected typo from `TeamFiel d` to `TeamField` */}
                {(Object.keys(teamLabels) as TeamField[]).map((key) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 print:text-black">
                      {teamLabels[key]}
                    </label>
                    <input
                      type="text"
                      value={formData.team[key]}
                      onChange={(e) => handleTeamChange(key, e.target.value)}
                      placeholder="Unassigned"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all print:bg-transparent print:p-0 print:border-none print:text-black"
                    />
                  </div>
                ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
