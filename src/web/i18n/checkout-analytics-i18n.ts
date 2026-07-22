/** Traducciones de analíticas de cobro y agenda (checkout). */

export type CheckoutAnalyticsI18n = {
  periodDay: string;
  periodWeek: string;
  periodMonth: string;
  periodYear: string;
  scope: string;
  loadingSales: string;
  loadingCollections: string;
  loadingProfit: string;
  retry: string;
  emptyPaidPeriod: string;
  emptySalesData: string;
  emptyAvgByPatient: string;
  emptyMonthSales: string;
  emptyServicesBreakdown: string;
  salesTitle: string;
  avgSalePerPatient: string;
  avgSalePerPatientChart: string;
  previousPeriod: string;
  weeklyChange: string;
  annualChange: string;
  vsPrevious: string;
  checkoutsCount: string;
  patientsCount: string;
  visitsTotal: string;
  periodAverageAmong: string;
  salesByDay: string;
  byService: string;
  comparisonMonth: string;
  byPodiatrist: string;
  growth12m: string;
  avgAbbrev: string;
  viewDetail: string;
  paidThisPeriod: string;
  pending: string;
  accountsReceivable: string;
  paidVsPending: string;
  paidLabel: string;
  openHandoffs: string;
  paymentMethods: string;
  paymentMethodsHint: string;
  monthlyCashFlow: string;
  collectionsByPodiatrist: string;
  collectionsPodiatristRow: string;
  receivablesByPatient: string;
  noReceivables: string;
  pendingItems: string;
  goalsAndExpenses: string;
  goalsReadOnlyHint: string;
  monthlyGoal: string;
  monthlyExpenses: string;
  goalPlaceholder: string;
  expensesPlaceholder: string;
  saving: string;
  saved: string;
  saveGoals: string;
  readOnly: string;
  realSales: string;
  estimatedProfit: string;
  goalVsActual: string;
  noGoal: string;
  monthEndProjection: string;
  expensesVsIncome: string;
  income: string;
  expenses: string;
  profit: string;
  marginByService: string;
  marginRow: string;
  cash: string;
  card: string;
  transfer: string;
  other: string;
  unknown: string;
  metricRevenue: string;
  metricSalesCount: string;
  searchService: string;
  clearSelection: string;
  noServiceMatch: string;
  compareSelected: string;
  revenueByService: string;
  salesByServiceChart: string;
  noChartData: string;
  clickToPin: string;
  maxServicesTitle: string;
  removeFromCompare: string;
  addToCompare: string;
  onChart: string;
  saleCountRow: string;
  showMoreRemaining: string;
  showingServices: string;
  selectedCount: string;
  chartTopN: string;
  otherCount: string;
  otherServices: string;
  loadFailed: string;
  loadNetworkError: string;
  emptyPeriod: string;
  currentPeriod: string;
  previousPeriodLegend: string;
  prevShort: string;
};

export type AgendaAnalyticsI18n = {
  loading: string;
  scheduleScope: string;
  occupiedAvailable: string;
  demand30d: string;
  demandHint: string;
  noShow: string;
  cancellations: string;
  appointmentsCount: string;
  peakHour: string;
  noData: string;
  busiestHours: string;
  topDemandDays: string;
  demandTotalLine: string;
  timeByService: string;
  durationHint: string;
  noDurationData: string;
  guidedMinutes: string;
  noGuided: string;
  realMinutes: string;
  noReal: string;
  workSchedule: string;
  loadingSchedule: string;
  start: string;
  end: string;
  overtimeFrom: string;
  overtimeCap: string;
  allowOvertime: string;
  scheduleReadOnlyHint: string;
  savingSchedule: string;
  saveSchedule: string;
  saved: string;
  rescheduleAlertInterval: string;
  rescheduleAlertIntervalHint: string;
  rescheduleAlertIntervalReadOnlyHint: string;
  rescheduleAlertIntervalUnit: string;
  timezoneLabel: string;
  timezoneHint: string;
  satisfactionTitle: string;
  satisfactionEmpty: string;
  satisfactionRate: string;
  satisfactionResponses: string;
  satisfactionGood: string;
  satisfactionRegular: string;
  satisfactionBad: string;
  satisfactionComments: string;
  satisfactionAnonymous: string;
  dailyCloseTitle: string;
  loadingClose: string;
  paidToday: string;
  checkoutsCount: string;
  pendingOpen: string;
  pendingCountSub: string;
  closedAt: string;
  snapshotLine: string;
  paidAfterClose: string;
  notes: string;
  closing: string;
  closeDay: string;
  dayStillOpen: string;
  history: string;
  refresh: string;
  loadMetricsFailed: string;
  loadMetricsNetworkError: string;
  loadDailyCloseFailed: string;
  closeDayFailed: string;
};

