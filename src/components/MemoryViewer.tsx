import { useState, useEffect, FC } from 'react';
import { apiClient } from '../services/apiClient';

interface Conversation {
  id: number;
  timestamp: string;
  user_input: string;
  jarvis_response: string;
  command_type: string;
  success: boolean;
  language: string;
}

interface MemoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MemoryFact {
  key: string;
  value: string;
  category: string;
  confidence: number;
  updated_at: string;
}

type ViewMode = 'history' | 'analytics' | 'memories';

export const MemoryViewer: FC<MemoryViewerProps> = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('history');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [convRes, statsRes, factsRes] = await Promise.all([
        apiClient.getConversations(100),
        apiClient.getMemoryStats(7),
        apiClient.getMemoryFacts()
      ]);

      if (convRes.success) {
        setConversations(convRes.conversations);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
      if (factsRes.success) {
        setFacts(factsRes.facts);
      }
    } catch (error) {
      console.error('Error loading memory data:', error);
    }
    setLoading(false);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user_input.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.jarvis_response.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.command_type && conv.command_type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFacts = facts.filter(fact =>
    fact.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fact.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fact.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'UNKNOWN';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-lg w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-cyan-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 border-b border-cyan-500/30 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              JARVIS Memory Explorer
            </h2>
            <p className="text-cyan-400 text-sm">Conversation History & Advanced Analytics</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/30 p-1 border-b border-slate-700 shrink-0">
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 py-2 text-sm font-medium rounded transition-all ${viewMode === 'history'
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            History Log
          </button>
          <button
            onClick={() => setViewMode('memories')}
            className={`flex-1 py-2 text-sm font-medium rounded transition-all ${viewMode === 'memories'
                ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Core Memories
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`flex-1 py-2 text-sm font-medium rounded transition-all ${viewMode === 'analytics'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Analytics Dashboard
          </button>
        </div>

        {/* Search (Only in history or memories mode) */}
        {viewMode !== 'analytics' && (
          <div className="p-4 border-b border-slate-700 shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder={viewMode === 'history' ? "Search by input, response, or command type..." : "Search core memories..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-10 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-all"
              />
              <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-900/40">
          {viewMode === 'history' ? (
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-cyan-400 p-8">
                  <div className="animate-spin inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
                  <p className="animate-pulse tracking-widest uppercase text-xs">Retrieving neural links...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 opacity-60">
                  <p className="text-6xl mb-4">📔</p>
                  <p className="text-lg font-medium">No records found</p>
                  <p className="text-sm mt-1">Start a conversation with JARVIS to populate the database.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-5 hover:bg-slate-800/30 transition-all border-l-2 ${conv.success ? 'border-transparent' : 'border-red-500/50 bg-red-900/5'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                          REC ID: {conv.id} // {formatTimestamp(conv.timestamp)}
                        </span>
                        <div className="flex gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${conv.success
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            {conv.success ? 'VALID' : 'FAILED'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                            {conv.language}
                          </span>
                          {conv.command_type && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                              {conv.command_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-slate-900/50 rounded p-3 border border-slate-800">
                          <div className="flex gap-3">
                            <span className="text-cyan-500 font-mono text-xs uppercase shrink-0 pt-1">User &gt;</span>
                            <span className="text-slate-200 text-sm leading-relaxed">{conv.user_input}</span>
                          </div>
                        </div>
                        <div className="bg-cyan-900/10 rounded p-3 border border-cyan-500/10">
                          <div className="flex gap-3">
                            <span className="text-orange-400 font-mono text-xs uppercase shrink-0 pt-1">JARVIS &gt;</span>
                            <span className="text-cyan-200/90 text-sm leading-relaxed italic">{conv.jarvis_response}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : viewMode === 'memories' ? (
            <div className="overflow-y-auto flex-1 custom-scrollbar p-5">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-orange-400">
                  <div className="animate-bounce mb-4 text-4xl">💾</div>
                  <p className="animate-pulse tracking-widest uppercase text-xs">Accessing biometric database...</p>
                </div>
              ) : filteredFacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                  <p className="text-6xl mb-4">🧩</p>
                  <p className="text-lg font-medium">No core memories established</p>
                  <p className="text-sm mt-1">Tell JARVIS facts about yourself to store them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFacts.map((fact, idx) => (
                    <div key={idx} className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 hover:border-orange-500/30 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-tighter">
                          {fact.category}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          UPDATED: {formatTimestamp(fact.updated_at)}
                        </span>
                      </div>
                      <h4 className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-white transition-colors">
                        {fact.key.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-slate-200 text-sm italic">"{fact.value}"</p>
                      <div className="mt-3 w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500/50"
                          style={{ width: `${fact.confidence * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-slate-600 mt-1 uppercase">
                        <span>Confidence Factor</span>
                        <span>{(fact.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 p-6 space-y-8 custom-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-pulse text-purple-400">Processing analytics...</div>
                </div>
              ) : stats ? (
                <>
                  {/* High Level Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold mb-1">Total Signals</span>
                      <span className="text-2xl font-bold text-white">{stats.total_conversations}</span>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold mb-1">Integrity Rate</span>
                      <span className={`text-2xl font-bold ${stats.success_rate > 90 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {stats.success_rate?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold mb-1">Multi-Lang Link</span>
                      <span className="text-2xl font-bold text-orange-400">{Object.keys(stats.languages || {}).length}</span>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold mb-1">Time Horizon</span>
                      <span className="text-2xl font-bold text-blue-400">{stats.period_days}d</span>
                    </div>
                  </div>

                  {/* Commands Breakdown */}
                  <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-5">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="text-purple-400">⚡</span> Protocol Execution Distribution
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(stats.command_types || {})
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 8)
                        .map(([type, count]) => {
                          const percentage = ((count as number) / stats.total_conversations * 100).toFixed(0);
                          return (
                            <div key={type} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-mono uppercase tracking-tighter">
                                <span className="text-slate-400">{type || 'General'}</span>
                                <span className="text-cyan-400">{count as number} calls ({percentage}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Language Distribution */}
                  <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-5">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="text-orange-400">🌐</span> Linguistic Pattern Analysis
                    </h3>
                    <div className="flex items-center gap-8 justify-center py-4">
                      {Object.entries(stats.languages || {}).map(([lang, count]) => (
                        <div key={lang} className="flex flex-col items-center">
                          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold mb-2 ${lang === 'hi' ? 'border-orange-500 text-orange-400' : 'border-cyan-500 text-cyan-400'
                            }`}>
                            {lang.toUpperCase()}
                          </div>
                          <span className="text-xs text-white font-mono">{count as number} entries</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  Analytics unavailable. Gather more data.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 p-4 border-t border-slate-700 flex justify-between items-center shrink-0">
          <span className="text-slate-500 text-xs font-mono">
            REC_COUNT: {viewMode === 'history' ? filteredConversations.length : 'N/A'} // STATS_HORIZON: 7D
          </span>
          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-all border border-slate-600"
            >
              SYNC SYSTEM
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs transition-all border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              EXIT VIEWER
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.4); }
      `}</style>
    </div>
  );
};
