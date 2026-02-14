import { useState, useEffect } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { api } from "../lib/api-client";

type Conversation = {
  id: string;
  userId: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userName?: string | null;
  userEmail?: string | null;
};

type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  isFromSupport: boolean;
};

const SupportPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<{
    id: string;
    subject: string;
    status: string;
    userId: string;
    userName?: string | null;
    userEmail?: string | null;
    messages: Message[];
  } | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const loadConversations = async () => {
    const r = await api.get<{ success?: boolean; conversations?: Conversation[] }>("/support/conversations");
    if (r.success && Array.isArray(r.data?.conversations)) setConversations(r.data.conversations);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const openConversation = async (c: Conversation) => {
    const r = await api.get<{
      success?: boolean;
      conversation?: { id: string; subject: string; status: string; userId: string };
      messages?: Message[];
    }>(`/support/conversations/${c.id}`);
    if (r.success && r.data?.conversation) {
      setSelected({
        ...r.data.conversation,
        userName: c.userName,
        userEmail: c.userEmail,
        messages: r.data.messages || [],
      });
      await api.patch(`/support/conversations/${c.id}`, { markRead: true });
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    const r = await api.post<{ success?: boolean; message?: Message }>(
      `/support/conversations/${selected.id}/messages`,
      { body: reply.trim() }
    );
    setSending(false);
    if (r.success && r.data?.message) {
      setReply("");
      setSelected((prev) =>
        prev ? { ...prev, messages: [...prev.messages, r.data!.message!] } : null
      );
      loadConversations();
    }
  };

  const closeConversation = async () => {
    if (!selected) return;
    await api.patch(`/support/conversations/${selected.id}`, { status: "closed" });
    setSelected((prev) => (prev ? { ...prev, status: "closed" } : null));
    loadConversations();
  };

  const reopenConversation = async () => {
    if (!selected) return;
    await api.patch(`/support/conversations/${selected.id}`, { status: "open" });
    setSelected((prev) => (prev ? { ...prev, status: "open" } : null));
    loadConversations();
  };

  return (
    <MainLayout title={t.support.title}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1a1a1a]">{t.support.contactPodoAdmin}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Mensajes de usuarios que contactan a soporte. Responde directamente desde aquí.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de conversaciones */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-medium text-[#1a1a1a]">Conversaciones</h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No hay conversaciones</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openConversation(c)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selected?.id === c.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium text-[#1a1a1a] truncate">{c.subject}</span>
                        <span
                          className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
                            c.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {c.status === "open" ? t.support.open : t.support.closed}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {c.userName || c.userEmail || c.userId}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(c.updatedAt).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detalle y respuesta */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {selected ? (
              <>
                <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-[#1a1a1a]">{selected.subject}</h3>
                    <p className="text-sm text-gray-500">
                      {selected.userName} {selected.userEmail && `(${selected.userEmail})`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selected.status === "open" ? (
                      <button
                        onClick={closeConversation}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                      >
                        {t.support.closeConversation}
                      </button>
                    ) : (
                      <button
                        onClick={reopenConversation}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        {t.support.reopenConversation}
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 max-h-[300px] overflow-y-auto form-modal-scroll space-y-3">
                  {selected.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg ${
                        m.isFromSupport ? "bg-blue-50 ml-4" : "bg-gray-50 mr-4"
                      }`}
                    >
                      <p className="text-xs text-gray-500 mb-1">
                        {m.isFromSupport ? (user?.name || "Soporte") : (selected.userName || selected.userEmail)} ·{" "}
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-[#1a1a1a] whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))}
                </div>
                {selected.status === "open" && (
                  <div className="p-4 border-t border-gray-100 flex gap-2">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder={t.support.replyPlaceholder}
                      rows={3}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] resize-none"
                    />
                    <button
                      onClick={sendReply}
                      disabled={sending || !reply.trim()}
                      className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] disabled:opacity-50 self-end"
                    >
                      {sending ? "..." : t.support.reply}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-gray-500">
                Selecciona una conversación para ver los mensajes y responder.
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SupportPage;
