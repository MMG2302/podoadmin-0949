import { useState, useMemo } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth, getAllUsers, User } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import {
  getUserCredits,
  getClinicCredits,
  getClinicAvailableCredits,
  distributeCreditsToDoctor,
  getCreditDistributions,
  initializeClinicCredits,
  addAuditLog,
  CreditDistribution,
} from "../lib/storage";

const DistributeCreditsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isClinicAdmin } = usePermissions();
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPodiatrist, setSelectedPodiatrist] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get clinic info
  const clinicId = user?.clinicId || "";
  
  // Initialize clinic credits if not exists
  const clinicCredits = useMemo(() => {
    if (!clinicId) return null;
    const credits = getClinicCredits(clinicId);
    if (!credits) {
      return initializeClinicCredits(clinicId, 500);
    }
    return credits;
  }, [clinicId, refreshKey]);
  
  const availableCredits = useMemo(() => {
    if (!clinicId) return 0;
    return getClinicAvailableCredits(clinicId);
  }, [clinicId, refreshKey]);

  // Get podiatrists in the clinic
  const allUsers = getAllUsers();
  const clinicPodiatrists = useMemo(() => {
    return allUsers.filter(u => u.role === "podiatrist" && u.clinicId === clinicId);
  }, [allUsers, clinicId]);

  // Get distribution history
  const distributions = useMemo(() => {
    return getCreditDistributions(clinicId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [clinicId, refreshKey]);

  // Get podiatrist credits
  const getPodiatristCredits = (podId: string) => {
    const credits = getUserCredits(podId);
    return credits.monthlyCredits + credits.extraCredits - credits.reservedCredits;
  };

  const getPodiatristName = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    return user?.name || "Usuario desconocido";
  };

  const handleDistribute = () => {
    setError("");
    setSuccess("");

    if (!selectedPodiatrist) {
      setError("Selecciona un podólogo");
      return;
    }

    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Ingresa una cantidad válida mayor a 0");
      return;
    }

    if (!reason.trim()) {
      setError("Ingresa una razón para la distribución");
      return;
    }

    const result = distributeCreditsToDoctor(
      clinicId,
      selectedPodiatrist,
      amountNum,
      user?.id || "",
      reason.trim()
    );

    if (!result.success) {
      setError(result.error || "Error al distribuir créditos");
      return;
    }

    // Log audit
    addAuditLog({
      userId: user?.id || "",
      userName: user?.name || "",
      action: "CREDIT_DISTRIBUTION",
      entityType: "credit",
      entityId: result.distribution?.id || "",
      details: JSON.stringify({
        clinicId,
        toPodiatrist: selectedPodiatrist,
        toPodiatristName: getPodiatristName(selectedPodiatrist),
        amount: amountNum,
        reason: reason.trim(),
      }),
    });

    setSuccess(`Se distribuyeron ${amountNum} créditos a ${getPodiatristName(selectedPodiatrist)}`);
    setSelectedPodiatrist("");
    setAmount("");
    setReason("");
    setRefreshKey(k => k + 1);
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

  // Redirect non-clinic admins
  if (!isClinicAdmin) {
    return (
      <MainLayout title="Acceso Denegado">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">Acceso Denegado</h2>
            <p className="text-gray-500">Solo los administradores de clínica pueden acceder a esta página.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Distribuir Créditos">
      <div className="space-y-6">
        {/* Clinic Credit Pool Info */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pool de Créditos de la Clínica</h2>
            <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-white/60 text-sm">Créditos Totales</p>
              <p className="text-3xl font-bold">{clinicCredits?.totalCredits || 0}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Distribuidos</p>
              <p className="text-3xl font-bold">{clinicCredits?.distributedToDate || 0}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Disponibles</p>
              <p className="text-3xl font-bold text-green-400">{availableCredits}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Distribuir Créditos a Podólogo</h3>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  Podólogo
                </label>
                <select
                  value={selectedPodiatrist}
                  onChange={(e) => setSelectedPodiatrist(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                >
                  <option value="">Seleccionar podólogo...</option>
                  {clinicPodiatrists.map(pod => (
                    <option key={pod.id} value={pod.id}>
                      {pod.name} ({getPodiatristCredits(pod.id)} créditos)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  Cantidad de créditos
                </label>
                <input
                  type="number"
                  min="1"
                  max={availableCredits}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej: 50"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo disponible: {availableCredits} créditos
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  Razón
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Asignación mensual, Créditos adicionales para campaña..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleDistribute}
                disabled={availableCredits === 0}
                className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl hover:bg-[#2a2a2a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Distribuir Créditos
              </button>
            </div>
          </div>

          {/* Podiatrists Current Credits */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Créditos por Podólogo</h3>
            
            {clinicPodiatrists.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay podólogos en esta clínica</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clinicPodiatrists.map(pod => {
                  const credits = getUserCredits(pod.id);
                  const total = credits.monthlyCredits + credits.extraCredits - credits.reservedCredits;
                  return (
                    <div 
                      key={pod.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white font-medium">
                          {pod.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[#1a1a1a]">{pod.name}</p>
                          <p className="text-xs text-gray-500">{pod.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#1a1a1a]">{total}</p>
                        <p className="text-xs text-gray-500">créditos</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Distribution History */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Historial de Distribuciones</h3>
          
          {distributions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No hay distribuciones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Podólogo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Cantidad</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Razón</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((dist) => (
                    <tr key={dist.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(dist.createdAt)}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#1a1a1a]">
                          {getPodiatristName(dist.toPodiatrist)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          +{dist.amount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                        {dist.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DistributeCreditsPage;
