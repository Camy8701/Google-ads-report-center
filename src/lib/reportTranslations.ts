/**
 * Report UI translations — all static strings in the report view.
 * Usage: const t = getReportT(language);
 */

export interface ReportTranslations {
  // Nav / toolbar (no-print bar)
  allReports: string;
  markInReview: string;
  approve: string;
  resyncSearchTerms: string;
  syncing: string;
  print: string;
  exportPdf: string;
  exporting: string;

  // Report header
  generated: string;
  monthlyPerformanceReport: string;
  goal: string; // "Goal ·"

  // Performance snapshot section
  performanceSnapshot: string;
  metricsTitle: string;   // "The metrics that"
  metricsEm: string;      // "matter first"
  takeaway: (n: number) => string; // "Takeaway 1"

  // Six-month trend chart
  sixMonthTrend: string;
  spendVsReturn: string;  // ecommerce
  spendVsCpa: string;     // lead_gen / growth
  trendNote: string;

  // Campaign comparison section
  campaignComparison: string;
  campaignCompTitle: string;   // "Where budget"
  campaignCompEm: string;      // "did the work"
  performanceComparison: string;
  campaignLadder: string;
  budgetAllocation: string;
  spendShare: string;
  topWinner: string;
  audienceSplit: string;
  deviceSplit: string;
  trackedSpend: string; // "Tracked spend:"

  // Campaign chart helpers
  noSpendRecorded: string;
  noSpendShareBreakdown: string;
  spend: string;

  // Section labels + titles (Section component titleMap)
  execSummaryLabel: string;
  execSummaryTitle: string;
  execSummaryEm: string;
  whatChangedLabel: string;
  whatChangedTitle: string;
  whatChangedEm: string;
  opportunitiesLabel: string;
  opportunitiesTitle: string;
  opportunitiesEm: string;
  appendixLabel: string;
  appendixTitle: string;
  appendixEm: string;

  // Section editor buttons
  edit: string;
  cancel: string;
  save: string;
  regenerate: string;
  regenerating: string;

  // Movement / driver section
  movementDetail: string;
  mainMovements: string;
  searchInsight: string;
  topSearchTerms: string;
  productInsight: string;
  topProducts: string;
  leadInsight: string;
  hardVsSoftConversions: string;
  growthInsight: string;
  momentumSignals: string;
  optimizationLens: string;

  // Table headers
  tableItem: string;
  tableClicks: string;
  tableConversions: string;
  tableAvgCpc: string;
  noSearchTermData: string;
  noProductData: string;

  // Decision page
  decisionPageLabel: string;
  decisionPageTitle: string;
  decisionPageEm: string;
  whyItMatters: string;
  expectedImpact: string;
  decisionBodyLive: string;

  // Metric labels (hero metrics)
  metricCost: string;
  metricConversions: string;
  metricConversionValue: string;
  metricRoas: string;
  metricHardConversions: string;
  metricSoftConversions: string;
  metricCpa: string;
  metricClicks: string;
  metricCtr: string;
  metricCpc: string;
  primaryGoalNote: string;
  cpaNote: string;
  growthNote: string;

  // WinnerCard mini-stats
  miniStatSpend: string;
  miniStatConv: string;
  miniStatDelta: string;
  miniStatRoas: string;  // "ROAS" (same in most langs)
  miniStatCpa: string;   // "CPA"

  // MiniTrendChart legend
  legendCost: string;

  // Metric inline % suffix
  mom: string; // "MoM"

  // GrowthInsightPanel
  growthInsightImpressionsLabel: string;
  growthReadTitle: string;
  growthReadBody: string;

  // Device split empty state
  deviceSplitEmpty: string;

  // Footer
  footerTagline: string;

  // Live driver labels (buildLiveWhatChanged)
  driverPrimary: string;
  driverCpc: string;
  driverConvEfficiency: string;

  // Tooltip labels
  tooltipConversions: string;
  tooltipSpendShare: string;
  tooltipShare: string;
}

