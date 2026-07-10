import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { AuditLog } from "../types/audit-log";
import { api } from "../lib/api-client";

const ITEMS_PER_PAGE = 20;

const AuditLogPage = () => {
  const { t } = useLanguage();
  const { user, getAllUsers } = useAuth();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const allUsers = getAllUsers();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Expanded details
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Cargar logs desde la API (backend aplica reglas de acceso por rol)
  useEffect(() => {
    const loadLogs = async () => {
      if (!user) return;

      try {
        let endpoint = "";
        if (user.role === "super_admin") {
          endpoint = "/audit-logs/all?limit=500";
        } else {
          endpoint = `/audit-logs/user/${encodeURIComponent(user.id)}?limit=200`;
        }

        const response = await api.get<{ success: boolean; logs: AuditLog[] }>(endpoint);
        if (response.success && response.data?.success) {
          setLogs(response.data.logs);
        } else {
          console.error("Error cargando auditoría:", response.error || response.data?.message);
        }
      } catch (error) {
        console.error("Error cargando auditoría:", error);
      }
    };

    loadLogs();
  }, [user]);

  const filteredLogs = useMemo(() => {
    let filtered = logs;
    
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }
    
    if (entityTypeFilter !== "all") {
      filtered = filtered.filter((log) => log.entityType.toLowerCase() === entityTypeFilter.toLowerCase());
    }
    
    if (userFilter !== "all") {
      filtered = filtered.filter((log) => log.userId === userFilter);
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((log) => new Date(log.createdAt) >= fromDate);
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((log) => new Date(log.createdAt) <= toDate);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.userName.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query) ||
          log.entityType.toLowerCase().includes(query) ||
          log.entityId.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [logs, searchQuery, actionFilter, entityTypeFilter, userFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Statistics
  const statistics = useMemo(() => {
    const actionCounts: Record<string, number> = {};
    const entityCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    
    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      entityCounts[log.entityType] = (entityCounts[log.entityType] || 0) + 1;
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
    });
    
    const topUsers = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => ({
        userId,
        userName: allUsers.find(u => u.id === userId)?.name || logs.find(l => l.userId === userId)?.userName || userId,
        count,
      }));
    
    return {
      total: logs.length,
      actionCounts,
      entityCounts,
      topUsers,
    };
  }, [logs, allUsers]);

  const uniqueActions = [...new Set(logs.map((log) => log.action))].sort();
  const uniqueEntityTypes = [...new Set(logs.map((log) => log.entityType))].sort();
  const uniqueUsers = [...new Set(logs.map((log) => log.userId))];

  // Identidad legible del usuario (nombre, email o ID) para mostrar en lista y detalles
  const getUserDisplay = (userId: string): { display: string; sub?: string } => {
    const u = allUsers.find((u) => u.id === userId);
    if (!u) {
      const fromLog = logs.find((l) => l.userId === userId)?.userName;
      return { display: fromLog || userId, sub: userId };
    }
    if (u.name && u.name.trim()) return { display: u.name, sub: u.email || userId };
    return { display: u.email || userId, sub: userId };
  };

  // Etiquetas amigables para no depender del código interno en producción
  const getFriendlyActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      LOGIN_SUCCESS: "Inicio de sesión",
      LOGIN_FAILED: "Inicio de sesión fallido",
      LOGOUT: "Cierre de sesión",
      PASSWORD_CHANGED: "Contraseña cambiada",
      PASSWORD_RESET_REJECTED: "Restablecimiento de contraseña rechazado",
      PASSWORD_RESET_APPROVED: "Restablecimiento de contraseña aprobado",
      PASSWORD_RESET_COMPLETED: "Restablecimiento de contraseña completado",
      PASSWORD_RESET_REQUESTED: "Solicitud de restablecimiento de contraseña",
      CREATE: "Creación",
      CREATE_USER: "Usuario creado",
      UPDATE: "Actualización",
      DELETE: "Eliminación",
      DELETE_USER: "Usuario eliminado",
      COMPLETE: "Completado",
      EXPORT: "Exportación",
      PRINT: "Impresión",
      UPDATE_DRAFT: "Borrador actualizado",
      REASSIGN: "Reasignación",
      TRANSFER: "Transferencia",
      ADD_CREDITS: "Créditos añadidos",
      SUBTRACT_CREDITS: "Créditos restados",
      ADMIN_CREDIT_ADJUSTMENT: "Ajuste de créditos (admin)",
      ALERT_MULTIPLE_PRINT_VIOLATIONS: "Alerta: múltiples impresiones",
      PRINT_VIOLATION_FORM: "Intento de impresión desde formulario",
    };
    return labels[action] ?? action;
  };

  const getFriendlyEntityTypeLabel = (entityType: string): string => {
    const type = entityType.toLowerCase();
    const labels: Record<string, string> = {
      authentication: "Autenticación",
      session: "Sesión",
      patient: "Paciente",
      prescription: "Receta",
      reassignment: "Reasignación",
      credit: "Créditos",
      user: "Usuario",
      user_data: "Datos de usuario",
      clinic: "Clínica",
      professional_info: "Datos profesionales",
      professional_credentials: "Credenciales",
      logo: "Logo",
      message: "Mensaje",
      clinical_history: "Historial clínico",
      receptionist: "Recepcionista",
      registration_list: "Lista de registro",
      support_conversation: "Conversación de soporte",
    };
    return labels[type] ?? entityType;
  };

  const getFriendlySummary = (log: AuditLog, parsedDetails: Record<string, unknown> | null): string => {
    const action = log.action;
    const entityType = (log.entityType || "").toLowerCase();
    const d = parsedDetails || {};

    if (action === "LOGIN_SUCCESS" && entityType === "authentication") {
      const email = (d.email as string) ?? "";
      const has2FA = d.has2FA === true;
      return `Inicio de sesión correcto${email ? `: ${email}` : ""}${has2FA ? " (2FA activado)" : " (sin 2FA)"}`;
    }
    if (action === "LOGOUT" && entityType === "session") {
      return "Cierre de sesión.";
    }
    if (action === "PASSWORD_CHANGED" && entityType === "authentication") {
      return "Contraseña cambiada por el usuario.";
    }
    if (action === "LOGIN_FAILED" && entityType === "authentication") {
      const email = (d.email as string) ?? "";
      return email ? `Intento de inicio de sesión fallido: ${email}` : "Intento de inicio de sesión fallido.";
    }
    if (action === "PASSWORD_RESET_REJECTED" && entityType === "authentication") {
      return "Solicitud de restablecimiento de contraseña rechazada.";
    }
    if (action === "PASSWORD_RESET_APPROVED" && entityType === "authentication") {
      return "Restablecimiento de contraseña aprobado por un administrador.";
    }
    if (action === "PASSWORD_RESET_COMPLETED" && entityType === "authentication") {
      return "El usuario completó el restablecimiento de contraseña.";
    }
    if (action === "PASSWORD_RESET_REQUESTED" && entityType === "authentication") {
      return "Solicitud de restablecimiento de contraseña enviada.";
    }
    if (d.patientName && typeof d.patientName === "string") return `Paciente: ${d.patientName}`;
    if (d.targetUserName && typeof d.targetUserName === "string") return `Usuario: ${d.targetUserName}`;
    if (d.clinicName && typeof d.clinicName === "string") return `Clínica: ${d.clinicName}`;
    if (d.subject && typeof d.subject === "string") return d.subject;
    if (d.email && typeof d.email === "string") return d.email;
    if (log.details && log.details.length <= 120) return log.details;
    return `${getFriendlyActionLabel(log.action)} · ${getFriendlyEntityTypeLabel(log.entityType)}`;
  };

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      LOGIN_SUCCESS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      LOGIN_FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      LOGOUT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      PASSWORD_CHANGED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      PASSWORD_RESET_REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
      PASSWORD_RESET_APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      PASSWORD_RESET_COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      PASSWORD_RESET_REQUESTED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      CREATE_USER: "bg-green-100 text-green-700",
      DELETE_USER: "bg-red-100 text-red-700",
      CREATE: "bg-green-100 text-green-700",
      UPDATE: "bg-blue-100 text-blue-700",
      DELETE: "bg-red-100 text-red-700",
      COMPLETE: "bg-purple-100 text-purple-700",
      EXPORT: "bg-orange-100 text-orange-700",
      PRINT: "bg-gray-100 text-gray-700",
      UPDATE_DRAFT: "bg-yellow-100 text-yellow-700",
      REASSIGN: "bg-indigo-100 text-indigo-700",
      TRANSFER: "bg-pink-100 text-pink-700",
      ADD_CREDITS: "bg-emerald-100 text-emerald-700",
      SUBTRACT_CREDITS: "bg-rose-100 text-rose-700",
      ADMIN_CREDIT_ADJUSTMENT: "bg-amber-100 text-amber-700",
      ALERT_MULTIPLE_PRINT_VIOLATIONS: "bg-orange-100 text-orange-700",
      PRINT_VIOLATION_FORM: "bg-amber-100 text-amber-700",
    };
    
    return (
      <span title={action} className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[action] || "bg-gray-100 text-gray-700"}`}>
        {getFriendlyActionLabel(action)}
      </span>
    );
  };

  const getEntityIcon = (entityType: string) => {
    const type = entityType.toLowerCase();
    switch (type) {
      case "patient":
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case "session":
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "prescription":
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        );
      case "reassignment":
        return (
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        );
      case "credit":
        return (
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
        );
      case "user":
      case "user_data":
        return (
          <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        );
      case "logo":
        return (
          <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        );
      case "message":
        return (
          <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        );
      case "clinical_history":
        return (
          <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        );
      case "clinic":
      case "professional_info":
      case "professional_credentials":
        return (
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseDetails = (details: string): Record<string, unknown> | null => {
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  };

  const exportAuditLogs = (format: "json" | "csv") => {
    if (format === "json") {
      const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const headers = ["ID", "Timestamp", "User", "User ID", "Action", "Entity Type", "Entity ID", "Details"];
      const rows = filteredLogs.map((log) => [
        log.id,
        log.createdAt,
        log.userName,
        log.userId,
        log.action,
        log.entityType,
        log.entityId,
        log.details.replace(/"/g, '""'),
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActionFilter("all");
    setEntityTypeFilter("all");
    setUserFilter("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  return (
    <MainLayout title={t.nav.auditLog} >
      <div className="space-y-6">
        {/* Statistics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
            <div className="text-sm text-brand-muted mb-1">Total de registros</div>
            <div className="text-2xl font-bold text-brand-ink">{statistics.total}</div>
          </div>
          <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
            <div className="text-sm text-brand-muted mb-1">Tipos de acción</div>
            <div className="text-2xl font-bold text-brand-ink">{Object.keys(statistics.actionCounts).length}</div>
          </div>
          <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
            <div className="text-sm text-brand-muted mb-1">Tipos de entidad</div>
            <div className="text-2xl font-bold text-brand-ink">{Object.keys(statistics.entityCounts).length}</div>
          </div>
          <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
            <div className="text-sm text-brand-muted mb-1">Usuarios activos</div>
            <div className="text-2xl font-bold text-brand-ink">{statistics.topUsers.length}</div>
          </div>
        </div>

        {/* Top Users */}
        {statistics.topUsers.length > 0 && (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
            <h3 className="text-sm font-medium text-brand-muted mb-3">Usuarios más activos</h3>
            <div className="flex flex-wrap gap-2">
              {statistics.topUsers.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => setUserFilter(u.userId)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    userFilter === u.userId
                      ? "bg-brand-ink text-brand-ink-fg"
                      : "bg-brand-canvas text-brand-muted hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {u.userName} <span className="opacity-60">({u.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-brand-muted">Filtros</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-brand-muted hover:text-brand-ink dark:hover:text-white transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink"
            >
              <option value="all">Todas las acciones</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>{getFriendlyActionLabel(action)}</option>
              ))}
            </select>
            <select
              value={entityTypeFilter}
              onChange={(e) => { setEntityTypeFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink"
            >
              <option value="all">Todos los tipos</option>
              {uniqueEntityTypes.map((type) => (
                <option key={type} value={type}>{getFriendlyEntityTypeLabel(type)}</option>
              ))}
            </select>
            <select
              value={userFilter}
              onChange={(e) => { setUserFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink"
            >
              <option value="all">Todos los usuarios</option>
              {uniqueUsers.map((userId) => {
                const userName = allUsers.find(u => u.id === userId)?.name || logs.find(l => l.userId === userId)?.userName || userId;
                return <option key={userId} value={userId}>{userName}</option>;
              })}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink"
              placeholder="Desde"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink"
              placeholder="Hasta"
            />
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-brand-muted">
            {filteredLogs.length} registros {filteredLogs.length !== logs.length && `(de ${logs.length} total)`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAuditLogs("csv")}
              className="px-3 py-1.5 text-sm text-brand-muted hover:text-brand-ink dark:hover:text-white bg-brand-canvas hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
            <button
              onClick={() => exportAuditLogs("json")}
              className="px-3 py-1.5 text-sm text-brand-muted hover:text-brand-ink dark:hover:text-white bg-brand-canvas hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              JSON
            </button>
          </div>
        </div>

        {/* Log List */}
        {paginatedLogs.length === 0 ? (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-12 text-center">
            <div className="w-16 h-16 bg-brand-canvas rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-brand-ink mb-2">No hay registros</h3>
            <p className="text-brand-muted">No se encontraron registros de auditoría con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {paginatedLogs.map((log) => {
                const parsedDetails = parseDetails(log.details);
                const isExpanded = expandedLogId === log.id;
                const userDisplay = getUserDisplay(log.userId);
                return (
                  <div key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5">
                          {getEntityIcon(log.entityType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getActionBadge(log.action)}
                            <span className="text-sm font-medium text-brand-ink">{getFriendlyEntityTypeLabel(log.entityType)}</span>
                          </div>
                          <p className="text-sm text-brand-muted mb-1 truncate" title={log.details}>
                            {getFriendlySummary(log, parsedDetails)}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                            <span className="flex items-center gap-1" title={log.userId}>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {userDisplay.display}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDate(log.createdAt)}
                            </span>
                            {log.entityId ? (
                              <span className="font-mono text-[10px] bg-brand-canvas px-1.5 py-0.5 rounded" title={log.entityId}>
                                {log.entityId.length > 12 ? `${log.entityId.slice(0, 12)}…` : log.entityId}
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] bg-brand-canvas px-1.5 py-0.5 rounded" title={log.id}>
                                {log.id.length > 14 ? `${log.id.slice(0, 14)}…` : log.id}
                              </span>
                            )}
                            <svg 
                              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 ml-9">
                        <div className="bg-brand-canvas rounded-lg p-4">
                          <h4 className="text-xs font-medium text-brand-muted uppercase mb-2">Detalles completos</h4>
                          {parsedDetails ? (
                            <div className="space-y-2">
                              {Object.entries(parsedDetails).map(([key, value]) => (
                                <div key={key} className="flex">
                                  <span className="text-xs font-medium text-brand-muted w-40 flex-shrink-0">{key}:</span>
                                  <span className="text-xs text-brand-muted break-all">
                                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-brand-muted">{log.details}</p>
                          )}
                          <div className="mt-3 pt-3 border-t border-brand-border">
                            <p className="text-xs text-brand-muted mb-2">Cada registro está vinculado al usuario que realizó la acción. El Log ID identifica de forma única este evento.</p>
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                              <span className="text-xs font-medium text-brand-muted flex-shrink-0">Usuario:</span>
                              <span className="text-xs font-medium text-brand-ink">{userDisplay.display}</span>
                              {userDisplay.sub && userDisplay.sub !== userDisplay.display && (
                                <span className="text-xs text-brand-muted">({userDisplay.sub})</span>
                              )}
                            </div>
                            <div className="flex mt-1">
                              <span className="text-xs font-medium text-brand-muted w-40 flex-shrink-0">ID de usuario:</span>
                              <span className="text-xs text-brand-muted font-mono">{log.userId}</span>
                            </div>
                            <div className="flex mt-1">
                              <span className="text-xs font-medium text-brand-muted w-40 flex-shrink-0">ID de registro (log):</span>
                              <span className="text-xs text-brand-muted font-mono">{log.id}</span>
                            </div>
                            {log.entityId && (
                              <div className="flex mt-1">
                                <span className="text-xs font-medium text-brand-muted w-40 flex-shrink-0">ID recurso:</span>
                                <span className="text-xs text-brand-muted font-mono">{log.entityId}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-brand-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              ««
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-brand-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              «
            </button>
            <span className="px-4 py-1.5 text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-brand-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              »
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-brand-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              »»
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AuditLogPage;
