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
  Loader2
} from 'lucide-react';
import { io } from 'socket.io-client';
import Card from '../components/dashboard/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const socket = io('http://localhost:5000');

const Chat = () => {
  const { user: me } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationId, setConversationId] = useState(null);
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
    if (conversationId) {
      socket.emit('join_conversation', conversationId);
    }
    
    const handleReceiveMessage = (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/chat/contacts');
      setContacts(res.data.contacts);
      if (res.data.contacts.length > 0) {
        setActiveContact(res.data.contacts[0]);
      }
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
      console.log('Envoi du message à:', activeContact.id);
      const res = await api.post('/chat/messages', {
        destinataire_id: activeContact.id,
        contenu: text
      });

      const newMsg = res.data.message;
      setMessages(prev => [...prev, newMsg]);
      
      console.log('Message envoyé avec succès, ID conv:', conversationId);
      // Notify other user via socket
      socket.emit('send_message', {
        conversation_id: conversationId,
        message: newMsg
      });
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err.response?.data || err.message);
      alert('Erreur: ' + (err.response?.data?.message || 'Impossible d\'envoyer le message'));
    }
  };


  if (loadingContacts) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
      {/* Sidebar Contacts */}
      <div className="w-80 flex flex-col gap-4">
        <div className="bg-white rounded-3xl p-4 shadow-soft border border-slate-100">
          <Input placeholder="Rechercher..." icon={Search} className="bg-slate-50 border-none" />
        </div>
        
        <div className="flex-1 bg-white rounded-3xl p-4 shadow-soft border border-slate-100 overflow-y-auto space-y-2">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                activeContact?.id === contact.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                  activeContact?.id === contact.id ? 'bg-white/20' : 'bg-primary/10 text-primary'
                }`}>
                  {contact.photo_url ? (
                    <img src={contact.photo_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : contact.prenom.charAt(0)}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 ${
                  activeContact?.id === contact.id ? 'border-primary' : 'border-white'
                } bg-secondary`}></div>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-sm truncate">{contact.prenom} {contact.nom}</h4>
                </div>
                <p className={`text-xs truncate ${activeContact?.id === contact.id ? 'text-white/80' : 'text-slate-500'}`}>
                  {contact.role}
                </p>
              </div>
            </button>
          ))}
          {contacts.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-10">Aucun contact trouvé</p>
          )}
        </div>
      </div>

      {/* Main Conversation */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden relative">
        {!activeContact ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
              <Send size={32} />
            </div>
            <p className="font-medium">Sélectionnez une conversation pour commencer</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg overflow-hidden">
                  {activeContact.photo_url ? (
                    <img src={activeContact.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : activeContact.prenom.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {activeContact.prenom} {activeContact.nom}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{activeContact.role}</span>
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
              {loadingMessages ? (
                <div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-xs font-bold text-slate-400 uppercase tracking-widest shadow-sm">Historique</span>
                  </div>

                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.expediteur_id === me.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${msg.expediteur_id === me.id ? 'order-1' : 'order-2'}`}>
                        <div className={`p-4 rounded-2xl shadow-sm relative ${
                          msg.expediteur_id === me.id 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                        }`}>
                          <p className="text-sm font-medium leading-relaxed">{msg.contenu}</p>
                          <div className={`flex items-center justify-end gap-1 mt-2 text-[10px] ${
                            msg.expediteur_id === me.id ? 'text-white/60' : 'text-slate-400'
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            {msg.expediteur_id === me.id && <CheckCheck size={14} className={msg.lu ? 'text-blue-300' : 'text-white/40'} />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="bg-slate-50 p-2 rounded-2xl flex items-center gap-2 border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all shadow-sm">
                <div className="flex gap-1">
                  <button type="button" className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all">
                    <Smile size={20} />
                  </button>
                  <button type="button" className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all">
                    <Paperclip size={20} />
                  </button>
                </div>
                <input 
                  type="text" 
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-transparent border-none outline-none text-sm p-2"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button 
                  type="submit"
                  className="rounded-xl h-10 w-10 p-0" 
                  icon={Send}
                  disabled={!message.trim()}
                >
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;

