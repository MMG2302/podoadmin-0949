import { useState, useMemo } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth, getAllUsers } from "../contexts/auth-context";
import {
  getUserCredits,
  addNotification,
  addSentMessage,
  getSentMessages,
  getSentMessageReadStatus,
  SentMessage,
} from "../lib/storage";

type RecipientMode = "all" | "specific" | "single";
type ViewMode = "compose" | "sent";

const MessagesPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const credits = getUserCredits(user?.id || "");
  const allUsers = getAllUsers().filter(u => u.id !== user?.id); // Exclude current user

  const [viewMode, setViewMode] = useState<ViewMode>("compose");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [singleUser, setSingleUser] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [sentMessages, setSentMessages] = useState<SentMessage[]>(getSentMessages());

  // Refresh sent messages
  const refreshSentMessages = () => {
    setSentMessages(getSentMessages());
  };

  // Get recipients based on mode
  const getRecipients = (): string[] => {
    switch (recipientMode) {
      case "all":
        return allUsers.map(u => u.id);
      case "specific":
        return Array.from(selectedUsers);
      case "single":
        return singleUser ? [singleUser] : [];
    }
  };

  const recipientCount = getRecipients().length;

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSend = () => {
    setError("");
    setSuccessMessage("");

    // Validation
    if (!subject.trim()) {
      setError(t.messaging.subjectRequired);
      return;
    }
    if (!messageBody.trim()) {
      setError(t.messaging.messageRequired);
      return;
    }
    const recipients = getRecipients();
    if (recipients.length === 0) {
      setError(t.messaging.recipientRequired);
      return;
    }

    setIsSending(true);

    // Simulate sending delay
    setTimeout(() => {
      // Save sent message
      const sentMessage = addSentMessage({
        senderId: user?.id || "",
        senderName: user?.name || "",
        subject: subject.trim(),
        body: messageBody.trim(),
        recipientIds: recipients,
        recipientType: recipientMode,
      });

      // Create notification for each recipient
      recipients.forEach(recipientId => {
        addNotification({
          userId: recipientId,
          type: "admin_message",
          title: subject.trim(),
          message: messageBody.trim(),
          metadata: {
            senderId: user?.id,
            senderName: user?.name,
            messageId: sentMessage.id,
            sentAt: sentMessage.sentAt,
            subject: subject.trim(),
          },
        });
      });

      // Reset form
      setSubject("");
      setMessageBody("");
      setSelectedUsers(new Set());
      setSingleUser("");
      setRecipientMode("all");
      setShowPreview(false);
      setIsSending(false);
      setSuccessMessage(t.messaging.messageSent);
      refreshSentMessages();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 500);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserName = (userId: string) => {
    const u = allUsers.find(u => u.id === userId);
    return u?.name || userId;
  };

  return (
    <MainLayout title={t.messaging.title} credits={credits}>
      <div className="space-y-6">
        {/* Header with tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#1a1a1a]">{t.messaging.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {viewMode === "compose" ? t.messaging.newMessage : t.messaging.sentMessages}
            </p>
          </div>
          
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("compose")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "compose"
                  ? "bg-white text-[#1a1a1a] shadow-sm"
                  : "text-gray-600 hover:text-[#1a1a1a]"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t.messaging.newMessage}
              </div>
            </button>
            <button
              onClick={() => { setViewMode("sent"); refreshSentMessages(); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "sent"
                  ? "bg-white text-[#1a1a1a] shadow-sm"
                  : "text-gray-600 hover:text-[#1a1a1a]"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {t.messaging.sentMessages}
              </div>
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {viewMode === "compose" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compose Form */}
            <div className="space-y-6">
              {/* Recipient Selection */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-[#1a1a1a] mb-4">{t.messaging.recipients}</h3>
                
                {/* Recipient Mode Selection */}
                <div className="space-y-3 mb-4">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      name="recipientMode"
                      checked={recipientMode === "all"}
                      onChange={() => setRecipientMode("all")}
                      className="w-4 h-4 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                    />
                    <div>
                      <span className="font-medium text-sm">{t.messaging.allUsers}</span>
                      <p className="text-xs text-gray-500">{allUsers.length} {t.messaging.recipientsCount}</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      name="recipientMode"
                      checked={recipientMode === "specific"}
                      onChange={() => setRecipientMode("specific")}
                      className="w-4 h-4 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                    />
                    <div>
                      <span className="font-medium text-sm">{t.messaging.selectSpecific}</span>
                      {recipientMode === "specific" && selectedUsers.size > 0 && (
                        <p className="text-xs text-gray-500">{selectedUsers.size} {t.messaging.recipientsCount}</p>
                      )}
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      name="recipientMode"
                      checked={recipientMode === "single"}
                      onChange={() => setRecipientMode("single")}
                      className="w-4 h-4 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                    />
                    <span className="font-medium text-sm">{t.messaging.singleUser}</span>
                  </label>
                </div>

                {/* User Selection for Specific/Single modes */}
                {recipientMode === "specific" && (
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <p className="text-sm text-gray-600 mb-3">{t.messaging.selectRecipients}:</p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {allUsers.map(u => (
                        <label
                          key={u.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(u.id)}
                            onChange={() => toggleUserSelection(u.id)}
                            className="w-4 h-4 rounded text-[#1a1a1a] focus:ring-[#1a1a1a]"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{u.name}</span>
                            <span className="text-xs text-gray-500 ml-2">{u.email}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            u.role === "clinic_admin" ? "bg-blue-100 text-blue-700" :
                            u.role === "admin" ? "bg-orange-100 text-orange-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {u.role === "clinic_admin" ? t.roles.clinicAdmin :
                             u.role === "admin" ? t.roles.admin :
                             t.roles.podiatrist}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {recipientMode === "single" && (
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <select
                      value={singleUser}
                      onChange={(e) => setSingleUser(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none"
                    >
                      <option value="">{t.messaging.selectRecipients}</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Message Composition */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-[#1a1a1a] mb-4">{t.messaging.messageBody}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.messaging.subject}
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t.messaging.subjectPlaceholder}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.messaging.messageBody}
                    </label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder={t.messaging.messagePlaceholder}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-[#1a1a1a] rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {t.messaging.preview}
                  </div>
                </button>
                
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    {isSending ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t.messaging.sending}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        {t.messaging.send} ({recipientCount} {t.messaging.recipientsCount})
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Preview Panel */}
            <div className={`${showPreview ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-4">
                <h3 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {t.messaging.preview}
                </h3>
                
                {/* Preview Notification Card */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#1a1a1a]">
                        {subject || t.messaging.subjectPlaceholder}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                        {messageBody || t.messaging.messagePlaceholder}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                        <span>{t.messaging.fromAdmin}</span>
                        <span>•</span>
                        <span>{t.notifications.justNow}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipients Summary */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t.messaging.recipients}:</span>{" "}
                    {recipientMode === "all" ? (
                      <span>{t.messaging.allUsers} ({allUsers.length})</span>
                    ) : recipientMode === "specific" ? (
                      <span>{selectedUsers.size} {t.messaging.recipientsCount}</span>
                    ) : singleUser ? (
                      <span>{getUserName(singleUser)}</span>
                    ) : (
                      <span className="text-gray-400">{t.messaging.selectRecipients}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Sent Messages History */
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {sentMessages.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">{t.messaging.noMessages}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sentMessages.map((msg) => {
                  const readStatus = getSentMessageReadStatus(msg.id);
                  return (
                    <div key={msg.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-medium text-[#1a1a1a]">{msg.subject}</h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{msg.body}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-gray-400">{formatDate(msg.sentAt)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {msg.recipientIds.length} {t.messaging.recipientsCount}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {readStatus.read} {t.messaging.readCount}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {readStatus.unread} {t.messaging.unreadCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MessagesPage;
