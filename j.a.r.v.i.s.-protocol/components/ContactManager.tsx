import React, { useState } from 'react';
import { ContactsMap } from '../types';
import { UserPlus, Trash2, X, Save } from 'lucide-react';

interface ContactManagerProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactsMap;
  onSave: (newContacts: ContactsMap) => void;
}

export const ContactManager: React.FC<ContactManagerProps> = ({ isOpen, onClose, contacts, onSave }) => {
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newName.trim() || !newPhone.trim()) {
      setError('FIELDS REQUIRED');
      return;
    }
    const nameKey = newName.trim().toUpperCase();
    if (contacts[nameKey]) {
      setError('ALREADY EXISTS');
      return;
    }
    
    const updated = { ...contacts, [nameKey]: newPhone.trim() };
    onSave(updated);
    setNewName('');
    setNewPhone('');
    setError('');
  };

  const handleDelete = (key: string) => {
    const updated = { ...contacts };
    delete updated[key];
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-black border border-cyan-800 rounded-lg shadow-[0_0_50px_rgba(0,255,255,0.2)] flex flex-col max-h-[80vh] relative overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-cyan-800 flex justify-between items-center bg-cyan-900/10">
          <h2 className="font-hud text-xl text-cyan-400 tracking-widest flex items-center gap-2">
            <span className="w-2 h-6 bg-cyan-500 block"></span>
            CONTACT DATABASE
          </h2>
          <button onClick={onClose} className="text-cyan-600 hover:text-red-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Add Form */}
          <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-cyan-800 bg-cyan-950/20">
             <h3 className="font-tech text-cyan-600 mb-4 tracking-widest text-sm">NEW ENTRY</h3>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-tech text-cyan-700 mb-1">DESIGNATION (NAME)</label>
                 <input 
                   type="text" 
                   value={newName}
                   onChange={(e) => setNewName(e.target.value)}
                   className="w-full bg-black/50 border-b border-cyan-700 focus:border-cyan-400 outline-none text-cyan-100 font-tech px-2 py-1 placeholder-cyan-900"
                   placeholder="E.G. TONY STARK"
                 />
               </div>
               <div>
                 <label className="block text-xs font-tech text-cyan-700 mb-1">COMM FREQUENCY (PHONE)</label>
                 <input 
                   type="text" 
                   value={newPhone}
                   onChange={(e) => setNewPhone(e.target.value)}
                   className="w-full bg-black/50 border-b border-cyan-700 focus:border-cyan-400 outline-none text-cyan-100 font-tech px-2 py-1 placeholder-cyan-900"
                   placeholder="1234567890"
                 />
               </div>
               
               {error && <div className="text-red-500 font-tech text-xs">{error}</div>}

               <button 
                 onClick={handleAdd}
                 className="w-full mt-4 border border-cyan-600 text-cyan-400 hover:bg-cyan-900/40 hover:text-cyan-200 font-hud text-xs py-2 tracking-widest transition-all flex items-center justify-center gap-2 group"
               >
                 <Save className="w-3 h-3 group-hover:scale-110 transition-transform" />
                 SAVE RECORD
               </button>
             </div>
          </div>

          {/* List */}
          <div className="flex-1 p-0 overflow-y-auto">
             <div className="sticky top-0 bg-black/90 border-b border-cyan-900 px-4 py-2 flex justify-between text-xs font-tech text-cyan-700 z-10">
                <span>IDENTITY</span>
                <span>CONTACT</span>
             </div>
             <div className="divide-y divide-cyan-900/30">
               {Object.entries(contacts).length === 0 ? (
                 <div className="p-8 text-center text-cyan-900 font-tech italic">NO RECORDS FOUND</div>
               ) : (
                 Object.entries(contacts).map(([name, phone]) => (
                   <div key={name} className="flex justify-between items-center px-4 py-3 hover:bg-cyan-900/10 transition-colors group">
                      <div className="flex flex-col">
                        <span className="font-hud text-cyan-400 text-sm tracking-wider">{name}</span>
                        <span className="font-tech text-cyan-700 text-xs">{phone}</span>
                      </div>
                      <button 
                        onClick={() => handleDelete(name)}
                        className="text-cyan-900 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                 ))
               )}
             </div>
          </div>

        </div>

        {/* Decor Lines */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>
      </div>
    </div>
  );
};