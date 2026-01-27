import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { 
  getUserCredits, 
  getCreditTransactions, 
  getClinicAvailableCredits,
  getClinicCredits,
  initializeClinicCredits,
  UserCredits,
  CreditTransaction,
} from "../lib/storage";
import { api } from "../lib/api-client";

const CreditsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isSuperAdmin, isClinicAdmin, hasPermission } = usePermissions();
  
  const [credits, setCredits] = useState<UserCredits | null>(() =>
    user ? getUserCredits(user.id) : null
  );
  const [transactions, setTransactions] = useState<CreditTransaction[]>(() =>
    user ? getCreditTransactions(user.id) : []
  );
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  
  // Cargar créditos y transacciones desde la API (backend como fuente de verdad)
  useEffect(() => {
    const loadCredits = async () => {
      if (!user) return;
      try {
        const response = await api.get<{ success: boolean; credits: UserCredits; transactions: CreditTransaction[] }>("/credits/me");
        if (response.success && response.data?.success) {
          setCredits(response.data.credits);
          setTransactions(response.data.transactions);
        } else {
          console.error("Error cargando créditos:", response.error || response.data?.message);
        }
      } catch (error) {
        console.error("Error cargando créditos:", error);
      }
    };

    loadCredits();
  }, [user?.id]);
  
  // For clinic_admin, get clinic credits instead of personal credits
  const clinicId = user?.clinicId || "";
  const clinicCredits = useMemo(() => {
    if (!isClinicAdmin || !clinicId) return null;
    const credits = getClinicCredits(clinicId);
    if (!credits) {
      return initializeClinicCredits(clinicId, 500);
    }
    return credits;
  }, [isClinicAdmin, clinicId]);
  
  const clinicAvailableCredits = useMemo(() => {
    if (!isClinicAdmin || !clinicId) return 0;
    return getClinicAvailableCredits(clinicId);
  }, [isClinicAdmin, clinicId]);

  const creditPackages = [
    { id: 1, amount: 50, price: 25, popular: false },
    { id: 2, amount: 100, price: 45, popular: true },
    { id: 3, amount: 250, price: 100, popular: false },
    { id: 4, amount: 500, price: 175, popular: false },
  ];

  const handlePurchase = async (amount: number) => {
    if (!user) return;
    
    try {
      const response = await api.post<{ success: boolean; credits: UserCredits; transaction: CreditTransaction }>(
        "/credits/purchase",
        { amount }
      );

      if (response.success && response.data?.success) {
        const { credits: newCredits, transaction } = response.data;
        setCredits(newCredits);
        setTransactions((prev) => [transaction, ...prev]);
        setShowPurchaseModal(false);
      } else {
        alert(response.error || response.data?.message || "No se pudo completar la compra de créditos.");
      }
    } catch (error) {
      console.error("Error al comprar créditos:", error);
      alert("Ha ocurrido un error al procesar la compra de créditos.");
    }
  };

  // For clinic_admin, show clinic pool credits; for others, show personal credits
  const totalAvailable = isClinicAdmin 
    ? clinicAvailableCredits 
    : credits
    ? credits.monthlyCredits + credits.extraCredits - credits.reservedCredits
    : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "monthly_allocation":
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case "purchase":
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case "consumption":
        return (
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      case "reservation":
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <MainLayout title={t.credits.title} credits={credits}>
      <div className="space-y-8">
        {/* Credit Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 text-white">
            <p className="text-gray-400 text-sm mb-1">{t.credits.currentBalance}</p>
            <p className="text-4xl font-light">{totalAvailable}</p>
            <p className="text-gray-500 text-xs mt-2">{t.credits.available}</p>
          </div>
          
          {isClinicAdmin ? (
            <>
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Créditos Totales</p>
                <p className="text-4xl font-light text-[#1a1a1a]">{clinicCredits?.totalCredits || 0}</p>
                <p className="text-gray-400 text-xs mt-2">En el pool de la clínica</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Distribuidos</p>
                <p className="text-4xl font-light text-[#1a1a1a]">{clinicCredits?.distributedToDate || 0}</p>
                <p className="text-gray-400 text-xs mt-2">Asignados a podólogos</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">{t.credits.monthlyCredits}</p>
                <p className="text-4xl font-light text-[#1a1a1a]">{credits.monthlyCredits}</p>
                <p className="text-gray-400 text-xs mt-2">{t.credits.expiresEndOfMonth}</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">{t.credits.extraCredits}</p>
                <p className="text-4xl font-light text-[#1a1a1a]">{credits.extraCredits}</p>
                <p className="text-gray-400 text-xs mt-2">{t.credits.neverExpires}</p>
              </div>
            </>
          )}
        </div>

        {/* Reserved Credits Warning */}
        {credits.reservedCredits > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-yellow-800">{credits.reservedCredits} {t.credits.reserved}</p>
              <p className="text-sm text-yellow-600">Créditos reservados para sesiones en progreso (4 horas máximo)</p>
            </div>
          </div>
        )}

        {/* Purchase Credits Section */}
        {hasPermission("purchase_credits") && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1a1a1a]">{t.credits.creditPackages}</h3>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors text-sm font-medium"
              >
                {t.credits.purchaseCredits}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative bg-white rounded-xl p-5 border ${
                    pkg.popular ? "border-[#1a1a1a] ring-2 ring-[#1a1a1a]" : "border-gray-100"
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#1a1a1a] text-white text-xs rounded-full">
                      Popular
                    </span>
                  )}
                  <p className="text-3xl font-light text-[#1a1a1a] mb-1">{pkg.amount}</p>
                  <p className="text-gray-500 text-sm mb-3">créditos</p>
                  <p className="text-lg font-semibold text-[#1a1a1a] mb-4">€{pkg.price}</p>
                  <button
                    onClick={() => handlePurchase(pkg.amount)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      pkg.popular
                        ? "bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]"
                        : "bg-gray-100 text-[#1a1a1a] hover:bg-gray-200"
                    }`}
                  >
                    {t.credits.buyNow}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Whop.io Integration - Super Admin Only */}
        {isSuperAdmin && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1a1a1a]">Integración Whop.io</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Conecta con Whop.io para automatizar la gestión de créditos, suscripciones y pagos.
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-yellow-700">No conectado</span>
            </div>

            {/* Setup Instructions */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-[#1a1a1a] mb-2">Instrucciones de configuración</h4>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Crea una cuenta en <a href="https://whop.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">whop.com</a></li>
                <li>Configura tus productos de créditos en el panel de Whop</li>
                <li>Obtén tu API Key desde la configuración de desarrollador</li>
                <li>Ingresa los datos a continuación para activar la integración</li>
              </ol>
            </div>

            {/* API Configuration Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  Webhook URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value="https://api.podoadmin.com/webhooks/whop"
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm"
                  />
                  <button className="px-4 py-2.5 bg-gray-100 text-[#1a1a1a] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    Copiar
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Configura esta URL en tu panel de Whop para recibir notificaciones</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="whop_api_xxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                  disabled
                />
                <p className="text-xs text-gray-400 mt-1">Tu clave API de Whop (obtenerla en la configuración de desarrollador)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  Company ID
                </label>
                <input
                  type="text"
                  placeholder="biz_xxxxxxxx"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                  disabled
                />
              </div>
            </div>

            {/* Connect Button */}
            <button
              disabled
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Conectar con Whop.io (Próximamente)
            </button>

            <p className="text-xs text-center text-gray-400 mt-4">
              La integración con Whop.io estará disponible en una próxima actualización.
            </p>
          </div>
        )}

        {/* Transaction History */}
        <div>
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">{t.credits.creditHistory}</h3>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No hay transacciones registradas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {transactions.slice(0, 20).map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center gap-4">
                    {getTransactionIcon(tx.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a1a1a] truncate">{tx.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                    </div>
                    <span className={`font-semibold ${
                      tx.type === "consumption" || tx.type === "reservation"
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}>
                      {tx.type === "consumption" || tx.type === "reservation" ? "-" : "+"}
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-[#1a1a1a] mb-4">{t.credits.purchaseCredits}</h3>
            <p className="text-gray-500 mb-6">Selecciona un paquete de créditos para comprar</p>
            
            <div className="space-y-3 mb-6">
              {creditPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg.amount)}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#1a1a1a] transition-colors"
                >
                  <span className="font-medium">{pkg.amount} créditos</span>
                  <span className="font-semibold">€{pkg.price}</span>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowPurchaseModal(false)}
              className="w-full py-3 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CreditsPage;
