import { useState, useMemo, useEffect, useCallback } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth, getAllUsers, User } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { api } from "../lib/api-client";

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  podiatrist: User | null;
  type: "add" | "subtract";
  maxAmount: number;
  onSubmit: (amount: number, reason: string) => void;
  error: string;
}

const CreditModal = ({ isOpen, onClose, podiatrist, type, maxAmount, onSubmit, error }: CreditModalProps) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) return;
    onSubmit(amountNum, reason);
  };

  const handleClose = () => {
    setAmount("");
    setReason("");
    onClose();
  };

  if (!isOpen || !podiatrist) return null;

  const isAdd = type === "add";
  const title = isAdd ? "Agregar Créditos" : "Restar Créditos";
  const buttonText = isAdd ? "Agregar" : "Restar";
  const buttonColor = isAdd ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className={`px-6 py-4 ${isAdd ? "bg-green-600" : "bg-red-600"} text-white`}>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Podólogo</label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white font-medium">
                {podiatrist.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-[#1a1a1a]">{podiatrist.name}</p>
                <p className="text-xs text-gray-500">{podiatrist.email}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Cantidad de créditos
            </label>
            <input
              type="number"
              min="1"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ej: 50"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              {isAdd ? `Máximo disponible en pool: ${maxAmount}` : `Máximo disponible del podólogo: ${maxAmount}`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Razón <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isAdd 
                ? "Ej: Créditos adicionales para alta demanda..." 
                : "Ej: Reasignación de créditos a otro podólogo..."
              }
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 border border-gray-200 text-[#1a1a1a] rounded-xl hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!amount || !reason.trim() || parseInt(amount) > maxAmount}
            className={`flex-1 py-3 ${buttonColor} text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

type ClinicCreditsApi = { clinicId: string; totalCredits: number; distributedToDate: number; available: number };
type DistributionApi = { id: string; clinicId: string; userId: string; toPodiatrist: string; amount: number; reason?: string; createdAt: string };

const DistributeCreditsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isClinicAdmin } = usePermissions();
  
  const clinicId = user?.clinicId || "";
  const [clinicCredits, setClinicCredits] = useState<ClinicCreditsApi | null>(null);
  const [distributions, setDistributions] = useState<DistributionApi[]>([]);
  const [creditsByUser, setCreditsByUser] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  
  const [selectedPodiatrist, setSelectedPodiatrist] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "subtract">("add");
  const [modalPodiatrist, setModalPodiatrist] = useState<User | null>(null);
  const [modalError, setModalError] = useState("");

  const loadClinicData = useCallback(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      api.get<{ success?: boolean; credits?: ClinicCreditsApi }>(`/clinic-credits/${clinicId}`),
      api.get<{ success?: boolean; distributions?: DistributionApi[] }>(`/clinic-credits/${clinicId}/distributions`),
      api.get<{ success?: boolean; byUser?: Record<string, number> }>(`/credits/balances?clinicId=${clinicId}`),
    ]).then(([credRes, distRes, balRes]) => {
      if (credRes.success && credRes.data?.credits) setClinicCredits(credRes.data.credits);
      if (distRes.success && Array.isArray(distRes.data?.distributions)) setDistributions(distRes.data.distributions);
      if (balRes.success && balRes.data?.byUser && typeof balRes.data.byUser === "object") setCreditsByUser(balRes.data.byUser);
    }).finally(() => setLoading(false));
  }, [clinicId]);

  useEffect(() => {
    loadClinicData();
  }, [loadClinicData]);

  const availableCredits = clinicCredits?.available ?? 0;

  const allUsers = getAllUsers();
  const clinicPodiatrists = useMemo(() => {
    return allUsers.filter(u => u.role === "podiatrist" && u.clinicId === clinicId);
  }, [allUsers, clinicId]);

  // Get podiatrist credits
  const getPodiatristCredits = (podId: string) => {
    return creditsByUser[podId] ?? 0;
  };

  const getPodiatristName = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    return user?.name || "Usuario desconocido";
  };

  const handleDistribute = async () => {
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

    const res = await api.post<{ success?: boolean; error?: string }>(`/clinic-credits/${clinicId}/distribute`, {
      userId: selectedPodiatrist,
      amount: amountNum,
      reason: reason.trim(),
    });

    if (!res.success) {
      setError(res.error || (res.data as { error?: string })?.error || "Error al distribuir créditos");
      return;
    }

    setSuccess(`Se distribuyeron ${amountNum} créditos a ${getPodiatristName(selectedPodiatrist)}`);
    setSelectedPodiatrist("");
    setAmount("");
    setReason("");
    loadClinicData();
  };

  const handleOpenAddModal = (pod: User) => {
    setModalPodiatrist(pod);
    setModalType("add");
    setModalError("");
    setModalOpen(true);
  };

  const handleOpenSubtractModal = (pod: User) => {
    setModalPodiatrist(pod);
    setModalType("subtract");
    setModalError("");
    setModalOpen(true);
  };

  const handleModalSubmit = async (amountNum: number, reasonText: string) => {
    if (!modalPodiatrist) return;
    
    setModalError("");

    if (!reasonText.trim()) {
      setModalError("Ingresa una razón");
      return;
    }

    if (modalType === "add") {
      const res = await api.post<{ success?: boolean; error?: string }>(`/clinic-credits/${clinicId}/distribute`, {
        userId: modalPodiatrist.id,
        amount: amountNum,
        reason: reasonText.trim(),
      });

      if (!res.success) {
        setModalError(res.error || (res.data as { error?: string })?.error || "Error al agregar créditos");
        return;
      }

      setSuccess(`Se agregaron ${amountNum} créditos a ${modalPodiatrist.name}`);
    } else {
      const res = await api.post<{ success?: boolean; error?: string }>(`/clinic-credits/${clinicId}/subtract`, {
        userId: modalPodiatrist.id,
        amount: amountNum,
        reason: reasonText.trim(),
      });

      if (!res.success) {
        setModalError(res.error || (res.data as { error?: string })?.error || "Error al restar créditos");
        return;
      }

      setSuccess(`Se restaron ${amountNum} créditos de ${modalPodiatrist.name} y se devolvieron al pool`);
    }

    setModalOpen(false);
    setModalPodiatrist(null);
    loadClinicData();
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

  const getModalMaxAmount = () => {
    if (!modalPodiatrist) return 0;
    if (modalType === "add") return availableCredits;
    return getPodiatristCredits(modalPodiatrist.id);
  };

  return (
    <MainLayout title="Distribuir Créditos">
      <div className="space-y-6">
        {/* Credit Modal */}
        <CreditModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setModalPodiatrist(null);
            setModalError("");
          }}
          podiatrist={modalPodiatrist}
          type={modalType}
          maxAmount={getModalMaxAmount()}
          onSubmit={handleModalSubmit}
          error={modalError}
        />

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="text-green-600 hover:text-green-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

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
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Distribución Inicial</h3>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                {error}
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
                  const total = getPodiatristCredits(pod.id);
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
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-2">
                          <p className="text-xl font-bold text-[#1a1a1a]">{total}</p>
                          <p className="text-xs text-gray-500">créditos</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenAddModal(pod)}
                            disabled={availableCredits === 0}
                            title="Agregar créditos desde el pool"
                            className="w-9 h-9 flex items-center justify-center bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleOpenSubtractModal(pod)}
                            disabled={total === 0}
                            title="Restar créditos y devolver al pool"
                            className="w-9 h-9 flex items-center justify-center bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                        </div>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Cantidad</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Razón</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((dist) => {
                    const isSubtraction = dist.amount < 0;
                    return (
                      <tr key={dist.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(dist.createdAt)}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-[#1a1a1a]">
                            {getPodiatristName(dist.toPodiatrist)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            isSubtraction 
                              ? "bg-orange-100 text-orange-700" 
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {isSubtraction ? "Retiro" : "Asignación"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                            isSubtraction 
                              ? "bg-red-100 text-red-700" 
                              : "bg-green-100 text-green-700"
                          }`}>
                            {isSubtraction ? "" : "+"}{dist.amount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                          {dist.reason}
                        </td>
                      </tr>
                    );
                  })}
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
