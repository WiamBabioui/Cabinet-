import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Phone,
  Video,
  CheckCheck,
  Loader2,
  Trash2,
  Sparkles,
  Activity,
  Mic,
  Image as ImageIcon,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../components/common/Input';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

// ─── Normalise a /chat/conversations item into a sidebar entry ────────────────
const makeConvItem = (conv) => ({
  id: conv.other_user.id,
  prenom: conv.other_user.prenom,
  nom: conv.other_user.nom,
  role: conv.other_user.role,
  photo_url: conv.other_user.photo_url || null,
  conversationId: conv.id || conv._id || null,
  lastMessage: conv.lastMessageText || conv.lastMessage?.text || '',
  lastMessageAt: conv.lastMessageAt || conv.updatedAt || null,
  unread_count: Number(conv.unread_count) || 0,
});

// ─── Normalise a /chat/contacts item into a sidebar entry ────────────────────
const makeContactItem = (contact) => ({
  id: contact.id,
  prenom: contact.prenom,
  nom: contact.nom,
  role: contact.role,
  photo_url: contact.photo_url || null,
  conversationId: null,
  lastMessage: null,
  lastMessageAt: null,
  unread_count: 0,
});

// ─── Merge: conversations first (ordered by lastMessageAt), then remaining contacts ─
const buildSidebarItems = (conversations, contacts) => {
  const convItems = conversations
    .filter((c) => c?.other_user?.id)
    .map(makeConvItem);

  const convUserIds = new Set(convItems.map((c) => c.id));

  const contactItems = contacts
    .filter((c) => c?.id && !convUserIds.has(c.id))
    .map(makeContactItem);

  return [...convItems, ...contactItems];
};