const analyticsEs: CheckoutAnalyticsI18n = {
  periodDay: "Día",
  periodWeek: "Semana",
  periodMonth: "Mes",
  periodYear: "Año",
  scope: "Ámbito: {label}",
  loadingSales: "Cargando ventas…",
  loadingCollections: "Cargando cobros…",
  loadingProfit: "Cargando rentabilidad…",
  retry: "Reintentar",
  emptyPaidPeriod: "No hay cobros en este {period}.",
  emptySalesData: "Aún no hay datos de ventas en el periodo.",
  emptyAvgByPatient: "Sin ticket medio por paciente en el periodo.",
  emptyMonthSales: "Sin ventas este mes.",
  emptyServicesBreakdown: "Sin desglose por servicio.",
  salesTitle: "Ventas ({period})",
  avgSalePerPatient: "Ticket medio / paciente",
  avgSalePerPatientChart: "Ticket medio por paciente",
  previousPeriod: "Periodo anterior",
  weeklyChange: "Cambio semanal",
  annualChange: "Cambio anual",
  vsPrevious: "vs anterior",
  checkoutsCount: "{n} cobros",
  patientsCount: "{n} pacientes",
  visitsTotal: "{n} visitas",
  periodAverageAmong: "Media del periodo entre pacientes con cobro",
  salesByDay: "Ventas por día ({period})",
  byService: "Por servicio",
  comparisonMonth: "Comparativa con periodo anterior",
  byPodiatrist: "Por podólogo",
  growth12m: "Crecimiento 12 meses",
  avgAbbrev: "media",
  viewDetail: "ver detalle",
  paidThisPeriod: "Cobrado en el periodo",
  pending: "Pendiente",
  accountsReceivable: "Cuentas por cobrar",
  paidVsPending: "Cobrado vs pendiente",
  paidLabel: "Cobrado",
  openHandoffs: "{n} pendientes abiertos",
  paymentMethods: "Métodos de pago",
  paymentMethodsHint: "Distribución de cobros registrados.",
  monthlyCashFlow: "Flujo de caja mensual",
  collectionsByPodiatrist: "Cobros por podólogo",
  collectionsPodiatristRow: "{paid} cobrado · {pending} pendiente",
  receivablesByPatient: "Pendientes por paciente",
  noReceivables: "No hay pendientes abiertos.",
  pendingItems: "{n} partidas",
  goalsAndExpenses: "Metas y gastos",
  goalsReadOnlyHint: "Solo el administrador de clínica puede editar metas y gastos.",
  monthlyGoal: "Meta mensual",
  monthlyExpenses: "Gastos mensuales",
  goalPlaceholder: "0.00",
  expensesPlaceholder: "0.00",
  saving: "Guardando…",
  saved: "Guardado",
  saveGoals: "Guardar metas",
  readOnly: "Solo lectura",
  realSales: "Ventas reales",
  estimatedProfit: "Beneficio estimado",
  goalVsActual: "Meta vs real",
  noGoal: "Sin meta",
  monthEndProjection: "Proyección fin de mes",
  expensesVsIncome: "Gastos vs ingresos",
  income: "Ingresos",
  expenses: "Gastos",
  profit: "Beneficio",
  marginByService: "Margen por servicio",
  marginRow: "margen {pct}% · beneficio {amount}",
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
  unknown: "Desconocido",
  metricRevenue: "Ingresos",
  metricSalesCount: "N.º ventas",
  searchService: "Buscar servicio…",
  clearSelection: "Limpiar selección",
  noServiceMatch: "Ningún servicio coincide con «{q}».",
  compareSelected: "Comparar seleccionados",
  revenueByService: "Ingresos por servicio",
  salesByServiceChart: "Ventas por servicio",
  noChartData: "Sin datos para el gráfico",
  clickToPin: "Pulsa una fila para fijarla en el gráfico (máx. {max}).",
  maxServicesTitle: "Máximo {max} servicios",
  removeFromCompare: "Quitar de comparación",
  addToCompare: "Añadir a comparación",
  onChart: "En gráfico",
  saleCountRow: "{n} ventas",
  showMoreRemaining: "Mostrar {n} más",
  showingServices: "Mostrando {shown} de {total}",
  selectedCount: "{n} seleccionados",
  chartTopN: "Top {n} en gráfico",
  otherCount: "+{n} más",
  otherServices: "Otros ({n})",
  loadFailed: "No se pudieron cargar las analíticas",
  loadNetworkError: "Error al cargar analíticas",
  emptyPeriod: "Sin datos en el periodo",
  currentPeriod: "Periodo actual",
  previousPeriodLegend: "Periodo anterior",
  prevShort: "prev",
};

