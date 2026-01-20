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

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 animate-slide-in-right px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {type === "success" ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

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

// Get all adjustments made for a SPECIFIC USER this month (by ALL admins)
const getAdjustmentsForUserThisMonth = (userId: string): AdminAdjustment[] => {
  const adjustments = getAdminAdjustments();
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  return adjustments.filter(adj => {
    const adjDate = new Date(adj.createdAt);
    return adj.userId === userId && 
           adjDate.getMonth() === thisMonth && 
           adjDate.getFullYear() === thisYear;
  });
};

// Calculate 10% limit for a specific user based on THEIR monthly credits
const calculateUserMonthlyLimit = (userId: string): number => {
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
  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [amountWarning, setAmountWarning] = useState("");

  // Get podiatrists only (admin can only adjust podiatrist credits)
  const podiatrists = allUsers.filter(u => u.role === "podiatrist");

  // Get selected user info
  const selectedUser = podiatrists.find(u => u.id === selectedUserId);
  const selectedUserCredits = selectedUser ? getUserCredits(selectedUser.id) : null;

  // Calculate per-user limit and usage (only when a user is selected)
  const userLimitInfo = useMemo(() => {
    if (!selectedUserId) return null;
    
    const userLimit = calculateUserMonthlyLimit(selectedUserId);
    const adjustmentsThisMonth = getAdjustmentsForUserThisMonth(selectedUserId);
    const totalAdjustedForUser = adjustmentsThisMonth.reduce((sum, adj) => sum + adj.amount, 0);
    const remaining = userLimit - totalAdjustedForUser;
    
    return {
      limit: userLimit,
      used: totalAdjustedForUser,
      remaining: Math.max(remaining, 0),
      adjustments: adjustmentsThisMonth,
    };
  }, [selectedUserId, refreshKey]);

  // All adjustments for history (filtered)
  const allAdjustments = useMemo(() => {
    const adjustments = getAdminAdjustments();
    if (filterUserId === "all") return adjustments;
    return adjustments.filter(adj => adj.userId === filterUserId);
  }, [filterUserId, refreshKey]);

  // Get selected user's current credit balance (refreshes with refreshKey)
  const selectedUserCurrentCredits = useMemo(() => {
    if (!selectedUserId) return null;
    return getUserCredits(selectedUserId);
  }, [selectedUserId, refreshKey]);

  // Real-time validation when amount changes
  const handleAmountChange = (newAmount: number) => {
    setAmount(newAmount);
    setError("");
    
    if (!userLimitInfo) {
      setAmountWarning("");
      return;
    }
    
    if (newAmount > userLimitInfo.remaining) {
      setAmountWarning(`Esta cantidad excede el límite disponible para este usuario (${userLimitInfo.remaining} créditos)`);
    } else if (newAmount <= 0) {
      setAmountWarning("La cantidad debe ser mayor a 0");
    } else {
      setAmountWarning("");
    }
  };

  // Reset amount warning when user changes
  useEffect(() => {
    if (selectedUserId && userLimitInfo) {
      handleAmountChange(amount);
    }
  }, [selectedUserId, userLimitInfo?.remaining]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAmountWarning("");

    // ============================================
    // PHASE 1: Pre-validation (before loading state)
    // ============================================
    console.log("[CREDIT_ADJUSTMENT] Starting validation...");

    // Basic field validation
    if (!selectedUserId) {
      console.log("[CREDIT_ADJUSTMENT] Error: No user selected");
      setError("Selecciona un usuario");
      return;
    }

    if (reason.length < 20) {
      console.log("[CREDIT_ADJUSTMENT] Error: Reason too short");
      setError("El motivo debe tener al menos 20 caracteres");
      return;
    }

    if (amount <= 0) {
      console.log("[CREDIT_ADJUSTMENT] Error: Invalid amount");
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    // ============================================
    // PHASE 2: Calculate limits (with error handling)
    // ============================================
    let userLimit: number;
    let adjustmentsThisMonth: AdminAdjustment[];
    let totalAdjustedForUser: number;
    let remainingForUser: number;

    try {
      console.log("[CREDIT_ADJUSTMENT] Calculating limits for user:", selectedUserId);
      userLimit = calculateUserMonthlyLimit(selectedUserId);
      console.log("[CREDIT_ADJUSTMENT] User monthly limit:", userLimit);
    } catch (calcError) {
      console.error("[CREDIT_ADJUSTMENT] Error calculating user limit:", calcError);
      setError("Error al calcular el límite del usuario. Intenta de nuevo.");
      setToast({ message: "Error al calcular límites", type: "error" });
      return;
    }

    try {
      adjustmentsThisMonth = getAdjustmentsForUserThisMonth(selectedUserId);
      totalAdjustedForUser = adjustmentsThisMonth.reduce((sum, adj) => sum + adj.amount, 0);
      remainingForUser = Math.max(0, userLimit - totalAdjustedForUser);
      console.log("[CREDIT_ADJUSTMENT] Total adjusted this month:", totalAdjustedForUser);
      console.log("[CREDIT_ADJUSTMENT] Remaining for user:", remainingForUser);
    } catch (adjError) {
      console.error("[CREDIT_ADJUSTMENT] Error fetching adjustments:", adjError);
      setError("Error al obtener los ajustes previos. Intenta de nuevo.");
      setToast({ message: "Error al verificar ajustes previos", type: "error" });
      return;
    }

    // ============================================
    // PHASE 3: Validate against limits (BEFORE any updates)
    // ============================================
    if (amount > remainingForUser) {
      console.log("[CREDIT_ADJUSTMENT] BLOCKED: Amount exceeds remaining limit");
      console.log(`[CREDIT_ADJUSTMENT] Requested: ${amount}, Available: ${remainingForUser}`);
      setError(
        `Este usuario solo puede recibir ${userLimit} créditos de ajuste este mes. ` +
        `Ya se han asignado ${totalAdjustedForUser}, quedan ${remainingForUser} disponibles.`
      );
      setToast({ message: "No se pudo completar el ajuste: límite por usuario excedido", type: "error" });
      return; // STOP HERE - do not proceed
    }

    // ============================================
    // PHASE 4: Execute updates (only if validation passed)
    // ============================================
    console.log("[CREDIT_ADJUSTMENT] Validation passed, proceeding with update...");
    setIsLoading(true);

    try {
      // Store values before clearing form
      const adjustedUserName = selectedUser?.name || "";
      const adjustedAmount = amount;
      const newRemaining = remainingForUser - amount;

      // Get fresh user credits and update
      console.log("[CREDIT_ADJUSTMENT] Fetching current credits...");
      const userCreditsData = getUserCredits(selectedUserId);
      console.log("[CREDIT_ADJUSTMENT] Current extra credits:", userCreditsData.extraCredits);
      
      userCreditsData.extraCredits += amount;
      console.log("[CREDIT_ADJUSTMENT] New extra credits:", userCreditsData.extraCredits);
      
      updateUserCredits(userCreditsData);
      console.log("[CREDIT_ADJUSTMENT] Credits updated successfully");

      // Add transaction
      addCreditTransaction({
        userId: selectedUserId,
        type: "purchase",
        amount,
        description: `Ajuste de soporte: ${reason}`,
      });
      console.log("[CREDIT_ADJUSTMENT] Transaction recorded");

      // Save admin adjustment record (this tracks the admin's usage of limit)
      saveAdminAdjustment({
        userId: selectedUserId,
        userName: selectedUser?.name || "",
        amount,
        reason,
        adminId: currentUser?.id || "",
        adminName: currentUser?.name || "",
      });
      console.log("[CREDIT_ADJUSTMENT] Admin adjustment saved");

      // Add audit log
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
          userMonthlyLimit: userLimit,
          totalAdjustedForUserThisMonth: totalAdjustedForUser + amount,
        }),
      });
      console.log("[CREDIT_ADJUSTMENT] Audit log created");

      // Reset form immediately
      setAmount(1);
      setReason("");
      setSelectedUserId("");
      setIsLoading(false);
      
      // Refresh data to show updated values
      setRefreshKey(prev => prev + 1);
      
      // Show success toast
      setToast({ 
        message: `+${adjustedAmount} créditos añadidos a ${adjustedUserName}. Disponible para este usuario: ${newRemaining}`, 
        type: "success" 
      });
      console.log("[CREDIT_ADJUSTMENT] SUCCESS - Adjustment completed");

    } catch (updateError) {
      // Error during the update phase
      console.error("[CREDIT_ADJUSTMENT] Error during update phase:", updateError);
      setIsLoading(false);
      setError("Error al actualizar los créditos. Por favor, inténtalo de nuevo.");
      setToast({ message: "Error al guardar los cambios", type: "error" });
    }
  };

  return (
    <MainLayout title="Ajustes de Créditos" credits={credits}>
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Límites de ajuste por usuario</p>
              <p className="text-sm text-blue-700 mt-1">
                Como administrador de soporte, puedes añadir créditos para compensar errores del sistema. 
                El límite máximo es el <strong>10% de los créditos mensuales de CADA usuario</strong> por mes. 
                Este límite es por usuario y se comparte entre todos los administradores.
              </p>
            </div>
          </div>
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
                    setAmountWarning("");
                  }}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                >
                  <option value="">Seleccionar usuario...</option>
                  {podiatrists.map(u => {
                    const userCreditsInfo = getUserCredits(u.id);
                    const userLimit = Math.floor(userCreditsInfo.monthlyCredits * 0.1);
                    const usedThisMonth = getAdjustmentsForUserThisMonth(u.id).reduce((sum, adj) => sum + adj.amount, 0);
                    const remaining = userLimit - usedThisMonth;
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) - Límite disponible: {remaining}/{userLimit}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Per-User Monthly Limit Indicator (shows only when user selected) */}
              {selectedUserId && userLimitInfo && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Límite mensual para este usuario (10%)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1a1a1a]">{userLimitInfo.limit} créditos</span>
                      <button
                        type="button"
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        className="p-1 text-gray-400 hover:text-[#1a1a1a] transition-colors rounded hover:bg-gray-200"
                        title="Actualizar límite (por si otro admin ajustó créditos)"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Ajustado este mes (todos los admins)</span>
                    <span className={`text-sm font-medium ${userLimitInfo.used >= userLimitInfo.limit ? "text-red-600" : "text-[#1a1a1a]"}`}>
                      {userLimitInfo.used} / {userLimitInfo.limit}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        userLimitInfo.used >= userLimitInfo.limit 
                          ? "bg-red-500" 
                          : userLimitInfo.used >= userLimitInfo.limit * 0.75 
                            ? "bg-yellow-500" 
                            : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min((userLimitInfo.used / userLimitInfo.limit) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {userLimitInfo.remaining > 0 ? (
                      <p className="text-xs text-gray-500">
                        Disponible para este usuario: <strong>{userLimitInfo.remaining}</strong> créditos
                      </p>
                    ) : (
                      <p className="text-xs text-red-600">
                        Límite de ajustes alcanzado para este usuario este mes
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setRefreshKey(prev => prev + 1)}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Actualizar
                    </button>
                  </div>
                </div>
              )}

              {/* Selected user current balance */}
              {selectedUserCurrentCredits && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Balance actual del usuario</span>
                    <span className="text-sm font-semibold text-blue-900">
                      {selectedUserCurrentCredits.monthlyCredits + selectedUserCurrentCredits.extraCredits} créditos
                    </span>
                  </div>
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
                  max={userLimitInfo ? Math.max(userLimitInfo.remaining, 1) : 999}
                  value={amount}
                  onChange={(e) => handleAmountChange(parseInt(e.target.value) || 1)}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-1 outline-none transition-colors ${
                    amountWarning 
                      ? "border-yellow-400 focus:border-yellow-500 focus:ring-yellow-500" 
                      : "border-gray-200 focus:border-[#1a1a1a] focus:ring-[#1a1a1a]"
                  }`}
                />
                {amountWarning && (
                  <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {amountWarning}
                  </p>
                )}
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

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={
                  !selectedUserId || 
                  reason.length < 20 || 
                  amount <= 0 ||
                  (userLimitInfo && userLimitInfo.remaining <= 0) || 
                  (userLimitInfo && amount > userLimitInfo.remaining) ||
                  isLoading || 
                  !!amountWarning
                }
                className="w-full px-4 py-3 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Procesando...
                  </>
                ) : (
                  "Añadir créditos"
                )}
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