const en: ReportTranslations = {
  allReports: "All reports",
  markInReview: "Mark in review",
  approve: "Approve",
  resyncSearchTerms: "Re-sync search terms",
  syncing: "Syncing…",
  print: "Print",
  exportPdf: "Export PDF",
  exporting: "Exporting…",

  generated: "Generated",
  monthlyPerformanceReport: "Monthly performance report",
  goal: "Goal ·",

  performanceSnapshot: "Performance snapshot",
  metricsTitle: "The metrics that",
  metricsEm: "matter first",
  takeaway: (n) => `Takeaway ${n}`,

  sixMonthTrend: "Six-month trend",
  spendVsReturn: "Spend vs return",
  spendVsCpa: "Spend vs CPA",
  trendNote: "A quick read on direction matters more than a paragraph of explanation here.",

  campaignComparison: "Campaign comparison",
  campaignCompTitle: "Where budget",
  campaignCompEm: "did the work",
  performanceComparison: "Performance comparison",
  campaignLadder: "Campaign ladder",
  budgetAllocation: "Budget allocation",
  spendShare: "Spend share",
  topWinner: "Top winner",
  audienceSplit: "Audience split",
  deviceSplit: "Device split",
  trackedSpend: "Tracked spend:",

  noSpendRecorded: "No spend was recorded across campaigns for this period.",
  noSpendShareBreakdown: "No spend-share breakdown is available for this period.",
  spend: "Spend",

  execSummaryLabel: "Executive summary",
  execSummaryTitle: "The month at",
  execSummaryEm: "a glance",
  whatChangedLabel: "What changed",
  whatChangedTitle: "Why the numbers",
  whatChangedEm: "moved",
  opportunitiesLabel: "Opportunities",
  opportunitiesTitle: "Where to lean",
  opportunitiesEm: "in next",
  appendixLabel: "Appendix",
  appendixTitle: "Supporting",
  appendixEm: "detail",

  edit: "Edit",
  cancel: "Cancel",
  save: "Save",
  regenerate: "Regenerate",
  regenerating: "Regenerating…",

  movementDetail: "Movement detail",
  mainMovements: "Main movements",
  searchInsight: "Search insight",
  topSearchTerms: "Top 10 search terms",
  productInsight: "Product insight",
  topProducts: "Top 10 products",
  leadInsight: "Lead insight",
  hardVsSoftConversions: "Hard vs soft conversions",
  growthInsight: "Growth insight",
  momentumSignals: "Momentum signals",
  optimizationLens: "Optimization lens",

  tableItem: "Item",
  tableClicks: "Clicks",
  tableConversions: "Conv.",
  tableAvgCpc: "Avg. CPC",
  noSearchTermData: "No search term data available yet.",
  noProductData: "No product-level performance available yet.",

  decisionPageLabel: "Decision page",
  decisionPageTitle: "Recommended",
  decisionPageEm: "actions",
  whyItMatters: "Why it matters",
  expectedImpact: "Expected impact",
  decisionBodyLive: "Three priorities for next month, ordered by expected impact and grounded in the actual account data.",

  metricCost: "Cost",
  metricConversions: "Conversions",
  metricConversionValue: "Conversion value",
  metricRoas: "ROAS",
  metricHardConversions: "Hard conversions",
  metricSoftConversions: "Soft conversions",
  metricCpa: "CPA",
  metricClicks: "Clicks",
  metricCtr: "CTR",
  metricCpc: "CPC",
  primaryGoalNote: "Primary account goal",
  cpaNote: "Read against hard conversions",
  growthNote: "Growth lens",

  miniStatSpend: "Spend",
  miniStatConv: "Conv.",
  miniStatDelta: "Delta",
  miniStatRoas: "ROAS",
  miniStatCpa: "CPA",

  legendCost: "Cost",

  mom: "MoM",

  growthInsightImpressionsLabel: "Impressions",
  growthReadTitle: "Read on this account",
  growthReadBody: "Growth accounts should not be forced into a fake deep explanation every month. When the data says seasonality, broader demand, or softer auction pressure, this report should say that clearly and move to the next decision.",

  deviceSplitEmpty: "Device segmentation is not stored in the report data yet. Once the Google Ads sync writes device-level metrics, this chart can render the real split here.",

  footerTagline: "Always optimizing — LYNCK Studio",

  driverPrimary: "Primary driver",
  driverCpc: "CPC shift",
  driverConvEfficiency: "Conversion efficiency",

  tooltipConversions: "Conversions",
  tooltipSpendShare: "Spend share",
  tooltipShare: "Share",
};

