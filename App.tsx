import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WorshipService, SongData, SongStats, teamLabels, TeamField } from './types';
import { INITIAL_DATA } from './data';
import { PlanCard } from './components/PlanCard';
import { PlanEditor } from './components/PlanEditor';
import { SongLibrary } from './components/SongLibrary';
import { Plus, LayoutGrid, List as ListIcon, Calendar as CalendarIcon, BookOpen, BarChart3, Upload, Download, MoreHorizontal, Edit3 } from 'lucide-react';

const createEmptySong = (title = ''): SongData => ({ title, key: '', notes: '' });

function App() {
  const [services, setServices] = useState<WorshipService[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'library'>('grid');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Load from local storage or init with migration logic
  useEffect(() => {
    const saved = localStorage.getItem('worshipflow_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated = parsed.map((s: any) => {
          const status = s.status || 'draft';
          const newSongs: any = {};
          if (s.songs) {
            for (const key of ['praise1', 'praise2', 'worship1', 'worship2', 'response', 'closing']) {
              const val = s.songs[key];
              if (typeof val === 'string') {
                newSongs[key] = createEmptySong(val);
              } else if (val && typeof val === 'object') {
                newSongs[key] = {
                  title: val.title || '',
                  key: val.key || '',
                  notes: val.notes || ''
                };
              } else {
                newSongs[key] = createEmptySong();
              }
            }
          }
          return { ...s, status, songs: newSongs };
        });
        setServices(migrated);
      } catch (e) {
        console.error("Migration error", e);
        setServices(INITIAL_DATA);
      }
    } else {
      setServices(INITIAL_DATA);
    }
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      localStorage.setItem('worshipflow_data', JSON.stringify(services));
    }
  }, [services]);

  // Click outside listener for mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Enhanced Library Logic with Stats
  const songStatsLibrary = useMemo(() => {
    const stats = new Map<string, SongStats>();
    
    const sortedServices = [...services].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedServices.forEach(service => {
      Object.values(service.songs).forEach((song: any) => {
        if (song.title && song.title.trim()) {
          const normalizedTitle = song.title.trim();
          
          if (!stats.has(normalizedTitle)) {
            stats.set(normalizedTitle, {
              title: normalizedTitle,
              defaultKey: song.key || '',
              playCount: 0,
              lastPlayed: null
            });
          }

          const entry = stats.get(normalizedTitle)!;
          entry.playCount += 1;
          
          if (!entry.lastPlayed) {
            entry.lastPlayed = service.date;
          }
          
          if (song.key && !entry.defaultKey) entry.defaultKey = song.key;
        }
      });
    });
    return Array.from(stats.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [services]);

  const handleAddNew = () => {
    const newService: WorshipService = {
      id: Date.now().toString(),
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      theme: '',
      songs: { 
        praise1: createEmptySong(), 
        praise2: createEmptySong(), 
        worship1: createEmptySong(), 
        worship2: createEmptySong(), 
        response: createEmptySong(), 
        closing: createEmptySong() 
      },
      team: { songLead: '', backup: '', guitar: '', bass: '', drums: '', piano: '' },
    };
    setServices([...services, newService]);
    setEditingId(newService.id);
  };

  const handleDuplicate = (service: WorshipService) => {
    const newDate = new Date(service.date);
    newDate.setDate(newDate.getDate() + 7); 

    const newService: WorshipService = {
      ...service,
      id: Date.now().toString(),
      status: 'draft', 
      date: newDate.toISOString().split('T')[0],
      theme: service.theme ? `${service.theme} (Copy)` : '',
    };
    setServices([...services, newService]);
    setEditingId(newService.id);
  };

  const handleSave = (updated: WorshipService) => {
    setServices(services.map(s => s.id === updated.id ? updated : s));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this service plan?')) {
      setServices(services.filter(s => s.id !== id));
      setEditingId(null);
    }
  };

  const handleExport = () => {
    const filename = `worshipflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    const jsonStr = JSON.stringify(services, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('Are you sure you want to import this file? This will overwrite all your current plans.')) {
        event.target.value = ''; // Reset input
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('File content is not readable text.');
        }
        const importedServices = JSON.parse(text);

        if (!Array.isArray(importedServices) || (importedServices.length > 0 && !importedServices[0].id)) {
          throw new Error('Invalid file format. The file does not appear to be a valid WorshipFlow backup.');
        }
        
        setServices(importedServices);
        alert('Data imported successfully!');

      } catch (error) {
        console.error("Import failed:", error);
        alert(`Import failed. Please make sure you are uploading a valid JSON backup file. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
         event.target.value = '';
      }
    };
    reader.onerror = () => {
      alert('Failed to read the file.');
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  if (editingId) {
    const serviceToEdit = services.find(s => s.id === editingId);
    if (!serviceToEdit) return <div>Error: Service not found</div>;
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 flex flex-col overflow-y-auto animate-fadeIn">
        <PlanEditor 
          service={serviceToEdit} 
          songLibrary={songStatsLibrary}
          onSave={handleSave} 
          onDelete={handleDelete}
          onCancel={() => setEditingId(null)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Navigation Bar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-indigo-500/30">
                  <CalendarIcon size={20} className="sm:size-6"/>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
                  WorshipFlow
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-3">
                <div className="bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center">
                    <button 
                      onClick={() => setViewMode('grid')}
                      title="Grid View"
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                      <LayoutGrid size={18} />
                    </button>
                    <button 
                      onClick={() => setViewMode('table')}
                      title="List View"
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                      <ListIcon size={18} />
                    </button>
                    <div className="w-px bg-slate-200 dark:bg-slate-700 my-1 mx-1"></div>
                    <button 
                      onClick={() => setViewMode('library')}
                      title="Song Library"
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'library' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                      <BarChart3 size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <input
                      type="file" id="import-file" className="hidden" accept=".json" onChange={handleImport}
                    />
                    <label htmlFor="import-file" title="Import Data (.json)" className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition-colors">
                      <Upload size={18} />
                    </label>
                    <button onClick={handleExport} title="Export Data (.json)" className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors">
                      <Download size={18} />
                    </button>
                </div>
              </div>
              
              <button
                onClick={handleAddNew}
                className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 shadow-md shadow-slate-900/10 dark:shadow-indigo-500/20"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">New Plan</span>
                <span className="sm:hidden">New</span>
              </button>

              {/* Mobile Menu */}
              <div className="md:hidden relative" ref={mobileMenuRef}>
                 <button onClick={() => setMobileMenuOpen(prev => !prev)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                    <MoreHorizontal size={20}/>
                 </button>
                 {isMobileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 ring-1 ring-black/5 z-50 p-2">
                        <p className="px-2 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500">View Mode</p>
                        <button onClick={() => {setViewMode('grid'); setMobileMenuOpen(false);}} className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md ${viewMode === 'grid' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><LayoutGrid size={16}/> Grid</button>
                        <button onClick={() => {setViewMode('table'); setMobileMenuOpen(false);}} className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md ${viewMode === 'table' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><ListIcon size={16}/> List</button>
                        <button onClick={() => {setViewMode('library'); setMobileMenuOpen(false);}} className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md ${viewMode === 'library' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><BarChart3 size={16}/> Library</button>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-2"></div>
                         <p className="px-2 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500">Data</p>
                        <label htmlFor="import-file-mobile" className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"><Upload size={16}/> Import Backup</label>
                        <input type="file" id="import-file-mobile" className="hidden" accept=".json" onChange={handleImport} />
                        <button onClick={handleExport} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"><Download size={16}/> Export Backup</button>
                    </div>
                 )}
              </div>

            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {viewMode === 'library' ? 'Song Library & Analytics' : 'Service Plans'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
               {viewMode === 'library' ? 'Track song usage, keys, and history.' : 'Manage your worship setlists and schedules.'}
            </p>
          </div>
          <button
            onClick={() => setViewMode('library')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white dark:border-slate-700 shadow-sm hover:bg-white dark:hover:bg-slate-700/80 hover:shadow-md transition-all"
          >
             <BookOpen size={14} className="text-indigo-500" />
             <span>{songStatsLibrary.length} Songs in Library</span>
          </button>
        </div>

        {viewMode === 'library' ? (
           <SongLibrary stats={songStatsLibrary} />
        ) : (
          <>
            {viewMode === 'grid' || (typeof window !== 'undefined' && window.innerWidth < 768) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((service) => (
                  <PlanCard 
                    key={service.id} 
                    service={service} 
                    onSelect={setEditingId}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>
            ) : (
              /* Desktop Modern Table View */
              <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-slate-700 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-32">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Service Details</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Team</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Setlist</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white/40 dark:bg-slate-800/40">
                    {services
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((service) => {
                        // FIX: Cast song data to access its properties.
                        const filledSongs = Object.values(service.songs).filter(s => (s as SongData).title.trim() !== '');
                        // FIX: Cast team member name to string to use string methods.
                        const filledTeam = Object.entries(service.team).filter(([_, name]) => (name as string).trim() !== '' && (name as string).toLowerCase() !== 'none');
                        const dateObj = new Date(service.date);
                        
                        return (
                          <tr 
                            key={service.id} 
                            onClick={() => setEditingId(service.id)} 
                            className="group hover:bg-white/80 dark:hover:bg-slate-700/50 transition-all duration-200 cursor-pointer"
                          >
                            {/* Date Column */}
                            <td className="px-6 py-4 whitespace-nowrap align-top">
                              <div className="flex flex-col">
                                <span className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{dateObj.getDate()}</span>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mt-1">
                                  {dateObj.toLocaleString('default', { month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </td>

                            {/* Details Column */}
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${service.status === 'confirmed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                      {service.theme || <span className="text-slate-400 dark:text-slate-500 italic font-normal">No Theme</span>}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-700 self-start px-2 py-0.5 rounded-full">
                                  {service.status === 'confirmed' ? 'Confirmed' : 'Draft'}
                                </span>
                              </div>
                            </td>

                            {/* Team Column */}
                            <td className="px-6 py-4 align-top text-xs">
                              {filledTeam.length > 0 ? (
                                <div className="space-y-1.5">
                                  {filledTeam.map(([key, name]) => (
                                    <div key={key} className="grid grid-cols-2 gap-2 items-center">
                                      <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">{teamLabels[key as TeamField]}:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-200">{name as string}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                              )}
                            </td>

                            {/* Setlist */}
                            <td className="px-6 py-4 align-top">
                              {filledSongs.length > 0 ? (
                                <div className="space-y-1.5">
                                  {filledSongs.map((songData, index) => {
                                    const song = songData as SongData;
                                    return (
                                    <div key={index} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                                      <span className="truncate" title={song.title}>{song.title}</span>
                                      {song.key && (
                                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 px-1 rounded border border-slate-200 dark:border-slate-500 flex-shrink-0">
                                          {song.key}
                                        </span>
                                      )}
                                    </div>
                                  );
                                  })}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-500 italic">No songs planned</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-right align-top">
                              <button 
                                className="p-2 text-slate-300 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors rounded-full hover:bg-indigo-50 dark:hover:bg-slate-700"
                              >
                                <Edit3 size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {services.length === 0 && viewMode !== 'library' && (
          <div className="text-center py-20 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-200 dark:text-indigo-500/40 mb-6 animate-pulse">
              <CalendarIcon size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No services planned</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Your schedule is clear. Click the button below to start planning your next worship service.</p>
            <button
              onClick={handleAddNew}
              className="mt-8 inline-flex items-center px-6 py-3 border border-transparent shadow-lg shadow-indigo-500/20 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
            >
              <Plus size={18} className="mr-2" />
              Create First Plan
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;