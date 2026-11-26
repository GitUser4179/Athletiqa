import { useEffect, useState } from "react";
import { ChatList } from "../../../widgets/chat-list";
import { MessageBubble } from "../../../enteties/message";
import { MessageInput } from "../../send-message";
import {
  startConnection,
  onReceiveMessage,
  offReceiveMessage,
  getConnection,
} from "../../send-message";
import {
  startNotificationConnection,
  onReceiveNotification,
  offReceiveNotification,
} from "../../../enteties/notifications";
import { getMessage } from "../../../enteties/message/api/messageApi";
import { Button } from "../../../shared/ui/button";
import { useMessageStore } from "../../../shared/model/useMessageStore";
import { useAuth } from "../../../shared/lib/useAuth";
import { Avatar } from "../../../shared/ui/avatar";
import { mapNotificationToDisplay } from "../../../enteties/notifications";
import { NotificationItem } from "../../../enteties/notifications";
import { getNotifications } from "../../../enteties/notifications";
import AlertOctagon from "../../../shared/assets/alert-octagon.svg?react";
import ChevronLeftIcon from "../../../shared/assets/chevron-left.svg?react";
import { useTranslation } from "react-i18next";

export function MessageModal() {
  const { isOpen, closeChat, pendingConversation, clearPendingConversation } = useMessageStore();
  const [activeTab, setActiveTab] = useState("chatt");
  const [selectedUser, setSelectedUser] = useState(null);

  // Opened via "Kontakta" on a profile: jump straight into that conversation
  useEffect(() => {
    if (!isOpen || !pendingConversation) return;
    setActiveTab("chatt");
    setSelectedUser(pendingConversation);
    clearPendingConversation();
  }, [isOpen, pendingConversation, clearPendingConversation]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [chatCount, setChatCount] = useState(0);
  const { t } = useTranslation();

  // Load User Info
  const { currentUserId } = useAuth();

  const unreadNotificationsCount = notifications.filter(
    (n) => !(n.isRead || n.IsRead)
  ).length;

  useEffect(() => {
    if (!isOpen || !currentUserId) return;
      getNotifications(currentUserId)
        .then(setNotifications)
        .catch(console.error);
      }, [isOpen, currentUserId]);

  // Join/Leave SignalR Conversation Group
  useEffect(() => {
    if (!selectedUser || !isOpen) return;

    let isActive = true;
    const conversationId = selectedUser.conversationId;

    async function joinConversation() {
      const conn = await startConnection();
      if (!isActive) return;
      await conn.invoke("JoinConversation", conversationId);
    }

    joinConversation().catch(console.error);

    return () => {
      isActive = false;
      const conn = getConnection();
      if (conn && conn.state === "Connected") {
        conn.invoke("LeaveConversation", conversationId).catch(console.error);
      }
    };
  }, [selectedUser, isOpen]);

  // Global SignalR Listener
  useEffect(() => {
    if (!isOpen) return;

    startConnection();

    function handleIncomingMessage(message) {
      // Only update state if message belongs to current view
      const incomingId = message.conversationId || message.ConversationId;

      if (selectedUser && incomingId === selectedUser.conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    }

    onReceiveMessage(handleIncomingMessage);
    return () => offReceiveMessage(handleIncomingMessage);
  }, [isOpen, selectedUser]);

  // Global SignalR Notifications Listener
  useEffect(() => {
    if (!isOpen) return;

  startNotificationConnection().catch(console.error);

  function handleIncomingNotification(notif) {
    setNotifications((prev) => [notif, ...prev]);
  }

  onReceiveNotification(handleIncomingNotification);
  
  return () => {
    offReceiveNotification(handleIncomingNotification);
  };
  }, [isOpen]);

  // Fetch history
  useEffect(() => {
    if (!selectedUser || !isOpen) return;
    getMessage(selectedUser.conversationId).then(setMessages);
  }, [selectedUser, isOpen]);

  function handleBack() {
    setSelectedUser(null);
    setMessages([]);
  }
// explain prev:
// 
  function handleSelectConversation(user) {
    setSelectedUser(user);
    setChatCount((prev) => Math.max(0, prev - 1));
  }

  // If the modal isn't open, don't render anything
  if (!isOpen) return null;

  return (
    <aside 
      className="fixed inset-0 z-[999] bg-black/20 flex justify-end items-start p-4 sm:p-6" 
      onClick={closeChat}
    >
      <div 
        className="w-[25rem] h-[calc(100vh-3rem)] max-h-[46.875rem] pointer-events-auto flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        <section className="flex flex-col h-full bg-bg rounded-3xl border border-gray-100 overflow-hidden">
          {/* Header Area */}
          <header className="p-4 bg-bg border-b border-gray-100 flex flex-col gap-2 shrink-0 relative">
            <div className="flex justify-between items-center min-h-[2rem]">
              {activeTab === "chatt" && selectedUser ? (
              <Button 
                variant="none" 
                size="icon"
                onClick={handleBack} 
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                variant="none" 
                size="icon"
                onClick={closeChat} 
                className="text-gray-500 hover:text-gray-700 text-xl font-light p-1"
              >
                ✕
              </Button>
            )}

            {activeTab === "chatt" && selectedUser && (
              <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                <Avatar 
                  src={selectedUser.avatarUrl} 
                  alt={selectedUser.name} 
                  className="w-5 h-5" 
                />
                <span className="font-heading font-semibold text-xs text-gray-700">
                  {selectedUser.name}
                </span>
              </div>
              )}
              {activeTab === "chatt" && selectedUser ? (
              <button 
                  className="text-gray-500 hover:text-error text-sm transition-colors" 
                  title={t("Report user")}
                >
                  <AlertOctagon className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-6 h-6" />
              )}
            </div>
          {!(activeTab === "chatt" && selectedUser) && (
          <nav className="flex justify-center border-b border-gray-100 mt-1">
            <button 
              onClick={() => { setActiveTab('aviseringar'); setSelectedUser(null); }}
              className={`flex items-center gap-2 pb-3 px-4 font-heading font-medium text-sm transition-all border-b-2 -mb-[0.125rem] ${
              activeTab === 'aviseringar' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{t("Aviseringar")}</span>
              {unreadNotificationsCount > 0 && (
                <span className="bg-primary text-white text-[0.625rem] font-bold px-1.5 py-0.5 rounded-full min-w-[1rem] text-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('chatt')}
              className={`flex items-center gap-2 pb-3 px-4 font-heading font-medium text-sm transition-all border-b-2 -mb-[0.125rem] ${
              activeTab === 'chatt' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{t("Chatt")}</span>
                {chatCount > 0 && (
                  <span className="bg-primary text-white text-[0.625rem] font-bold px-1.5 py-0.5 rounded-full min-w-[1rem] text-center">
                    {chatCount}
                  </span>
                )}
            </button>
          </nav>
            )}
        </header>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-bg text-gray-700 flex flex-col min-h-0">
          {activeTab === "aviseringar" && (
            <article className="flex flex-col division-y divide-gray-100">
              {notifications.map((rawNotif) => {
                const mappedNotif = mapNotificationToDisplay(rawNotif);
                return (
                  <NotificationItem 
                    key={mappedNotif.id}
                    notif={mappedNotif} 
                    setNotifications={setNotifications}
                  />
                );
              })}
              {notifications.length === 0 && (
                <p className="text-center text-sm text-gray-500 mt-8">{t("Inga nya aviseringar.")}</p>
              )}
            </article>
          )}

          {activeTab === "chatt" && !selectedUser && (
            <div className="flex-1 overflow-y-auto">
              <ChatList onSelectUser={handleSelectConversation} onCountChange={setChatCount} />
            </div>
          )}

          {activeTab === "chatt" && selectedUser && (
            <div className="flex flex-col h-full min-h-0 bg-bg w-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-bg w-full flex flex-col">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.messageId}
                    message={msg}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 bg-bg shrink-0 flex flex-col gap-3 w-full">
                
              <footer className="w-full">
                <MessageInput conversationId={selectedUser.conversationId} />
              </footer>
            </div>
          </div>
          )}
        </div>
      </section>
    </div>
  </aside>
  );
}