const de: ReportTranslations = {
  allReports: "Alle Berichte",
  markInReview: "In Prüfung markieren",
  approve: "Freigeben",
  resyncSearchTerms: "Suchbegriffe neu synchronisieren",
  syncing: "Synchronisierung…",
  print: "Drucken",
  exportPdf: "PDF exportieren",
  exporting: "Exportieren…",

  generated: "Erstellt",
  monthlyPerformanceReport: "Monatlicher Leistungsbericht",
  goal: "Ziel ·",

  performanceSnapshot: "Leistungsübersicht",
  metricsTitle: "Die wichtigsten",
  metricsEm: "Kennzahlen",
  takeaway: (n) => `Erkenntnis ${n}`,

  sixMonthTrend: "6-Monats-Trend",
  spendVsReturn: "Budget vs. Ertrag",
  spendVsCpa: "Budget vs. CPA",
  trendNote: "Eine kurze Einschätzung der Richtung ist hier aussagekräftiger als eine lange Erklärung.",

  campaignComparison: "Kampagnenvergleich",
  campaignCompTitle: "Wo das Budget",
  campaignCompEm: "gearbeitet hat",
  performanceComparison: "Leistungsvergleich",
  campaignLadder: "Kampagnen-Ranking",
  budgetAllocation: "Budgetverteilung",
  spendShare: "Budget­anteil",
  topWinner: "Top-Kampagne",
  audienceSplit: "Zielgruppen­aufteilung",
  deviceSplit: "Geräteaufteilung",
  trackedSpend: "Erfasstes Budget:",

  noSpendRecorded: "In diesem Zeitraum wurden keine Ausgaben über Kampagnen erfasst.",
  noSpendShareBreakdown: "Für diesen Zeitraum ist keine Budget­aufteilung verfügbar.",
  spend: "Budget",

  execSummaryLabel: "Zusammenfassung",
  execSummaryTitle: "Der Monat auf",
  execSummaryEm: "einen Blick",
  whatChangedLabel: "Was hat sich verändert",
  whatChangedTitle: "Warum sich die Zahlen",
  whatChangedEm: "verändert haben",
  opportunitiesLabel: "Optimierungspotenziale",
  opportunitiesTitle: "Wo als nächstes",
  opportunitiesEm: "ansetzen",
  appendixLabel: "Anhang",
  appendixTitle: "Ergänzende",
  appendixEm: "Details",

  edit: "Bearbeiten",
  cancel: "Abbrechen",
  save: "Speichern",
  regenerate: "Neu generieren",
  regenerating: "Wird generiert…",

  movementDetail: "Bewegungsdetails",
  mainMovements: "Wichtigste Entwicklungen",
  searchInsight: "Suchbegriff-Analyse",
  topSearchTerms: "Top 10 Suchbegriffe",
  productInsight: "Produkt-Analyse",
  topProducts: "Top 10 Produkte",
  leadInsight: "Lead-Analyse",
  hardVsSoftConversions: "Hard- vs. Soft-Conversions",
  growthInsight: "Wachstums-Analyse",
  momentumSignals: "Momentum-Signale",
  optimizationLens: "Optimierungsperspektive",

  tableItem: "Begriff",
  tableClicks: "Klicks",
  tableConversions: "Conv.",
  tableAvgCpc: "Ø CPC",
  noSearchTermData: "Noch keine Suchbegriff-Daten verfügbar.",
  noProductData: "Noch keine Produktleistungs-Daten verfügbar.",

  decisionPageLabel: "Maßnahmenplan",
  decisionPageTitle: "Empfohlene",
  decisionPageEm: "Maßnahmen",
  whyItMatters: "Warum es wichtig ist",
  expectedImpact: "Erwartete Wirkung",
  decisionBodyLive: "Drei Prioritäten für den nächsten Monat, nach erwarteter Wirkung geordnet und auf Basis der tatsächlichen Kontodaten.",

  metricCost: "Budget",
  metricConversions: "Conversions",
  metricConversionValue: "Conversion-Wert",
  metricRoas: "ROAS",
  metricHardConversions: "Hard-Conversions",
  metricSoftConversions: "Soft-Conversions",
  metricCpa: "CPA",
  metricClicks: "Klicks",
  metricCtr: "CTR",
  metricCpc: "CPC",
  primaryGoalNote: "Primäres Kontoziel",
  cpaNote: "Im Verhältnis zu Hard-Conversions",
  growthNote: "Wachstumsperspektive",

  miniStatSpend: "Budget",
  miniStatConv: "Conv.",
  miniStatDelta: "Delta",
  miniStatRoas: "ROAS",
  miniStatCpa: "CPA",

  legendCost: "Budget",

  mom: "MoM",

  growthInsightImpressionsLabel: "Impressionen",
  growthReadTitle: "Einschätzung zu diesem Konto",
  growthReadBody: "Wachstumskonten sollten nicht jeden Monat zu einer künstlich tiefen Erklärung gezwungen werden. Wenn die Daten auf Saisonalität, breitere Nachfrage oder schwächeren Auktionsdruck hinweisen, sollte dieser Bericht das klar aussagen und zur nächsten Entscheidung übergehen.",

  deviceSplitEmpty: "Die Gerätesegmentierung ist noch nicht in den Berichtsdaten gespeichert. Sobald die Google Ads-Synchronisierung gerätebezogene Metriken schreibt, wird hier die tatsächliche Aufteilung angezeigt.",

  footerTagline: "Immer optimieren — LYNCK Studio",

  driverPrimary: "Haupttreiber",
  driverCpc: "CPC-Entwicklung",
  driverConvEfficiency: "Conversion-Effizienz",

  tooltipConversions: "Conversions",
  tooltipSpendShare: "Budgetanteil",
  tooltipShare: "Anteil",
};