// ─── Component ────────────────────────────────────────────────────────────────
const Chat = () => {
  const { user: me } = useAuth();
  const socket = useSocket();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const targetId = location.state?.contactId;
  const targetContact = location.state?.contact;

  // Sidebar
  const [sidebarItems, setSidebarItems] = useState([]);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [sidebarError, setSidebarError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Active conversation
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Sending
  const [message, setMessage] = useState('');
  const [sendError, setSendError] = useState(null);

  const messagesEndRef = useRef(null);

  // Refs so socket callbacks always read the latest state without stale closures
  const activeContactRef = useRef(activeContact);
  const conversationIdRef = useRef(conversationId);
  useEffect(() => { activeContactRef.current = activeContact; }, [activeContact]);
  useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);

  // ─── Scroll helpers ───────────────────────────────────────────────────────
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  // ─── Sidebar timestamp formatter ──────────────────────────────────────────
  const formatSidebarTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d)) return '';
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    const locale = i18n.language === 'ar' ? 'ar-MA' : 'fr-MA';
    if (diffDays === 0)
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return d.toLocaleDateString(locale, { weekday: 'short' });
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  };

  // ─── Auto-select after sidebar loads ─────────────────────────────────────
  const autoSelectContact = (merged) => {
    if (targetId) {
      const found = merged.find((item) => String(item.id) === String(targetId));
      if (found) { setActiveContact(found); return; }
      if (targetContact) {
        const item = makeContactItem(targetContact);
        setSidebarItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
        setActiveContact(item);
        return;
      }
    }
    if (merged.length > 0) setActiveContact(merged[0]);
  };

  // ─── Load sidebar: conversations + contacts merged ────────────────────────
  const fetchSidebar = async () => {
    setLoadingSidebar(true);
    setSidebarError(null);
    try {
      // Use allSettled so a single failure doesn't kill the whole sidebar
      const [convResult, contactsResult] = await Promise.allSettled([
        api.get('/chat/conversations'),
        api.get('/chat/contacts'),
      ]);

      const conversations =
        convResult.status === 'fulfilled'
          ? (convResult.value.data.conversations ?? [])
          : [];

      const contacts =
        contactsResult.status === 'fulfilled'
          ? (contactsResult.value.data.contacts ?? [])
          : [];

      if (convResult.status === 'rejected') {
        console.error('[Chat] /chat/conversations failed:', convResult.reason?.message);
      }
      if (contactsResult.status === 'rejected') {
        console.error('[Chat] /chat/contacts failed:', contactsResult.reason?.message);
      }

      const merged = buildSidebarItems(conversations, contacts);
      setSidebarItems(merged);
      autoSelectContact(merged);
    } catch (err) {
      console.error('[Chat] fetchSidebar error:', err);
      setSidebarError('Impossible de charger les conversations');
    } finally {
      setLoadingSidebar(false);
    }
  };

  // Load once on mount (eslint: targetId / targetContact intentionally excluded)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSidebar(); }, []);

  // ─── Load messages whenever active contact changes ────────────────────────
  const fetchMessages = async (userId) => {
    setLoadingMessages(true);
    setMessages([]);
    setConversationId(null);
    try {
      const res = await api.get(`/chat/messages/${userId}`);
      const {
        messages: msgs = [],
        conversation_id,
        conversationId: cId,
      } = res.data;

      setMessages(msgs);
      const convId = conversation_id || cId || null;
      setConversationId(convId);

      // Reset unread count in sidebar now that we've opened the conversation
      setSidebarItems((prev) =>
        prev.map((item) =>
          item.id === userId
            ? { ...item, unread_count: 0, conversationId: item.conversationId || convId }
            : item
        )
      );
    } catch (err) {
      console.error('[Chat] fetchMessages error:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!activeContact) return;
    fetchMessages(activeContact.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContact?.id]);

  // ─── Socket.IO ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Join the conversation room as soon as we have its ID
    if (conversationId) {
      socket.emit('join_conversation', conversationId);
    }

    // ── Incoming message ──────────────────────────────────────────────────
    const handleReceiveMessage = (newMsg) => {
      const nextConvId = newMsg.conversation_id || newMsg.conversationId;
      const senderId = Number(newMsg.expediteur_id ?? newMsg.senderId);
      const receiverId = Number(newMsg.destinataire_id ?? newMsg.receiverId);
      const currentActive = activeContactRef.current;
      const currentConvId = conversationIdRef.current;

      // Update conversationId if we don't have it yet
      if (nextConvId && !currentConvId) setConversationId(nextConvId);

      const belongsToActive =
        currentActive?.id &&
        (senderId === currentActive.id || receiverId === currentActive.id);

      setMessages((prev) => {
        const msgId = newMsg.id || newMsg._id;
        // Deduplicate
        if (prev.some((m) => (m.id || m._id) === msgId)) return prev;
        // Only append if it belongs to the currently open conversation
        if (currentConvId && nextConvId && nextConvId !== currentConvId) return prev;
        if (!currentConvId && !belongsToActive) return prev;
        return [...prev, newMsg];
      });
    };

    // ── Conversation updated (last message, unread count) ─────────────────
    const handleConversationUpdated = (updatedConv) => {
      if (!updatedConv?.other_user?.id) return;
      const otherUserId = updatedConv.other_user.id;
      const currentActive = activeContactRef.current;
      const isActive = Number(currentActive?.id) === Number(otherUserId);

      setSidebarItems((prev) => {
        const existing = prev.find((item) => item.id === otherUserId);
        const updatedItem = {
          // Start from the existing entry (preserves all fields), fall back to other_user
          ...(existing ?? updatedConv.other_user),
          id: otherUserId,
          conversationId:
            updatedConv.id ||
            updatedConv._id ||
            existing?.conversationId ||
            null,
          lastMessage:
            updatedConv.lastMessageText ||
            updatedConv.lastMessage?.text ||
            existing?.lastMessage ||
            '',
          lastMessageAt:
            updatedConv.updatedAt ||
            updatedConv.lastMessageAt ||
            new Date().toISOString(),
          // Keep 0 if this is the active conversation, else use server value or increment
          unread_count: isActive
            ? 0
            : updatedConv.unread_count != null
            ? updatedConv.unread_count
            : (existing?.unread_count ?? 0) + 1,
        };
        // Move to top of list
        return [updatedItem, ...prev.filter((item) => item.id !== otherUserId)];
      });
    };

    // ── Message deleted ───────────────────────────────────────────────────
    const handleMessageDeleted = (deletedId) => {
      setMessages((prev) =>
        prev.filter((m) => (m.id || m._id) !== deletedId)
      );
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, conversationId]);

  // ─── Send message ─────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || !activeContact) return;

    setMessage('');
    setSendError(null);

    try {
      const res = await api.post('/chat/messages', {
        destinataire_id: activeContact.id,
        contenu: text,
      });

      const newMsg = res.data.message;
      const convId =
        newMsg.conversation_id || newMsg.conversationId || conversationId;

      setConversationId(convId);

      // Append message (guard dedup)
      setMessages((prev) => {
        const msgId = newMsg.id || newMsg._id;
        return prev.some((m) => (m.id || m._id) === msgId) ? prev : [...prev, newMsg];
      });

      // Immediately update sender's sidebar entry (don't wait for socket)
      setSidebarItems((prev) => {
        const existing = prev.find((item) => item.id === activeContact.id);
        const updatedItem = {
          ...(existing ?? activeContact),
          conversationId: convId,
          lastMessage: text,
          lastMessageAt: new Date().toISOString(),
          unread_count: 0,
        };
        return [updatedItem, ...prev.filter((item) => item.id !== activeContact.id)];
      });
    } catch (err) {
      console.error('[Chat] sendMessage error:', err);
      setMessage(text); // restore text so user doesn't lose it
      setSendError(
        err.response?.data?.message ||
          t('chat.send_error') ||
          "Erreur lors de l'envoi du message"
      );
    }
  };

  // ─── Delete message ───────────────────────────────────────────────────────
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm(t('chat.delete_confirm') || 'Supprimer ce message ?'))
      return;
    try {
      await api.delete(`/chat/messages/${messageId}`);
      setMessages((prev) => prev.filter((m) => (m.id || m._id) !== messageId));
    } catch (err) {
      console.error('[Chat] deleteMessage error:', err);
    }
  };

  // ─── Computed ─────────────────────────────────────────────────────────────
  const filteredItems = sidebarItems.filter((item) =>
    `${item.prenom ?? ''} ${item.nom ?? ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // ─── Loading screen ───────────────────────────────────────────────────────
  if (loadingSidebar) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple/10 border-t-purple rounded-full animate-spin" />
          <Activity
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple animate-pulse"
            size={30}
          />
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Chargement des conversations...
        </p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-100px)] sm:h-[calc(100vh-140px)] flex gap-4 sm:gap-8 overflow-hidden pb-2 sm:pb-4">

      {/* ════════════════════════════════════ SIDEBAR ════════════════════════════════════ */}
      {/* On mobile: show sidebar only when no contact is active. On md+: always show */}
      <div className={twMerge(
        "flex flex-col gap-4 sm:gap-6 transition-all",
        // Mobile: full width when no contact, hidden when contact active
        activeContact
          ? "hidden md:flex md:w-80"
          : "flex w-full md:w-80"
      )}>

        {/* Search */}
        <div className="glass-card p-4 border border-white/60">
          <Input
            placeholder={t('nav.search')}
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 bg-white/50 border-slate-100 focus:bg-white"
          />
        </div>

        {/* List */}
        <div className="flex-1 glass-card p-4 border border-white/60 overflow-y-auto custom-scrollbar space-y-2 relative">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Sparkles size={14} className="text-purple" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Conversations
            </span>
          </div>

          {/* ── Error state ── */}
          {sidebarError && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle size={32} className="text-red-300" />
              <p className="text-xs font-bold text-slate-400">{sidebarError}</p>
              <button
                onClick={fetchSidebar}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-purple bg-purple/5 rounded-xl hover:bg-purple/10 transition-all"
              >
                <RefreshCw size={12} />
                Réessayer
              </button>
            </div>
          )}

          {/* ── Items ── */}
          {!sidebarError && filteredItems.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setActiveContact(item)}
              className={twMerge(
                'w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all relative group text-left',
                activeContact?.id === item.id
                  ? 'bg-gradient-to-br from-purple to-indigo text-white shadow-glow'
                  : 'hover:bg-purple/5 text-slate-700'
              )}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={twMerge(
                  'w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border relative z-10 overflow-hidden',
                  activeContact?.id === item.id
                    ? 'bg-white/20 border-white/20 shadow-sm text-white'
                    : 'bg-gradient-to-br from-purple/10 to-indigo/10 border-purple/10 text-purple'
                )}>
                  {item.photo_url ? (
                    <img src={item.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    item.prenom?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>
                <div className={twMerge(
                  'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 z-20',
                  activeContact?.id === item.id
                    ? 'border-purple bg-emerald'
                    : 'border-white bg-emerald shadow-sm'
                )} />
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0 relative z-10">
                {/* Name + timestamp */}
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-black text-sm truncate leading-tight pr-1">
                    {item.prenom} {item.nom}
                  </h4>
                  {item.lastMessageAt && (
                    <span className={twMerge(
                      'text-[9px] font-bold flex-shrink-0',
                      activeContact?.id === item.id ? 'text-white/60' : 'text-slate-400'
                    )}>
                      {formatSidebarTime(item.lastMessageAt)}
                    </span>
                  )}
                </div>

                {/* Last message preview OR role badge + unread count */}
                <div className="flex items-center justify-between gap-1">
                  {item.lastMessage ? (
                    <p className={twMerge(
                      'text-[11px] font-medium truncate flex-1',
                      activeContact?.id === item.id ? 'text-white/75' : 'text-slate-400'
                    )}>
                      {item.lastMessage}
                    </p>
                  ) : (
                    <p className={twMerge(
                      'text-[10px] font-bold uppercase tracking-wider',
                      activeContact?.id === item.id ? 'text-white/70' : 'text-slate-400'
                    )}>
                      {t(`roles.${item.role}`) || item.role}
                    </p>
                  )}

                  {/* Unread badge */}
                  {item.unread_count > 0 && activeContact?.id !== item.id && (
                    <span className="flex-shrink-0 min-w-[20px] h-5 px-1 bg-purple text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none">
                      {item.unread_count > 99 ? '99+' : item.unread_count}
                    </span>
                  )}
                </div>
              </div>

              {/* Active gradient overlay */}
              {activeContact?.id === item.id && (
                <motion.div
                  layoutId="active-contact-glow"
                  className="absolute inset-0 bg-gradient-to-br from-purple to-indigo rounded-[1.5rem] -z-0"
                />
              )}
            </motion.button>
          ))}

          {/* ── Empty state ── */}
          {!sidebarError && filteredItems.length === 0 && (
            <div className="text-center py-20 opacity-30">
              <MessageSquare size={32} className="mx-auto mb-3" />
              <p className="text-xs font-black uppercase tracking-widest">
                {searchTerm
                  ? 'Aucun résultat'
                  : t('chat.no_contacts') || 'Aucune conversation'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════ MAIN CHAT ════════════════════════════════════ */}
      {/* On mobile: show main chat only when a contact is active */}
      <div className={twMerge(
        "flex flex-col glass-card border border-white/60 overflow-hidden relative shadow-premium",
        activeContact
          ? "flex flex-1 w-full"
          : "hidden md:flex flex-1"
      )}>
        <AnimatePresence mode="wait">

          {/* ── No contact selected ── */}
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
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                  {t('chat.select_conv')}
                </h3>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                  Selectionnez un contact pour commencer
                </p>
              </div>
            </motion.div>

          ) : (

            /* ── Active conversation ── */
            <motion.div
              key={activeContact.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col h-full"
            >
              {/* Chat Header */}
              <div className="p-4 sm:p-6 border-b border-white/60 flex items-center justify-between bg-white/40 backdrop-blur-xl z-20">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Back button on mobile */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveContact(null)}
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-soft border border-slate-100 text-slate-500 hover:text-purple transition-all flex-shrink-0"
                  >
                    <ChevronLeft size={20} strokeWidth={2.5} />
                  </motion.button>
                  <div className="relative">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-purple to-indigo rounded-[1.25rem] flex items-center justify-center text-white font-black text-xl overflow-hidden shadow-glow">
                      {activeContact.photo_url ? (
                        <img src={activeContact.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        activeContact.prenom?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald rounded-full border-4 border-white shadow-sm" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base sm:text-lg leading-tight flex items-center gap-2">
                      {activeContact.prenom} {activeContact.nom}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-purple uppercase tracking-[0.15em] px-2 py-0.5 bg-purple/5 rounded-lg border border-purple/10">
                        {t(`roles.${activeContact.role}`) || activeContact.role}
                      </span>
                      <span className="hidden sm:flex text-[10px] font-bold text-emerald uppercase tracking-widest items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                        En ligne
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="w-11 h-11 flex items-center justify-center bg-white shadow-soft rounded-xl text-slate-400 hover:text-purple hover:border-purple/30 border border-transparent transition-all">
                    <Phone size={20} strokeWidth={2.5} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="w-11 h-11 flex items-center justify-center bg-white shadow-soft rounded-xl text-slate-400 hover:text-purple hover:border-purple/30 border border-transparent transition-all">
                    <Video size={20} strokeWidth={2.5} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }}
                    className="w-11 h-11 flex items-center justify-center bg-white shadow-soft rounded-xl text-slate-400 hover:text-slate-700 transition-all border border-transparent">
                    <MoreVertical size={20} strokeWidth={2.5} />
                  </motion.button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar space-y-6 sm:space-y-8 bg-gradient-to-b from-transparent to-purple/[0.02]">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-purple" size={32} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Chargement...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <span className="px-5 py-2 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] shadow-soft">
                        {t('chat.history')}
                      </span>
                    </div>

                    {/* Empty conversation */}
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-4 opacity-40">
                        <MessageSquare size={40} className="text-slate-300" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Envoyez le premier message
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {messages.map((msg) => {
                          const msgId = msg.id || msg._id;
                          // Explicit Number cast — handles both string and number IDs
                          const isMe = Number(msg.expediteur_id ?? msg.senderId) === Number(me?.id);
                          const text = msg.contenu ?? msg.content ?? msg.message ?? '';
                          const createdAt = msg.created_at ?? msg.createdAt;
                          const seen = msg.lu ?? msg.seen;

                          return (
                            <motion.div
                              key={msgId}
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ delay: 0.04 }}
                              className={`flex group ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[70%] relative flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={twMerge(
                                  'p-4 px-6 rounded-[1.75rem] shadow-sm relative transition-all group-hover:shadow-md',
                                  isMe
                                    ? 'bg-gradient-to-br from-purple to-indigo text-white rounded-tr-none'
                                    : 'bg-white/70 backdrop-blur-md text-slate-700 border border-white/80 rounded-tl-none'
                                )}>
                                  <p className="text-[15px] font-medium leading-relaxed tracking-tight">
                                    {text}
                                  </p>

                                  <div className={twMerge(
                                    'flex items-center gap-1.5 mt-2 text-[9px] font-black uppercase tracking-widest',
                                    isMe ? 'text-white/60' : 'text-slate-400'
                                  )}>
                                    {createdAt && new Date(createdAt).toLocaleTimeString(
                                      i18n.language === 'ar' ? 'ar-MA' : 'fr-MA',
                                      { hour: '2-digit', minute: '2-digit' }
                                    )}
                                    {isMe && (
                                      <CheckCheck size={12} className={seen ? 'text-emerald-300' : 'text-white/30'} />
                                    )}
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
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input area */}
              <div className="p-3 sm:p-6 bg-white/40 backdrop-blur-xl border-t border-white/60 relative z-20">
                {/* Inline send error */}
                {sendError && (
                  <div className="flex items-center gap-2 px-4 py-2 mb-3 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-bold">
                    <AlertCircle size={14} />
                    {sendError}
                  </div>
                )}
                <form
                  onSubmit={handleSendMessage}
                  className="bg-white p-2 ps-4 rounded-[2rem] flex items-center gap-3 border border-slate-100 shadow-premium focus-within:ring-4 focus-within:ring-purple/10 transition-all"
                >
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
                    placeholder={t('chat.placeholder') || 'Écrire un message...'}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium p-2 placeholder:text-slate-300"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (sendError) setSendError(null);
                    }}
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
