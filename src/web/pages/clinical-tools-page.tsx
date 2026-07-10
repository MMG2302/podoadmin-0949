import { useCallback, useEffect, useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { SessionTemplateDesigner } from "../components/clinical/session-template-designer";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { useClinicalLayout } from "../hooks/use-clinical-layout";
import { api } from "../lib/api-client";
import {
  countIncludedTemplateSections,
  createTemplateSectionLayoutFromGlobal,
  DEFAULT_TEMPLATE_FIELDS,
  ensureTemplateSectionLayout,
  normalizeTemplateFields,
  resolvePresetFields,
  SESSION_TEMPLATE_PRESETS,
  TEMPLATE_CATEGORIES,
  templateScopeLabel,
  type SessionTemplate,
  type SessionTemplateFields,
  type SessionTemplateScope,
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
  const { user } = useAuth();
  const { isPodiatrist, isClinicAdmin } = usePermissions();
  const { layout: clinicalLayout } = useClinicalLayout();
  const [tab, setTab] = useState<Tab>("templates");
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("general");
  const [templateScope, setTemplateScope] = useState<SessionTemplateScope>("personal");
  const [inventoryName, setInventoryName] = useState("");
  const [inventoryQuantity, setInventoryQuantity] = useState("1");
  const [inventoryUnit, setInventoryUnit] = useState("unidad");
  const [refPatientId, setRefPatientId] = useState("");
  const [refTo, setRefTo] = useState("");
  const [refReason, setRefReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editShared, setEditShared] = useState(false);
  const [editFields, setEditFields] = useState<SessionTemplateFields>(DEFAULT_TEMPLATE_FIELDS);
  const [savingEdit, setSavingEdit] = useState(false);
  const [creating, setCreating] = useState(false);

  const canUse = isPodiatrist || isClinicAdmin;
  const hasClinic = Boolean(user?.clinicId);

  const loadAll = useCallback(async () => {
    const requests: Promise<void>[] = [];
    if (tab === "templates" || templates.length === 0) {
      requests.push(
        api.get<{ success?: boolean; templates?: SessionTemplate[] }>("/clinical/templates").then((tRes) => {
          if (tRes.success && tRes.data?.templates) {
            setTemplates(tRes.data.templates.map((t) => ({ ...t, fields: normalizeTemplateFields(t.fields) })));
          }
        })
      );
    }
    if (tab === "inventory" || inventory.length === 0) {
      requests.push(
        api.get<{ success?: boolean; items?: InventoryItem[] }>("/clinical/inventory").then((iRes) => {
          if (iRes.success && iRes.data?.items) setInventory(iRes.data.items);
        })
      );
    }
    if (tab === "referrals" || referrals.length === 0) {
      requests.push(
        api.get<{ success?: boolean; referrals?: Referral[] }>("/clinical/referrals").then((rRes) => {
          if (rRes.success && rRes.data?.referrals) setReferrals(rRes.data.referrals);
        })
      );
    }
    await Promise.all(requests);
  }, [tab, templates.length, inventory.length, referrals.length]);

  useEffect(() => {
    if (canUse) void loadAll();
  }, [canUse, loadAll, tab]);

  useEffect(() => {
    if (isClinicAdmin) setTemplateScope("clinic");
  }, [isClinicAdmin]);

  if (!canUse) {
    return (
      <MainLayout title="Herramientas clínicas">
        <p className="text-brand-muted">No tienes permiso para acceder a esta sección.</p>
      </MainLayout>
    );
  }

  const resolveIsShared = (scope: SessionTemplateScope) =>
    isClinicAdmin ? true : scope === "clinic" && hasClinic;

  const createTemplate = async (fieldsOverride?: SessionTemplateFields) => {
    if (!templateName.trim()) {
      setErrorMessage("Indica un nombre para la plantilla.");
      return;
    }
    setCreating(true);
    setErrorMessage(null);
    setMessage(null);
    const fields = normalizeTemplateFields(
      fieldsOverride ?? {
        ...DEFAULT_TEMPLATE_FIELDS,
        sectionLayout: createTemplateSectionLayoutFromGlobal(clinicalLayout),
      }
    );
    const res = await api.post("/clinical/templates", {
      name: templateName.trim(),
      category: templateCategory,
      fields,
      isShared: resolveIsShared(templateScope),
    });
    setCreating(false);
    if (res.success) {
      setTemplateName("");
      setTemplateCategory("general");
      setTemplateScope(isClinicAdmin ? "clinic" : "personal");
      setMessage("Plantilla creada. Edítala para elegir secciones y contenido.");
      loadAll();
    } else {
      setErrorMessage(res.message || res.error || "No se pudo crear la plantilla.");
    }
  };

  const createFromPreset = async (presetIndex: number) => {
    const preset = SESSION_TEMPLATE_PRESETS[presetIndex];
    if (!preset) return;
    setTemplateName(preset.name);
    setTemplateCategory(preset.category);
    setCreating(true);
    setErrorMessage(null);
    setMessage(null);
    const fields = normalizeTemplateFields(resolvePresetFields(preset, clinicalLayout));
    const res = await api.post("/clinical/templates", {
      name: preset.name,
      category: preset.category,
      fields,
      isShared: resolveIsShared(templateScope),
    });
    setCreating(false);
    if (res.success) {
      setTemplateName("");
      setMessage(`Plantilla «${preset.name}» creada.`);
      loadAll();
    } else {
      setErrorMessage(res.message || res.error || "No se pudo crear la plantilla.");
    }
  };

  const startEditTemplate = (template: SessionTemplate) => {
    const fields = normalizeTemplateFields(template.fields);
    setEditingId(template.id);
    setEditName(template.name);
    setEditCategory(template.category);
    setEditShared(template.isShared);
    setEditFields({
      ...fields,
      sectionLayout: ensureTemplateSectionLayout(fields, clinicalLayout),
    });
  };

  const saveTemplateEdit = async () => {
    if (!editingId) return;
    setSavingEdit(true);
    setMessage(null);
    setErrorMessage(null);
    const res = await api.patch(`/clinical/templates/${editingId}`, {
      name: editName.trim(),
      category: editCategory,
      isShared: isClinicAdmin ? true : editShared,
      fields: normalizeTemplateFields(editFields),
    });
    setSavingEdit(false);
    if (res.success) {
      setEditingId(null);
      setMessage("Plantilla actualizada.");
      loadAll();
    } else {
      setErrorMessage(res.message || res.error || "No se pudo guardar la plantilla.");
    }
  };

  const deleteTemplate = async (template: SessionTemplate) => {
    if (!window.confirm(`¿Eliminar la plantilla «${template.name}»? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(template.id);
    setMessage(null);
    setErrorMessage(null);
    const res = await api.delete(`/clinical/templates/${template.id}`);
    setDeletingId(null);
    if (res.success) {
      setMessage("Plantilla eliminada.");
      loadAll();
    } else {
      setErrorMessage(res.message || res.error || "No se pudo eliminar la plantilla.");
    }
  };

  const createInventory = async () => {
    if (!inventoryName.trim()) return;
    const quantity = Number.parseFloat(inventoryQuantity.replace(",", "."));
    if (!Number.isFinite(quantity) || quantity < 0) {
      setErrorMessage("Indique una cantidad válida (0 o más).");
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
      setMessage("Material registrado.");
      loadAll();
    } else setErrorMessage(res.error || "Error");
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
      setMessage("Derivación registrada.");
      loadAll();
    } else setErrorMessage(res.error || "Error");
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "templates", label: "Plantillas de sesión" },
    { id: "inventory", label: "Inventario" },
    { id: "referrals", label: "Derivaciones" },
  ];

  return (
    <MainLayout title="Herramientas clínicas">
      <p className="text-sm text-brand-muted mb-4">
        Define historiales clínicos predefinidos (callosidad, uña encarnada, etc.) para cargarlos al abrir una sesión.
      </p>
      {message && (
        <div className="mb-4 p-3 rounded-lg text-sm border bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800">
          {message}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg text-sm border bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-brand-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id
                ? "border-brand-ink text-brand-ink dark:border-white text-brand-ink"
                : "border-transparent text-brand-muted hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "templates" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-3">
            <p className="text-sm font-medium text-brand-ink">Nueva plantilla</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Nombre (ej. Callosidad 1er dedo)"
                className="flex-1 px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                className="px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-ink text-sm"
                aria-label="Categoría"
              >
                {TEMPLATE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            {hasClinic && isPodiatrist && (
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-brand-muted">Alcance:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="template-scope"
                    checked={templateScope === "personal"}
                    onChange={() => setTemplateScope("personal")}
                  />
                  Solo yo
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="template-scope"
                    checked={templateScope === "clinic"}
                    onChange={() => setTemplateScope("clinic")}
                  />
                  Consultorio (todos los podólogos)
                </label>
              </div>
            )}
            {isClinicAdmin && (
              <p className="text-xs text-brand-muted">
                Como administrador de clínica, las plantillas se comparten con todo el consultorio.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => createTemplate()}
                disabled={creating}
                className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm disabled:opacity-50"
              >
                {creating ? "Creando…" : "Crear"}
              </button>
              {SESSION_TEMPLATE_PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => createFromPreset(idx)}
                  disabled={creating}
                  className="px-3 py-2 text-sm border border-brand-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-gray-800 bg-brand-surface rounded-xl border border-brand-border">
            {templates.map((t) => (
              <li key={t.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-brand-ink">{t.name}</p>
                    <p className="text-xs text-brand-muted">
                      {TEMPLATE_CATEGORIES.find((c) => c.id === t.category)?.label ?? t.category}
                      {" · "}
                      {templateScopeLabel(t, user?.id)}
                      {" · "}
                      {countIncludedTemplateSections(t.fields.sectionLayout) || "—"} secciones
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => (editingId === t.id ? setEditingId(null) : startEditTemplate(t))}
                      className="px-3 py-1.5 text-sm text-brand-muted border border-brand-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {editingId === t.id ? "Cerrar" : "Editar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTemplate(t)}
                      disabled={deletingId === t.id}
                      className="px-3 py-1.5 text-sm text-semantic-error border border-red-200 dark:border-red-900/60 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
                    >
                      {deletingId === t.id ? "Eliminando…" : "Eliminar"}
                    </button>
                  </div>
                </div>
                {editingId === t.id && (
                  <div className="mt-4 space-y-4 border-t border-brand-border pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-brand-muted mb-1">Nombre</label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-white dark:bg-gray-950 text-brand-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-brand-muted mb-1">Categoría</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-white dark:bg-gray-950 text-brand-ink"
                        >
                          {TEMPLATE_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {hasClinic && isPodiatrist && (
                      <label className="inline-flex items-center gap-2 text-sm text-brand-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editShared}
                          onChange={(e) => setEditShared(e.target.checked)}
                        />
                        Compartir con el consultorio
                      </label>
                    )}
                    <SessionTemplateDesigner
                      globalLayout={clinicalLayout}
                      fields={editFields}
                      onChange={setEditFields}
                    />
                    <button
                      type="button"
                      onClick={saveTemplateEdit}
                      disabled={savingEdit}
                      className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm disabled:opacity-50"
                    >
                      {savingEdit ? "Guardando…" : "Guardar plantilla"}
                    </button>
                  </div>
                )}
              </li>
            ))}
            {templates.length === 0 && (
              <li className="p-4 text-sm text-brand-muted text-center">
                Sin plantillas. Crea una vacía o usa los accesos rápidos de callosidad / uña encarnada.
              </li>
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
              className="flex-1 px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <input
              type="number"
              min={0}
              step="any"
              value={inventoryQuantity}
              onChange={(e) => setInventoryQuantity(e.target.value)}
              placeholder="Cantidad"
              aria-label="Cantidad"
              className="w-full sm:w-28 px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <input
              value={inventoryUnit}
              onChange={(e) => setInventoryUnit(e.target.value)}
              placeholder="Unidad"
              aria-label="Unidad"
              className="w-full sm:w-32 px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={createInventory}
              className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm shrink-0"
            >
              Añadir
            </button>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800 bg-brand-surface rounded-xl border border-brand-border">
            {inventory.map((i) => (
              <li key={i.id} className="p-4 flex flex-wrap items-baseline justify-between gap-2 text-brand-ink">
                <span className="font-medium">{i.name}</span>
                <span className="text-sm text-brand-muted">
                  {formatInventoryQuantity(i.quantity ?? 0)} {i.unit}
                </span>
              </li>
            ))}
            {inventory.length === 0 && (
              <li className="p-4 text-sm text-brand-muted text-center">Sin material registrado</li>
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
              className="px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-surface text-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <input
              value={refTo}
              onChange={(e) => setRefTo(e.target.value)}
              placeholder="Derivar a (especialista)"
              className="px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-surface text-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <textarea
              value={refReason}
              onChange={(e) => setRefReason(e.target.value)}
              placeholder="Motivo"
              rows={2}
              className="sm:col-span-2 px-3 py-2 border border-brand-border rounded-lg text-sm bg-brand-surface text-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <button
            type="button"
            onClick={createReferral}
            className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm"
          >
            Registrar derivación
          </button>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800 bg-brand-surface rounded-xl border border-brand-border">
            {referrals.map((r) => (
              <li key={r.id} className="p-4">
                <p className="font-medium text-brand-ink">{r.referredTo}</p>
                <p className="text-sm text-brand-muted">{r.reason}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Paciente: {r.patientId} · {r.status}
                </p>
              </li>
            ))}
            {referrals.length === 0 && (
              <li className="p-4 text-sm text-brand-muted text-center">Sin derivaciones</li>
            )}
          </ul>
        </div>
      )}
    </MainLayout>
  );
};

export default ClinicalToolsPage;