const fr: ReportTranslations = {
  allReports: "Tous les rapports",
  markInReview: "Marquer en révision",
  approve: "Approuver",
  resyncSearchTerms: "Resynchroniser les termes",
  syncing: "Synchronisation…",
  print: "Imprimer",
  exportPdf: "Exporter en PDF",
  exporting: "Export en cours…",

  generated: "Généré",
  monthlyPerformanceReport: "Rapport de performance mensuel",
  goal: "Objectif ·",

  performanceSnapshot: "Aperçu des performances",
  metricsTitle: "Les indicateurs qui",
  metricsEm: "comptent d'abord",
  takeaway: (n) => `Point clé ${n}`,

  sixMonthTrend: "Tendance sur 6 mois",
  spendVsReturn: "Dépenses vs retour",
  spendVsCpa: "Dépenses vs CPA",
  trendNote: "Une lecture rapide de la direction importe plus qu'un paragraphe d'explication ici.",

  campaignComparison: "Comparaison des campagnes",
  campaignCompTitle: "Où le budget",
  campaignCompEm: "a travaillé",
  performanceComparison: "Comparaison de performance",
  campaignLadder: "Classement des campagnes",
  budgetAllocation: "Allocation budgétaire",
  spendShare: "Part des dépenses",
  topWinner: "Meilleure campagne",
  audienceSplit: "Répartition de l'audience",
  deviceSplit: "Répartition par appareil",
  trackedSpend: "Dépenses suivies :",

  noSpendRecorded: "Aucune dépense enregistrée pour les campagnes sur cette période.",
  noSpendShareBreakdown: "Aucune répartition des dépenses disponible pour cette période.",
  spend: "Dépenses",

  execSummaryLabel: "Résumé exécutif",
  execSummaryTitle: "Le mois en",
  execSummaryEm: "un coup d'œil",
  whatChangedLabel: "Ce qui a changé",
  whatChangedTitle: "Pourquoi les chiffres",
  whatChangedEm: "ont évolué",
  opportunitiesLabel: "Opportunités",
  opportunitiesTitle: "Où concentrer",
  opportunitiesEm: "les efforts",
  appendixLabel: "Annexe",
  appendixTitle: "Détails",
  appendixEm: "complémentaires",

  edit: "Modifier",
  cancel: "Annuler",
  save: "Enregistrer",
  regenerate: "Régénérer",
  regenerating: "Régénération…",

  movementDetail: "Détail des mouvements",
  mainMovements: "Mouvements principaux",
  searchInsight: "Analyse des recherches",
  topSearchTerms: "Top 10 termes de recherche",
  productInsight: "Analyse produits",
  topProducts: "Top 10 produits",
  leadInsight: "Analyse des leads",
  hardVsSoftConversions: "Conversions dures vs douces",
  growthInsight: "Analyse de croissance",
  momentumSignals: "Signaux de momentum",
  optimizationLens: "Angle d'optimisation",

  tableItem: "Élément",
  tableClicks: "Clics",
  tableConversions: "Conv.",
  tableAvgCpc: "CPC moy.",
  noSearchTermData: "Pas encore de données sur les termes de recherche.",
  noProductData: "Pas encore de données de performance produit.",

  decisionPageLabel: "Plan d'action",
  decisionPageTitle: "Actions",
  decisionPageEm: "recommandées",
  whyItMatters: "Pourquoi c'est important",
  expectedImpact: "Impact attendu",
  decisionBodyLive: "Trois priorités pour le mois prochain, classées par impact attendu et basées sur les données réelles du compte.",

  metricCost: "Dépenses",
  metricConversions: "Conversions",
  metricConversionValue: "Valeur des conversions",
  metricRoas: "ROAS",
  metricHardConversions: "Conv. dures",
  metricSoftConversions: "Conv. douces",
  metricCpa: "CPA",
  metricClicks: "Clics",
  metricCtr: "CTR",
  metricCpc: "CPC",
  primaryGoalNote: "Objectif principal du compte",
  cpaNote: "Par rapport aux conv. dures",
  growthNote: "Optique croissance",

  miniStatSpend: "Dépenses",
  miniStatConv: "Conv.",
  miniStatDelta: "Delta",
  miniStatRoas: "ROAS",
  miniStatCpa: "CPA",

  legendCost: "Dépenses",

  mom: "MoM",

  growthInsightImpressionsLabel: "Impressions",
  growthReadTitle: "Lecture de ce compte",
  growthReadBody: "Les comptes en croissance ne doivent pas être forcés à une explication artificielle chaque mois. Quand les données indiquent la saisonnalité, une demande plus large ou une pression d'enchères plus faible, ce rapport doit le dire clairement et passer à la décision suivante.",

  deviceSplitEmpty: "La segmentation par appareil n'est pas encore enregistrée dans les données du rapport. Une fois que la synchronisation Google Ads écrira les métriques par appareil, ce graphique affichera la répartition réelle.",

  footerTagline: "Toujours en optimisation — LYNCK Studio",

  driverPrimary: "Facteur principal",
  driverCpc: "Évolution du CPC",
  driverConvEfficiency: "Efficacité des conversions",

  tooltipConversions: "Conversions",
  tooltipSpendShare: "Part des dépenses",
  tooltipShare: "Part",
};

