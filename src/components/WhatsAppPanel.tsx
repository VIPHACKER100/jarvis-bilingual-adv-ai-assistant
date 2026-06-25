import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle, Send, Phone, Contact, RefreshCw,
  MessageSquare, X, ExternalLink, Sparkles,
} from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { useNotifications } from '../context/NotificationContext';
import {
  useWhatsAppStatus, useWhatsAppContacts, useSendWhatsAppMessage,
} from '../hooks/useSystemQuery';
import { apiClient } from '../services/apiClient';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';

export const WhatsAppPanel: FC = () => {
  const { showWhatsApp, setShowWhatsApp } = useJarvisStore();
  const { addNotification } = useNotifications();
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [customContact, setCustomContact] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);

  const statusQuery = useWhatsAppStatus();
  const contactsQuery = useWhatsAppContacts();
  const sendMutation = useSendWhatsAppMessage();

  const status = statusQuery.data;
  const contacts = contactsQuery.data?.contacts ?? [];
  const isRunning = status?.is_running ?? false;

  const handleSend = async () => {
    const target = useCustom ? customContact : contact;
    if (!target || !message.trim()) return;
    try {
      const res = await sendMutation.mutateAsync({ contact: target, message: message.trim() });
      addNotification({ type: 'success', title: 'WhatsApp Sent', message: res.response || 'Message delivered', duration: 3000 });
      setMessage('');
    } catch {
      addNotification({ type: 'error', title: 'Send Failed', message: 'Could not send WhatsApp message', duration: 4000 });
    }
  };

  const handleDraftReply = async () => {
    setDraftLoading(true);
    try {
      const res = await apiClient.draftWhatsAppReply();
      if (res.success && res.draft) {
        setMessage(res.draft);
        addNotification({ type: 'info', title: 'Draft Ready', message: 'AI-generated reply loaded', duration: 3000 });
      }
    } catch {
      addNotification({ type: 'error', title: 'Draft Failed', message: 'Could not generate draft reply', duration: 3000 });
    }
    setDraftLoading(false);
  };

  if (!showWhatsApp) return null;

  return (
    <Modal isOpen={showWhatsApp} onClose={() => setShowWhatsApp(false)} title="WHATSAPP_NEURAL_INTERFACE // v4.0" size="md">
      <div className="flex flex-col h-full min-h-[400px] gap-4">
        {/* Status Bar */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
          isRunning ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-success animate-pulse' : 'bg-danger'}`} />
          <span className="text-xs font-mono text-foreground">
            WhatsApp Desktop: <span className={isRunning ? 'text-success' : 'text-danger'}>{isRunning ? 'ACTIVE' : 'OFFLINE'}</span>
          </span>
          {!isRunning && (
            <button onClick={async () => {
              try {
                await apiClient.openWhatsApp();
                addNotification({ type: 'info', title: 'Launching WhatsApp', message: 'Opening WhatsApp Desktop...', duration: 3000 });
              } catch {}
            }} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-accent/20">
              <ExternalLink className="w-3 h-3" /> Launch
            </button>
          )}
        </div>

        {/* Contact Selection */}
        <div className="flex items-center gap-2 mb-1">
          <Contact className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">Recipient</span>
          <button onClick={() => setUseCustom(!useCustom)} className="ml-auto text-[9px] font-mono text-accent hover:underline">
            {useCustom ? 'Use Contacts' : 'Custom Number'}
          </button>
        </div>

        {useCustom ? (
          <Input value={customContact} onChange={e => setCustomContact(e.target.value)}
            placeholder="+919876543210" className="font-mono text-xs" />
        ) : (
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {contactsQuery.isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-accent/50" />
            ) : contacts.length === 0 ? (
              <span className="text-xs text-foreground-muted">No contacts loaded</span>
            ) : (
              contacts.map((c, i) => (
                <button key={i} onClick={() => setContact(c.phone)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono transition-all ${
                    contact === c.phone
                      ? 'bg-accent/15 border-accent/40 text-accent'
                      : 'bg-background-deep border-border-default text-foreground-muted hover:border-accent/30'
                  }`}>
                  {c.alias || c.name}
                </button>
              ))
            )}
            {contactsQuery.data && <button onClick={() => contactsQuery.refetch()} className="p-1.5 hover:bg-surface-hover rounded" title="Refresh contacts">
              <RefreshCw className="w-3 h-3 text-foreground-muted" />
            </button>}
          </div>
        )}

        {/* Selected contact display */}
        {(contact || customContact) && (
          <div className="px-3 py-2 bg-accent/5 border border-accent/20 rounded-lg text-xs font-mono text-accent">
            To: {useCustom ? customContact : contact}
          </div>
        )}

        {/* Message Input */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">Message</span>
            <button onClick={handleDraftReply} disabled={draftLoading}
              className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all hover:bg-purple-500/20 disabled:opacity-50">
              <Sparkles className="w-3 h-3" />{draftLoading ? '...' : 'AI Draft'}
            </button>
          </div>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            className="flex-1 w-full bg-background-deep border border-border-default rounded-lg p-3 text-sm font-mono text-foreground placeholder:text-foreground-muted/50 focus:border-accent/50 outline-none transition-colors resize-none"
            onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleSend(); }}
          />
        </div>

        {/* Send Button */}
        <Button onClick={handleSend} disabled={(!contact && !customContact) || !message.trim() || sendMutation.isPending}
          isLoading={sendMutation.isPending}
          className="w-full py-3" size="lg">
          <Send className="w-4 h-4 mr-2" /> Send Message
        </Button>

        {/* Footer */}
        <div className="flex items-center justify-between text-[9px] font-mono text-foreground-muted pt-2 border-t border-border-subtle">
          <span>WhatsApp Desktop Required</span>
          <button onClick={() => statusQuery.refetch()} className="flex items-center gap-1 hover:text-accent transition-colors">
            <RefreshCw className="w-3 h-3" /> Refresh Status
          </button>
        </div>
      </div>
    </Modal>
  );
};
