import * as React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useDashboardLogo } from "@/hooks/use-dashboard-logo";
import { useLanguage } from "@/contexts/language-context";
import type { DashboardLogoConfig } from "@/types/dashboard-logo";
import { DashboardLogoDisplay } from "@/components/ui/dashboard-logo-display";

interface BentoCardProps {
  Icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  href: string;
  cta?: string;
  background?: React.ReactNode;
  className?: string;
}

const BentoCard = ({
  Icon,
  name,
  description,
  href,
  cta,
  background,
  className,
}: BentoCardProps) => (
  <Link href={href}>
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-xl border border-brand-border bg-brand-surface p-6 transition-all hover:border-brand-ink dark:hover:border-gray-600 hover:shadow-lg",
        "cursor-pointer",
        className
      )}
    >
      {background}
      <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
        <div className="space-y-4 transition-transform duration-300 group-hover:-translate-y-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-canvas text-brand-muted transition-colors group-hover:bg-brand-ink dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-gray-900">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-ink">{name}</h3>
            <p className="mt-1 text-sm text-brand-muted">{description}</p>
          </div>
        </div>
        <p className="mt-4 flex items-center text-sm font-medium text-brand-ink opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
          {cta}
          <svg
            className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </p>
      </div>
    </div>
  </Link>
);

/** Variante para estadísticas rápidas: muestra label + valor destacado */
interface BentoStatCardProps {
  Icon: React.ComponentType<{ className?: string }>;
  name: string;
  value: string;
  href: string;
  hint?: string;
  cta?: string;
  className?: string;
}

const BentoStatCard = ({
  Icon,
  name,
  value,
  href,
  hint,
  cta,
  className,
}: BentoStatCardProps) => (
  <Link href={href}>
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-xl border border-brand-border bg-brand-surface p-5 sm:p-6 transition-all hover:border-brand-ink dark:hover:border-gray-600 hover:shadow-lg",
        "cursor-pointer",
        className
      )}
    >
      <div className="relative z-10 flex flex-col justify-between h-full min-h-[132px]">
        <div className="space-y-3 transition-transform duration-300 group-hover:-translate-y-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-canvas text-brand-muted transition-colors group-hover:bg-brand-ink dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-gray-900">
              <Icon className="h-5 w-5" strokeWidth={1.5} />
            </div>
            {hint ? (
              <span className="text-[11px] sm:text-xs text-brand-muted text-right leading-tight pt-0.5">
                {hint}
              </span>
            ) : null}
          </div>
          <div>
            <p className="text-sm text-brand-muted">{name}</p>
            <p className="mt-1 text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-brand-ink transition-colors dark:group-hover:text-white/90">
              {value}
            </p>
          </div>
        </div>
        <p className="mt-4 flex items-center text-sm font-medium text-brand-ink opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
          {cta}
          <svg
            className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </p>
      </div>
    </div>
  </Link>
);

/** Tarjeta con el logo de clínica/profesional en el dashboard */
interface BentoLogoCardProps {
  logoUrl: string;
  config: DashboardLogoConfig;
  alt?: string;
  className?: string;
}

const BentoLogoCard = ({ logoUrl, config, alt = "Logo", className }: BentoLogoCardProps) => (
  <DashboardLogoDisplay
    logoUrl={logoUrl}
    config={config}
    alt={alt}
    className={cn("h-full min-h-[180px] transition-all", className)}
  />
);

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

const BentoGrid = ({ children, className }: BentoGridProps) => (
  <div
    className={cn(
      "grid w-full grid-cols-1 gap-4 auto-rows-[minmax(140px,auto)] md:grid-cols-2 lg:grid-cols-3",
      className
    )}
  >
    {children}
  </div>
);

/** Tarjeta de bienvenida para integrar en el Bento (no es enlace) */
interface BentoWelcomeCardProps {
  title: React.ReactNode;
  description: React.ReactNode;
  className?: string;
}