const es: ReportTranslations = {
  allReports: "Todos los informes",
  markInReview: "Marcar en revisión",
  approve: "Aprobar",
  resyncSearchTerms: "Resincronizar términos",
  syncing: "Sincronizando…",
  print: "Imprimir",
  exportPdf: "Exportar PDF",
  exporting: "Exportando…",

  generated: "Generado",
  monthlyPerformanceReport: "Informe de rendimiento mensual",
  goal: "Objetivo ·",

  performanceSnapshot: "Resumen de rendimiento",
  metricsTitle: "Las métricas que",
  metricsEm: "importan primero",
  takeaway: (n) => `Conclusión ${n}`,

  sixMonthTrend: "Tendencia de 6 meses",
  spendVsReturn: "Gasto vs retorno",
  spendVsCpa: "Gasto vs CPA",
  trendNote: "Una lectura rápida de la dirección importa más que un párrafo de explicación aquí.",

  campaignComparison: "Comparación de campañas",
  campaignCompTitle: "Dónde el presupuesto",
  campaignCompEm: "trabajó más",
  performanceComparison: "Comparación de rendimiento",
  campaignLadder: "Ranking de campañas",
  budgetAllocation: "Distribución del presupuesto",
  spendShare: "Cuota de gasto",
  topWinner: "Mejor campaña",
  audienceSplit: "División de audiencia",
  deviceSplit: "División por dispositivo",
  trackedSpend: "Gasto registrado:",

  noSpendRecorded: "No se registró gasto en campañas durante este período.",
  noSpendShareBreakdown: "No hay desglose de cuota de gasto disponible para este período.",
  spend: "Gasto",

  execSummaryLabel: "Resumen ejecutivo",
  execSummaryTitle: "El mes de",
  execSummaryEm: "un vistazo",
  whatChangedLabel: "Qué cambió",
  whatChangedTitle: "Por qué los números",
  whatChangedEm: "se movieron",
  opportunitiesLabel: "Oportunidades",
  opportunitiesTitle: "Dónde enfocarse",
  opportunitiesEm: "a continuación",
  appendixLabel: "Apéndice",
  appendixTitle: "Detalle",
  appendixEm: "de soporte",

  edit: "Editar",
  cancel: "Cancelar",
  save: "Guardar",
  regenerate: "Regenerar",
  regenerating: "Regenerando…",

  movementDetail: "Detalle de movimientos",
  mainMovements: "Movimientos principales",
  searchInsight: "Análisis de búsquedas",
  topSearchTerms: "Top 10 términos de búsqueda",
  productInsight: "Análisis de productos",
  topProducts: "Top 10 productos",
  leadInsight: "Análisis de leads",
  hardVsSoftConversions: "Conversiones directas vs indirectas",
  growthInsight: "Análisis de crecimiento",
  momentumSignals: "Señales de momentum",
  optimizationLens: "Perspectiva de optimización",

  tableItem: "Elemento",
  tableClicks: "Clics",
  tableConversions: "Conv.",
  tableAvgCpc: "CPC prom.",
  noSearchTermData: "Aún no hay datos de términos de búsqueda.",
  noProductData: "Aún no hay datos de rendimiento a nivel de producto.",

  decisionPageLabel: "Plan de acción",
  decisionPageTitle: "Acciones",
  decisionPageEm: "recomendadas",
  whyItMatters: "Por qué importa",
  expectedImpact: "Impacto esperado",
  decisionBodyLive: "Tres prioridades para el próximo mes, ordenadas por impacto esperado y basadas en los datos reales de la cuenta.",

  metricCost: "Gasto",
  metricConversions: "Conversiones",
  metricConversionValue: "Valor de conversión",
  metricRoas: "ROAS",
  metricHardConversions: "Conv. directas",
  metricSoftConversions: "Conv. indirectas",
  metricCpa: "CPA",
  metricClicks: "Clics",
  metricCtr: "CTR",
  metricCpc: "CPC",
  primaryGoalNote: "Objetivo principal de la cuenta",
  cpaNote: "Relativo a conv. directas",
  growthNote: "Perspectiva de crecimiento",

  miniStatSpend: "Gasto",
  miniStatConv: "Conv.",
  miniStatDelta: "Delta",
  miniStatRoas: "ROAS",
  miniStatCpa: "CPA",

  legendCost: "Gasto",

  mom: "MoM",

  growthInsightImpressionsLabel: "Impresiones",
  growthReadTitle: "Lectura de esta cuenta",
  growthReadBody: "Las cuentas de crecimiento no deben ser forzadas a una explicación artificialmente profunda cada mes. Cuando los datos indican estacionalidad, mayor demanda o menor presión de subasta, este informe debe decirlo claramente y pasar a la siguiente decisión.",

  deviceSplitEmpty: "La segmentación por dispositivo aún no está almacenada en los datos del informe. Una vez que la sincronización de Google Ads escriba métricas por dispositivo, este gráfico mostrará la división real.",

  footerTagline: "Siempre optimizando — LYNCK Studio",

  driverPrimary: "Factor principal",
  driverCpc: "Variación del CPC",
  driverConvEfficiency: "Eficiencia de conversión",

  tooltipConversions: "Conversiones",
  tooltipSpendShare: "Cuota de gasto",
  tooltipShare: "Cuota",
};