const analyticsEn: CheckoutAnalyticsI18n = {
  periodDay: "Day",
  periodWeek: "Week",
  periodMonth: "Month",
  periodYear: "Year",
  scope: "Scope: {label}",
  loadingSales: "Loading sales…",
  loadingCollections: "Loading collections…",
  loadingProfit: "Loading profitability…",
  retry: "Retry",
  emptyPaidPeriod: "No payments in this {period}.",
  emptySalesData: "No sales data in this period yet.",
  emptyAvgByPatient: "No average ticket per patient in this period.",
  emptyMonthSales: "No sales this month.",
  emptyServicesBreakdown: "No service breakdown.",
  salesTitle: "Sales ({period})",
  avgSalePerPatient: "Avg ticket / patient",
  avgSalePerPatientChart: "Average ticket by patient",
  previousPeriod: "Previous period",
  weeklyChange: "Weekly change",
  annualChange: "Annual change",
  vsPrevious: "vs previous",
  checkoutsCount: "{n} checkouts",
  patientsCount: "{n} patients",
  visitsTotal: "{n} visits",
  periodAverageAmong: "Period average among patients with payment",
  salesByDay: "Sales by day ({period})",
  byService: "By service",
  comparisonMonth: "Comparison with previous period",
  byPodiatrist: "By podiatrist",
  growth12m: "12-month growth",
  avgAbbrev: "avg",
  viewDetail: "view detail",
  paidThisPeriod: "Paid this period",
  pending: "Pending",
  accountsReceivable: "Accounts receivable",
  paidVsPending: "Paid vs pending",
  paidLabel: "Paid",
  openHandoffs: "{n} open pending",
  paymentMethods: "Payment methods",
  paymentMethodsHint: "Breakdown of recorded payments.",
  monthlyCashFlow: "Monthly cash flow",
  collectionsByPodiatrist: "Collections by podiatrist",
  collectionsPodiatristRow: "{paid} paid · {pending} pending",
  receivablesByPatient: "Pending by patient",
  noReceivables: "No open receivables.",
  pendingItems: "{n} items",
  goalsAndExpenses: "Goals and expenses",
  goalsReadOnlyHint: "Only the clinic admin can edit goals and expenses.",
  monthlyGoal: "Monthly goal",
  monthlyExpenses: "Monthly expenses",
  goalPlaceholder: "0.00",
  expensesPlaceholder: "0.00",
  saving: "Saving…",
  saved: "Saved",
  saveGoals: "Save goals",
  readOnly: "Read only",
  realSales: "Actual sales",
  estimatedProfit: "Estimated profit",
  goalVsActual: "Goal vs actual",
  noGoal: "No goal",
  monthEndProjection: "Month-end projection",
  expensesVsIncome: "Expenses vs income",
  income: "Income",
  expenses: "Expenses",
  profit: "Profit",
  marginByService: "Margin by service",
  marginRow: "margin {pct}% · profit {amount}",
  cash: "Cash",
  card: "Card",
  transfer: "Transfer",
  other: "Other",
  unknown: "Unknown",
  metricRevenue: "Revenue",
  metricSalesCount: "Sale count",
  searchService: "Search service…",
  clearSelection: "Clear selection",
  noServiceMatch: "No service matches «{q}».",
  compareSelected: "Compare selected",
  revenueByService: "Revenue by service",
  salesByServiceChart: "Sales by service",
  noChartData: "No chart data",
  clickToPin: "Click a row to pin it on the chart (max {max}).",
  maxServicesTitle: "Maximum {max} services",
  removeFromCompare: "Remove from comparison",
  addToCompare: "Add to comparison",
  onChart: "On chart",
  saleCountRow: "{n} sales",
  showMoreRemaining: "Show {n} more",
  showingServices: "Showing {shown} of {total}",
  selectedCount: "{n} selected",
  chartTopN: "Top {n} on chart",
  otherCount: "+{n} more",
  otherServices: "Other ({n})",
  loadFailed: "Could not load analytics",
  loadNetworkError: "Error loading analytics",
  emptyPeriod: "No data in this period",
  currentPeriod: "Current period",
  previousPeriodLegend: "Previous period",
  prevShort: "prev",
};

