import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
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

type RegistrationList = {
  id: string;
  name: string;
  createdBy: string;
  status: "draft" | "pending" | "approved" | "rejected";
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  creatorName?: string | null;
};

type RegistrationEntry = {
  id: string;
  name: string;
  email: string;
  role: string;
  clinicId?: string | null;
  clinicMode?: string | null;
  podiatristLimit?: number | null;
  notes?: string | null;
  paid?: boolean;
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const SupportPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isSuperAdmin, isAdmin } = usePermissions();
  const canCreateLists = isSuperAdmin || isAdmin;

  const [activeTab, setActiveTab] = useState<"messages" | "lists">("messages");

  // Mensajes
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

  // Listas de registro
  const [lists, setLists] = useState<RegistrationList[]>([]);
  const [selectedList, setSelectedList] = useState<{
    list: RegistrationList;
    entries: RegistrationEntry[];
  } | null>(null);
  const [listName, setListName] = useState("");
  const [newEntry, setNewEntry] = useState({ name: "", email: "", role: "podiatrist" as string, podiatristLimit: "" });
  const [listLoading, setListLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    const r = await api.get<{ success?: boolean; conversations?: Conversation[] }>("/support/conversations");
    if (r.success && Array.isArray(r.data?.conversations)) setConversations(r.data.conversations);
  }, []);

  const loadLists = useCallback(async () => {
    const r = await api.get<{ success?: boolean; lists?: RegistrationList[] }>("/registration-lists");
    if (r.success && Array.isArray(r.data?.lists)) setLists(r.data.lists);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (canCreateLists && activeTab === "lists") loadLists();
  }, [canCreateLists, activeTab, loadLists]);

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

  // Listas
  const createList = async () => {
    setListLoading(true);
    try {
      const r = await api.post<{ success?: boolean; list?: { id: string; name: string } }>("/registration-lists", {
        name: listName.trim() || "Nueva lista",
      });
      if (r.success && r.data?.list) {
        setListName("");
        loadLists();
        await openList(r.data.list.id);
      } else {
        alert(r.error || (r.data as { message?: string })?.message || "Error al crear la lista");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al crear la lista");
    } finally {
      setListLoading(false);
    }
  };

  const openList = async (id: string) => {
    const r = await api.get<{
      success?: boolean;
      list?: RegistrationList;
      entries?: RegistrationEntry[];
    }>(`/registration-lists/${id}`);
    if (r.success && r.data?.list) {
      setSelectedList({
        list: r.data.list,
        entries: r.data.entries || [],
      });
      setListName(r.data.list.name);
    }
  };

  const updateListName = async () => {
    if (!selectedList || selectedList.list.status !== "draft") return;
    await api.patch(`/registration-lists/${selectedList.list.id}`, { name: listName.trim() });
    setSelectedList((prev) =>
      prev ? { ...prev, list: { ...prev.list, name: listName.trim() } } : null
    );
    loadLists();
  };

  const addEntry = async () => {
    if (
      !selectedList ||
      selectedList.list.status !== "draft" ||
      !newEntry.name.trim() ||
      !newEntry.email.trim()
    )
      return;

    if (!isValidEmail(newEntry.email)) {
      alert("Introduce un correo electrónico válido.");
      return;
    }
    const payload: Record<string, unknown> = { name: newEntry.name, email: newEntry.email, role: newEntry.role };
    if (newEntry.role === "clinic_admin" && newEntry.podiatristLimit) {
      const n = parseInt(newEntry.podiatristLimit, 10);
      if (!Number.isNaN(n) && n >= 1) payload.podiatristLimit = n;
    }
    const r = await api.post<{ success?: boolean; entry?: RegistrationEntry }>(
      `/registration-lists/${selectedList.list.id}/entries`,
      payload
    );
    if (r.success && r.data?.entry) {
      setSelectedList((prev) =>
        prev ? { ...prev, entries: [...prev.entries, r.data!.entry!] } : null
      );
      setNewEntry({ name: "", email: "", role: "podiatrist", podiatristLimit: "" });
    }
  };

  const removeEntry = async (entryId: string) => {
    if (!selectedList || selectedList.list.status !== "draft") return;
    await api.delete(`/registration-lists/${selectedList.list.id}/entries/${entryId}`);
    setSelectedList((prev) =>
      prev ? { ...prev, entries: prev.entries.filter((e) => e.id !== entryId) } : null
    );
  };

  const deleteList = async (listId: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta lista?")) return;
    await api.delete(`/registration-lists/${listId}`);
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setSelectedList((prev) => (prev && prev.list.id === listId ? null : prev));
  };

  const submitList = async () => {
    if (!selectedList || selectedList.list.status !== "draft" || selectedList.entries.length === 0) return;
    await api.post(`/registration-lists/${selectedList.list.id}/submit`);
    setSelectedList(null);
    loadLists();
  };

  const downloadCsv = async (listId: string, entryIds?: string[]) => {
    try {
      const res = await fetch(`/api/registration-lists/${listId}/csv`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryIds }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lista_${listId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const statusLabel = (s: string) =>
    s === "draft" ? "Borrador" : s === "pending" ? "Pendiente" : s === "approved" ? "Aprobada" : "Rechazada";

  return (
    <MainLayout title={t.support.title}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1a1a1a] dark:text-white">{t.support.contactPodoAdmin}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Mensajes de usuarios y listas de registro para aprobación.
          </p>
        </div>

        {canCreateLists && (
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("messages")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "messages" ? "bg-white dark:bg-gray-700 text-[#1a1a1a] dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-300 hover:text-[#1a1a1a] dark:hover:text-white"
              }`}
            >
              Mensajes
            </button>
            <button
              onClick={() => setActiveTab("lists")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "lists" ? "bg-white dark:bg-gray-700 text-[#1a1a1a] dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-300 hover:text-[#1a1a1a] dark:hover:text-white"
              }`}
            >
              Crear listas
            </button>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-medium text-[#1a1a1a] dark:text-white">Conversaciones</h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">No hay conversaciones</div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {conversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => openConversation(c)}
                        className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          selected?.id === c.id ? "bg-blue-50 dark:bg-gray-800" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-medium text-[#1a1a1a] dark:text-white truncate">{c.subject}</span>
                          <span
                            className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
                              c.status === "open" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {c.status === "open" ? t.support.open : t.support.closed}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {c.userName || c.userEmail || c.userId}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {new Date(c.updatedAt).toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {selected ? (
                <>
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-[#1a1a1a] dark:text-white">{selected.subject}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selected.userName} {selected.userEmail && `(${selected.userEmail})`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {selected.status === "open" ? (
                        <button
                          onClick={closeConversation}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
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
                          m.isFromSupport ? "bg-blue-50 dark:bg-blue-900/30 ml-4" : "bg-gray-50 dark:bg-gray-800 mr-4"
                        }`}
                      >
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {m.isFromSupport ? (user?.name || "Soporte") : (selected.userName || selected.userEmail)} ·{" "}
                          {new Date(m.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-[#1a1a1a] dark:text-white whitespace-pre-wrap">{m.body}</p>
                      </div>
                    ))}
                  </div>
                  {selected.status === "open" && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder={t.support.replyPlaceholder}
                        rows={3}
                        className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#1a1a1a] dark:text-white focus:ring-2 focus:ring-[#1a1a1a] dark:focus:ring-gray-500 resize-none"
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
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  Selecciona una conversación para ver los mensajes y responder.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "lists" && canCreateLists && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-medium text-[#1a1a1a] dark:text-white">Listas de registro</h3>
                <button
                  type="button"
                  onClick={() => void createList()}
                  disabled={listLoading}
                  className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] disabled:opacity-50"
                >
                  {listLoading ? "..." : "Nueva lista"}
                </button>
              </div>
              <div className="p-4 border-b border-gray-50 dark:border-gray-800">
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="Nombre de la nueva lista..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#1a1a1a] dark:text-white text-sm"
                  onKeyDown={(e) => e.key === "Enter" && createList()}
                />
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {lists.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Crea listas de registros (cursos, eventos) y envíalas para que el administrador las apruebe e importe.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {lists.map((l) => (
                      <div
                        key={l.id}
                        className={`flex items-start justify-between gap-2 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          selectedList?.list.id === l.id ? "bg-blue-50 dark:bg-gray-800" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => openList(l.id)}
                          className="text-left flex-1"
                        >
                          <span className="font-medium text-[#1a1a1a] dark:text-white truncate block">{l.name}</span>
                          <span
                            className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                              l.status === "draft"
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                : l.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : l.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {statusLabel(l.status)}
                          </span>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(l.updatedAt).toLocaleString()}
                            {l.creatorName && isSuperAdmin ? ` · ${l.creatorName}` : ""}
                          </p>
                        </button>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void deleteList(l.id);
                            }}
                            className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {selectedList ? (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {selectedList.list.status === "draft" ? (
                        <input
                          type="text"
                          value={listName}
                          onChange={(e) => setListName(e.target.value)}
                          onBlur={updateListName}
                          className="w-full font-medium text-[#1a1a1a] dark:text-white border-b border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-[#1a1a1a] dark:focus:border-gray-400 focus:outline-none px-1 py-0.5 bg-transparent"
                        />
                      ) : (
                        <h3 className="font-medium text-[#1a1a1a] dark:text-white">{selectedList.list.name}</h3>
                      )}
                      <span
                        className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                          selectedList.list.status === "draft"
                            ? "bg-gray-100 text-gray-600"
                            : selectedList.list.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : selectedList.list.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {statusLabel(selectedList.list.status)}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          const paidIds = selectedList.entries.filter((e) => e.paid).map((e) => e.id);
                          if (paidIds.length === 0) {
                            alert("Marca al menos un registro como pagado para exportar.");
                            return;
                          }
                          void downloadCsv(selectedList.list.id, paidIds);
                        }}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                      >
                        Descargar CSV
                      </button>
                      {selectedList.list.status === "draft" && (
                        <button
                          onClick={submitList}
                          disabled={selectedList.entries.length === 0}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                        >
                          Enviar para aprobación
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedList.list.status === "draft" && (
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Añadir registro</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 flex-wrap">
                          <input
                            type="text"
                            placeholder="Nombre"
                            value={newEntry.name}
                            onChange={(e) => setNewEntry((p) => ({ ...p, name: e.target.value }))}
                            className="flex-1 min-w-[100px] px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#1a1a1a] dark:text-white text-sm"
                          />
                          <input
                            type="email"
                            inputMode="email"
                            placeholder="Email"
                            value={newEntry.email}
                            onChange={(e) => setNewEntry((p) => ({ ...p, email: e.target.value }))}
                            className="flex-1 min-w-[120px] px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#1a1a1a] dark:text-white text-sm"
                          />
                          <select
                            value={newEntry.role}
                            onChange={(e) => setNewEntry((p) => ({ ...p, role: e.target.value }))}
                            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#1a1a1a] dark:text-white text-sm"
                          >
                            <option value="podiatrist">Podólogo independiente</option>
                            <option value="clinic_admin">Admin de clínica</option>
                          </select>
                          {newEntry.role === "clinic_admin" && (
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Límite podólogos:</label>
                              <input
                                type="number"
                                min="1"
                                max="999"
                                placeholder="Ej: 5"
                                value={newEntry.podiatristLimit}
                                onChange={(e) => setNewEntry((p) => ({ ...p, podiatristLimit: e.target.value }))}
                                className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#1a1a1a] dark:text-white text-sm"
                              />
                            </div>
                          )}
                          <button
                            onClick={addEntry}
                            disabled={!newEntry.name.trim() || !newEntry.email.trim()}
                            className="px-3 py-2 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] disabled:opacity-50"
                          >
                            Añadir
                          </button>
                        </div>
                        {newEntry.role === "clinic_admin" && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Los podólogos de la clínica estarán limitados a este número. Recepcionistas no cuentan en el límite.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 max-h-[300px]">
                    {selectedList.entries.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No hay registros en esta lista.</p>
                    ) : (
                      (() => {
                        const isDraft = selectedList.list.status === "draft";
                        const pending = selectedList.entries.filter((e) => !e.paid);
                        const paid = selectedList.entries.filter((e) => e.paid);

                        const renderRow = (e: RegistrationEntry) => (
                          <div
                            key={e.id}
                            className="flex justify-between items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={
                                  !isDraft
                                    ? undefined
                                    : () =>
                                        setSelectedList((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                entries: prev.entries.map((entry) =>
                                                  entry.id === e.id ? { ...entry, paid: !entry.paid } : entry
                                                ),
                                              }
                                            : prev
                                        )
                                }
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                                  e.paid
                                    ? "bg-green-100 text-green-700 border-green-300"
                                    : "bg-yellow-50 text-yellow-700 border-yellow-300"
                                } ${isDraft ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                              >
                                {e.paid ? "Pagado" : "No pagado"}
                              </button>
                              <div>
                                <p className="font-medium text-sm text-[#1a1a1a] dark:text-white">{e.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {e.email} · {e.role === "clinic_admin" ? "Admin de clínica" : "Podólogo independiente"}
                                  {e.role === "clinic_admin" && e.podiatristLimit != null && (
                                    <> · Límite: {e.podiatristLimit} podólogos</>
                                  )}
                                </p>
                              </div>
                            </div>
                            {isDraft && (
                              <button
                                onClick={() => removeEntry(e.id)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        );

                        return (
                          <div className="space-y-4">
                            {pending.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                                  Pendientes de pago ({pending.length})
                                </p>
                                <div className="space-y-2">{pending.map((e) => renderRow(e))}</div>
                              </div>
                            )}
                            {paid.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                                  Pagados (se exportan al CSV) ({paid.length})
                                </p>
                                <div className="space-y-2">{paid.map((e) => renderRow(e))}</div>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  Selecciona una lista o crea una nueva.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SupportPage;