const nl: ReportTranslations = {
  allReports: "Alle rapporten",
  markInReview: "Markeer als in beoordeling",
  approve: "Goedkeuren",
  resyncSearchTerms: "Zoektermen opnieuw synchroniseren",
  syncing: "Synchroniseren…",
  print: "Afdrukken",
  exportPdf: "PDF exporteren",
  exporting: "Exporteren…",

  generated: "Gegenereerd",
  monthlyPerformanceReport: "Maandelijks prestatierapport",
  goal: "Doel ·",

  performanceSnapshot: "Prestatieoverzicht",
  metricsTitle: "De statistieken die",
  metricsEm: "er het meest toe doen",
  takeaway: (n) => `Inzicht ${n}`,

  sixMonthTrend: "Trend van 6 maanden",
  spendVsReturn: "Budget vs. rendement",
  spendVsCpa: "Budget vs. CPA",
  trendNote: "Een snelle lezing van de richting is hier waardevoller dan een uitgebreide uitleg.",

  campaignComparison: "Campagnevergelijking",
  campaignCompTitle: "Waar het budget",
  campaignCompEm: "het werk deed",
  performanceComparison: "Prestatievergelijking",
  campaignLadder: "Campagnerangschikking",
  budgetAllocation: "Budgetverdeling",
  spendShare: "Budgetaandeel",
  topWinner: "Beste campagne",
  audienceSplit: "Doelgroepverdeling",
  deviceSplit: "Apparaatverdeling",
  trackedSpend: "Geregistreerd budget:",

  noSpendRecorded: "Er zijn geen uitgaven geregistreerd voor campagnes in deze periode.",
  noSpendShareBreakdown: "Er is geen budgetverdeling beschikbaar voor deze periode.",
  spend: "Budget",

  execSummaryLabel: "Samenvatting",
  execSummaryTitle: "De maand in",
  execSummaryEm: "één oogopslag",
  whatChangedLabel: "Wat is er veranderd",
  whatChangedTitle: "Waarom de cijfers",
  whatChangedEm: "verschoven zijn",
  opportunitiesLabel: "Kansen",
  opportunitiesTitle: "Waar als volgende",
  opportunitiesEm: "op in te zetten",
  appendixLabel: "Bijlage",
  appendixTitle: "Ondersteunende",
  appendixEm: "details",

  edit: "Bewerken",
  cancel: "Annuleren",
  save: "Opslaan",
  regenerate: "Opnieuw genereren",
  regenerating: "Genereren…",

  movementDetail: "Bewegingsdetail",
  mainMovements: "Belangrijkste ontwikkelingen",
  searchInsight: "Zoektermen­analyse",
  topSearchTerms: "Top 10 zoektermen",
  productInsight: "Productanalyse",
  topProducts: "Top 10 producten",
  leadInsight: "Lead-analyse",
  hardVsSoftConversions: "Harde vs. zachte conversies",
  growthInsight: "Groeianalyse",
  momentumSignals: "Momentumsignalen",
  optimizationLens: "Optimalisatieperspectief",

  tableItem: "Item",
  tableClicks: "Klikken",
  tableConversions: "Conv.",
  tableAvgCpc: "Gem. CPC",
  noSearchTermData: "Nog geen zoektermengegevens beschikbaar.",
  noProductData: "Nog geen productprestatiegegevens beschikbaar.",

  decisionPageLabel: "Actieplan",
  decisionPageTitle: "Aanbevolen",
  decisionPageEm: "acties",
  whyItMatters: "Waarom het belangrijk is",
  expectedImpact: "Verwacht effect",
  decisionBodyLive: "Drie prioriteiten voor de komende maand, gerangschikt op verwacht effect en gebaseerd op de werkelijke accountgegevens.",

  metricCost: "Budget",
  metricConversions: "Conversies",
  metricConversionValue: "Conversiewaarde",
  metricRoas: "ROAS",
  metricHardConversions: "Harde conversies",
  metricSoftConversions: "Zachte conversies",
  metricCpa: "CPA",
  metricClicks: "Klikken",
  metricCtr: "CTR",
  metricCpc: "CPC",
  primaryGoalNote: "Primair accountdoel",
  cpaNote: "Gerelateerd aan harde conversies",
  growthNote: "Groeiperspectief",

  miniStatSpend: "Budget",
  miniStatConv: "Conv.",
  miniStatDelta: "Delta",
  miniStatRoas: "ROAS",
  miniStatCpa: "CPA",

  legendCost: "Budget",

  mom: "MoM",

  growthInsightImpressionsLabel: "Vertoningen",
  growthReadTitle: "Lezing van dit account",
  growthReadBody: "Groeiaccounts mogen niet elke maand worden gedwongen tot een kunstmatig diepe verklaring. Als de gegevens wijzen op seizoensinvloeden, bredere vraag of lagere veilingdruk, moet dit rapport dat duidelijk zeggen en doorgaan naar de volgende beslissing.",

  deviceSplitEmpty: "Apparaatsegmentatie is nog niet opgeslagen in de rapportgegevens. Zodra de Google Ads-synchronisatie apparaatspecifieke statistieken schrijft, toont dit diagram de werkelijke verdeling.",

  footerTagline: "Altijd optimaliseren — LYNCK Studio",

  driverPrimary: "Hoofdaanjager",
  driverCpc: "CPC-verschuiving",
  driverConvEfficiency: "Conversie-efficiëntie",

  tooltipConversions: "Conversies",
  tooltipSpendShare: "Budgetaandeel",
  tooltipShare: "Aandeel",
};

