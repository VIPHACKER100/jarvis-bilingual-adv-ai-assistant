import { useState, useEffect, FC } from 'react';

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

export const MemoryViewer: FC<MemoryViewerProps> = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      fetchStats();
    }
  }, [isOpen]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/memory/conversations?limit=50');
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/memory/stats?days=7');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.user_input.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.jarvis_response.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 border-b border-cyan-500/30 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              Memory Viewer
            </h2>
            <p className="text-cyan-400 text-sm">Conversation History & Analytics</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="bg-slate-800/50 p-3 border-b border-slate-700 flex gap-6 text-sm">
            <div className="text-cyan-400">
              <span className="text-slate-400">Total:</span> {stats.total_conversations}
            </div>
            <div className="text-green-400">
              <span className="text-slate-400">Success:</span> {stats.successful_commands}
            </div>
            <div className="text-orange-400">
              <span className="text-slate-400">Rate:</span> {stats.success_rate?.toFixed(1)}%
            </div>
            <div className="text-purple-400">
              <span className="text-slate-400">Period:</span> {stats.period_days} days
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-slate-700">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Conversations List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="p-8 text-center text-cyan-400">
              <div className="animate-spin inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-2"></div>
              <p>Loading memory...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-4xl mb-2">📝</p>
              <p>No conversations found</p>
              <p className="text-sm mt-1">Start talking to JARVIS to build memory!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 hover:bg-slate-800/50 transition-colors ${
                    conv.success ? '' : 'bg-red-900/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-slate-500">
                      {formatTimestamp(conv.timestamp)}
                    </span>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        conv.success 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {conv.success ? '✓' : '✗'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 uppercase">
                        {conv.language}
                      </span>
                      {conv.command_type && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                          {conv.command_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <span className="text-cyan-400 font-bold">You:</span>
                      <span className="text-white">{conv.user_input}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-orange-400 font-bold">JARVIS:</span>
                      <span className="text-slate-300">{conv.jarvis_response}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 p-4 border-t border-slate-700 flex justify-between items-center">
          <span className="text-slate-500 text-sm">
            Showing {filteredConversations.length} of {conversations.length} conversations
          </span>
          <button
            onClick={fetchConversations}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