const analyticsPt: CheckoutAnalyticsI18n = {
  ...analyticsEs,
  periodDay: "Dia",
  periodWeek: "Semana",
  periodMonth: "Mês",
  periodYear: "Ano",
  scope: "Âmbito: {label}",
  loadingSales: "A carregar vendas…",
  loadingCollections: "A carregar cobranças…",
  loadingProfit: "A carregar rentabilidade…",
  retry: "Tentar novamente",
  emptyPaidPeriod: "Não há cobranças neste {period}.",
  emptySalesData: "Ainda não há dados de vendas no período.",
  emptyAvgByPatient: "Sem ticket médio por paciente no período.",
  emptyMonthSales: "Sem vendas este mês.",
  emptyServicesBreakdown: "Sem detalhe por serviço.",
  salesTitle: "Vendas ({period})",
  avgSalePerPatient: "Ticket médio / paciente",
  avgSalePerPatientChart: "Ticket médio por paciente",
  previousPeriod: "Período anterior",
  weeklyChange: "Variação semanal",
  annualChange: "Variação anual",
  vsPrevious: "vs anterior",
  checkoutsCount: "{n} cobranças",
  patientsCount: "{n} pacientes",
  visitsTotal: "{n} visitas",
  periodAverageAmong: "Média do período entre pacientes com cobrança",
  salesByDay: "Vendas por dia ({period})",
  byService: "Por serviço",
  comparisonMonth: "Comparação com período anterior",
  byPodiatrist: "Por podólogo",
  growth12m: "Crescimento 12 meses",
  avgAbbrev: "média",
  viewDetail: "ver detalhe",
  paidThisPeriod: "Cobrado no período",
  pending: "Pendente",
  accountsReceivable: "Contas a receber",
  paidVsPending: "Cobrado vs pendente",
  paidLabel: "Cobrado",
  openHandoffs: "{n} pendentes abertos",
  paymentMethods: "Métodos de pagamento",
  paymentMethodsHint: "Distribuição das cobranças registadas.",
  monthlyCashFlow: "Fluxo de caixa mensal",
  collectionsByPodiatrist: "Cobranças por podólogo",
  collectionsPodiatristRow: "{paid} cobrado · {pending} pendente",
  receivablesByPatient: "Pendentes por paciente",
  noReceivables: "Não há pendentes abertos.",
  pendingItems: "{n} partidas",
  goalsAndExpenses: "Metas e despesas",
  goalsReadOnlyHint: "Apenas o admin da clínica pode editar metas e despesas.",
  monthlyGoal: "Meta mensal",
  monthlyExpenses: "Despesas mensais",
  saving: "A guardar…",
  saved: "Guardado",
  saveGoals: "Guardar metas",
  readOnly: "Só leitura",
  realSales: "Vendas reais",
  estimatedProfit: "Lucro estimado",
  goalVsActual: "Meta vs real",
  noGoal: "Sem meta",
  monthEndProjection: "Projeção fim do mês",
  expensesVsIncome: "Despesas vs receitas",
  income: "Receitas",
  expenses: "Despesas",
  profit: "Lucro",
  marginByService: "Margem por serviço",
  marginRow: "margem {pct}% · lucro {amount}",
  cash: "Dinheiro",
  card: "Cartão",
  transfer: "Transferência",
  other: "Outro",
  unknown: "Desconhecido",
  metricRevenue: "Receitas",
  metricSalesCount: "N.º vendas",
  searchService: "Pesquisar serviço…",
  clearSelection: "Limpar seleção",
  noServiceMatch: "Nenhum serviço corresponde a «{q}».",
  compareSelected: "Comparar selecionados",
  revenueByService: "Receitas por serviço",
  salesByServiceChart: "Vendas por serviço",
  noChartData: "Sem dados para o gráfico",
  clickToPin: "Clique numa linha para fixá-la no gráfico (máx. {max}).",
  maxServicesTitle: "Máximo {max} serviços",
  removeFromCompare: "Remover da comparação",
  addToCompare: "Adicionar à comparação",
  onChart: "No gráfico",
  saleCountRow: "{n} vendas",
  showMoreRemaining: "Mostrar mais {n}",
  showingServices: "A mostrar {shown} de {total}",
  selectedCount: "{n} selecionados",
  chartTopN: "Top {n} no gráfico",
  otherCount: "+{n} mais",
  otherServices: "Outros ({n})",
  loadFailed: "Não foi possível carregar as análises",
  loadNetworkError: "Erro ao carregar análises",
  emptyPeriod: "Sem dados no período",
  currentPeriod: "Período atual",
  previousPeriodLegend: "Período anterior",
  prevShort: "ant.",
};