const it: ReportTranslations = {
  allReports: "Tutti i report",
  markInReview: "Segna come in revisione",
  approve: "Approva",
  resyncSearchTerms: "Risincronizza i termini",
  syncing: "Sincronizzazione…",
  print: "Stampa",
  exportPdf: "Esporta PDF",
  exporting: "Esportazione…",

  generated: "Generato",
  monthlyPerformanceReport: "Report mensile delle performance",
  goal: "Obiettivo ·",

  performanceSnapshot: "Panoramica delle performance",
  metricsTitle: "Le metriche che",
  metricsEm: "contano di più",
  takeaway: (n) => `Punto chiave ${n}`,

  sixMonthTrend: "Tendenza 6 mesi",
  spendVsReturn: "Spesa vs ritorno",
  spendVsCpa: "Spesa vs CPA",
  trendNote: "Una lettura rapida della direzione vale più di un paragrafo di spiegazioni.",

  campaignComparison: "Confronto campagne",
  campaignCompTitle: "Dove il budget",
  campaignCompEm: "ha lavorato",
  performanceComparison: "Confronto performance",
  campaignLadder: "Classifica campagne",
  budgetAllocation: "Allocazione del budget",
  spendShare: "Quota di spesa",
  topWinner: "Campagna migliore",
  audienceSplit: "Suddivisione del pubblico",
  deviceSplit: "Suddivisione per dispositivo",
  trackedSpend: "Spesa tracciata:",

  noSpendRecorded: "Nessuna spesa registrata nelle campagne per questo periodo.",
  noSpendShareBreakdown: "Nessuna suddivisione della spesa disponibile per questo periodo.",
  spend: "Spesa",

  execSummaryLabel: "Sintesi esecutiva",
  execSummaryTitle: "Il mese in",
  execSummaryEm: "sintesi",
  whatChangedLabel: "Cosa è cambiato",
  whatChangedTitle: "Perché i numeri",
  whatChangedEm: "si sono mossi",
  opportunitiesLabel: "Opportunità",
  opportunitiesTitle: "Dove concentrarsi",
  opportunitiesEm: "nei prossimi passi",
  appendixLabel: "Appendice",
  appendixTitle: "Dettagli",
  appendixEm: "di supporto",

  edit: "Modifica",
  cancel: "Annulla",
  save: "Salva",
  regenerate: "Rigenera",
  regenerating: "Rigenerazione…",

  movementDetail: "Dettaglio movimenti",
  mainMovements: "Movimenti principali",
  searchInsight: "Analisi delle ricerche",
  topSearchTerms: "Top 10 termini di ricerca",
  productInsight: "Analisi prodotti",
  topProducts: "Top 10 prodotti",
  leadInsight: "Analisi dei lead",
  hardVsSoftConversions: "Conversioni dirette vs indirette",
  growthInsight: "Analisi della crescita",
  momentumSignals: "Segnali di momentum",
  optimizationLens: "Prospettiva di ottimizzazione",

  tableItem: "Elemento",
  tableClicks: "Clic",
  tableConversions: "Conv.",
  tableAvgCpc: "CPC med.",
  noSearchTermData: "Nessun dato sui termini di ricerca ancora disponibile.",
  noProductData: "Nessun dato sulle performance di prodotto ancora disponibile.",

  decisionPageLabel: "Piano d'azione",
  decisionPageTitle: "Azioni",
  decisionPageEm: "raccomandate",
  whyItMatters: "Perché è importante",
  expectedImpact: "Impatto previsto",
  decisionBodyLive: "Tre priorità per il prossimo mese, ordinate per impatto atteso e basate sui dati reali dell'account.",

  metricCost: "Spesa",
  metricConversions: "Conversioni",
  metricConversionValue: "Valore conversioni",
  metricRoas: "ROAS",
  metricHardConversions: "Conv. dirette",
  metricSoftConversions: "Conv. indirette",
  metricCpa: "CPA",
  metricClicks: "Clic",
  metricCtr: "CTR",
  metricCpc: "CPC",
  primaryGoalNote: "Obiettivo principale dell'account",
  cpaNote: "Relativo alle conv. dirette",
  growthNote: "Prospettiva di crescita",

  miniStatSpend: "Spesa",
  miniStatConv: "Conv.",
  miniStatDelta: "Delta",
  miniStatRoas: "ROAS",
  miniStatCpa: "CPA",

  legendCost: "Spesa",

  mom: "MoM",

  growthInsightImpressionsLabel: "Impressioni",
  growthReadTitle: "Lettura di questo account",
  growthReadBody: "Gli account in crescita non devono essere forzati a una spiegazione artificialmente profonda ogni mese. Quando i dati indicano stagionalità, maggiore domanda o minore pressione delle aste, questo report dovrebbe dirlo chiaramente e passare alla decisione successiva.",

  deviceSplitEmpty: "La segmentazione per dispositivo non è ancora memorizzata nei dati del report. Una volta che la sincronizzazione Google Ads scrive le metriche per dispositivo, questo grafico mostrerà la suddivisione reale.",

  footerTagline: "Sempre in ottimizzazione — LYNCK Studio",

  driverPrimary: "Fattore principale",
  driverCpc: "Variazione CPC",
  driverConvEfficiency: "Efficienza conversioni",

  tooltipConversions: "Conversioni",
  tooltipSpendShare: "Quota di spesa",
  tooltipShare: "Quota",
};