const BentoWelcomeCard = ({ title, description, className }: BentoWelcomeCardProps) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-xl border border-transparent dark:border-gray-700 bg-brand-ink dark:bg-gray-900 p-6 text-white",
      "flex flex-col justify-center h-full min-h-[180px]",
      className
    )}
  >
    <div className="absolute inset-0 opacity-5" aria-hidden>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="bento-welcome-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bento-welcome-grid)" />
      </svg>
    </div>
    <div className="relative z-10">
      <h2 className="text-xl font-light md:text-2xl mb-2">{title}</h2>
      <div className="text-gray-400 text-sm md:text-base [&_p]:mt-1">{description}</div>
    </div>
  </div>
);

/** Configuración para RoleDashboardBento - reutilizable para todos los roles */
export type StatItem = {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  path: string;
  hint?: string;
};

export type ActionItem = {
  Icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  href: string;
  cta?: string;
};

interface RoleDashboardBentoProps {
  welcomeTitle: React.ReactNode;
  welcomeDescription: React.ReactNode;
  statItems?: StatItem[];
  actionItems: ActionItem[];
  /** Logo en tarjeta (solo si hay URL y está habilitado en configuración) */
  logoUrl?: string | null;
  logoConfig?: DashboardLogoConfig;
  children?: React.ReactNode;
  /** Clases para el grid (ej: md:grid-cols-2 para menos columnas) */
  gridClassName?: string;
}

/** Dashboard Bento unificado: bienvenida + stats + acciones. Reutilizable para todos los roles actuales y futuros. */
const RoleDashboardBento = ({
  welcomeTitle,
  welcomeDescription,
  statItems = [],
  actionItems,
  logoUrl,
  logoConfig,
  children,
  gridClassName,
}: RoleDashboardBentoProps) => {
  const { t } = useLanguage();
  const hasLogo = Boolean(logoUrl && logoConfig);
  const viewMoreCta = t.common.viewMore;
  const goCta = t.common.go;

  return (
    <div className="space-y-4">
      <BentoGrid className={cn("items-stretch", gridClassName)}>
        <BentoWelcomeCard
          title={welcomeTitle}
          description={welcomeDescription}
          className={hasLogo ? "lg:col-span-2" : "lg:col-span-3"}
        />
        {hasLogo && logoUrl && logoConfig ? (
          <BentoLogoCard key={`logo-${logoConfig.size}-${logoConfig.zoom}`} logoUrl={logoUrl} config={logoConfig} />
        ) : null}
        {statItems.map((stat, index) => (
          <BentoStatCard
            key={`stat-${stat.label}-${index}`}
            Icon={stat.Icon}
            name={stat.label}
            value={stat.value}
            href={stat.path}
            hint={stat.hint}
            cta={viewMoreCta}
          />
        ))}
        {actionItems.map((action, index) => (
          <BentoCard
            key={`action-${action.href}-${index}`}
            Icon={action.Icon}
            name={action.name}
            description={action.description}
            href={action.href}
            cta={action.cta ?? goCta}
          />
        ))}
      </BentoGrid>
      {children}
    </div>
  );
};

/** Dashboard Bento con logo clínico/profesional cuando está habilitado en configuración */
const ClinicalRoleDashboardBento = ({
  welcomeTitle,
  welcomeDescription,
  statItems,
  actionItems,
  children,
  gridClassName,
}: Omit<RoleDashboardBentoProps, "logoUrl">) => {
  const { visible, logoUrl, config } = useDashboardLogo();
  return (
    <RoleDashboardBento
      welcomeTitle={welcomeTitle}
      welcomeDescription={welcomeDescription}
      statItems={statItems}
      actionItems={actionItems}
      logoUrl={visible ? logoUrl : null}
      logoConfig={visible ? config : undefined}
      gridClassName={gridClassName}
    >
      {children}
    </RoleDashboardBento>
  );
};

export { BentoCard, BentoGrid, BentoLogoCard, BentoStatCard, BentoWelcomeCard, ClinicalRoleDashboardBento, RoleDashboardBento };