const analyticsFr: CheckoutAnalyticsI18n = {
  ...analyticsEn,
  periodDay: "Jour",
  periodWeek: "Semaine",
  periodMonth: "Mois",
  periodYear: "Année",
  scope: "Périmètre : {label}",
  loadingSales: "Chargement des ventes…",
  loadingCollections: "Chargement des encaissements…",
  loadingProfit: "Chargement de la rentabilité…",
  retry: "Réessayer",
  emptyPaidPeriod: "Aucun encaissement sur ce {period}.",
  emptySalesData: "Pas encore de données de ventes sur la période.",
  emptyAvgByPatient: "Pas de ticket moyen par patient sur la période.",
  emptyMonthSales: "Pas de ventes ce mois-ci.",
  emptyServicesBreakdown: "Pas de répartition par service.",
  salesTitle: "Ventes ({period})",
  avgSalePerPatient: "Ticket moyen / patient",
  avgSalePerPatientChart: "Ticket moyen par patient",
  previousPeriod: "Période précédente",
  weeklyChange: "Variation hebdomadaire",
  annualChange: "Variation annuelle",
  vsPrevious: "vs précédent",
  checkoutsCount: "{n} encaissements",
  patientsCount: "{n} patients",
  visitsTotal: "{n} visites",
  periodAverageAmong: "Moyenne de la période parmi les patients payants",
  salesByDay: "Ventes par jour ({period})",
  byService: "Par service",
  comparisonMonth: "Comparaison avec la période précédente",
  byPodiatrist: "Par podologue",
  growth12m: "Croissance 12 mois",
  avgAbbrev: "moy.",
  viewDetail: "voir détail",
  paidThisPeriod: "Encaissé sur la période",
  pending: "En attente",
  accountsReceivable: "Créances",
  paidVsPending: "Encaissé vs en attente",
  paidLabel: "Encaissé",
  openHandoffs: "{n} en attente ouverts",
  paymentMethods: "Modes de paiement",
  paymentMethodsHint: "Répartition des encaissements enregistrés.",
  monthlyCashFlow: "Flux de trésorerie mensuel",
  collectionsByPodiatrist: "Encaissements par podologue",
  collectionsPodiatristRow: "{paid} encaissé · {pending} en attente",
  receivablesByPatient: "En attente par patient",
  noReceivables: "Aucune créance ouverte.",
  pendingItems: "{n} lignes",
  goalsAndExpenses: "Objectifs et dépenses",
  goalsReadOnlyHint: "Seul l'admin de la clinique peut modifier objectifs et dépenses.",
  monthlyGoal: "Objectif mensuel",
  monthlyExpenses: "Dépenses mensuelles",
  saving: "Enregistrement…",
  saved: "Enregistré",
  saveGoals: "Enregistrer les objectifs",
  readOnly: "Lecture seule",
  realSales: "Ventes réelles",
  estimatedProfit: "Bénéfice estimé",
  goalVsActual: "Objectif vs réel",
  noGoal: "Sans objectif",
  monthEndProjection: "Projection fin de mois",
  expensesVsIncome: "Dépenses vs revenus",
  income: "Revenus",
  expenses: "Dépenses",
  profit: "Bénéfice",
  marginByService: "Marge par service",
  marginRow: "marge {pct}% · bénéfice {amount}",
  cash: "Espèces",
  card: "Carte",
  transfer: "Virement",
  other: "Autre",
  unknown: "Inconnu",
  metricRevenue: "Revenus",
  metricSalesCount: "Nb ventes",
  searchService: "Rechercher un service…",
  clearSelection: "Effacer la sélection",
  noServiceMatch: "Aucun service ne correspond à «{q}».",
  compareSelected: "Comparer la sélection",
  revenueByService: "Revenus par service",
  salesByServiceChart: "Ventes par service",
  noChartData: "Pas de données pour le graphique",
  clickToPin: "Cliquez une ligne pour l'épingler (max. {max}).",
  maxServicesTitle: "Maximum {max} services",
  removeFromCompare: "Retirer de la comparaison",
  addToCompare: "Ajouter à la comparaison",
  onChart: "Sur le graphique",
  saleCountRow: "{n} ventes",
  showMoreRemaining: "Afficher {n} de plus",
  showingServices: "Affichage de {shown} sur {total}",
  selectedCount: "{n} sélectionnés",
  chartTopN: "Top {n} du graphique",
  otherCount: "+{n} de plus",
  otherServices: "Autres ({n})",
  loadFailed: "Impossible de charger les analyses",
  loadNetworkError: "Erreur lors du chargement des analyses",
  emptyPeriod: "Pas de données sur la période",
  currentPeriod: "Période actuelle",
  previousPeriodLegend: "Période précédente",
  prevShort: "préc.",
};