const pt: ReportTranslations = {
  allReports: "Todos os relatórios",
  markInReview: "Marcar em revisão",
  approve: "Aprovar",
  resyncSearchTerms: "Ressincronizar termos",
  syncing: "Sincronizando…",
  print: "Imprimir",
  exportPdf: "Exportar PDF",
  exporting: "Exportando…",

  generated: "Gerado",
  monthlyPerformanceReport: "Relatório mensal de desempenho",
  goal: "Meta ·",

  performanceSnapshot: "Visão geral do desempenho",
  metricsTitle: "As métricas que",
  metricsEm: "mais importam",
  takeaway: (n) => `Ponto principal ${n}`,

  sixMonthTrend: "Tendência de 6 meses",
  spendVsReturn: "Gasto vs retorno",
  spendVsCpa: "Gasto vs CPA",
  trendNote: "Uma leitura rápida da direção importa mais do que um parágrafo de explicação aqui.",

  campaignComparison: "Comparação de campanhas",
  campaignCompTitle: "Onde o orçamento",
  campaignCompEm: "trabalhou mais",
  performanceComparison: "Comparação de desempenho",
  campaignLadder: "Ranking de campanhas",
  budgetAllocation: "Alocação de orçamento",
  spendShare: "Participação do gasto",
  topWinner: "Melhor campanha",
  audienceSplit: "Divisão de audiência",
  deviceSplit: "Divisão por dispositivo",
  trackedSpend: "Gasto registrado:",

  noSpendRecorded: "Nenhum gasto registrado nas campanhas neste período.",
  noSpendShareBreakdown: "Nenhuma divisão de gasto disponível para este período.",
  spend: "Gasto",

  execSummaryLabel: "Resumo executivo",
  execSummaryTitle: "O mês em",
  execSummaryEm: "resumo",
  whatChangedLabel: "O que mudou",
  whatChangedTitle: "Por que os números",
  whatChangedEm: "se moveram",
  opportunitiesLabel: "Oportunidades",
  opportunitiesTitle: "Onde focar",
  opportunitiesEm: "a seguir",
  appendixLabel: "Apêndice",
  appendixTitle: "Detalhes",
  appendixEm: "de suporte",

  edit: "Editar",
  cancel: "Cancelar",
  save: "Salvar",
  regenerate: "Regenerar",
  regenerating: "Regenerando…",

  movementDetail: "Detalhe dos movimentos",
  mainMovements: "Principais movimentos",
  searchInsight: "Análise de pesquisas",
  topSearchTerms: "Top 10 termos de pesquisa",
  productInsight: "Análise de produtos",
  topProducts: "Top 10 produtos",
  leadInsight: "Análise de leads",
  hardVsSoftConversions: "Conversões diretas vs indiretas",
  growthInsight: "Análise de crescimento",
  momentumSignals: "Sinais de momentum",
  optimizationLens: "Perspectiva de otimização",

  tableItem: "Item",
  tableClicks: "Cliques",
  tableConversions: "Conv.",
  tableAvgCpc: "CPC méd.",
  noSearchTermData: "Ainda não há dados de termos de pesquisa.",
  noProductData: "Ainda não há dados de desempenho por produto.",

  decisionPageLabel: "Plano de ação",
  decisionPageTitle: "Ações",
  decisionPageEm: "recomendadas",
  whyItMatters: "Por que é importante",
  expectedImpact: "Impacto esperado",
  decisionBodyLive: "Três prioridades para o próximo mês, ordenadas por impacto esperado e baseadas nos dados reais da conta.",

  metricCost: "Gasto",
  metricConversions: "Conversões",
  metricConversionValue: "Valor das conversões",
  metricRoas: "ROAS",
  metricHardConversions: "Conv. diretas",
  metricSoftConversions: "Conv. indiretas",
  metricCpa: "CPA",
  metricClicks: "Cliques",
  metricCtr: "CTR",
  metricCpc: "CPC",
  primaryGoalNote: "Meta principal da conta",
  cpaNote: "Em relação às conv. diretas",
  growthNote: "Perspectiva de crescimento",

  miniStatSpend: "Gasto",
  miniStatConv: "Conv.",
  miniStatDelta: "Delta",
  miniStatRoas: "ROAS",
  miniStatCpa: "CPA",

  legendCost: "Gasto",

  mom: "MoM",

  growthInsightImpressionsLabel: "Impressões",
  growthReadTitle: "Leitura desta conta",
  growthReadBody: "Contas em crescimento não devem ser forçadas a uma explicação artificialmente profunda todos os meses. Quando os dados apontam sazonalidade, maior demanda ou menor pressão nos leilões, este relatório deve dizer isso claramente e avançar para a próxima decisão.",

  deviceSplitEmpty: "A segmentação por dispositivo ainda não está armazenada nos dados do relatório. Assim que a sincronização do Google Ads gravar métricas por dispositivo, este gráfico exibirá a divisão real.",

  footerTagline: "Sempre otimizando — LYNCK Studio",

  driverPrimary: "Fator principal",
  driverCpc: "Variação do CPC",
  driverConvEfficiency: "Eficiência de conversão",

  tooltipConversions: "Conversões",
  tooltipSpendShare: "Participação do gasto",
  tooltipShare: "Participação",
};

const TRANSLATIONS: Record<string, ReportTranslations> = { en, de, fr, es, nl, it, pt };

export function getReportT(language: string): ReportTranslations {
  return TRANSLATIONS[language] ?? TRANSLATIONS.en;
}

/** Returns the BCP-47 locale tag for Intl/date formatting */
export function getLocale(language: string): string {
  const localeMap: Record<string, string> = {
    en: "en-GB",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    nl: "nl-NL",
    it: "it-IT",
    pt: "pt-PT",
  };
  return localeMap[language] ?? "en-GB";
}
