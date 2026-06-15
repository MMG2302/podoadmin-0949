import { useState } from "react";
import { useLanguage } from "../../contexts/language-context";
import {
  officialMetaLinks,
  whatsappSetupGuideContent,
  type SetupGuidePhase,
  type SetupGuideStep,
} from "./whatsapp-setup-guide-content";

function StepLine({ step, index }: { step: SetupGuideStep; index: number }) {
  return (
    <li className="text-xs leading-relaxed text-blue-950/90 dark:text-blue-100/90">
      <span className="font-medium text-blue-900 dark:text-blue-200">{index}. </span>
      {step.text}
      {step.links?.map((link) => (
        <span key={link.href}>
          {" "}
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium text-blue-800 dark:text-blue-300 hover:opacity-80"
          >
            {link.label}
          </a>
        </span>
      ))}
    </li>
  );
}

function PhaseBlock({
  phase,
  open,
  onToggle,
}: {
  phase: SetupGuidePhase;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-blue-200/80 dark:border-blue-900/60 rounded-lg overflow-hidden bg-white/60 dark:bg-gray-950/40">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-blue-100/50 dark:hover:bg-blue-950/30 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-blue-950 dark:text-blue-100">{phase.title}</span>
        <svg
          className={`w-4 h-4 shrink-0 text-blue-700 dark:text-blue-300 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0 border-t border-blue-100/80 dark:border-blue-900/40">
          <ol className="mt-2 space-y-2 list-none">
            {phase.steps.map((step, i) => (
              <StepLine key={`${phase.id}-${i}`} step={step} index={i + 1} />
            ))}
          </ol>
          {phase.callout && (
            <p
              className={`mt-3 text-xs rounded-md px-3 py-2 border ${
                phase.callout.variant === "warning"
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200"
                  : "bg-blue-50/80 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-200"
              }`}
            >
              {phase.callout.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function WhatsAppSetupGuide() {
  const { language } = useLanguage();
  const content = whatsappSetupGuideContent[language] ?? whatsappSetupGuideContent.es;
  const [troubleshootingOpen, setTroubleshootingOpen] = useState(true);
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({
    "developer-app": true,
    "business-manager": false,
    "system-user": false,
    ids: false,
    template: false,
    podoadmin: false,
  });

  const allOpen = content.phases.every((p) => openPhases[p.id]);
  const toggleAll = () => {
    const next = !allOpen;
    setOpenPhases(Object.fromEntries(content.phases.map((p) => [p.id, next])));
    setTroubleshootingOpen(next);
  };

  const togglePhase = (id: string) => {
    setOpenPhases((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="mb-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/25 overflow-hidden">
      <div className="px-4 py-3 border-b border-blue-100 dark:border-blue-900/50 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-blue-950 dark:text-blue-100">{content.title}</p>
          <p className="text-xs text-blue-900/80 dark:text-blue-200/80 mt-1 max-w-3xl">{content.intro}</p>
        </div>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-medium text-blue-800 dark:text-blue-300 underline shrink-0"
        >
          {allOpen ? content.collapseAll : content.expandAll}
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-lg border border-blue-200/70 dark:border-blue-900/50 bg-white/70 dark:bg-gray-950/50 p-3">
          <p className="text-xs font-semibold text-blue-950 dark:text-blue-100 mb-2">{content.checklistTitle}</p>
          <ul className="space-y-1">
            {content.checklistItems.map((item) => (
              <li key={item} className="flex gap-2 text-xs text-blue-900/90 dark:text-blue-100/90">
                <span className="text-blue-600 dark:text-blue-400 shrink-0" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border-2 border-amber-300 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/25 overflow-hidden">
          <button
            type="button"
            onClick={() => setTroubleshootingOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-amber-100/60 dark:hover:bg-amber-950/40"
            aria-expanded={troubleshootingOpen}
          >
            <span className="text-sm font-semibold text-amber-950 dark:text-amber-100">{content.troubleshootingTitle}</span>
            <svg
              className={`w-4 h-4 shrink-0 text-amber-800 dark:text-amber-300 transition-transform ${troubleshootingOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {troubleshootingOpen && (
            <div className="px-3 pb-3 border-t border-amber-200 dark:border-amber-900/50">
              <p className="text-xs text-amber-900/90 dark:text-amber-100/90 mt-2 mb-2">{content.troubleshootingIntro}</p>
              <ul className="space-y-2">
                {content.troubleshootingItems.map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs text-amber-950/90 dark:text-amber-100/90">
                    <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {content.phases.map((phase) => (
            <PhaseBlock
              key={phase.id}
              phase={phase}
              open={!!openPhases[phase.id]}
              onToggle={() => togglePhase(phase.id)}
            />
          ))}
        </div>

        <div className="pt-1 border-t border-blue-100 dark:border-blue-900/40">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-2">{content.officialLinksTitle}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {officialMetaLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline text-blue-800 dark:text-blue-300 hover:opacity-80"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
