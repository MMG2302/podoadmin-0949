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

// Get admin adjustments from localStorage - with cleanup
const getAdminAdjustments = (): AdminAdjustment[] => {
  try {
    const data = localStorage.getItem(ADMIN_ADJUSTMENTS_KEY);
    if (!data) return [];
    const adjustments = JSON.parse(data);
    // Keep only last 50 to prevent quota issues
    if (adjustments.length > 50) {
      const trimmed = adjustments.slice(-50);
      localStorage.setItem(ADMIN_ADJUSTMENTS_KEY, JSON.stringify(trimmed));
      return trimmed;
    }
    return adjustments;
  } catch {
    // If error, clear the corrupted data
    localStorage.removeItem(ADMIN_ADJUSTMENTS_KEY);
    return [];
  }
};

// Save admin adjustment with error handling
const saveAdminAdjustment = (adjustment: Omit<AdminAdjustment, "id" | "createdAt">): AdminAdjustment | null => {
  try {
    let adjustments = getAdminAdjustments();
    
    // Keep only last 40 to make room
    if (adjustments.length >= 40) {
      adjustments = adjustments.slice(-40);
    }
    
    const newAdjustment: AdminAdjustment = {
      ...adjustment,
      id: `adj_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    adjustments.push(newAdjustment);
    localStorage.setItem(ADMIN_ADJUSTMENTS_KEY, JSON.stringify(adjustments));
    return newAdjustment;
  } catch (err) {
    console.error("Error saving adjustment:", err);
    // Try to clear and save just this one
    try {
      const newAdjustment: AdminAdjustment = {
        ...adjustment,
        id: `adj_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(ADMIN_ADJUSTMENTS_KEY, JSON.stringify([newAdjustment]));
      return newAdjustment;
    } catch {
      return null;
    }
  }
};

// Get ALL adjustments this month from ALL admins for a specific USER
const getMonthlyAdjustmentsForUser = (targetUserId: string): AdminAdjustment[] => {
  const adjustments = getAdminAdjustments();
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  return adjustments.filter(adj => {
    const adjDate = new Date(adj.createdAt);
    return adj.userId === targetUserId && 
           adjDate.getMonth() === thisMonth && 
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

  // Get podiatrists only (admin can only adjust podiatrist credits)
  const podiatrists = allUsers.filter(u => u.role === "podiatrist");

  // Get selected user info with fresh data
  const selectedUser = podiatrists.find(u => u.id === selectedUserId);
  
  // Calculate limits using fresh data every time
  const selectedUserLimit = useMemo(() => {
    if (!selectedUserId) return 0;
    return calculateMonthlyLimit(selectedUserId);
  }, [selectedUserId, refreshKey]);
  
  const selectedUserAdjusted = useMemo(() => {
    if (!selectedUserId) return 0;
    const adjustments = getMonthlyAdjustmentsForUser(selectedUserId);
    return adjustments.reduce((sum, adj) => sum + adj.amount, 0);
  }, [selectedUserId, refreshKey]);
  
  const selectedUserRemaining = selectedUserLimit - selectedUserAdjusted;

  // All adjustments for history
  const allAdjustments = useMemo(() => {
    const adjustments = getAdminAdjustments();
    if (filterUserId === "all") return adjustments.slice().reverse();
    return adjustments.filter(adj => adj.userId === filterUserId).reverse();
  }, [filterUserId, refreshKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic validations
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

    // FRESH validation - get latest data right now
    const freshLimit = calculateMonthlyLimit(selectedUserId);
    const freshAdjustments = getMonthlyAdjustmentsForUser(selectedUserId);
    const freshTotalAdjusted = freshAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
    const freshRemaining = freshLimit - freshTotalAdjusted;

    console.log("[Admin Credits] Validación:", {
      usuario: selectedUser?.name,
      limite: freshLimit,
      yaAjustado: freshTotalAdjusted,
      disponible: freshRemaining,
      intentando: amount
    });

    if (amount > freshRemaining) {
      setError(`Límite excedido. Este usuario solo puede recibir ${freshRemaining} créditos más este mes (${freshTotalAdjusted}/${freshLimit} ya asignados por todos los admins)`);
      return;
    }

    // Save adjustment record FIRST
    const savedAdj = saveAdminAdjustment({
      userId: selectedUserId,
      userName: selectedUser?.name || "",
      amount,
      reason,
      adminId: currentUser?.id || "",
      adminName: currentUser?.name || "",
    });

    if (!savedAdj) {
      setError("Error al guardar el registro. Intente de nuevo.");
      return;
    }

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

    // Add audit log
    addAuditLog({
      userId: currentUser?.id || "",
      userName: currentUser?.name || "",
      action: "ADMIN_CREDIT_ADJUSTMENT",
      entityType: "credit",
      entityId: selectedUserId,
      details: JSON.stringify({
        targetUserId: selectedUserId,
        targetUserName: selectedUser?.name,
        amount,
        reason,
        totalAdjustedAfter: freshTotalAdjusted + amount,
        monthlyLimit: freshLimit,
      }),
    });

    const addedAmount = amount;
    const userName = selectedUser?.name;
    
    // Reset form
    setAmount(1);
    setReason("");
    setSelectedUserId("");
    setSuccess(`✓ Se añadieron ${addedAmount} créditos a ${userName}`);
    
    // Refresh data and reload page
    setRefreshKey(prev => prev + 1);
    setTimeout(() => window.location.reload(), 1500);
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
              <p className="text-sm font-medium text-blue-900">Límite de ajuste compartido</p>
              <p className="text-xs text-blue-700 mt-1">
                Solo puedes añadir hasta el 10% de los créditos mensuales de cada usuario. 
                <strong> Este límite es compartido entre TODOS los administradores.</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Adjustment Form */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Añadir Créditos</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {success}
                <p className="text-xs mt-1">Recargando página...</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setRefreshKey(prev => prev + 1);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none"
                >
                  <option value="">Seleccionar usuario...</option>
                  {podiatrists.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Show limit info when user selected */}
              {selectedUserId && (
                <div className={`p-3 rounded-lg ${selectedUserRemaining > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-sm font-medium">
                    Límite para {selectedUser?.name}: {selectedUserLimit} créditos/mes
                  </p>
                  <p className="text-xs mt-1">
                    Ya asignados (todos los admins): {selectedUserAdjusted} | 
                    <strong> Disponibles: {selectedUserRemaining}</strong>
                  </p>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad de créditos
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedUserRemaining || 100}
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo (mínimo 20 caracteres)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Explica el motivo del ajuste..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{reason.length}/20 caracteres</p>
              </div>

              <button
                type="submit"
                disabled={!selectedUserId || amount <= 0 || reason.length < 20 || selectedUserRemaining <= 0}
                className="w-full py-2 px-4 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Añadir Créditos
              </button>
            </form>
          </div>

          {/* History */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1a1a1a]">Historial de Ajustes</h3>
              <button 
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="text-sm text-blue-600 hover:underline"
              >
                🔄 Actualizar
              </button>
            </div>
            
            <div className="mb-4">
              <select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1a1a1a] outline-none"
              >
                <option value="all">Todos los usuarios</option>
                {podiatrists.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {allAdjustments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay ajustes registrados
                </p>
              ) : (
                allAdjustments.map((adj) => (
                  <div key={adj.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{adj.userName}</span>
                      <span className="text-green-600 font-semibold">+{adj.amount}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{adj.reason}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>Por: {adj.adminName}</span>
                      <span>{new Date(adj.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminCreditsPage;
