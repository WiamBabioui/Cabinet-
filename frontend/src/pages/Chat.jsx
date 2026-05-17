import React, { useState, useEffect, useRef } from 'react';
import {
  Search, 
  MoreVertical, 
  User as UserIcon, 
  Send, 
  Paperclip, 
  Smile,
  Phone,
  Video,
  CheckCheck,
  Loader2,
  Trash2,
  Sparkles,
  Info,
  Activity,
  Mic,
  Image as ImageIcon
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../components/common/Input';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

const Chat = () => {
  const { user: me } = useAuth();
  const socket = useSocket();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const targetId = location.state?.contactId;
  const targetContact = location.state?.contact;

  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact.id);
    }
  }, [activeContact]);

  useEffect(() => {
    if (!socket) return;
    if (conversationId) {
      socket.emit('join_conversation', conversationId);
    }
    
    const handleReceiveMessage = (newMsg) => {
      const nextConversationId = newMsg.conversation_id || newMsg.conversationId;
      if (nextConversationId && !conversationId) setConversationId(nextConversationId);

      setMessages(prev => {
        const nextId = newMsg.id || newMsg._id;
        const senderId = newMsg.expediteur_id ?? newMsg.senderId;
        const receiverId = newMsg.destinataire_id ?? newMsg.receiverId;
        const belongsToActiveContact = activeContact?.id && (
          senderId === activeContact.id || receiverId === activeContact.id
        );

        if (prev.some(msg => (msg.id || msg._id) === nextId)) return prev;
        if (conversationId && nextConversationId !== conversationId) return prev;
        if (!conversationId && !belongsToActiveContact) return prev;
        return [...prev, newMsg];
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    const handleConversationUpdated = (conversation) => {
      if (!conversation?.other_user) return;
      setContacts(prev => {
        const exists = prev.some(contact => contact.id === conversation.other_user.id);
        return exists ? prev : [conversation.other_user, ...prev];
      });
    };

    socket.on('conversation_updated', handleConversationUpdated);

    const handleMessageDeleted = (deletedMsgId) => {
      setMessages(prev => prev.filter(m => (m.id || m._id) !== deletedMsgId));
    };

    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, conversationId, activeContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/chat/contacts');
      let nextContacts = Array.isArray(res.data.contacts) ? res.data.contacts : [];
      
      // If we came from Patients list with an ID, find that contact
      if (targetId) {
        const target = nextContacts.find(c => String(c.id) === String(targetId));
        if (target) {
          setActiveContact(target);
        } else if (targetContact) {
          // If the contact doesn't exist in history yet, inject them at the top
          nextContacts = [targetContact, ...nextContacts];
          setActiveContact(targetContact);
        } else if (nextContacts.length > 0) {
          setActiveContact(nextContacts[0]);
        }
      } else if (nextContacts.length > 0 && !activeContact) {
        setActiveContact(nextContacts[0]);
      }
      setContacts(nextContacts);
    } catch (err) {
      console.error('Failed to fetch contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchMessages = async (userId) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/messages/${userId}`);
      setMessages(res.data.messages);
      setConversationId(res.data.conversation_id);
    } catch (err) {
      console.error('Failed to fetch messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeContact) return;

    const text = message;
    setMessage('');

    try {
      const res = await api.post('/chat/messages', {
        destinataire_id: activeContact.id,
        contenu: text
      });

      const newMsg = res.data.message;
      setConversationId(newMsg.conversation_id || newMsg.conversationId || conversationId);
      setMessages(prev => prev.some(msg => (msg.id || msg._id) === (newMsg.id || newMsg._id)) ? prev : [...prev, newMsg]);
    } catch (err) {
      alert(t('chat.send_error') || 'Error sending message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm(t('chat.delete_confirm'))) return;

    try {
      await api.delete(`/chat/messages/${messageId}`);
      setMessages(prev => prev.filter(m => (m.id || m._id) !== messageId));
    } catch (err) {
      console.error('Delete error');
    }
  };

  const filteredContacts = contacts.filter(c => 
    `${c.prenom} ${c.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingContacts) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple/10 border-t-purple rounded-full animate-spin" />
          <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple animate-pulse" size={30} />
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Connexion au serveur...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex gap-8 overflow-hidden pb-4">
      {/* Sidebar Contacts */}
      <div className="w-80 flex flex-col gap-6">
        <div className="glass-card p-4 border border-white/60">
          <Input 
            placeholder={t('nav.search')} 
            icon={Search} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 bg-white/50 border-slate-100 focus:bg-white" 
          />
        </div>
        
        <div className="flex-1 glass-card p-4 border border-white/60 overflow-y-auto custom-scrollbar space-y-2 relative">
          <div className="flex items-center gap-2 mb-4 px-2">
             <Sparkles size={14} className="text-purple" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversations</span>
          </div>
          {filteredContacts.map((contact, i) => (
            <motion.button
              key={contact.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveContact(contact)}
              className={twMerge(
                "w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all relative group",
                activeContact?.id === contact.id ? 'bg-gradient-to-br from-purple to-indigo text-white shadow-glow' : 'hover:bg-purple/5 text-slate-700'
              )}
            >
              <div className="relative flex-shrink-0">
                <div className={twMerge(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border relative z-10",
                  activeContact?.id === contact.id ? 'bg-white/20 border-white/20 shadow-sm' : 'bg-gradient-to-br from-purple/10 to-indigo/10 border-purple/10 text-purple'
                )}>
                  {contact.photo_url ? (
                    <img src={contact.photo_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : contact.prenom?.charAt(0) || '?'}
                </div>
                {/* Online Indicator */}
                <div className={twMerge(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 z-20",
                  activeContact?.id === contact.id ? 'border-purple bg-emerald' : 'border-white bg-emerald shadow-sm'
                )}></div>
              </div>
              <div className="flex-1 text-left min-w-0 relative z-10">
                <h4 className="font-black text-sm truncate leading-tight mb-1">{contact.prenom} {contact.nom}</h4>
                <div className="flex items-center justify-between">
                   <p className={twMerge("text-[10px] font-bold uppercase tracking-wider truncate", activeContact?.id === contact.id ? 'text-white/70' : 'text-slate-400')}>
                    {t(`roles.${contact.role}`)}
                   </p>
                   <span className={twMerge("text-[9px] font-black opacity-50", activeContact?.id === contact.id ? 'text-white' : 'text-slate-400')}>12:45</span>
                </div>
              </div>
              {activeContact?.id === contact.id && (
                <motion.div layoutId="active-contact-glow" className="absolute inset-0 bg-gradient-to-br from-purple to-indigo rounded-[1.5rem] -z-0" />
              )}
            </motion.button>
          ))}
          {filteredContacts.length === 0 && (
            <div className="text-center py-20 opacity-30">
               <Info size={32} className="mx-auto mb-3" />
               <p className="text-xs font-black uppercase tracking-widest">{t('chat.no_contacts')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Conversation */}
      <div className="flex-1 flex flex-col glass-card border border-white/60 overflow-hidden relative shadow-premium">
        <AnimatePresence mode="wait">
          {!activeContact ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-6"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-purple/10 to-indigo/10 flex items-center justify-center border border-purple/10">
                  <Send size={40} className="text-purple/50" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-glow flex items-center justify-center text-purple">
                   <Sparkles size={18} />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">{t('chat.select_conv')}</h3>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Selectionnez un contact pour commencer</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={activeContact.id}
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col h-full"
            >
              {/* Chat Header */}
              <div className="p-6 border-b border-white/60 flex items-center justify-between bg-white/40 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple to-indigo rounded-[1.25rem] flex items-center justify-center text-white font-black text-xl overflow-hidden shadow-glow">
                      {activeContact.photo_url ? (
                        <img src={activeContact.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : activeContact.prenom?.charAt(0) || '?'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald rounded-full border-4 border-white shadow-sm"></div>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg leading-tight flex items-center gap-2">
                      {activeContact.prenom} {activeContact.nom}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-purple uppercase tracking-[0.15em] px-2 py-0.5 bg-purple/5 rounded-lg border border-purple/10">
                        {t(`roles.${activeContact.role}`)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald uppercase tracking-widest flex items-center gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                         En ligne
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-11 h-11 flex items-center justify-center bg-white shadow-soft rounded-xl text-slate-400 hover:text-purple hover:border-purple/30 border border-transparent transition-all">
                    <Phone size={20} strokeWidth={2.5} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-11 h-11 flex items-center justify-center bg-white shadow-soft rounded-xl text-slate-400 hover:text-purple hover:border-purple/30 border border-transparent transition-all">
                    <Video size={20} strokeWidth={2.5} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} className="w-11 h-11 flex items-center justify-center bg-white shadow-soft rounded-xl text-slate-400 hover:text-slate-700 transition-all border border-transparent">
                    <MoreVertical size={20} strokeWidth={2.5} />
                  </motion.button>
                </div>
              </div>

              {/* Message Area */}
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8 bg-gradient-to-b from-transparent to-purple/[0.02]">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                     <Loader2 className="animate-spin text-purple" size={32} />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <span className="px-5 py-2 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] shadow-soft">
                        {t('chat.history')}
                      </span>
                    </div>

                    <div className="space-y-6">
                      {messages.map((msg, i) => {
                        const msgId = msg.id || msg._id;
                        const isMe = (msg.expediteur_id ?? msg.senderId) === me.id;
                        const text = msg.contenu ?? msg.content ?? msg.message ?? '';
                        const createdAt = msg.created_at ?? msg.createdAt;
                        const seen = msg.lu ?? msg.seen;
                        return (
                          <motion.div 
                            key={msgId} 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.05 }}
                            className={`flex group ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] relative flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className={twMerge(
                                "p-4 px-6 rounded-[1.75rem] shadow-sm relative transition-all group-hover:shadow-md",
                                isMe 
                                  ? 'bg-gradient-to-br from-purple to-indigo text-white rounded-tr-none' 
                                  : 'bg-white/70 backdrop-blur-md text-slate-700 border border-white/80 rounded-tl-none'
                              )}>
                                <p className="text-[15px] font-medium leading-relaxed tracking-tight">{text}</p>
                                
                                <div className={twMerge(
                                  "flex items-center gap-1.5 mt-2 text-[9px] font-black uppercase tracking-widest",
                                  isMe ? 'text-white/60' : 'text-slate-400'
                                )}>
                                  {new Date(createdAt).toLocaleTimeString(i18n.language === 'ar' ? 'ar-MA' : 'fr-MA', { hour: '2-digit', minute: '2-digit' })}
                                  {isMe && <CheckCheck size={12} className={seen ? 'text-emerald-300' : 'text-white/30'} />}
                                </div>

                                {isMe && (
                                  <button 
                                    onClick={() => handleDeleteMessage(msgId)}
                                    className="absolute -left-10 top-1/2 -translate-y-1/2 p-2.5 text-slate-300 hover:text-coral opacity-0 group-hover:opacity-100 transition-all bg-white shadow-soft rounded-xl border border-slate-100 scale-75 group-hover:scale-100"
                                    title={t('chat.delete_tooltip')}
                                  >
                                    <Trash2 size={14} strokeWidth={2.5} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-8 bg-white/40 backdrop-blur-xl border-t border-white/60 relative z-20">
                <form onSubmit={handleSendMessage} className="bg-white p-2 ps-4 rounded-[2rem] flex items-center gap-3 border border-slate-100 shadow-premium focus-within:ring-4 focus-within:ring-purple/10 transition-all">
                  <div className="flex gap-1 border-r border-slate-100 pe-2">
                    <button type="button" className="p-2.5 text-slate-400 hover:text-purple hover:bg-purple/5 rounded-2xl transition-all">
                      <Paperclip size={20} strokeWidth={2.5} />
                    </button>
                    <button type="button" className="p-2.5 text-slate-400 hover:text-purple hover:bg-purple/5 rounded-2xl transition-all hidden sm:flex">
                      <ImageIcon size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder={t('chat.placeholder')}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium p-2 placeholder:text-slate-300"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <button type="button" className="p-2.5 text-slate-400 hover:text-purple hover:bg-purple/5 rounded-2xl transition-all">
                      <Mic size={20} strokeWidth={2.5} />
                    </button>
                    <motion.button 
                      whileHover={{ scale: 1.05, rotate: -10 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={!message.trim()}
                      className="bg-gradient-to-br from-purple to-indigo text-white rounded-[1.25rem] h-12 w-12 flex items-center justify-center shadow-glow disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      <Send size={20} strokeWidth={2.5} />
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Chat;