const agendaEs: AgendaAnalyticsI18n = {
  loading: "Cargando métricas de agenda…",
  scheduleScope: "Horario: {label}",
  occupiedAvailable: "{occupied} ocupadas · {available} libres",
  demand30d: "Demanda 30 días",
  demandHint: "Citas solicitadas / creadas",
  noShow: "No-shows",
  cancellations: "Cancelaciones",
  appointmentsCount: "{n} citas",
  peakHour: "Hora pico",
  noData: "Sin datos",
  busiestHours: "Horas más ocupadas",
  topDemandDays: "Días de mayor demanda",
  demandTotalLine: "Total demanda: {n}",
  timeByService: "Tiempo por servicio",
  durationHint: "Pauta guiada vs tiempo real registrado",
  noDurationData: "Sin datos de duración por servicio.",
  guidedMinutes: "{n} min pauta",
  noGuided: "Sin pauta",
  realMinutes: "{n} min reales",
  noReal: "Sin real",
  workSchedule: "Horario de trabajo",
  loadingSchedule: "Cargando horario…",
  start: "Inicio",
  end: "Fin",
  overtimeFrom: "Extra desde",
  overtimeCap: "Tope extra",
  allowOvertime: "Permitir horas extra",
  scheduleReadOnlyHint: "Solo lectura: el admin de clínica define el horario compartido.",
  savingSchedule: "Guardando…",
  saveSchedule: "Guardar horario",
  saved: "Guardado",
  rescheduleAlertInterval: "Alerta de reagendo pendiente",
  rescheduleAlertIntervalHint: "Minutos entre avisos internos mientras una cita cancelada siga sin reagendarse. Se apaga sola al crear la nueva cita.",
  timezoneLabel: "Zona horaria de la clínica",
  timezoneHint: "Se usa para enviar recordatorios y alertas de reagendo a la hora local correcta (solo en horario laboral).",
  satisfactionTitle: "Satisfacción del paciente",
  satisfactionEmpty: "Aún no hay opiniones en el periodo.",
  satisfactionRate: "Satisfacción",
  satisfactionResponses: "{n} respuestas",
  satisfactionGood: "Bien",
  satisfactionRegular: "Regular",
  satisfactionBad: "Mal",
  satisfactionComments: "Quejas y sugerencias",
  satisfactionAnonymous: "Anónimo",
  rescheduleAlertIntervalReadOnlyHint: "Solo el administrador de clínica configura este intervalo.",
  rescheduleAlertIntervalUnit: "min",
  dailyCloseTitle: "Cierre diario de caja",
  loadingClose: "Cargando cierre…",
  paidToday: "Cobrado hoy",
  checkoutsCount: "{n} cobros",
  pendingOpen: "Pendiente abierto",
  pendingCountSub: "{n} partidas",
  closedAt: "Cerrado a las {time}",
  snapshotLine: "Snapshot: {paid} cobrado · {pending} pendiente",
  paidAfterClose: "Tras cierre: {amount}",
  notes: "Notas del cierre (opcional)",
  closing: "Cerrando…",
  closeDay: "Cerrar día",
  dayStillOpen: "El día sigue abierto.",
  history: "Historial reciente",
  refresh: "Actualizar",
  loadMetricsFailed: "No se pudieron cargar métricas de agenda",
  loadMetricsNetworkError: "Error de red al cargar métricas de agenda",
  loadDailyCloseFailed: "No se pudo cargar el cierre diario",
  closeDayFailed: "No se pudo cerrar el día",
};

