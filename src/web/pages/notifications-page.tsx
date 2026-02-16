import { useState, useEffect, useMemo, useCallback } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { useRefreshOnFocus } from "../hooks/use-refresh-on-focus";
import { api } from "../lib/api-client";
import { Notification, NotificationType } from "../lib/storage";

type FilterTab = "all" | "unread" | "read";
type TypeFilter = "all" | NotificationType;

const NotificationIcon = ({ type, size = "md" }: { type: NotificationType; size?: "sm" | "md" }) => {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  
  switch (type) {
    case "reassignment":
      return (
        <svg className={sizeClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case "appointment":
      return (
        <svg className={sizeClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "credit":
      return (
        <svg className={sizeClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "admin_message":
      return (
        <svg className={sizeClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case "system":
    default:
      return (
        <svg className={sizeClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const formatTimeAgo = (dateStr: string, t: any): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return t.notifications.justNow;
  if (diffMinutes < 60) return t.notifications.agoMinutes.replace("{n}", diffMinutes.toString());
  if (diffHours < 24) return t.notifications.agoHours.replace("{n}", diffHours.toString());
  if (diffDays === 1) return t.notifications.yesterday;
  return t.notifications.agoDays.replace("{n}", diffDays.toString());
};

const formatFullDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NotificationsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    const r = await api.get<{ success?: boolean; notifications?: Notification[] }>("/notifications");
    if (r.success && Array.isArray(r.data?.notifications)) setNotifications(r.data.notifications);
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
    // Polling cada 5 segundos para actualizaciones casi instantáneas
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useRefreshOnFocus(loadNotifications);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (filterTab === "unread" && n.read) return false;
      if (filterTab === "read" && !n.read) return false;
      
      // Type filter
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(query);
        const matchesMessage = n.message.toLowerCase().includes(query);
        const matchesPatient = n.metadata?.patientName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesMessage && !matchesPatient) return false;
      }
      
      return true;
    });
  }, [notifications, filterTab, typeFilter, searchQuery]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    const r = await api.patch<{ success?: boolean }>(`/notifications/${id}/read`);
    if (r.success) loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    const r = await api.post<{ success?: boolean }>("/notifications/read-all");
    if (r.success) loadNotifications();
  };

  const handleDelete = async (id: string) => {
    const r = await api.delete<{ success?: boolean }>(`/notifications/${id}`);
    if (r.success) {
      setSelectedNotifications((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      loadNotifications();
    }
  };

  const handleBulkDelete = async () => {
    await Promise.all(Array.from(selectedNotifications).map((id) => api.delete<{ success?: boolean }>(`/notifications/${id}`)));
    setSelectedNotifications(new Set());
    loadNotifications();
  };

  const handleBulkMarkAsRead = async () => {
    await Promise.all(Array.from(selectedNotifications).map((id) => api.patch<{ success?: boolean }>(`/notifications/${id}/read`)));
    setSelectedNotifications(new Set());
    loadNotifications();
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedNotifications(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getTypeLabel = (type: NotificationType): string => {
    switch (type) {
      case "reassignment": return t.notifications.reassignment;
      case "appointment": return t.notifications.appointment;
      case "credit": return t.notifications.credit;
      case "admin_message": return t.notifications.adminMessage;
      case "system": return t.notifications.system;
      default: return type;
    }
  };

  return (
    <MainLayout title={t.notifications.title} >
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#1a1a1a]">{t.notifications.title}</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {unreadCount} {t.notifications.unread.toLowerCase()}
              </p>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1a1a1a] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t.notifications.markAllAsRead}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Tab Filter */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {(["all", "unread", "read"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterTab === tab
                      ? "bg-white text-[#1a1a1a] shadow-sm"
                      : "text-gray-600 hover:text-[#1a1a1a]"
                  }`}
                >
                  {tab === "all" ? t.notifications.all : 
                   tab === "unread" ? t.notifications.unread : 
                   t.notifications.read}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none"
            >
              <option value="all">{t.notifications.all}</option>
              <option value="reassignment">{t.notifications.reassignment}</option>
              <option value="appointment">{t.notifications.appointment}</option>
              <option value="credit">{t.notifications.credit}</option>
              <option value="admin_message">{t.notifications.adminMessage}</option>
              <option value="system">{t.notifications.system}</option>
            </select>

            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t.common.search + "..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.size > 0 && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-600">
                {selectedNotifications.size} seleccionadas
              </span>
              <button
                onClick={handleBulkMarkAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {t.notifications.markAsRead}
              </button>
              <button
                onClick={handleBulkDelete}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                {t.notifications.delete}
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-gray-500">{t.notifications.noNotifications}</p>
            </div>
          ) : (
            <>
              {/* Header Row */}
              <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex-1">
                  {t.notifications.title}
                </span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-24 text-center">
                  Tipo
                </span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-32 text-right">
                  {t.common.date}
                </span>
                <span className="w-20"></span>
              </div>

              {/* Notification Rows */}
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    notification.type === "admin_message" 
                      ? !notification.read 
                        ? "bg-purple-50 border-l-4 border-l-purple-500" 
                        : "bg-purple-50/30 border-l-4 border-l-purple-300"
                      : !notification.read ? "bg-blue-50/30" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={() => toggleSelect(notification.id)}
                    className="w-4 h-4 mt-1 rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                  />
                  
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === "reassignment" ? "bg-blue-100 text-blue-600" :
                    notification.type === "appointment" ? "bg-green-100 text-green-600" :
                    notification.type === "credit" ? "bg-yellow-100 text-yellow-600" :
                    notification.type === "admin_message" ? "bg-purple-100 text-purple-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    <NotificationIcon type={notification.type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p className={`text-sm ${!notification.read ? "font-semibold" : "font-medium"} text-[#1a1a1a]`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 mt-1.5 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    
                    {/* Metadata for reassignment */}
                    {notification.type === "reassignment" && notification.metadata && (
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        {notification.metadata.patientName && (
                          <p>
                            <span className="font-medium">Paciente:</span> {notification.metadata.patientName}
                          </p>
                        )}
                        {notification.metadata.fromUserName && (
                          <p>
                            <span className="font-medium">De:</span> {notification.metadata.fromUserName}
                          </p>
                        )}
                        {notification.metadata.toUserName && (
                          <p>
                            <span className="font-medium">A:</span> {notification.metadata.toUserName}
                          </p>
                        )}
                        {notification.metadata.reassignedByName && (
                          <p>
                            <span className="font-medium">{t.notifications.reassignedBy}:</span> {notification.metadata.reassignedByName}
                          </p>
                        )}
                        {notification.metadata.reason && (
                          <p>
                            <span className="font-medium">{t.notifications.reason}:</span> {notification.metadata.reason}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Metadata for admin messages */}
                    {notification.type === "admin_message" && notification.metadata && (
                      <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                        {notification.metadata.senderName && (
                          <p className="text-xs text-purple-700 font-medium">
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {t.notifications.from}: {notification.metadata.senderName}
                            </span>
                          </p>
                        )}
                        {notification.metadata.sentAt && (
                          <p className="text-[10px] text-purple-500 mt-1">
                            {new Date(notification.metadata.sentAt).toLocaleString("es-ES")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Type Badge */}
                  <div className="w-24 flex justify-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      notification.type === "reassignment" ? "bg-blue-100 text-blue-700" :
                      notification.type === "appointment" ? "bg-green-100 text-green-700" :
                      notification.type === "credit" ? "bg-yellow-100 text-yellow-700" :
                      notification.type === "admin_message" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      <NotificationIcon type={notification.type} size="sm" />
                      {getTypeLabel(notification.type)}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="w-32 text-right">
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(notification.createdAt, t)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {formatFullDate(notification.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="w-20 flex items-center justify-end gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title={t.notifications.markAsRead}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t.notifications.delete}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default NotificationsPage;
