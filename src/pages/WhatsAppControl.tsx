import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  MessageCircle,
  Phone,
  Video,
  Search,
  Send,
  CheckCheck,
  Paperclip,
  MoreVertical,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_CHATS = [
  {
    id: 1,
    name: "Secure Channel Alpha",
    message: "Deployment successful. Standing by.",
    time: "10:42 AM",
    unread: 0,
    online: true,
  },
  {
    id: 2,
    name: "Commander",
    message: "Run diagnostics on Node 4.",
    time: "09:15 AM",
    unread: 2,
    online: false,
  },
  {
    id: 3,
    name: "Automated Alerts",
    message: "[Warning] High memory usage detected.",
    time: "Yesterday",
    unread: 0,
    online: true,
  },
  {
    id: 4,
    name: "Project Omega",
    message: "File transfer complete (4.2GB)",
    time: "Tuesday",
    unread: 0,
    online: false,
  },
];

const MOCK_MESSAGES = [
  {
    id: 1,
    sender: "me",
    text: "Initiate system backup.",
    time: "09:12 AM",
    status: "read",
  },
  {
    id: 2,
    sender: "them",
    text: "Backup sequence started. ETA 4 minutes.",
    time: "09:13 AM",
  },
  {
    id: 3,
    sender: "them",
    text: "Backup complete. Integrity check passed.",
    time: "09:18 AM",
  },
  {
    id: 4,
    sender: "me",
    text: "Run diagnostics on Node 4.",
    time: "09:15 AM",
    status: "delivered",
  },
];

export function WhatsAppControl() {
  const [activeChat, setActiveChat] = useState(MOCK_CHATS[1]!);
  const [message, setMessage] = useState("");

  return (
    <div className="h-full flex flex-col space-y-4 text-slate-300 relative z-10">
      <div className="flex items-center justify-between border-b border-emerald-900/50 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <MessageCircle size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-display tracking-wider">
              WHATSAPP CONTROL
            </h2>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              Encrypted Communications
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Chat List */}
        <Card className="w-80 shrink-0 hud-bg hud-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-emerald-900/30 shrink-0">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50"
              />
              <input
                type="text"
                placeholder="Search encrypted channels..."
                className="w-full bg-slate-900/80 border border-emerald-900/50 rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-emerald-100 placeholder-emerald-900/50 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {MOCK_CHATS.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={cn(
                  "p-4 border-b border-slate-800/50 cursor-pointer transition-colors group",
                  activeChat.id === chat.id
                    ? "bg-emerald-950/30 border-l-2 border-l-emerald-400"
                    : "hover:bg-slate-900/50",
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4
                    className={cn(
                      "font-bold text-sm truncate pr-2",
                      activeChat.id === chat.id
                        ? "text-emerald-100"
                        : "text-slate-200 group-hover:text-emerald-300",
                    )}
                  >
                    {chat.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {chat.time}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className="text-xs text-slate-400 truncate">
                    {chat.message}
                  </p>
                  {chat.unread > 0 && (
                    <span className="bg-emerald-500 text-[#020617] text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 hud-bg hud-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-emerald-900/30 shrink-0 flex justify-between items-center bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-display text-lg">
                {activeChat.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-100">{activeChat.name}</h3>
                <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  {activeChat.online && (
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  )}
                  {activeChat.online ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-400/70">
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 hover:text-emerald-300 hover:bg-emerald-500/10"
              >
                <Video size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 hover:text-emerald-300 hover:bg-emerald-500/10"
              >
                <Phone size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 hover:text-emerald-300 hover:bg-emerald-500/10"
              >
                <MoreVertical size={18} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {MOCK_MESSAGES.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[70%]",
                  msg.sender === "me"
                    ? "ml-auto items-end"
                    : "mr-auto items-start",
                )}
              >
                <div
                  className={cn(
                    "p-3 rounded-2xl text-sm font-mono",
                    msg.sender === "me"
                      ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-100 rounded-tr-sm"
                      : "bg-slate-900 border border-slate-700 text-slate-300 rounded-tl-sm",
                  )}
                >
                  {msg.text}
                </div>
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-[10px] text-slate-500">{msg.time}</span>
                  {msg.sender === "me" &&
                    (msg.status === "read" ? (
                      <CheckCheck size={12} className="text-emerald-500" />
                    ) : (
                      <Check size={12} className="text-slate-500" />
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-emerald-900/30 shrink-0 bg-slate-950/80">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 text-slate-400 hover:text-emerald-400"
              >
                <Paperclip size={18} />
              </Button>
              <input
                type="text"
                placeholder="Type an encrypted message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
              />
              <Button className="w-10 h-10 p-0 bg-emerald-600 hover:bg-emerald-500 text-white border-none">
                <Send size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
