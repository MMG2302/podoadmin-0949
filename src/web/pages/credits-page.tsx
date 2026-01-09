import { useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { getUserCredits, getCreditTransactions, addCreditTransaction, updateUserCredits } from "../lib/storage";

const CreditsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isSuperAdmin, hasPermission } = usePermissions();
  
  const [credits, setCredits] = useState(() => getUserCredits(user?.id || ""));
  const [transactions, setTransactions] = useState(() => getCreditTransactions(user?.id));
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const creditPackages = [
    { id: 1, amount: 50, price: 25, popular: false },
    { id: 2, amount: 100, price: 45, popular: true },
    { id: 3, amount: 250, price: 100, popular: false },
    { id: 4, amount: 500, price: 175, popular: false },
  ];

  const handlePurchase = (amount: number) => {
    if (!user) return;
    
    const newCredits = {
      ...credits,
      extraCredits: credits.extraCredits + amount,
    };
    updateUserCredits(newCredits);
    setCredits(newCredits);
    
    const transaction = addCreditTransaction({
      userId: user.id,
      type: "purchase",
      amount,
      description: `Compra de ${amount} créditos extra`,
    });
    setTransactions([transaction, ...transactions]);
    setShowPurchaseModal(false);
  };

  const totalAvailable = credits.monthlyCredits + credits.extraCredits - credits.reservedCredits;

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