const agendaEn: AgendaAnalyticsI18n = {
  loading: "Loading agenda metrics…",
  scheduleScope: "Schedule: {label}",
  occupiedAvailable: "{occupied} busy · {available} free",
  demand30d: "30-day demand",
  demandHint: "Appointments requested / created",
  noShow: "No-shows",
  cancellations: "Cancellations",
  appointmentsCount: "{n} appointments",
  peakHour: "Peak hour",
  noData: "No data",
  busiestHours: "Busiest hours",
  topDemandDays: "Top demand days",
  demandTotalLine: "Total demand: {n}",
  timeByService: "Time by service",
  durationHint: "Guided guideline vs actual recorded time",
  noDurationData: "No duration data by service.",
  guidedMinutes: "{n} min guideline",
  noGuided: "No guideline",
  realMinutes: "{n} min actual",
  noReal: "No actual",
  workSchedule: "Work schedule",
  loadingSchedule: "Loading schedule…",
  start: "Start",
  end: "End",
  overtimeFrom: "Overtime from",
  overtimeCap: "Overtime cap",
  allowOvertime: "Allow overtime",
  scheduleReadOnlyHint: "Read only: clinic admin sets the shared schedule.",
  savingSchedule: "Saving…",
  saveSchedule: "Save schedule",
  saved: "Saved",
  rescheduleAlertInterval: "Pending reschedule alert",
  rescheduleAlertIntervalHint: "Minutes between internal reminders while a cancelled appointment stays unrescheduled. Turns off automatically once the new appointment is created.",
  timezoneLabel: "Clinic timezone",
  timezoneHint: "Used to send reminders and reschedule alerts at the correct local time (business hours only).",
  satisfactionTitle: "Patient satisfaction",
  satisfactionEmpty: "No feedback in this period yet.",
  satisfactionRate: "Satisfaction",
  satisfactionResponses: "{n} responses",
  satisfactionGood: "Good",
  satisfactionRegular: "Okay",
  satisfactionBad: "Bad",
  satisfactionComments: "Complaints and suggestions",
  satisfactionAnonymous: "Anonymous",
  rescheduleAlertIntervalReadOnlyHint: "Only the clinic admin configures this interval.",
  rescheduleAlertIntervalUnit: "min",
  dailyCloseTitle: "Daily cash close",
  loadingClose: "Loading close…",
  paidToday: "Paid today",
  checkoutsCount: "{n} checkouts",
  pendingOpen: "Open pending",
  pendingCountSub: "{n} items",
  closedAt: "Closed at {time}",
  snapshotLine: "Snapshot: {paid} paid · {pending} pending",
  paidAfterClose: "After close: {amount}",
  notes: "Close notes (optional)",
  closing: "Closing…",
  closeDay: "Close day",
  dayStillOpen: "The day is still open.",
  history: "Recent history",
  refresh: "Refresh",
  loadMetricsFailed: "Could not load agenda metrics",
  loadMetricsNetworkError: "Network error loading agenda metrics",
  loadDailyCloseFailed: "Could not load daily close",
  closeDayFailed: "Could not close the day",
};

const agendaPt: AgendaAnalyticsI18n = {
  ...agendaEs,
  loading: "A carregar métricas da agenda…",
  scheduleScope: "Horário: {label}",
  occupiedAvailable: "{occupied} ocupadas · {available} livres",
  demand30d: "Procura 30 dias",
  demandHint: "Consultas pedidas / criadas",
  noShow: "Faltas",
  cancellations: "Cancelamentos",
  appointmentsCount: "{n} consultas",
  peakHour: "Hora de pico",
  noData: "Sem dados",
  busiestHours: "Horas mais ocupadas",
  topDemandDays: "Dias de maior procura",
  demandTotalLine: "Procura total: {n}",
  timeByService: "Tempo por serviço",
  durationHint: "Pauta guiada vs tempo real registado",
  noDurationData: "Sem dados de duração por serviço.",
  guidedMinutes: "{n} min pauta",
  noGuided: "Sem pauta",
  realMinutes: "{n} min reais",
  noReal: "Sem real",
  workSchedule: "Horário de trabalho",
  loadingSchedule: "A carregar horário…",
  start: "Início",
  end: "Fim",
  overtimeFrom: "Extra a partir de",
  overtimeCap: "Limite extra",
  allowOvertime: "Permitir horas extra",
  scheduleReadOnlyHint: "Só leitura: o admin define o horário partilhado.",
  savingSchedule: "A guardar…",
  saveSchedule: "Guardar horário",
  saved: "Guardado",
  rescheduleAlertInterval: "Alerta de reagendamento pendente",
  rescheduleAlertIntervalHint: "Minutos entre avisos internos enquanto uma consulta cancelada continuar sem ser reagendada. Desliga-se sozinho ao criar a nova consulta.",
  timezoneLabel: "Fuso horário da clínica",
  timezoneHint: "Usado para enviar lembretes e alertas de reagendamento à hora local correta (só em horário laboral).",
  satisfactionTitle: "Satisfação do paciente",
  satisfactionEmpty: "Ainda não há opiniões no período.",
  satisfactionRate: "Satisfação",
  satisfactionResponses: "{n} respostas",
  satisfactionGood: "Bem",
  satisfactionRegular: "Regular",
  satisfactionBad: "Mal",
  satisfactionComments: "Queixas e sugestões",
  satisfactionAnonymous: "Anónimo",
  rescheduleAlertIntervalReadOnlyHint: "Só o administrador da clínica configura este intervalo.",
  rescheduleAlertIntervalUnit: "min",
  dailyCloseTitle: "Fecho diário de caixa",
  loadingClose: "A carregar fecho…",
  paidToday: "Cobrado hoje",
  checkoutsCount: "{n} cobranças",
  pendingOpen: "Pendente aberto",
  pendingCountSub: "{n} partidas",
  closedAt: "Fechado às {time}",
  snapshotLine: "Snapshot: {paid} cobrado · {pending} pendente",
  paidAfterClose: "Após fecho: {amount}",
  notes: "Notas do fecho (opcional)",
  closing: "A fechar…",
  closeDay: "Fechar dia",
  dayStillOpen: "O dia ainda está aberto.",
  history: "Histórico recente",
  refresh: "Atualizar",
  loadMetricsFailed: "Não foi possível carregar métricas da agenda",
  loadMetricsNetworkError: "Erro de rede ao carregar métricas da agenda",
  loadDailyCloseFailed: "Não foi possível carregar o fecho diário",
  closeDayFailed: "Não foi possível fechar o dia",
};

