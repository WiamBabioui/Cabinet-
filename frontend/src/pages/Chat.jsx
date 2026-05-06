import React, { useState } from 'react';
import { 
  Search, 
  MoreVertical, 
  User, 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  Smile,
  Phone,
  Video,
  CheckCheck
} from 'lucide-react';
import Card from '../components/dashboard/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Chat = () => {
  const [activeChat, setActiveChat] = useState(1);
  const [message, setMessage] = useState('');

  const contacts = [
    { id: 1, name: 'Dr. Sarah Johnson', lastMsg: 'I reviewed the lab reports...', time: '10:42 AM', unread: 2, status: 'online' },
    { id: 2, name: 'James Wilson', lastMsg: 'Thank you doctor!', time: 'Yesterday', unread: 0, status: 'offline' },
    { id: 3, name: 'Pharmacy - Green Life', lastMsg: 'Prescription SM-4382 processed', time: 'Mon', unread: 0, status: 'online' },
  ];

  const messages = [
    { id: 1, type: 'received', text: 'Hello Doctor, I wanted to follow up on my last visit.', time: '10:30 AM' },
    { id: 2, type: 'sent', text: 'Hello Sarah, sure. How are you feeling today?', time: '10:32 AM' },
    { id: 3, type: 'received', text: 'Much better, but I have a question about the dosage.', time: '10:35 AM' },
    { id: 4, type: 'received', text: 'Should I take it before or after breakfast?', time: '10:35 AM' },
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
      {/* Sidebar Contacts */}
      <div className="w-80 flex flex-col gap-4">
        <div className="bg-white rounded-3xl p-4 shadow-soft border border-slate-100">
          <Input placeholder="Search messages..." icon={Search} className="bg-slate-50 border-none" />
        </div>
        
        <div className="flex-1 bg-white rounded-3xl p-4 shadow-soft border border-slate-100 overflow-y-auto space-y-2">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setActiveChat(contact.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                activeChat === contact.id ? 'bg-primary text-white' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                  activeChat === contact.id ? 'bg-white/20' : 'bg-primary/10 text-primary'
                }`}>
                  {contact.name.charAt(0)}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 ${
                  activeChat === contact.id ? 'border-primary' : 'border-white'
                } ${contact.status === 'online' ? 'bg-secondary' : 'bg-slate-300'}`}></div>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-sm truncate">{contact.name}</h4>
                  <span className={`text-[10px] ${activeChat === contact.id ? 'text-white/60' : 'text-slate-400'}`}>{contact.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs truncate ${activeChat === contact.id ? 'text-white/80' : 'text-slate-500'}`}>{contact.lastMsg}</p>
                  {contact.unread > 0 && activeChat !== contact.id && (
                    <span className="w-5 h-5 bg-secondary text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden relative">
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">
              {contacts.find(c => c.id === activeChat)?.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">
                {contacts.find(c => c.id === activeChat)?.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 text-slate-400 hover:text-primary transition-colors">
              <Phone size={20} />
            </button>
            <button className="p-3 text-slate-400 hover:text-primary transition-colors">
              <Video size={20} />
            </button>
            <button className="p-3 text-slate-400 hover:text-primary transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30 space-y-6">
          <div className="flex justify-center">
            <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-xs font-bold text-slate-400 uppercase tracking-widest shadow-sm">Today</span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${msg.type === 'sent' ? 'order-1' : 'order-2'}`}>
                <div className={`p-4 rounded-2xl shadow-sm relative ${
                  msg.type === 'sent' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-2 text-[10px] ${
                    msg.type === 'sent' ? 'text-white/60' : 'text-slate-400'
                  }`}>
                    {msg.time}
                    {msg.type === 'sent' && <CheckCheck size={14} className="text-white" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          <div className="bg-slate-50 p-2 rounded-2xl flex items-center gap-2 border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all shadow-sm">
            <div className="flex gap-1">
              <button className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all">
                <Smile size={20} />
              </button>
              <button className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all">
                <Paperclip size={20} />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Write your message..."
              className="flex-1 bg-transparent border-none outline-none text-sm p-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button 
              className="rounded-xl h-10 w-10 p-0" 
              icon={Send}
              onClick={() => {
                if(message.trim()) {
                  setMessage('');
                }
              }}
            >
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
