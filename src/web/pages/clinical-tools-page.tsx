import { useCallback, useEffect, useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { usePermissions } from "../hooks/use-permissions";
import { api } from "../lib/api-client";
import {
  DEFAULT_TEMPLATE_FIELDS,
  type SessionTemplate,
  type SessionTemplateFields,
} from "../lib/session-templates";

type Tab = "templates" | "inventory" | "referrals";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

const formatInventoryQuantity = (qty: number): string =>
  Number.isInteger(qty) ? String(qty) : qty.toLocaleString("es-ES", { maximumFractionDigits: 2 });

interface Referral {
  id: string;
  patientId: string;
  referredTo: string;
  reason: string;
  status: string;
  createdAt: string;
}

const ClinicalToolsPage = () => {
  const { isPodiatrist, isClinicAdmin } = usePermissions();
  const [tab, setTab] = useState<Tab>("templates");
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [inventoryName, setInventoryName] = useState("");
  const [inventoryQuantity, setInventoryQuantity] = useState("1");
  const [inventoryUnit, setInventoryUnit] = useState("unidad");
  const [refPatientId, setRefPatientId] = useState("");
  const [refTo, setRefTo] = useState("");
  const [refReason, setRefReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<SessionTemplateFields>(DEFAULT_TEMPLATE_FIELDS);
  const [savingEdit, setSavingEdit] = useState(false);

  const canUse = isPodiatrist || isClinicAdmin;

  const loadAll = useCallback(async () => {
    const [tRes, iRes, rRes] = await Promise.all([
      api.get<{ success?: boolean; templates?: SessionTemplate[] }>("/clinical/templates"),
      api.get<{ success?: boolean; items?: InventoryItem[] }>("/clinical/inventory"),
      api.get<{ success?: boolean; referrals?: Referral[] }>("/clinical/referrals"),
    ]);
    if (tRes.success && tRes.data?.templates) setTemplates(tRes.data.templates);
    if (iRes.success && iRes.data?.items) setInventory(iRes.data.items);
    if (rRes.success && rRes.data?.referrals) setReferrals(rRes.data.referrals);
  }, []);

  useEffect(() => {
    if (canUse) loadAll();
  }, [canUse, loadAll]);

  if (!canUse) {
    return (
      <MainLayout title="Herramientas clínicas">
        <p className="text-gray-500 dark:text-gray-400">No tienes permiso para acceder a esta sección.</p>
      </MainLayout>
    );
  }

  const createTemplate = async () => {
    if (!templateName.trim()) return;
    const res = await api.post("/clinical/templates", {
      name: templateName.trim(),
      category: "general",
      fields: DEFAULT_TEMPLATE_FIELDS,
      isShared: isClinicAdmin,
    });
    if (res.success) {
      setTemplateName("");
      setMessage("Plantilla creada");
      loadAll();
    } else setMessage(res.error || "Error");
  };

  const startEditTemplate = (template: SessionTemplate) => {
    setEditingId(template.id);
    setEditFields({
      anamnesis: String(template.fields.anamnesis ?? ""),
      physicalExamination: String(template.fields.physicalExamination ?? ""),
      diagnosis: String(template.fields.diagnosis ?? ""),
      treatmentPlan: String(template.fields.treatmentPlan ?? ""),
    });
  };

  const saveTemplateEdit = async () => {
    if (!editingId) return;
    setSavingEdit(true);
    setMessage(null);
    const res = await api.patch(`/clinical/templates/${editingId}`, { fields: editFields });
    setSavingEdit(false);
    if (res.success) {
      setEditingId(null);
      setMessage("Plantilla actualizada");
      loadAll();
    } else {
      setMessage(res.message || res.error || "No se pudo guardar la plantilla");
    }
  };

  const deleteTemplate = async (template: SessionTemplate) => {
    if (!window.confirm(`¿Eliminar la plantilla «${template.name}»? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(template.id);
    setMessage(null);
    const res = await api.delete(`/clinical/templates/${template.id}`);
    setDeletingId(null);
    if (res.success) {
      setMessage("Plantilla eliminada");
      loadAll();
    } else {
      setMessage(res.message || res.error || "No se pudo eliminar la plantilla");
    }
  };

  const createInventory = async () => {
    if (!inventoryName.trim()) return;
    const quantity = Number.parseFloat(inventoryQuantity.replace(",", "."));
    if (!Number.isFinite(quantity) || quantity < 0) {
      setMessage("Indique una cantidad válida (0 o más).");
      return;
    }
    const res = await api.post("/clinical/inventory", {
      name: inventoryName.trim(),
      quantity,
      unit: inventoryUnit.trim() || "unidad",
    });
    if (res.success) {
      setInventoryName("");
      setInventoryQuantity("1");
      setInventoryUnit("unidad");
      setMessage("Material registrado");
      loadAll();
    } else setMessage(res.error || "Error");
  };

  const createReferral = async () => {
    if (!refPatientId.trim() || !refTo.trim() || !refReason.trim()) return;
    const res = await api.post("/clinical/referrals", {
      patientId: refPatientId.trim(),
      referredTo: refTo.trim(),
      reason: refReason.trim(),
    });
    if (res.success) {
      setRefPatientId("");
      setRefTo("");
      setRefReason("");
      setMessage("Derivación registrada");
      loadAll();
    } else setMessage(res.error || "Error");
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "templates", label: "Plantillas de sesión" },
    { id: "inventory", label: "Inventario" },
    { id: "referrals", label: "Derivaciones" },
  ];

  return (
    <MainLayout title="Herramientas clínicas">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Plantillas, material consumible y derivaciones a otros especialistas.
      </p>
      {message && (
        <div className="mb-4 p-3 rounded-lg text-sm border bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800">
          {message}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-gray-100 dark:border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id
                ? "border-[#1a1a1a] text-[#1a1a1a] dark:border-white dark:text-white"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "templates" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nombre de plantilla"
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-[#1a1a1a] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={createTemplate}
              className="px-4 py-2 bg-[#1a1a1a] dark:bg-white dark:text-[#1a1a1a] text-white rounded-lg text-sm"
            >
              Crear
            </button>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            {templates.map((t) => (
              <li key={t.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[#1a1a1a] dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t.category}
                      {t.isShared ? " · compartida" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => (editingId === t.id ? setEditingId(null) : startEditTemplate(t))}
                      className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {editingId === t.id ? "Cerrar" : "Editar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTemplate(t)}
                      disabled={deletingId === t.id}
                      className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
                    >
                      {deletingId === t.id ? "Eliminando…" : "Eliminar"}
                    </button>
                  </div>
                </div>
                {editingId === t.id && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Texto predeterminado que se cargará al usar esta plantilla en una sesión.
                    </p>
                    {(
                      [
                        ["anamnesis", "Anamnesis"],
                        ["physicalExamination", "Exploración física"],
                        ["diagnosis", "Diagnóstico"],
                        ["treatmentPlan", "Plan de tratamiento"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {label}
                        </label>
                        <textarea
                          rows={2}
                          value={editFields[key]}
                          onChange={(e) => setEditFields((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-[#1a1a1a] dark:text-white"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={saveTemplateEdit}
                      disabled={savingEdit}
                      className="px-4 py-2 bg-[#1a1a1a] dark:bg-white dark:text-[#1a1a1a] text-white rounded-lg text-sm disabled:opacity-50"
                    >
                      {savingEdit ? "Guardando…" : "Guardar plantilla"}
                    </button>
                  </div>
                )}
              </li>
            ))}
            {templates.length === 0 && (
              <li className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">Sin plantillas</li>
            )}
          </ul>
        </div>
      )}

      {tab === "inventory" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={inventoryName}
              onChange={(e) => setInventoryName(e.target.value)}
              placeholder="Nombre del material"
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-[#1a1a1a] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <input
              type="number"
              min={0}
              step="any"
              value={inventoryQuantity}
              onChange={(e) => setInventoryQuantity(e.target.value)}
              placeholder="Cantidad"
              aria-label="Cantidad"
              className="w-full sm:w-28 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-[#1a1a1a] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <input
              value={inventoryUnit}
              onChange={(e) => setInventoryUnit(e.target.value)}
              placeholder="Unidad"
              aria-label="Unidad"
              className="w-full sm:w-32 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-[#1a1a1a] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={createInventory}
              className="px-4 py-2 bg-[#1a1a1a] dark:bg-white dark:text-[#1a1a1a] text-white rounded-lg text-sm shrink-0"
            >
              Añadir
            </button>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            {inventory.map((i) => (
              <li key={i.id} className="p-4 flex flex-wrap items-baseline justify-between gap-2 text-[#1a1a1a] dark:text-white">
                <span className="font-medium">{i.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatInventoryQuantity(i.quantity ?? 0)} {i.unit}
                </span>
              </li>
            ))}
            {inventory.length === 0 && (
              <li className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">Sin material registrado</li>
            )}
          </ul>
        </div>
      )}

      {tab === "referrals" && (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={refPatientId}
              onChange={(e) => setRefPatientId(e.target.value)}
              placeholder="ID paciente (UUID)"
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-[#1a1a1a] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <input
              value={refTo}
              onChange={(e) => setRefTo(e.target.value)}
              placeholder="Derivar a (especialista)"
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-[#1a1a1a] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <textarea
              value={refReason}
              onChange={(e) => setRefReason(e.target.value)}
              placeholder="Motivo"
              rows={2}
              className="sm:col-span-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-[#1a1a1a] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <button
            type="button"
            onClick={createReferral}
            className="px-4 py-2 bg-[#1a1a1a] dark:bg-white dark:text-[#1a1a1a] text-white rounded-lg text-sm"
          >
            Registrar derivación
          </button>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            {referrals.map((r) => (
              <li key={r.id} className="p-4">
                <p className="font-medium text-[#1a1a1a] dark:text-white">{r.referredTo}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{r.reason}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Paciente: {r.patientId} · {r.status}
                </p>
              </li>
            ))}
            {referrals.length === 0 && (
              <li className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">Sin derivaciones</li>
            )}
          </ul>
        </div>
      )}
    </MainLayout>
  );
};

export default ClinicalToolsPage;
