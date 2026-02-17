import * as React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

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
  cta = "Ver más",
  background,
  className,
}: BentoCardProps) => (
    <Link href={href}>
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 transition-all hover:border-[#1a1a1a] dark:hover:border-gray-600 hover:shadow-lg",
        "cursor-pointer",
        className
      )}
    >
      {background}
      <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
        <div className="space-y-4 transition-transform duration-300 group-hover:-translate-y-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors group-hover:bg-[#1a1a1a] dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-gray-900">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1a1a1a] dark:text-white">{name}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <p className="mt-4 flex items-center text-sm font-medium text-[#1a1a1a] dark:text-white opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
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
  cta?: string;
  className?: string;
}

const BentoStatCard = ({
  Icon,
  name,
  value,
  href,
  cta = "Ver más",
  className,
}: BentoStatCardProps) => (
  <Link href={href}>
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 transition-all hover:border-[#1a1a1a] dark:hover:border-gray-600 hover:shadow-lg",
        "cursor-pointer",
        className
      )}
    >
      <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
        <div className="space-y-4 transition-transform duration-300 group-hover:-translate-y-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors group-hover:bg-[#1a1a1a] dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-gray-900">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{name}</p>
            <p className="mt-1 text-3xl font-semibold text-[#1a1a1a] dark:text-white group-hover:text-[#1a1a1a]/90 dark:group-hover:text-white/90 transition-colors">
              {value}
            </p>
          </div>
        </div>
        <p className="mt-4 flex items-center text-sm font-medium text-[#1a1a1a] dark:text-white opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
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

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

const BentoGrid = ({ children, className }: BentoGridProps) => (
  <div
    className={cn(
      "grid w-full auto-rows-[minmax(140px,auto)] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
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
      "relative overflow-hidden rounded-xl border border-transparent dark:border-gray-700 bg-[#1a1a1a] dark:bg-gray-900 p-6 text-white",
      "flex flex-col justify-center min-h-[160px] md:min-h-[180px]",
      className
    )}
  >
    <div className="absolute inset-0 opacity-5">
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
      <p className="text-gray-400 text-sm md:text-base">{description}</p>
    </div>
  </div>
);

/** Configuración para RoleDashboardBento - reutilizable para todos los roles */
export type StatItem = {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  path: string;
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
  children,
  gridClassName,
}: RoleDashboardBentoProps) => (
  <div className="space-y-4">
    <BentoGrid className={cn("auto-rows-[minmax(140px,auto)]", gridClassName)}>
      <BentoWelcomeCard
        title={welcomeTitle}
        description={welcomeDescription}
        className="lg:col-span-2 lg:row-span-2"
      />
      {statItems.map((stat, index) => (
        <BentoStatCard
          key={index}
          Icon={stat.Icon}
          name={stat.label}
          value={stat.value}
          href={stat.path}
          cta="Ver más"
        />
      ))}
      {actionItems.map((action, index) => (
        <BentoCard
          key={index}
          Icon={action.Icon}
          name={action.name}
          description={action.description}
          href={action.href}
          cta={action.cta ?? "Ir"}
        />
      ))}
    </BentoGrid>
    {children}
  </div>
);

export { BentoCard, BentoGrid, BentoStatCard, BentoWelcomeCard, RoleDashboardBento };
