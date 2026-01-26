import { useState, useEffect } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth, getAllUsers, User, UserRole } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { 
  getUserCredits, 
  getPatients, 
  getSessions, 
  getCreditTransactions, 
  updateUserCredits,
  addCreditTransaction,
  addAuditLog,
  exportPatientData,
  generateId,
  saveCreatedUser,
  getClinicCredits,
  getClinicAvailableCredits,
  updateClinicCredits,
  addClinicCredits,
  initializeClinicCredits,
  updateMonthlyRenewalAmount,
  blockUser,
  unblockUser,
  enableUser,
  disableUser,
  banUser,
  unbanUser,
  deleteCreatedUser,
  Patient,
  ClinicalSession,
  CreditTransaction,
} from "../lib/storage";

interface UserWithData extends User {
  credits: {
    monthly: number;
    extra: number;
    reserved: number;
    total: number;
  };
  patientCount: number;
  sessionCount: number;
}

// Create User Modal
const CreateUserModal = ({ 
  isOpen, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (user: Partial<User> & { password: string }) => void;
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "podiatrist" as UserRole,
    clinicId: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({ name: "", email: "", password: "", role: "podiatrist", clinicId: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#1a1a1a]">Crear nuevo usuario</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
            >
              <option value="podiatrist">Podólogo</option>
              <option value="clinic_admin">Administrador de Clínica</option>
              <option value="admin">Soporte</option>
              <option value="super_admin">Super Administrador</option>
            </select>
          </div>
          {(formData.role === "podiatrist" || formData.role === "clinic_admin") && (
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Clínica ID</label>
              <input
                type="text"
                value={formData.clinicId}
                onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                placeholder="clinic_001"
              />
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[#1a1a1a] font-medium hover:bg-gray-50 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors"
            >
              {t.common.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal
const EditUserModal = ({ 
  isOpen, 
  onClose, 
  user,
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: User | null;
  onSave: (userId: string, updates: Partial<User>) => void;
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "podiatrist" as UserRole,
    clinicId: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId || "",
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#1a1a1a]">Editar usuario</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
            >
              <option value="podiatrist">Podólogo</option>
              <option value="clinic_admin">Administrador de Clínica</option>
              <option value="admin">Soporte</option>
              <option value="super_admin">Super Administrador</option>
            </select>
          </div>
          {(formData.role === "podiatrist" || formData.role === "clinic_admin") && (
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Clínica ID</label>
              <input
                type="text"
                value={formData.clinicId}
                onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                placeholder="clinic_001"
              />
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[#1a1a1a] font-medium hover:bg-gray-50 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors"
            >
              {t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Credit Adjustment Modal
const CreditAdjustmentModal = ({ 
  isOpen, 
  onClose, 
  user,
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: User | null;
  onSave: (userId: string, amount: number, isAdd: boolean, reason: string) => { success: boolean; error?: string };
}) => {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(0);
  const [isAdd, setIsAdd] = useState(true);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAuth().user;

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    setError(null);
    const result = onSave(user.id, amount, isAdd, reason);
    
    if (result.success) {
      setAmount(0);
      setReason("");
      setError(null);
      onClose();
    } else {
      setError(result.error || "Error al ajustar los créditos");
    }
  };

  const userCredits = getUserCredits(user.id);
  const isClinicAdminUser = user.role === "clinic_admin";
  const isPodiatristWithClinic = user.role === "podiatrist" && user.clinicId;
  const isIndependentPodiatrist = user.role === "podiatrist" && !user.clinicId;
  
  // Get clinic credits if user is clinic_admin
  const clinicCredits = isClinicAdminUser && user.clinicId 
    ? (getClinicCredits(user.clinicId) || initializeClinicCredits(user.clinicId, 500))
    : null;
  const clinicAvailableCredits = isClinicAdminUser && user.clinicId
    ? getClinicAvailableCredits(user.clinicId)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#1a1a1a]">Ajustar créditos</h3>
          <p className="text-sm text-gray-500 mt-1">{user.name}</p>
          {/* Show credit type label */}
          <div className="mt-2">
            {isClinicAdminUser && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Pool de Clínica
              </span>
            )}
            {isPodiatristWithClinic && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Créditos Personales (en clínica)
              </span>
            )}
            {isIndependentPodiatrist && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Créditos Personales (independiente)
              </span>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Credit type explanation */}
          {isClinicAdminUser && (
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
              <p className="text-xs text-purple-700">
                <strong>Pool de Clínica:</strong> Estos créditos serán distribuidos por el administrador de la clínica a sus podólogos.
              </p>
            </div>
          )}
          {isPodiatristWithClinic && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Créditos Personales:</strong> Este podólogo pertenece a una clínica. Estos créditos son adicionales a los que recibe de su clínica (para correcciones).
              </p>
            </div>
          )}
          
          {/* Current balance */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Saldo actual</p>
            {isClinicAdminUser && clinicCredits ? (
              <div className="flex gap-4 mt-2">
                <div>
                  <span className="text-lg font-semibold text-[#1a1a1a]">{clinicCredits.totalCredits}</span>
                  <span className="text-xs text-gray-500 ml-1">total en pool</span>
                </div>
                <div>
                  <span className="text-lg font-semibold text-[#1a1a1a]">{clinicCredits.distributedToDate}</span>
                  <span className="text-xs text-gray-500 ml-1">distribuidos</span>
                </div>
                <div>
                  <span className="text-lg font-semibold text-green-600">{clinicAvailableCredits}</span>
                  <span className="text-xs text-gray-500 ml-1">disponibles</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 mt-2">
                <div>
                  <span className="text-lg font-semibold text-[#1a1a1a]">{userCredits.monthlyCredits}</span>
                  <span className="text-xs text-gray-500 ml-1">mensuales</span>
                </div>
                <div>
                  <span className="text-lg font-semibold text-[#1a1a1a]">{userCredits.extraCredits}</span>
                  <span className="text-xs text-gray-500 ml-1">extra</span>
                </div>
              </div>
            )}
          </div>

          {/* Add/Subtract toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAdd(true)}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                isAdd 
                  ? "bg-green-100 text-green-700 border-2 border-green-500" 
                  : "bg-gray-100 text-gray-600 border-2 border-transparent"
              }`}
            >
              + Añadir
            </button>
            <button
              type="button"
              onClick={() => setIsAdd(false)}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                !isAdd 
                  ? "bg-red-100 text-red-700 border-2 border-red-500" 
                  : "bg-gray-100 text-gray-600 border-2 border-transparent"
              }`}
            >
              - Restar
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => {
                setAmount(parseInt(e.target.value) || 0);
                setError(null); // Clear error when user changes amount
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null); // Clear error when user types
              }}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors resize-none"
              placeholder="Explica el motivo del ajuste..."
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[#1a1a1a] font-medium hover:bg-gray-50 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || amount <= 0}
              className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.common.confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Monthly Renewal Amount Modal
const MonthlyRenewalModal = ({ 
  isOpen, 
  onClose, 
  user,
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: User | null;
  onSave: (userId: string, renewalAmount: number) => void;
}) => {
  const { t } = useLanguage();
  const [renewalAmount, setRenewalAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAuth().user;

  useEffect(() => {
    if (user) {
      const userCredits = getUserCredits(user.id);
      setRenewalAmount(userCredits.monthlyRenewalAmount ?? userCredits.monthlyCredits);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (renewalAmount < 0) {
      setError("La cantidad debe ser mayor o igual a 0");
      return;
    }
    
    setError(null);
    onSave(user.id, renewalAmount);
    onClose();
  };

  const userCredits = getUserCredits(user.id);
  const currentRenewalAmount = userCredits.monthlyRenewalAmount ?? userCredits.monthlyCredits;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#1a1a1a]">Gestionar Renovación Mensual</h3>
          <p className="text-sm text-gray-500 mt-1">{user.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Renovación Mensual:</strong> Esta es la cantidad de créditos que se renovarán automáticamente cada mes para este usuario.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">Valor actual de renovación mensual</p>
            <p className="text-2xl font-semibold text-[#1a1a1a]">{currentRenewalAmount} créditos/mes</p>
            <p className="text-xs text-gray-500 mt-1">
              Créditos mensuales actuales: {userCredits.monthlyCredits}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
              Nueva cantidad de renovación mensual
            </label>
            <input
              type="number"
              min="0"
              value={renewalAmount}
              onChange={(e) => {
                setRenewalAmount(parseInt(e.target.value) || 0);
                setError(null);
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Establece cuántos créditos se renovarán cada mes para este usuario.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[#1a1a1a] font-medium hover:bg-gray-50 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Transfer History Modal
const TransferHistoryModal = ({ 
  isOpen, 
  onClose, 
  allUsers
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  allUsers: User[];
}) => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [sourceUserId, setSourceUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const sourceUser = allUsers.find(u => u.id === sourceUserId);
  const sourcePatients = getPatients().filter(p => p.createdBy === sourceUserId);

  const handleTransfer = async () => {
    if (!sourceUserId || !targetUserId || sourceUserId === targetUserId) return;
    
    setIsTransferring(true);
    
    try {
      // Get all patients and sessions for source user
      const patients = getPatients();
      const sessions = getSessions();
      
      const sourcePatientIds = patients
        .filter(p => p.createdBy === sourceUserId)
        .map(p => p.id);
      
      // Update patients to new owner
      const updatedPatients = patients.map(p => {
        if (p.createdBy === sourceUserId) {
          return { ...p, createdBy: targetUserId, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      
      // Update sessions to new owner
      const updatedSessions = sessions.map(s => {
        if (s.createdBy === sourceUserId) {
          return { ...s, createdBy: targetUserId, updatedAt: new Date().toISOString() };
        }
        return s;
      });
      
      // Save to localStorage
      localStorage.setItem("podoadmin_patients", JSON.stringify(updatedPatients));
      localStorage.setItem("podoadmin_sessions", JSON.stringify(updatedSessions));
      
      // Add audit log
      const targetUser = allUsers.find(u => u.id === targetUserId);
      addAuditLog({
        userId: currentUser?.id || "",
        userName: currentUser?.name || "",
        action: "TRANSFER",
        entityType: "clinical_history",
        entityId: sourceUserId,
        details: JSON.stringify({
          action: "clinical_history_transfer",
          sourceUserId: sourceUserId,
          sourceUserName: sourceUser?.name,
          targetUserId: targetUserId,
          targetUserName: targetUser?.name,
          patientsTransferred: sourcePatientIds.length,
        }),
      });
      
      setResult({
        success: true,
        message: `Se han transferido ${sourcePatientIds.length} pacientes correctamente.`
      });
    } catch (error) {
      setResult({
        success: false,
        message: "Error al transferir los datos."
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#1a1a1a]">Transferir historial clínico</h3>
          <p className="text-sm text-gray-500 mt-1">Copiar todos los pacientes y sesiones de un usuario a otro</p>
        </div>
        <div className="p-6 space-y-4">
          {result ? (
            <div className={`p-4 rounded-lg ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              <p className="font-medium">{result.success ? "¡Éxito!" : "Error"}</p>
              <p className="text-sm mt-1">{result.message}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Usuario origen</label>
                <select
                  value={sourceUserId}
                  onChange={(e) => setSourceUserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                >
                  <option value="">Seleccionar usuario...</option>
                  {allUsers.filter(u => u.role === "podiatrist").map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              {sourceUserId && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-[#1a1a1a]">{sourcePatients.length}</span> pacientes para transferir
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Usuario destino</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                >
                  <option value="">Seleccionar usuario...</option>
                  {allUsers.filter(u => u.role === "podiatrist" && u.id !== sourceUserId).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700">
                  <strong>Advertencia:</strong> Esta acción transferirá la propiedad de todos los pacientes y sesiones. El usuario origen perderá acceso a estos datos.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setSourceUserId("");
                setTargetUserId("");
                onClose();
              }}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[#1a1a1a] font-medium hover:bg-gray-50 transition-colors"
            >
              {result ? "Cerrar" : t.common.cancel}
            </button>
            {!result && (
              <button
                onClick={handleTransfer}
                disabled={!sourceUserId || !targetUserId || sourceUserId === targetUserId || isTransferring}
                className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTransferring ? "Transfiriendo..." : "Transferir"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// User Profile/Details Modal
const UserProfileModal = ({ 
  isOpen, 
  onClose, 
  user 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: User | null;
}) => {
  const { t } = useLanguage();
  
  if (!isOpen || !user) return null;
  
  const userCredits = getUserCredits(user.id);
  const patients = getPatients().filter(p => p.createdBy === user.id);
  const sessions = getSessions().filter(s => s.createdBy === user.id);
  const transactions = getCreditTransactions(user.id);

  const roleLabel = {
    super_admin: t.roles.superAdmin,
    clinic_admin: t.roles.clinicAdmin,
    admin: t.roles.admin,
    podiatrist: t.roles.podiatrist,
  }[user.role];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-8">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#1a1a1a] rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-medium">{user.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1a1a1a]">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.role === "super_admin" ? "bg-[#1a1a1a] text-white" :
            user.role === "clinic_admin" ? "bg-blue-100 text-blue-700" :
            user.role === "admin" ? "bg-orange-100 text-orange-700" :
            "bg-gray-100 text-gray-700"
          }`}>
            {roleLabel}
          </span>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Pacientes</p>
              <p className="text-2xl font-semibold text-[#1a1a1a]">{patients.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Sesiones</p>
              <p className="text-2xl font-semibold text-[#1a1a1a]">{sessions.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Créditos mensuales</p>
              <p className="text-2xl font-semibold text-[#1a1a1a]">{userCredits.monthlyCredits}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Créditos extra</p>
              <p className="text-2xl font-semibold text-[#1a1a1a]">{userCredits.extraCredits}</p>
            </div>
          </div>

          {/* Patients list */}
          {patients.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#1a1a1a] mb-3">Pacientes ({patients.length})</h4>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {patients.slice(0, 10).map((patient) => (
                  <div key={patient.id} className="p-3 flex items-center justify-between">
                    <span className="text-sm text-[#1a1a1a]">{patient.firstName} {patient.lastName}</span>
                    <span className="text-xs text-gray-500">{patient.email}</span>
                  </div>
                ))}
                {patients.length > 10 && (
                  <div className="p-3 text-center">
                    <span className="text-xs text-gray-500">...y {patients.length - 10} más</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent transactions */}
          {transactions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#1a1a1a] mb-3">Historial de créditos</h4>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#1a1a1a]">{tx.description}</p>
                      <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-sm font-medium ${
                      tx.type === "consumption" || tx.type === "reservation" ? "text-red-600" : "text-green-600"
                    }`}>
                      {tx.type === "consumption" || tx.type === "reservation" ? "-" : "+"}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Users Page
const UsersPage = () => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const credits = getUserCredits(currentUser?.id || "");
  const allUsers = getAllUsers();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Enhance users with additional data
  const usersWithData: UserWithData[] = allUsers.map(u => {
    const userCredits = getUserCredits(u.id);
    const patients = getPatients().filter(p => p.createdBy === u.id);
    const sessions = getSessions().filter(s => s.createdBy === u.id);
    
    return {
      ...u,
      credits: {
        monthly: userCredits.monthlyCredits,
        extra: userCredits.extraCredits,
        reserved: userCredits.reservedCredits,
        total: userCredits.monthlyCredits + userCredits.extraCredits - userCredits.reservedCredits,
      },
      patientCount: patients.length,
      sessionCount: sessions.length,
    };
  });

  // Filter users
  const filteredUsers = usersWithData.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleLabels = {
    super_admin: t.roles.superAdmin,
    clinic_admin: t.roles.clinicAdmin,
    admin: t.roles.admin,
    podiatrist: t.roles.podiatrist,
  };

  // Función auxiliar para obtener el estado visual de un usuario
  const getUserStatusBadge = (user: User) => {
    if (user.isBanned) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Baneado
        </span>
      );
    }
    if (user.isBlocked) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Bloqueado
        </span>
      );
    }
    if (user.isEnabled === false) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Deshabilitado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Activo
      </span>
    );
  };

  // Verificar si el usuario es creado (puede ser gestionado)
  const isCreatedUser = (userId: string): boolean => {
    return userId.startsWith("user_created_");
  };

  const handleCreateUser = (userData: Partial<User> & { password: string }) => {
    try {
      // Save the user to localStorage so they can log in
      const newUser = saveCreatedUser(
        {
          email: userData.email || "",
          name: userData.name || "",
          role: userData.role || "podiatrist",
          clinicId: userData.clinicId,
        },
        userData.password,
        currentUser?.id || ""
      );
      
      // Add audit log
      addAuditLog({
        userId: currentUser?.id || "",
        userName: currentUser?.name || "",
        action: "CREATE",
        entityType: "user",
        entityId: newUser.id,
        details: JSON.stringify({
          action: "user_create",
          newUserName: userData.name,
          newUserEmail: userData.email,
          newUserRole: userData.role,
          newUserClinicId: userData.clinicId,
        }),
      });
      
      // Refresh users list
      setUsers(loadUsersWithData());
      
      // Show success (toast would be better but using alert for simplicity)
      alert("Usuario creado exitosamente. El usuario puede iniciar sesión inmediatamente.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al crear usuario");
    }
  };

  const handleEditUser = (userId: string, updates: Partial<User>) => {
    // In a real app, this would update the user in the backend
    console.log("Updating user:", userId, updates);
    addAuditLog({
      userId: currentUser?.id || "",
      userName: currentUser?.name || "",
      action: "UPDATE",
      entityType: "user",
      entityId: userId,
      details: JSON.stringify({
        action: "user_update",
        targetUserId: userId,
        targetUserName: updates.name,
      }),
    });
  };

  const handleMonthlyRenewalUpdate = (userId: string, renewalAmount: number): void => {
    const targetUser = getAllUsers().find(u => u.id === userId);
    
    // Actualizar la cantidad de renovación mensual
    updateMonthlyRenewalAmount(userId, renewalAmount);
    
    // Agregar log de auditoría
    addAuditLog({
      userId: currentUser?.id || "",
      userName: currentUser?.name || "",
      action: "UPDATE_MONTHLY_RENEWAL",
      entityType: "credit",
      entityId: userId,
      details: JSON.stringify({
        action: "update_monthly_renewal_amount",
        targetUserId: userId,
        targetUserName: targetUser?.name,
        newRenewalAmount: renewalAmount,
      }),
    });
    
    // Forzar actualización de la lista
    window.dispatchEvent(new Event("creditsUpdated"));
  };

  const handleCreditAdjustment = (userId: string, amount: number, isAdd: boolean, reason: string): { success: boolean; error?: string } => {
    const targetUser = getAllUsers().find(u => u.id === userId);
    
    // If user is clinic_admin, adjust clinic pool credits
    if (targetUser?.role === "clinic_admin" && targetUser.clinicId) {
      const clinicId = targetUser.clinicId;
      let clinicCredits = getClinicCredits(clinicId);
      
      if (!clinicCredits) {
        clinicCredits = initializeClinicCredits(clinicId, 500);
      }
      
      if (isAdd) {
        // Add to total pool
        addClinicCredits(clinicId, amount);
      } else {
        // Subtract from total pool (but can't go below distributed amount)
        const available = getClinicAvailableCredits(clinicId);
        if (amount > available) {
          // Can't subtract more than available
          return {
            success: false,
            error: `No se pueden restar ${amount} créditos. Solo hay ${available} créditos disponibles en el pool.`,
          };
        }
        const newTotal = Math.max(clinicCredits.distributedToDate, clinicCredits.totalCredits - amount);
        updateClinicCredits(clinicId, newTotal);
      }
      
      addAuditLog({
        userId: currentUser?.id || "",
        userName: currentUser?.name || "",
        action: isAdd ? "ADD_CLINIC_POOL_CREDITS" : "SUBTRACT_CLINIC_POOL_CREDITS",
        entityType: "clinic_credit",
        entityId: clinicId,
        details: JSON.stringify({
          action: "manual_clinic_pool_adjustment",
          clinicId: clinicId,
          clinicAdminUserId: userId,
          clinicAdminName: targetUser?.name,
          amount: amount,
          adjustmentType: isAdd ? "add" : "subtract",
          reason: reason,
        }),
      });
      
      return { success: true };
    } else {
      // Original logic for podiatrists
      const userCredits = getUserCredits(userId);
      
      if (isAdd) {
        userCredits.extraCredits += amount;
      } else {
        // Subtract from extra first, then monthly
        const totalAvailable = userCredits.monthlyCredits + userCredits.extraCredits - userCredits.reservedCredits;
        if (amount > totalAvailable) {
          return {
            success: false,
            error: `No se pueden restar ${amount} créditos. El usuario solo tiene ${totalAvailable} créditos disponibles.`,
          };
        }
        
        if (userCredits.extraCredits >= amount) {
          userCredits.extraCredits -= amount;
        } else {
          const remaining = amount - userCredits.extraCredits;
          userCredits.extraCredits = 0;
          userCredits.monthlyCredits = Math.max(0, userCredits.monthlyCredits - remaining);
        }
      }
      
      updateUserCredits(userCredits);
      
      addCreditTransaction({
        userId,
        type: isAdd ? "purchase" : "consumption",
        amount,
        description: `Ajuste administrativo: ${reason}`,
      });
      
      addAuditLog({
        userId: currentUser?.id || "",
        userName: currentUser?.name || "",
        action: isAdd ? "ADD_CREDITS" : "SUBTRACT_CREDITS",
        entityType: "credit",
        entityId: userId,
        details: JSON.stringify({
          action: "manual_credit_adjustment",
          targetUserId: userId,
          targetUserName: targetUser?.name,
          amount: amount,
          adjustmentType: isAdd ? "add" : "subtract",
          reason: reason,
        }),
      });
      
      return { success: true };
    }
  };

  const handleExportUserData = (user: User) => {
    const patients = getPatients().filter(p => p.createdBy === user.id);
    const sessions = getSessions().filter(s => s.createdBy === user.id);
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.name,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
      },
      patients: patients.map(p => ({
        ...exportPatientData(p.id),
      })),
      statistics: {
        totalPatients: patients.length,
        totalSessions: sessions.length,
      },
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user_${user.id}_clinical_history.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addAuditLog({
      userId: currentUser?.id || "",
      userName: currentUser?.name || "",
      action: "EXPORT",
      entityType: "user_data",
      entityId: user.id,
      details: JSON.stringify({
        action: "user_clinical_history_export",
        targetUserId: user.id,
        targetUserName: user.name,
        patientsExported: patients.length,
        sessionsExported: sessions.length,
        exportType: "json",
      }),
    });
  };

  const handleBlockUser = (user: User) => {
    if (!window.confirm(`¿Estás seguro de que deseas bloquear la cuenta de ${user.name}?`)) {
      return;
    }
    
    const success = blockUser(user.id);
    if (success) {
      addAuditLog({
        userId: currentUser?.id || "",
        userName: currentUser?.name || "",
        action: "BLOCK_USER",
        entityType: "user",
        entityId: user.id,
        details: JSON.stringify({
          action: "block_user",
          targetUserId: user.id,
          targetUserName: user.name,
          targetUserEmail: user.email,
        }),
      });
      window.location.reload(); // Recargar para actualizar la lista
    } else {
      alert("Error al bloquear el usuario. Solo se pueden bloquear usuarios creados.");
    }
  };

  const handleUnblockUser = (user: User) => {
    if (!window.confirm(`¿Estás seguro de que deseas desbloquear la cuenta de ${user.name}?`)) {
      return;
    }
    
    const success = unblockUser(user.id);
    if (success) {
      addAuditLog({
        userId: currentUser?.id || "",
        userName: currentUser?.name || "",
        action: "UNBLOCK_USER",
        entityType: "user",
        entityId: user.id,
        details: JSON.stringify({
          action: "unblock_user",
          targetUserId: user.id,
          targetUserName: user.name,
          targetUserEmail: user.email,
        }),
      });
      window.location.reload(); // Recargar para actualizar la lista
    } else {
      alert("Error al desbloquear el usuario. Solo se pueden desbloquear usuarios creados.");
    }
  };

  const handleEnableUser = async (user: User) => {
    if (!window.confirm(`¿Estás seguro de que deseas habilitar la cuenta de ${user.name}?`)) {
      return;
    }
    
    try {
      const { api } = await import("../lib/api-client");
      const response = await api.post(`/users/${user.id}/enable`);
      
      if (response.success) {
        addAuditLog({
          userId: currentUser?.id || "",
          userName: currentUser?.name || "",
          action: "ENABLE_USER",
          entityType: "user",
          entityId: user.id,
          details: JSON.stringify({
            action: "enable_user",
            targetUserId: user.id,
            targetUserName: user.name,
            targetUserEmail: user.email,
          }),
        });
        // También actualizar localmente para respuesta inmediata
        enableUser(user.id);
        window.location.reload(); // Recargar para actualizar la lista
      } else {
        alert(response.error || "Error al habilitar el usuario");
      }
    } catch (error) {
      console.error("Error habilitando usuario:", error);
      // Fallback a función local
      const success = enableUser(user.id);
      if (success) {
        addAuditLog({
          userId: currentUser?.id || "",
          userName: currentUser?.name || "",
          action: "ENABLE_USER",
          entityType: "user",
          entityId: user.id,
          details: JSON.stringify({
            action: "enable_user",
            targetUserId: user.id,
            targetUserName: user.name,
            targetUserEmail: user.email,
          }),
        });
        window.location.reload();
      } else {
        alert("Error al habilitar el usuario");
      }
    }
  };

  const handleDisableUser = async (user: User) => {
    if (!window.confirm(`¿Estás seguro de que deseas deshabilitar la cuenta de ${user.name}?\n\nEl usuario no podrá iniciar sesión hasta que sea habilitado nuevamente.`)) {
      return;
    }
    
    try {
      const { api } = await import("../lib/api-client");
      const response = await api.post(`/users/${user.id}/disable`);
      
      if (response.success) {
        addAuditLog({
          userId: currentUser?.id || "",
          userName: currentUser?.name || "",
          action: "DISABLE_USER",
          entityType: "user",
          entityId: user.id,
          details: JSON.stringify({
            action: "disable_user",
            targetUserId: user.id,
            targetUserName: user.name,
            targetUserEmail: user.email,
          }),
        });
        // También actualizar localmente para respuesta inmediata
        disableUser(user.id);
        window.location.reload(); // Recargar para actualizar la lista
      } else {
        alert(response.error || "Error al deshabilitar el usuario");
      }
    } catch (error) {
      console.error("Error deshabilitando usuario:", error);
      // Fallback a función local
      const success = disableUser(user.id);
      if (success) {
        window.location.reload();
      } else {
        alert("Error al deshabilitar el usuario. Solo se pueden deshabilitar usuarios creados.");
      }
    }
  };

  const handleBanUser = (user: User) => {
    if (!window.confirm(`¿Estás seguro de que deseas BANEAR permanentemente la cuenta de ${user.name}? Esta acción es irreversible.`)) {
      return;
    }
    
    const success = banUser(user.id);
    if (success) {
      addAuditLog({
        userId: currentUser?.id || "",
        userName: currentUser?.name || "",
        action: "BAN_USER",
        entityType: "user",
        entityId: user.id,
        details: JSON.stringify({
          action: "ban_user",
          targetUserId: user.id,
          targetUserName: user.name,
          targetUserEmail: user.email,
        }),
      });
      window.location.reload(); // Recargar para actualizar la lista
    } else {
      alert("Error al banear el usuario. Solo se pueden banear usuarios creados.");
    }
  };

  const handleUnbanUser = (user: User) => {
    if (!window.confirm(`¿Estás seguro de que deseas desbanear la cuenta de ${user.name}?`)) {
      return;
    }
    
    const success = unbanUser(user.id);
    if (success) {
      addAuditLog({
        userId: currentUser?.id || "",
        userName: currentUser?.name || "",
        action: "UNBAN_USER",
        entityType: "user",
        entityId: user.id,
        details: JSON.stringify({
          action: "unban_user",
          targetUserId: user.id,
          targetUserName: user.name,
          targetUserEmail: user.email,
        }),
      });
      window.location.reload(); // Recargar para actualizar la lista
    } else {
      alert("Error al desbanear el usuario. Solo se pueden desbanear usuarios creados.");
    }
  };

  const handleDeleteUser = (user: User) => {
    if (!window.confirm(`¿Estás seguro de que deseas ELIMINAR permanentemente la cuenta de ${user.name}? Esta acción es irreversible y eliminará todos los datos del usuario.`)) {
      return;
    }
    
    if (!window.confirm("Esta acción es PERMANENTE e IRREVERSIBLE. ¿Continuar?")) {
      return;
    }
    
    const success = deleteCreatedUser(user.id);
    if (success) {
      addAuditLog({
        userId: currentUser?.id || "",
        userName: currentUser?.name || "",
        action: "DELETE_USER",
        entityType: "user",
        entityId: user.id,
        details: JSON.stringify({
          action: "delete_user",
          targetUserId: user.id,
          targetUserName: user.name,
          targetUserEmail: user.email,
        }),
      });
      window.location.reload(); // Recargar para actualizar la lista
    } else {
      alert("Error al eliminar el usuario. Solo se pueden eliminar usuarios creados.");
    }
  };

  // Cerrar menús de cuenta al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[id^="account-menu-"]') && !target.closest('button[title="Gestionar cuenta"]')) {
        document.querySelectorAll('[id^="account-menu-"]').forEach(menu => {
          menu.classList.add("hidden");
        });
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <MainLayout title={t.nav.users} credits={credits}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Crear usuario
                </button>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-4 py-2 border border-gray-200 text-[#1a1a1a] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Transferir historial
                </button>
              </>
            )}
          </div>
          
          {/* Filters */}
          <div className="flex gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 sm:w-64 px-4 py-2 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors text-sm"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
              className="px-4 py-2 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors text-sm"
            >
              <option value="all">Todos los roles</option>
              <option value="super_admin">{t.roles.superAdmin}</option>
              <option value="clinic_admin">{t.roles.clinicAdmin}</option>
              <option value="admin">{t.roles.admin}</option>
              <option value="podiatrist">{t.roles.podiatrist}</option>
            </select>
          </div>
        </div>

        {/* Users List - Mobile: Cards, Desktop: Table */}
        
        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-3">
          {filteredUsers.map((u) => (
            <div key={u.id} className="mobile-card">
              <div className="mobile-card-header">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-medium text-[#1a1a1a]">{u.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#1a1a1a] truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    <div className="mt-1">
                      {getUserStatusBadge(u)}
                    </div>
                  </div>
                </div>
                <span className={`flex-shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  u.role === "super_admin" ? "bg-[#1a1a1a] text-white" :
                  u.role === "clinic_admin" ? "bg-blue-100 text-blue-700" :
                  u.role === "admin" ? "bg-orange-100 text-orange-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {roleLabels[u.role]}
                </span>
              </div>
              
              <div className="space-y-1">
                {u.clinicId && (
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Clínica</span>
                    <span className="mobile-card-value">{u.clinicId}</span>
                  </div>
                )}
                {u.role === "podiatrist" && (
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Créditos</span>
                    <span className="mobile-card-value">
                      {u.credits.total} <span className="text-xs text-gray-400">({u.credits.monthly}m + {u.credits.extra}e)</span>
                    </span>
                  </div>
                )}
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Datos</span>
                  <span className="mobile-card-value">{u.patientCount} pacientes · {u.sessionCount} sesiones</span>
                </div>
              </div>
              
              <div className="mobile-card-actions">
                <button
                  onClick={() => { setSelectedUser(u); setShowProfileModal(true); }}
                  className="flex-1 py-2.5 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm font-medium min-h-[44px]"
                >
                  Ver
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => { setSelectedUser(u); setShowEditModal(true); }}
                    className="flex-1 py-2.5 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm font-medium min-h-[44px]"
                  >
                    Editar
                  </button>
                )}
                {isSuperAdmin && (u.role === "podiatrist" || u.role === "clinic_admin" || u.role === "admin") && (
                  <>
                    <button
                      onClick={() => { setSelectedUser(u); setShowCreditModal(true); }}
                      className="py-2.5 px-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors min-h-[44px]"
                      title="Ajustar créditos"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setSelectedUser(u); setShowRenewalModal(true); }}
                      className="py-2.5 px-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors min-h-[44px]"
                      title="Renovación mensual"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </>
                )}
                {/* Estado de cuenta - solo para superadmin y usuarios creados */}
                {isSuperAdmin && isCreatedUser(u.id) && (
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                    {u.isBanned ? (
                      <button
                        onClick={() => handleUnbanUser(u)}
                        className="w-full py-2 px-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors text-xs font-medium"
                      >
                        Desbanear
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBanUser(u)}
                        className="w-full py-2 px-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors text-xs font-medium"
                      >
                        Banear
                      </button>
                    )}
                    {u.isBlocked ? (
                      <button
                        onClick={() => handleUnblockUser(u)}
                        className="w-full py-2 px-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors text-xs font-medium"
                      >
                        Desbloquear
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlockUser(u)}
                        className="w-full py-2 px-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 active:bg-orange-200 transition-colors text-xs font-medium"
                      >
                        Bloquear
                      </button>
                    )}
                    {u.isEnabled === false ? (
                      <button
                        onClick={() => handleEnableUser(u)}
                        className="w-full py-2.5 px-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors text-xs font-semibold border border-green-200"
                      >
                        ✅ Habilitar cuenta
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDisableUser(u)}
                        className="w-full py-2.5 px-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 active:bg-yellow-200 transition-colors text-xs font-semibold border border-yellow-200"
                      >
                        ⚠️ Deshabilitar cuenta
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="w-full py-2 px-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors text-xs font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Desktop Table Layout */}
        <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clínica</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Créditos</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Datos</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-medium text-[#1a1a1a]">
                            {u.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-[#1a1a1a] truncate">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.role === "super_admin" ? "bg-[#1a1a1a] text-white" :
                        u.role === "clinic_admin" ? "bg-blue-100 text-blue-700" :
                        u.role === "admin" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {roleLabels[u.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getUserStatusBadge(u)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {u.clinicId || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {u.role === "podiatrist" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#1a1a1a]">{u.credits.total}</span>
                          <span className="text-xs text-gray-400">
                            ({u.credits.monthly}m + {u.credits.extra}e)
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{u.patientCount} pacientes</span>
                        <span>{u.sessionCount} sesiones</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Profile */}
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowProfileModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ver perfil"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        
                        {/* Edit */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        
                        {/* Adjust Credits */}
                        {isSuperAdmin && (u.role === "podiatrist" || u.role === "clinic_admin" || u.role === "admin") && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowCreditModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 rounded-lg transition-colors"
                              title={u.role === "clinic_admin" ? "Ajustar pool de créditos de la clínica" : "Ajustar créditos"}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowRenewalModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 rounded-lg transition-colors"
                              title="Gestionar renovación mensual"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </>
                        )}
                        
                        {/* Export JSON */}
                        {isSuperAdmin && u.role === "podiatrist" && u.patientCount > 0 && (
                          <button
                            onClick={() => handleExportUserData(u)}
                            className="p-2 text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Descargar JSON"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        )}
                        
                        {/* Account Management Actions - Solo para superadmin y usuarios creados */}
                        {isSuperAdmin && isCreatedUser(u.id) && (
                          <div className="relative inline-block">
                            <button
                              className="p-2 text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 rounded-lg transition-colors"
                              title="Gestionar cuenta"
                              onClick={(e) => {
                                e.stopPropagation();
                                const menu = document.getElementById(`account-menu-${u.id}`);
                                if (menu) {
                                  menu.classList.toggle("hidden");
                                }
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                            <div
                              id={`account-menu-${u.id}`}
                              className="hidden absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-1">
                                {u.isBanned ? (
                                  <button
                                    onClick={() => {
                                      handleUnbanUser(u);
                                      document.getElementById(`account-menu-${u.id}`)?.classList.add("hidden");
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                  >
                                    Desbanear cuenta
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      handleBanUser(u);
                                      document.getElementById(`account-menu-${u.id}`)?.classList.add("hidden");
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                  >
                                    Banear cuenta
                                  </button>
                                )}
                                {u.isBlocked ? (
                                  <button
                                    onClick={() => {
                                      handleUnblockUser(u);
                                      document.getElementById(`account-menu-${u.id}`)?.classList.add("hidden");
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                  >
                                    Desbloquear cuenta
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      handleBlockUser(u);
                                      document.getElementById(`account-menu-${u.id}`)?.classList.add("hidden");
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
                                  >
                                    Bloquear cuenta
                                  </button>
                                )}
                                {u.isEnabled === false ? (
                                  <button
                                    onClick={() => {
                                      handleEnableUser(u);
                                      document.getElementById(`account-menu-${u.id}`)?.classList.add("hidden");
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 font-medium"
                                  >
                                    ✅ Habilitar cuenta
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      handleDisableUser(u);
                                      document.getElementById(`account-menu-${u.id}`)?.classList.add("hidden");
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 font-medium"
                                  >
                                    ⚠️ Deshabilitar cuenta
                                  </button>
                                )}
                                <div className="border-t border-gray-100 my-1"></div>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={() => {
                                    handleDeleteUser(u);
                                    document.getElementById(`account-menu-${u.id}`)?.classList.add("hidden");
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                >
                                  Eliminar cuenta
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500">No se encontraron usuarios</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateUser}
      />
      
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={selectedUser}
        onSave={handleEditUser}
      />
      
      <CreditAdjustmentModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        user={selectedUser}
        onSave={handleCreditAdjustment}
      />
      
      <MonthlyRenewalModal
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        user={selectedUser}
        onSave={handleMonthlyRenewalUpdate}
      />
      
      <TransferHistoryModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        allUsers={allUsers}
      />
      
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={selectedUser}
      />
    </MainLayout>
  );
};

export default UsersPage;
