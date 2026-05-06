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

  // Live summary body templates (buildLiveSummary)
  liveSummaryEcom: (cost: string, convValue: string, roas: string, campaignName?: string) => string;
  liveSummaryLeadGen: (cost: string, conversions: string, cpa: string, campaignName?: string) => string;
  liveSummaryGrowth: (clicks: string, ctr: string, cpc: string, campaignName?: string) => string;

  // Live takeaway templates (buildLiveSummary)
  liveTakeaway1Ecom: (roas: string, cost: string) => string;
  liveTakeaway2Ecom: (conversions: string, convValue: string) => string;
  liveTakeaway3Ecom: (campaignName?: string) => string;
  liveTakeaway1LeadGen: (conversions: string) => string;
  liveTakeaway2LeadGen: (cpa: string, cost: string) => string;
  liveTakeaway3LeadGen: (campaignName?: string) => string;
  liveTakeaway1Growth: (clicks: string, ctr: string) => string;
  liveTakeaway2Growth: (cpc: string, cost: string) => string;
  liveTakeaway3Growth: (campaignName?: string) => string;

  // Live opportunities body templates (buildLiveOpportunities)
  liveOpportunitiesEcom: (keywordTerm?: string) => string;
  liveOpportunitiesLeadGen: (campaignName?: string) => string;
  liveOpportunitiesGrowth: (campaignName?: string) => string;

  // Recommendations UI
  addRecommendation: string;
  regenerateRecommendations: string;
  regeneratingRecs: string;
  deleteRec: string;
  recTitle: string;
  recWhy: string;
  recImpact: string;
  noRecs: string;
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

  liveSummaryEcom: (cost, convValue, roas, cam) =>
    `I have prepared the monthly readout using the actual account data for this period. Spend landed at ${cost} and produced ${convValue} in tracked value, keeping ROAS at ${roas}x. ${cam ? `${cam} was the strongest efficiency driver in the account.` : "This month should be read through return, not just volume."}`,
  liveSummaryLeadGen: (cost, conversions, cpa, cam) =>
    `I have prepared the monthly readout using the actual account data for this period. Spend landed at ${cost} and drove ${conversions} tracked conversions at ${cpa} CPA. ${cam ? `${cam} was the strongest lead source in the account.` : "The account should be judged on hard output first."}`,
  liveSummaryGrowth: (clicks, ctr, cpc, cam) =>
    `I have prepared the monthly readout using the actual account data for this period. The account delivered ${clicks} clicks at a ${ctr} CTR while holding CPC at ${cpc}. ${cam ? `${cam} carried the strongest momentum.` : "This month should be judged by traffic quality and efficient reach."}`,

  liveTakeaway1Ecom: (roas, cost) => `ROAS at ${roas}x on ${cost} spend`,
  liveTakeaway2Ecom: (conversions, convValue) => `${conversions} tracked conversions worth ${convValue}`,
  liveTakeaway3Ecom: (cam) => cam ? `${cam} led the account on return` : "Efficiency was concentrated in a small part of the account",
  liveTakeaway1LeadGen: (conversions) => `${conversions} tracked conversions`,
  liveTakeaway2LeadGen: (cpa, cost) => `CPA at ${cpa} on ${cost} spend`,
  liveTakeaway3LeadGen: (cam) => cam ? `${cam} created the best lead efficiency` : "Lead quality should stay ahead of raw volume",
  liveTakeaway1Growth: (clicks, ctr) => `${clicks} clicks at ${ctr} CTR`,
  liveTakeaway2Growth: (cpc, cost) => `CPC at ${cpc} on ${cost} spend`,
  liveTakeaway3Growth: (cam) => cam ? `${cam} carried the strongest momentum` : "Momentum was uneven across the account",

  liveOpportunitiesEcom: (kw) =>
    `The clearest upside is to shift more weight toward the campaigns and search themes already converting, while reducing exposure in campaigns still spending without return.${kw ? ` ${kw} is one of the strongest proven demand signals in the account.` : ""}`.trim(),
  liveOpportunitiesLeadGen: (cam) =>
    `The clearest upside is to weight budget toward the campaigns already producing conversions efficiently, while trimming broader coverage that consumes spend without enough hard output.${cam ? ` ${cam} is the first area to review.` : ""}`.trim(),
  liveOpportunitiesGrowth: (cam) =>
    `The clearest upside is to keep the strongest demand themes live while cutting placements and campaign pockets that add spend without enough downstream response.${cam ? ` ${cam} is the first area to review.` : ""}`.trim(),

  addRecommendation: "Add action",
  regenerateRecommendations: "Regenerate actions",
  regeneratingRecs: "Regenerating…",
  deleteRec: "Delete",
  recTitle: "Action title",
  recWhy: "Why it matters",
  recImpact: "Expected impact",
  noRecs: "No recommended actions yet.",
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

  liveSummaryEcom: (cost, convValue, roas, cam) =>
    `Ich habe den monatlichen Bericht auf Basis der tatsächlichen Kontodaten für diesen Zeitraum erstellt. Das Budget lag bei ${cost} und erzielte ${convValue} an erfasstem Wert bei einem ROAS von ${roas}x. ${cam ? `${cam} war der stärkste Effizienztreiber im Konto.` : "Dieser Monat sollte über den Ertrag bewertet werden, nicht nur über das Volumen."}`,
  liveSummaryLeadGen: (cost, conversions, cpa, cam) =>
    `Ich habe den monatlichen Bericht auf Basis der tatsächlichen Kontodaten für diesen Zeitraum erstellt. Das Budget lag bei ${cost} und generierte ${conversions} erfasste Conversions bei einem CPA von ${cpa}. ${cam ? `${cam} war die stärkste Lead-Quelle im Konto.` : "Das Konto sollte primär am tatsächlichen Output gemessen werden."}`,
  liveSummaryGrowth: (clicks, ctr, cpc, cam) =>
    `Ich habe den monatlichen Bericht auf Basis der tatsächlichen Kontodaten für diesen Zeitraum erstellt. Das Konto lieferte ${clicks} Klicks bei einer CTR von ${ctr} und hielt den CPC bei ${cpc}. ${cam ? `${cam} hatte das stärkste Momentum.` : "Dieser Monat sollte über Traffic-Qualität und effiziente Reichweite bewertet werden."}`,

  liveTakeaway1Ecom: (roas, cost) => `ROAS bei ${roas}x bei ${cost} Budget`,
  liveTakeaway2Ecom: (conversions, convValue) => `${conversions} erfasste Conversions im Wert von ${convValue}`,
  liveTakeaway3Ecom: (cam) => cam ? `${cam} hat das Konto bei der Effizienz angeführt` : "Die Effizienz war auf einen kleinen Teil des Kontos konzentriert",
  liveTakeaway1LeadGen: (conversions) => `${conversions} erfasste Conversions`,
  liveTakeaway2LeadGen: (cpa, cost) => `CPA bei ${cpa} bei ${cost} Budget`,
  liveTakeaway3LeadGen: (cam) => cam ? `${cam} hat die beste Lead-Effizienz erzielt` : "Lead-Qualität sollte vor rohem Volumen stehen",
  liveTakeaway1Growth: (clicks, ctr) => `${clicks} Klicks bei ${ctr} CTR`,
  liveTakeaway2Growth: (cpc, cost) => `CPC bei ${cpc} bei ${cost} Budget`,
  liveTakeaway3Growth: (cam) => cam ? `${cam} hatte das stärkste Momentum` : "Das Momentum war ungleichmäßig im Konto verteilt",

  liveOpportunitiesEcom: (kw) =>
    `Das größte Potenzial liegt darin, mehr Gewicht auf die Kampagnen und Suchthemen zu verlagern, die bereits konvertieren, und die Ausgaben bei Kampagnen zu reduzieren, die noch ohne Ertrag laufen.${kw ? ` ${kw} ist eines der stärksten bewährten Nachfragesignale im Konto.` : ""}`.trim(),
  liveOpportunitiesLeadGen: (cam) =>
    `Das größte Potenzial liegt darin, Budget auf die Kampagnen zu konzentrieren, die bereits effizient konvertieren, und breitere Abdeckung zu reduzieren, die Budget ohne ausreichenden Output verbraucht.${cam ? ` ${cam} ist der erste Bereich, der überprüft werden sollte.` : ""}`.trim(),
  liveOpportunitiesGrowth: (cam) =>
    `Das größte Potenzial liegt darin, die stärksten Nachfragethemen aktiv zu halten und gleichzeitig Placements und Kampagnenbereiche zu kürzen, die Budget ohne ausreichende Reaktion verursachen.${cam ? ` ${cam} ist der erste Bereich, der überprüft werden sollte.` : ""}`.trim(),

  addRecommendation: "Maßnahme hinzufügen",
  regenerateRecommendations: "Maßnahmen neu generieren",
  regeneratingRecs: "Wird generiert…",
  deleteRec: "Löschen",
  recTitle: "Maßnahmen-Titel",
  recWhy: "Warum es wichtig ist",
  recImpact: "Erwartete Wirkung",
  noRecs: "Noch keine empfohlenen Maßnahmen.",
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

  liveSummaryEcom: (cost, convValue, roas, cam) =>
    `J'ai préparé le bilan mensuel à partir des données réelles du compte pour cette période. Les dépenses se sont établies à ${cost} et ont généré ${convValue} de valeur suivie, avec un ROAS de ${roas}x. ${cam ? `${cam} a été le principal moteur d'efficacité du compte.` : "Ce mois doit être lu sous l'angle du retour, pas seulement du volume."}`,
  liveSummaryLeadGen: (cost, conversions, cpa, cam) =>
    `J'ai préparé le bilan mensuel à partir des données réelles du compte pour cette période. Les dépenses se sont établies à ${cost} et ont généré ${conversions} conversions suivies à ${cpa} de CPA. ${cam ? `${cam} a été la meilleure source de leads du compte.` : "Le compte doit être évalué sur les résultats concrets en premier."}`,
  liveSummaryGrowth: (clicks, ctr, cpc, cam) =>
    `J'ai préparé le bilan mensuel à partir des données réelles du compte pour cette période. Le compte a livré ${clicks} clics à un CTR de ${ctr} en maintenant le CPC à ${cpc}. ${cam ? `${cam} a porté le momentum le plus fort.` : "Ce mois doit être évalué sur la qualité du trafic et l'efficacité de la portée."}`,

  liveTakeaway1Ecom: (roas, cost) => `ROAS à ${roas}x sur ${cost} de dépenses`,
  liveTakeaway2Ecom: (conversions, convValue) => `${conversions} conversions suivies d'une valeur de ${convValue}`,
  liveTakeaway3Ecom: (cam) => cam ? `${cam} a dominé le compte en termes de retour` : "L'efficacité était concentrée sur une petite partie du compte",
  liveTakeaway1LeadGen: (conversions) => `${conversions} conversions suivies`,
  liveTakeaway2LeadGen: (cpa, cost) => `CPA à ${cpa} sur ${cost} de dépenses`,
  liveTakeaway3LeadGen: (cam) => cam ? `${cam} a créé la meilleure efficacité de leads` : "La qualité des leads doit primer sur le volume brut",
  liveTakeaway1Growth: (clicks, ctr) => `${clicks} clics à ${ctr} de CTR`,
  liveTakeaway2Growth: (cpc, cost) => `CPC à ${cpc} sur ${cost} de dépenses`,
  liveTakeaway3Growth: (cam) => cam ? `${cam} a porté le momentum le plus fort` : "Le momentum était inégal à travers le compte",

  liveOpportunitiesEcom: (kw) =>
    `La plus grande opportunité est de déplacer davantage de poids vers les campagnes et thèmes de recherche qui convertissent déjà, tout en réduisant l'exposition aux campagnes qui dépensent encore sans retour.${kw ? ` ${kw} est l'un des signaux de demande prouvés les plus forts du compte.` : ""}`.trim(),
  liveOpportunitiesLeadGen: (cam) =>
    `La plus grande opportunité est de concentrer le budget sur les campagnes qui produisent déjà des conversions efficacement, tout en réduisant la couverture plus large qui consomme des dépenses sans production suffisante.${cam ? ` ${cam} est le premier domaine à examiner.` : ""}`.trim(),
  liveOpportunitiesGrowth: (cam) =>
    `La plus grande opportunité est de maintenir les thèmes de demande les plus forts tout en supprimant les emplacements et segments de campagne qui ajoutent des dépenses sans réponse suffisante.${cam ? ` ${cam} est le premier domaine à examiner.` : ""}`.trim(),

  addRecommendation: "Ajouter une action",
  regenerateRecommendations: "Régénérer les actions",
  regeneratingRecs: "Régénération…",
  deleteRec: "Supprimer",
  recTitle: "Titre de l'action",
  recWhy: "Pourquoi c'est important",
  recImpact: "Impact attendu",
  noRecs: "Aucune action recommandée pour l'instant.",
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

  liveSummaryEcom: (cost, convValue, roas, cam) =>
    `He preparado el resumen mensual utilizando los datos reales de la cuenta para este período. El gasto se situó en ${cost} y generó ${convValue} en valor registrado, manteniendo un ROAS de ${roas}x. ${cam ? `${cam} fue el principal motor de eficiencia de la cuenta.` : "Este mes debe leerse a través del retorno, no solo del volumen."}`,
  liveSummaryLeadGen: (cost, conversions, cpa, cam) =>
    `He preparado el resumen mensual utilizando los datos reales de la cuenta para este período. El gasto se situó en ${cost} y generó ${conversions} conversiones registradas a ${cpa} de CPA. ${cam ? `${cam} fue la mejor fuente de leads de la cuenta.` : "La cuenta debe juzgarse por el resultado concreto en primer lugar."}`,
  liveSummaryGrowth: (clicks, ctr, cpc, cam) =>
    `He preparado el resumen mensual utilizando los datos reales de la cuenta para este período. La cuenta generó ${clicks} clics con un CTR del ${ctr} manteniendo el CPC en ${cpc}. ${cam ? `${cam} mantuvo el mayor impulso.` : "Este mes debe juzgarse por la calidad del tráfico y el alcance eficiente."}`,

  liveTakeaway1Ecom: (roas, cost) => `ROAS en ${roas}x con ${cost} de gasto`,
  liveTakeaway2Ecom: (conversions, convValue) => `${conversions} conversiones registradas por valor de ${convValue}`,
  liveTakeaway3Ecom: (cam) => cam ? `${cam} lideró la cuenta en retorno` : "La eficiencia se concentró en una pequeña parte de la cuenta",
  liveTakeaway1LeadGen: (conversions) => `${conversions} conversiones registradas`,
  liveTakeaway2LeadGen: (cpa, cost) => `CPA en ${cpa} con ${cost} de gasto`,
  liveTakeaway3LeadGen: (cam) => cam ? `${cam} logró la mejor eficiencia de leads` : "La calidad del lead debe estar por delante del volumen bruto",
  liveTakeaway1Growth: (clicks, ctr) => `${clicks} clics con ${ctr} de CTR`,
  liveTakeaway2Growth: (cpc, cost) => `CPC en ${cpc} con ${cost} de gasto`,
  liveTakeaway3Growth: (cam) => cam ? `${cam} mantuvo el mayor impulso` : "El impulso fue desigual en toda la cuenta",

  liveOpportunitiesEcom: (kw) =>
    `La oportunidad más clara es trasladar más peso hacia las campañas y temas de búsqueda que ya están convirtiendo, mientras se reduce la exposición en campañas que aún gastan sin retorno.${kw ? ` ${kw} es una de las señales de demanda probadas más fuertes de la cuenta.` : ""}`.trim(),
  liveOpportunitiesLeadGen: (cam) =>
    `La oportunidad más clara es concentrar el presupuesto en las campañas que ya producen conversiones de forma eficiente, mientras se reduce la cobertura más amplia que consume gasto sin suficiente producción.${cam ? ` ${cam} es la primera área a revisar.` : ""}`.trim(),
  liveOpportunitiesGrowth: (cam) =>
    `La oportunidad más clara es mantener activos los temas de demanda más fuertes mientras se eliminan ubicaciones y segmentos de campaña que añaden gasto sin respuesta suficiente.${cam ? ` ${cam} es la primera área a revisar.` : ""}`.trim(),

  addRecommendation: "Añadir acción",
  regenerateRecommendations: "Regenerar acciones",
  regeneratingRecs: "Regenerando…",
  deleteRec: "Eliminar",
  recTitle: "Título de la acción",
  recWhy: "Por qué importa",
  recImpact: "Impacto esperado",
  noRecs: "No hay acciones recomendadas aún.",
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

  liveSummaryEcom: (cost, convValue, roas, cam) =>
    `Ik heb het maandelijkse overzicht opgesteld op basis van de werkelijke accountgegevens voor deze periode. Het budget bedroeg ${cost} en genereerde ${convValue} aan gevolgde waarde bij een ROAS van ${roas}x. ${cam ? `${cam} was de sterkste efficiëntiedriver in het account.` : "Deze maand moet worden beoordeeld op rendement, niet alleen op volume."}`,
  liveSummaryLeadGen: (cost, conversions, cpa, cam) =>
    `Ik heb het maandelijkse overzicht opgesteld op basis van de werkelijke accountgegevens voor deze periode. Het budget bedroeg ${cost} en genereerde ${conversions} gevolgde conversies bij een CPA van ${cpa}. ${cam ? `${cam} was de sterkste leadbron in het account.` : "Het account moet primair op harde output worden beoordeeld."}`,
  liveSummaryGrowth: (clicks, ctr, cpc, cam) =>
    `Ik heb het maandelijkse overzicht opgesteld op basis van de werkelijke accountgegevens voor deze periode. Het account leverde ${clicks} klikken bij een CTR van ${ctr} en hield de CPC op ${cpc}. ${cam ? `${cam} had het sterkste momentum.` : "Deze maand moet worden beoordeeld op verkeerskwaliteit en efficiënt bereik."}`,

  liveTakeaway1Ecom: (roas, cost) => `ROAS op ${roas}x bij ${cost} budget`,
  liveTakeaway2Ecom: (conversions, convValue) => `${conversions} gevolgde conversies ter waarde van ${convValue}`,
  liveTakeaway3Ecom: (cam) => cam ? `${cam} leidde het account op rendement` : "De efficiëntie was geconcentreerd in een klein deel van het account",
  liveTakeaway1LeadGen: (conversions) => `${conversions} gevolgde conversies`,
  liveTakeaway2LeadGen: (cpa, cost) => `CPA op ${cpa} bij ${cost} budget`,
  liveTakeaway3LeadGen: (cam) => cam ? `${cam} realiseerde de beste leadefficiëntie` : "Leadkwaliteit moet vóór ruw volume gaan",
  liveTakeaway1Growth: (clicks, ctr) => `${clicks} klikken bij ${ctr} CTR`,
  liveTakeaway2Growth: (cpc, cost) => `CPC op ${cpc} bij ${cost} budget`,
  liveTakeaway3Growth: (cam) => cam ? `${cam} had het sterkste momentum` : "Het momentum was ongelijk verdeeld over het account",

  liveOpportunitiesEcom: (kw) =>
    `Het grootste potentieel ligt in het verschuiven van meer gewicht naar de campagnes en zoekthema's die al converteren, terwijl de blootstelling aan campagnes die nog steeds zonder rendement uitgeven wordt verminderd.${kw ? ` ${kw} is een van de sterkste bewezen vraag­signalen in het account.` : ""}`.trim(),
  liveOpportunitiesLeadGen: (cam) =>
    `Het grootste potentieel ligt in het concentreren van budget op campagnes die al efficiënt converteren, terwijl bredere dekking die budget verbruikt zonder voldoende output wordt gereduceerd.${cam ? ` ${cam} is het eerste gebied om te reviewen.` : ""}`.trim(),
  liveOpportunitiesGrowth: (cam) =>
    `Het grootste potentieel ligt in het actief houden van de sterkste vraagthema's terwijl plaatsingen en campagnesegmenten die budget toevoegen zonder voldoende respons worden gekort.${cam ? ` ${cam} is het eerste gebied om te reviewen.` : ""}`.trim(),

  addRecommendation: "Actie toevoegen",
  regenerateRecommendations: "Acties opnieuw genereren",
  regeneratingRecs: "Genereren…",
  deleteRec: "Verwijderen",
  recTitle: "Actietitel",
  recWhy: "Waarom het belangrijk is",
  recImpact: "Verwacht effect",
  noRecs: "Nog geen aanbevolen acties.",
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

  liveSummaryEcom: (cost, convValue, roas, cam) =>
    `Ho preparato il riepilogo mensile utilizzando i dati reali dell'account per questo periodo. La spesa si è attestata a ${cost} e ha prodotto ${convValue} di valore tracciato, mantenendo un ROAS di ${roas}x. ${cam ? `${cam} è stato il principale motore di efficienza nell'account.` : "Questo mese deve essere letto attraverso il ritorno, non solo il volume."}`,
  liveSummaryLeadGen: (cost, conversions, cpa, cam) =>
    `Ho preparato il riepilogo mensile utilizzando i dati reali dell'account per questo periodo. La spesa si è attestata a ${cost} e ha generato ${conversions} conversioni tracciate a ${cpa} di CPA. ${cam ? `${cam} è stata la migliore fonte di lead nell'account.` : "L'account deve essere giudicato principalmente sull'output concreto."}`,
  liveSummaryGrowth: (clicks, ctr, cpc, cam) =>
    `Ho preparato il riepilogo mensile utilizzando i dati reali dell'account per questo periodo. L'account ha generato ${clicks} clic con un CTR del ${ctr} mantenendo il CPC a ${cpc}. ${cam ? `${cam} ha avuto il momentum più forte.` : "Questo mese deve essere valutato sulla qualità del traffico e la portata efficiente."}`,

  liveTakeaway1Ecom: (roas, cost) => `ROAS a ${roas}x su ${cost} di spesa`,
  liveTakeaway2Ecom: (conversions, convValue) => `${conversions} conversioni tracciate per un valore di ${convValue}`,
  liveTakeaway3Ecom: (cam) => cam ? `${cam} ha guidato l'account sul rendimento` : "L'efficienza era concentrata in una piccola parte dell'account",
  liveTakeaway1LeadGen: (conversions) => `${conversions} conversioni tracciate`,
  liveTakeaway2LeadGen: (cpa, cost) => `CPA a ${cpa} su ${cost} di spesa`,
  liveTakeaway3LeadGen: (cam) => cam ? `${cam} ha creato la migliore efficienza di lead` : "La qualità dei lead deve precedere il volume grezzo",
  liveTakeaway1Growth: (clicks, ctr) => `${clicks} clic a ${ctr} di CTR`,
  liveTakeaway2Growth: (cpc, cost) => `CPC a ${cpc} su ${cost} di spesa`,
  liveTakeaway3Growth: (cam) => cam ? `${cam} ha avuto il momentum più forte` : "Il momentum era irregolare nell'account",

  liveOpportunitiesEcom: (kw) =>
    `Il potenziale più chiaro è spostare più peso verso le campagne e i temi di ricerca che già convertono, riducendo l'esposizione nelle campagne che ancora spendono senza rendimento.${kw ? ` ${kw} è uno dei segnali di domanda più forti e consolidati nell'account.` : ""}`.trim(),
  liveOpportunitiesLeadGen: (cam) =>
    `Il potenziale più chiaro è concentrare il budget sulle campagne che già producono conversioni in modo efficiente, riducendo la copertura più ampia che consuma spesa senza output sufficiente.${cam ? ` ${cam} è la prima area da esaminare.` : ""}`.trim(),
  liveOpportunitiesGrowth: (cam) =>
    `Il potenziale più chiaro è mantenere attivi i temi di domanda più forti eliminando posizionamenti e segmenti di campagna che aggiungono spesa senza una risposta adeguata.${cam ? ` ${cam} è la prima area da esaminare.` : ""}`.trim(),

  addRecommendation: "Aggiungi azione",
  regenerateRecommendations: "Rigenera azioni",
  regeneratingRecs: "Rigenerazione…",
  deleteRec: "Elimina",
  recTitle: "Titolo dell'azione",
  recWhy: "Perché è importante",
  recImpact: "Impatto previsto",
  noRecs: "Nessuna azione raccomandata ancora.",
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

  liveSummaryEcom: (cost, convValue, roas, cam) =>
    `Preparei o resumo mensal utilizando os dados reais da conta para este período. O gasto ficou em ${cost} e gerou ${convValue} em valor rastreado, mantendo um ROAS de ${roas}x. ${cam ? `${cam} foi o principal motor de eficiência da conta.` : "Este mês deve ser lido pelo retorno, não apenas pelo volume."}`,
  liveSummaryLeadGen: (cost, conversions, cpa, cam) =>
    `Preparei o resumo mensal utilizando os dados reais da conta para este período. O gasto ficou em ${cost} e gerou ${conversions} conversões rastreadas a ${cpa} de CPA. ${cam ? `${cam} foi a melhor fonte de leads da conta.` : "A conta deve ser avaliada principalmente pelo resultado concreto."}`,
  liveSummaryGrowth: (clicks, ctr, cpc, cam) =>
    `Preparei o resumo mensal utilizando os dados reais da conta para este período. A conta entregou ${clicks} cliques com um CTR de ${ctr} mantendo o CPC em ${cpc}. ${cam ? `${cam} manteve o maior momentum.` : "Este mês deve ser avaliado pela qualidade do tráfego e alcance eficiente."}`,

  liveTakeaway1Ecom: (roas, cost) => `ROAS em ${roas}x com ${cost} de gasto`,
  liveTakeaway2Ecom: (conversions, convValue) => `${conversions} conversões rastreadas no valor de ${convValue}`,
  liveTakeaway3Ecom: (cam) => cam ? `${cam} liderou a conta em retorno` : "A eficiência estava concentrada em uma pequena parte da conta",
  liveTakeaway1LeadGen: (conversions) => `${conversions} conversões rastreadas`,
  liveTakeaway2LeadGen: (cpa, cost) => `CPA em ${cpa} com ${cost} de gasto`,
  liveTakeaway3LeadGen: (cam) => cam ? `${cam} criou a melhor eficiência de leads` : "A qualidade do lead deve estar à frente do volume bruto",
  liveTakeaway1Growth: (clicks, ctr) => `${clicks} cliques com ${ctr} de CTR`,
  liveTakeaway2Growth: (cpc, cost) => `CPC em ${cpc} com ${cost} de gasto`,
  liveTakeaway3Growth: (cam) => cam ? `${cam} manteve o maior momentum` : "O momentum foi desigual na conta",

  liveOpportunitiesEcom: (kw) =>
    `A oportunidade mais clara é transferir mais peso para as campanhas e temas de pesquisa que já estão convertendo, enquanto se reduz a exposição nas campanhas que ainda gastam sem retorno.${kw ? ` ${kw} é um dos sinais de demanda mais fortes e comprovados da conta.` : ""}`.trim(),
  liveOpportunitiesLeadGen: (cam) =>
    `A oportunidade mais clara é concentrar o orçamento nas campanhas que já produzem conversões de forma eficiente, enquanto se reduz a cobertura mais ampla que consome gasto sem produção suficiente.${cam ? ` ${cam} é a primeira área a revisar.` : ""}`.trim(),
  liveOpportunitiesGrowth: (cam) =>
    `A oportunidade mais clara é manter ativos os temas de demanda mais fortes enquanto se eliminam posicionamentos e segmentos de campanha que adicionam gasto sem resposta suficiente.${cam ? ` ${cam} é a primeira área a revisar.` : ""}`.trim(),

  addRecommendation: "Adicionar ação",
  regenerateRecommendations: "Regenerar ações",
  regeneratingRecs: "Regenerando…",
  deleteRec: "Excluir",
  recTitle: "Título da ação",
  recWhy: "Por que é importante",
  recImpact: "Impacto esperado",
  noRecs: "Nenhuma ação recomendada ainda.",
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