const agendaFr: AgendaAnalyticsI18n = {
  ...agendaEn,
  loading: "Chargement des métriques d'agenda…",
  scheduleScope: "Horaires : {label}",
  occupiedAvailable: "{occupied} occupés · {available} libres",
  demand30d: "Demande 30 jours",
  demandHint: "Rendez-vous demandés / créés",
  noShow: "Absences",
  cancellations: "Annulations",
  appointmentsCount: "{n} rendez-vous",
  peakHour: "Heure de pointe",
  noData: "Pas de données",
  busiestHours: "Heures les plus chargées",
  topDemandDays: "Jours à plus forte demande",
  demandTotalLine: "Demande totale : {n}",
  timeByService: "Temps par service",
  durationHint: "Durée recommandée vs temps réel enregistré",
  noDurationData: "Pas de données de durée par service.",
  guidedMinutes: "{n} min guidées",
  noGuided: "Sans guide",
  realMinutes: "{n} min réelles",
  noReal: "Sans réel",
  workSchedule: "Horaires de travail",
  loadingSchedule: "Chargement des horaires…",
  start: "Début",
  end: "Fin",
  overtimeFrom: "Heures supp. à partir de",
  overtimeCap: "Plafond heures supp.",
  allowOvertime: "Autoriser les heures supplémentaires",
  scheduleReadOnlyHint: "Lecture seule : l'admin définit l'horaire partagé.",
  savingSchedule: "Enregistrement…",
  saveSchedule: "Enregistrer l'horaire",
  saved: "Enregistré",
  rescheduleAlertInterval: "Alerte de reprogrammation en attente",
  rescheduleAlertIntervalHint: "Minutes entre les rappels internes tant qu'un rendez-vous annulé reste sans nouvelle date. S'éteint automatiquement à la création du nouveau rendez-vous.",
  timezoneLabel: "Fuseau horaire de la clinique",
  timezoneHint: "Utilisé pour envoyer les rappels et alertes de reprogrammation à la bonne heure locale (heures d'ouverture uniquement).",
  satisfactionTitle: "Satisfaction du patient",
  satisfactionEmpty: "Pas encore d'avis sur la période.",
  satisfactionRate: "Satisfaction",
  satisfactionResponses: "{n} réponses",
  satisfactionGood: "Bien",
  satisfactionRegular: "Moyen",
  satisfactionBad: "Mauvais",
  satisfactionComments: "Réclamations et suggestions",
  satisfactionAnonymous: "Anonyme",
  rescheduleAlertIntervalReadOnlyHint: "Seul l'admin de la clinique configure cet intervalle.",
  rescheduleAlertIntervalUnit: "min",
  dailyCloseTitle: "Clôture de caisse journalière",
  loadingClose: "Chargement de la clôture…",
  paidToday: "Encaissé aujourd'hui",
  checkoutsCount: "{n} encaissements",
  pendingOpen: "En attente ouvert",
  pendingCountSub: "{n} lignes",
  closedAt: "Clôturé à {time}",
  snapshotLine: "Instantané : {paid} encaissé · {pending} en attente",
  paidAfterClose: "Après clôture : {amount}",
  notes: "Notes de clôture (optionnel)",
  closing: "Clôture…",
  closeDay: "Clôturer le jour",
  dayStillOpen: "La journée est encore ouverte.",
  history: "Historique récent",
  refresh: "Actualiser",
  loadMetricsFailed: "Impossible de charger les métriques d'agenda",
  loadMetricsNetworkError: "Erreur réseau lors du chargement des métriques d'agenda",
  loadDailyCloseFailed: "Impossible de charger la clôture journalière",
  closeDayFailed: "Impossible de clôturer la journée",
};

export const checkoutAnalyticsByLang = {
  es: analyticsEs,
  en: analyticsEn,
  pt: analyticsPt,
  fr: analyticsFr,
} as const;

export const agendaAnalyticsByLang = {
  es: agendaEs,
  en: agendaEn,
  pt: agendaPt,
  fr: agendaFr,
} as const;
