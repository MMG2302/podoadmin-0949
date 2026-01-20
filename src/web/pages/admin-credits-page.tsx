import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth, getAllUsers, User } from "../contexts/auth-context";
import { 
  getUserCredits, 
  getCreditTransactions,
  updateUserCredits,
  addCreditTransaction,
  addAuditLog,
  CreditTransaction,
} from "../lib/storage";

interface AdminAdjustment {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  reason: string;
  adminId: string;
  adminName: string;
  createdAt: string;
}

const ADMIN_ADJUSTMENTS_KEY = "podoadmin_admin_adjustments";

// Get admin adjustments from localStorage
const getAdminAdjustments = (): AdminAdjustment[] => {
  try {
    const data = localStorage.getItem(ADMIN_ADJUSTMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Save admin adjustment
const saveAdminAdjustment = (adjustment: Omit<AdminAdjustment, "id" | "createdAt">): AdminAdjustment => {
  const adjustments = getAdminAdjustments();
  const newAdjustment: AdminAdjustment = {
    ...adjustment,
    id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  adjustments.push(newAdjustment);
  localStorage.setItem(ADMIN_ADJUSTMENTS_KEY, JSON.stringify(adjustments));
  return newAdjustment;
};

// Get adjustments made this month by a specific admin
const getMonthlyAdjustmentsForAdmin = (adminId: string): AdminAdjustment[] => {
  const adjustments = getAdminAdjustments();
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  return adjustments.filter(adj => {
    const adjDate = new Date(adj.createdAt);
    return adj.adminId === adminId && 
           adjDate.getMonth() === thisMonth && 
           adjDate.getFullYear() === thisYear;
  });
};

// Get ALL adjustments made this month by ALL admins (shared limit)
const getAllMonthlyAdjustments = (): AdminAdjustment[] => {
  const adjustments = getAdminAdjustments();
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  return adjustments.filter(adj => {
    const adjDate = new Date(adj.createdAt);
    return adjDate.getMonth() === thisMonth && 
           adjDate.getFullYear() === thisYear;
  });
};

// Calculate 10% limit for a user
const calculateMonthlyLimit = (userId: string): number => {
  const userCredits = getUserCredits(userId);
  return Math.floor(userCredits.monthlyCredits * 0.1);
};

// Main Admin Credits Page
const AdminCreditsPage = () => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const credits = getUserCredits(currentUser?.id || "");
  const allUsers = getAllUsers();
  
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0);

  // Auto-refresh every 5 seconds to show real-time updates from other admins
  useEffect(() => {
    const dataInterval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      setSecondsSinceRefresh(0);
    }, 5000);
    
    // Update seconds counter every second for display
    const timerInterval = setInterval(() => {
      setSecondsSinceRefresh(prev => prev + 1);
    }, 1000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(timerInterval);
    };
  }, []);

  // Get podiatrists only (admin can only adjust podiatrist credits)
  const podiatrists = allUsers.filter(u => u.role === "podiatrist");

  // Get ALL monthly adjustments from ALL admins (shared limit)
  const allMonthlyAdjustments = useMemo(() => 
    getAllMonthlyAdjustments(), 
    [success, refreshKey] // Refresh on success and every 5 seconds
  );

  // Calculate total adjusted this month per user (by ALL admins combined)
  const totalAdjustedPerUser = useMemo(() => {
    const totals = new Map<string, number>();
    allMonthlyAdjustments.forEach(adj => {
      const current = totals.get(adj.userId) || 0;
      totals.set(adj.userId, current + adj.amount);
    });
    return totals;
  }, [allMonthlyAdjustments]);

  // Get selected user info
  const selectedUser = podiatrists.find(u => u.id === selectedUserId);
  const selectedUserCredits = selectedUser ? getUserCredits(selectedUser.id) : null;
  const selectedUserLimit = selectedUser ? calculateMonthlyLimit(selectedUser.id) : 0;
  const selectedUserAdjusted = selectedUserId ? (totalAdjustedPerUser.get(selectedUserId) || 0) : 0;
  const selectedUserRemaining = selectedUserLimit - selectedUserAdjusted;

  // All adjustments for history (filtered)
  const allAdjustments = useMemo(() => {
    const adjustments = getAdminAdjustments();
    if (filterUserId === "all") return adjustments;
    return adjustments.filter(adj => adj.userId === filterUserId);
  }, [filterUserId, success, refreshKey]);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedUserId) {
      setError("Selecciona un usuario");
      return;
    }

    if (reason.length < 20) {
      setError("El motivo debe tener al menos 20 caracteres");
      return;
    }

    if (amount <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    // Store what the user saw on screen for staleness detection
    const displayedAdjusted = selectedUserAdjusted;
    const displayedLimit = selectedUserLimit;

    try {
      // ULTRA-STRICT VALIDATION: Get absolute latest data from localStorage RIGHT BEFORE saving
      // This is the LAST check before any write operations
      const freshAdjustments = getAllMonthlyAdjustments();
      const freshTotalAdjusted = freshAdjustments
        .filter(adj => adj.userId === selectedUserId)
        .reduce((sum, adj) => sum + adj.amount, 0);
      const freshLimit = calculateMonthlyLimit(selectedUserId);
      const freshRemaining = freshLimit - freshTotalAdjusted;

      // Debug logging
      console.log("[Credit Adjustment Debug]", {
        userId: selectedUserId,
        displayedAdjusted,
        displayedLimit,
        freshLimit,
        freshTotalAdjusted,
        freshRemaining,
        requestedAmount: amount,
      });

      // STALENESS CHECK: Compare fresh data with what user saw on screen
      // If another admin made adjustments since this form was loaded, force reload
      if (freshTotalAdjusted !== displayedAdjusted || freshLimit !== displayedLimit) {
        setError("Los datos han cambiado. Otro administrador realizó ajustes. Recargando página...");
        setTimeout(() => window.location.reload(), 1500);
        return;
      }

      // Check if within monthly limit using fresh data
      if (amount > freshRemaining) {
        setError(`No puedes añadir más de ${freshRemaining} créditos a este usuario este mes (límite del 10%)`);
        return;
      }

      // ===== FINAL VALIDATION PASSED - NOW PROCEED WITH SAVE =====

      // Add credits to user
      const userCredits = getUserCredits(selectedUserId);
      userCredits.extraCredits += amount;
      updateUserCredits(userCredits);

      // Add transaction
      addCreditTransaction({
        userId: selectedUserId,
        type: "purchase",
        amount,
        description: `Ajuste de soporte: ${reason}`,
      });

      // Save admin adjustment record
      const savedAdjustment = saveAdminAdjustment({
        userId: selectedUserId,
        userName: selectedUser?.name || "",
        amount,
        reason,
        adminId: currentUser?.id || "",
        adminName: currentUser?.name || "",
      });
      
      console.log("[Credit Adjustment Debug] Saved adjustment:", savedAdjustment);

      // Add audit log with correct variable names
      addAuditLog({
        userId: currentUser?.id || "",
        userName: currentUser?.name || "",
        action: "ADMIN_CREDIT_ADJUSTMENT",
        entityType: "credit",
        entityId: selectedUserId,
        details: JSON.stringify({
          action: "admin_credit_adjustment",
          targetUserId: selectedUserId,
          targetUserName: selectedUser?.name,
          amount: amount,
          reason: reason,
          limitUsedThisMonth: freshTotalAdjusted + amount,
          monthlyLimit: freshLimit,
        }),
      });

      setSuccess(`Se han añadido ${amount} créditos a ${selectedUser?.name}`);
      setAmount(1);
      setReason("");
      setSelectedUserId("");
      
      // Reload page after 1 second to ensure fresh data and prevent over-assignment
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error("[Credit Adjustment Error] localStorage read/write failed:", err);
      setError("Error al acceder a los datos. Por favor, recargue la página e intente de nuevo.");
    }
  };

  return (
    <MainLayout title="Ajustes de Créditos" credits={credits}>
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Límites de ajuste</p>
              <p className="text-sm text-blue-700 mt-1">
                Como administrador de soporte, puedes añadir créditos para compensar errores del sistema. 
                El límite máximo es el <strong>10% de los créditos mensuales</strong> del usuario por mes, 
                <strong>compartido entre todos los administradores</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Última actualización: hace {secondsSinceRefresh} segundos (auto-actualización cada 5s)</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Adjustment Form */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-6">Añadir créditos</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* User selector */}
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  Usuario a compensar
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setError("");
                  }}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                >
                  <option value="">Seleccionar usuario...</option>
                  {podiatrists.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              {/* Monthly limit indicator */}
              {selectedUser && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Límite mensual (10%)</span>
                    <span className="text-sm font-medium text-[#1a1a1a]">{selectedUserLimit} créditos</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Usado este mes</span>
                    <span className={`text-sm font-medium ${selectedUserAdjusted >= selectedUserLimit ? "text-red-600" : "text-[#1a1a1a]"}`}>
                      {selectedUserAdjusted} / {selectedUserLimit}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        selectedUserAdjusted >= selectedUserLimit 
                          ? "bg-red-500" 
                          : selectedUserAdjusted >= selectedUserLimit * 0.75 
                            ? "bg-yellow-500" 
                            : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min((selectedUserAdjusted / selectedUserLimit) * 100, 100)}%` }}
                    />
                  </div>
                  {selectedUserRemaining > 0 ? (
                    <p className="text-xs text-gray-500 mt-2">
                      Se pueden añadir hasta {selectedUserRemaining} créditos más a este usuario este mes (todos los admins)
                    </p>
                  ) : (
                    <p className="text-xs text-red-600 mt-2">
                      Se ha alcanzado el límite de ajustes para este usuario este mes (todos los admins)
                    </p>
                  )}
                </div>
              )}

              {/* Amount input */}
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  Cantidad de créditos a añadir
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedUserRemaining || 999}
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                />
              </div>

              {/* Reason textarea */}
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  Motivo del ajuste <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 ml-2">(mínimo 20 caracteres)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors resize-none"
                  placeholder="Describe detalladamente el error del sistema y por qué se requiere la compensación..."
                />
                <p className={`text-xs mt-1 ${reason.length >= 20 ? "text-green-600" : "text-gray-400"}`}>
                  {reason.length}/20 caracteres mínimos
                </p>
              </div>

              {/* Error/Success messages */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={!selectedUserId || reason.length < 20 || selectedUserRemaining <= 0}
                className="w-full px-4 py-3 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Añadir créditos
              </button>
            </form>
          </div>

          {/* Adjustment History */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1a1a1a]">Historial de ajustes</h3>
              <select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
              >
                <option value="all">Todos los usuarios</option>
                {podiatrists.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {allAdjustments.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No hay ajustes registrados</p>
                </div>
              ) : (
                allAdjustments.sort((a, b) => 
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ).map((adj) => (
                  <div key={adj.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-[#1a1a1a]">{adj.userName}</p>
                        <p className="text-xs text-gray-500">
                          Por {adj.adminName} • {new Date(adj.createdAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded">
                        +{adj.amount}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{adj.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Approval Workflow Notice */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[#1a1a1a]">Flujo de aprobación (próximamente)</p>
              <p className="text-sm text-gray-600 mt-1">
                En una futura actualización, los ajustes de créditos superiores a cierto umbral requerirán 
                aprobación de un Super Administrador antes de aplicarse.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminCreditsPage;
