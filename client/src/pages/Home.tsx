import DashboardLayout from "@/components/DashboardLayout";
import ApprovalWorkspace from "@/components/ApprovalWorkspace";
import OnboardingGuide from "@/components/OnboardingGuide";
import { RevenueStackPanel, type ComputedPlausibility, type ComputedStack } from "@/components/RevenueStackPanel";
import { CompetitorMapPanel, type ComputedLandscape } from "@/components/CompetitorMapPanel";
import { DecisionMemoSection } from "@/components/DecisionMemoPanel";
import { PreparationPanel } from "@/components/PreparationPanel";
import { sanitisePreparation } from "@shared/domain/preparation";
import { IdentityNotice } from "@/components/IdentityNotice";
import { identityDivergences, identityPrefill } from "@shared/domain/caseIdentity";
import { industry as industryById } from "@shared/domain/industries";
import type { CompetitiveLandscape } from "@shared/domain/competitiveLandscape";
import type { RevenueStack } from "@shared/domain/revenueStack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowDownToLine, ArrowUpRight, BarChart3, Building2, ChartNoAxesCombined, CheckCircle2, ChevronRight, CircleAlert, CircleDollarSign, ClipboardCheck, Columns3, Compass, Database, FileCheck2, FileDown, FileText, Globe2, ListChecks, Loader2, MapPinned, Pencil, Plus, RefreshCw, RotateCcw, Save, ShieldCheck, SlidersHorizontal, Sparkles, Target, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { countryCatalog } from "@shared/domain/countries";
import { CountryAssessmentPanel, assessmentProgress, emptyAssessment, type CountryAssessmentState } from "@/components/CountryAssessmentPanel";
import { CaseWorkspace } from "@/components/CaseWorkspace";
import { GlobalStrategyPanel } from "@/components/GlobalStrategyPanel";
import { GuidedRoutePanel } from "@/components/GuidedRoutePanel";
import { AssumptionBoard } from "@/components/AssumptionBoard";
import { ThesisPanel } from "@/components/ThesisPanel";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useLanguage } from "@/i18n";
import { loc, pick, pickAll, type Localized } from "@shared/i18n";
import { readLocalizedError } from "@shared/localizedError";
import { commitmentLabel, entryModes, type CommitmentLevel } from "@shared/domain/entryModes";
import { COUNTRY_REGIONS, regionLabel, type CountryRegion } from "@shared/domain/countries";
import { ScenarioArchive } from "@/components/ScenarioArchive";

type Objective = "market" | "resources" | "learning" | "coordination";
type Status = "live" | "partial" | "unavailable";

type MarketData = {
  gdpUsd?: number | null;
  gdpPerCapita?: number | null;
  gdpGrowth?: number | null;
  population?: number | null;
  urbanization?: number | null;
  internetUse?: number | null;
  tradeOpenness?: number | null;
  investmentRate?: number | null;
  fdiInflowUsd?: number | null;
  fdiInflowPctGdp?: number | null;
  governance?: {
    politicalStability: number | null;
    governmentEffectiveness: number | null;
    regulatoryQuality: number | null;
    ruleOfLaw: number | null;
    controlOfCorruption: number | null;
    sourceYear: number | null;
    sourceStatus: Status;
  };
  sourceYear?: number | null;
  lastUpdatedAt?: string | null;
  manualFields?: string[];
  sourceStatus: Status;
};

type Calibration = {
  demandQuality: number;
  resourceFit: number;
  competitionAttractiveness: number;
  governmentOpenness: number;
  cageDistance: number;
  politicalRisk: number;
  economicRisk: number;
  competitiveRisk: number;
  operationalRisk: number;
  internalReadiness: number;
  timePressure: number;
  controlNeed: number;
  ipSensitivity: number;
};

type CalibrationNotes = Partial<Record<keyof Calibration, { rationale?: string }>>;
/**
 * El nombre del país viaja como par `{ es, en }` mientras vive en el cliente, y se resuelve
 * al idioma activo justo antes de mandarlo al servidor. Un escenario guardado conserva la
 * cadena con la que se guardó, que es lo que debe ocurrir con una instantánea.
 */
type Candidate = { code: string; name: Localized | string; region: CountryRegion; calibration: Calibration; notes: CalibrationNotes; assessment: CountryAssessmentState; landscape?: CompetitiveLandscape | null };
type ModeKey = "greenfield" | "acquisition" | "alliance" | "licensing" | "distributor" | "office" | "digital";
type FinancialProfile = { initialInvestment?: number | null; annualOperatingCost?: number | null; revenueCapturePct?: number | null };
type Provenance = { sourceStatus: Status; sourceName: string; sourceUrl: string; sourceYear?: number | null; observedAt?: string | null; retrievedAt: string; note: Localized };
type Sensitivity = { priceRevenuePct?: number | null; operatingMarginPctPoints?: number | null; fxRatePct?: number | null };
type FinancialAssumptions = { currency?: string | null; reportingCurrency?: string | null; fxRateToReportingCurrency?: number | null; fxRateDataMode?: "public" | "manual"; fxReference?: Provenance | null; tamYearOne?: number | null; annualMarketGrowthPct?: number | null; samPct?: number | null; somPctYearOne?: number | null; somPctHorizon?: number | null; operatingMarginPct?: number | null; taxRatePct?: number | null; taxRateDataMode?: "public" | "manual"; taxReference?: Provenance | null; workingCapitalPctRevenue?: number | null; discountRatePct?: number | null; terminalGrowthPct?: number | null; sensitivityScenarios?: { optimistic?: Sensitivity; conservative?: Sensitivity }; modeProfiles?: Partial<Record<ModeKey, FinancialProfile>>; revenueStack?: RevenueStack | null };
type InvestmentThresholds = { currency?: string | null; advanceMinRiskAdjusted?: number | null; testMinRiskAdjusted?: number | null; minConfidence?: number | null; advanceMinNpv?: number | null; testMinNpv?: number | null; advanceMinRoiPct?: number | null; testMinRoiPct?: number | null; advanceMaxPaybackYears?: number | null; testMaxInitialInvestment?: number | null };

type FinancialAlternative = { key: ModeKey; mode: Localized; status: "ok" | "insufficient_data" | "not_meaningful"; roiPct: number | null; npv: number | null; paybackYear: number | null; initialInvestment: number | null; annualOperatingCost: number | null; revenueCapturePct: number | null; cumulativeFreeCashFlow: number | null; terminalValue: number | null; presentValueTerminal: number | null; annualProjection: { year: number; revenue: number; operatingProfit: number; taxes: number; changeInWorkingCapital: number; freeCashFlow: number; presentValue: number }[]; missingInputs: Localized[] };
type FinancialCase = { status: "ok" | "insufficient_data"; currency: string | null; localCurrency: string | null; reportingCurrency: string | null; fxRateToReportingCurrency: number | null; horizonYears: number; assumptions: { taxRatePct: number | null; workingCapitalPctRevenue: number | null; discountRatePct: number | null; terminalGrowthPct: number | null }; market: { tamYearOne: number | null; tamAtHorizon: number | null; samAtHorizon: number | null; somRevenueYearOne: number | null; somRevenueAtHorizon: number | null }; alternatives: FinancialAlternative[]; missingInputs: Localized[]; methodology: Localized; stack: ComputedStack; plausibility: ComputedPlausibility };
type FinancialScenario = { key: "base" | "optimistic" | "conservative"; label: Localized; priceRevenuePct: number | null; operatingMarginPctPoints: number | null; fxRatePct: number | null; status: "ok" | "insufficient_data" | "not_meaningful"; financial: FinancialCase | null; missingInputs: Localized[]; note: Localized };

type CountryResult = {
  code: string;
  name: string;
  data: MarketData;
  scores: { market: number; resources: number; competition: number; government: number; distanceFit: number; safety: number; attractiveness: number; riskAdjusted: number; confidence: number };
  assessment: {
    summary: { assessedItems: number; totalItems: number; coverage: number; sustainabilityConcerns: string[] };
    profile: { best: { key: string; label: Localized; description: Localized; match: number } | null };
    opportunityRisk: { opportunity: number; risk: number; label: Localized; reading: Localized; source: Localized };
    growthVariability: { mean: number | null; coefficientOfVariation: number | null; observations: number };
  };
  entryModes: { mode: Localized; score: number; rationale: Localized; commitment: CommitmentLevel }[];
  landscape: ComputedLandscape;
  financial: FinancialCase & { scenarios: FinancialScenario[] };
  investmentRecommendation: { action: "advance" | "test" | "discard" | "insufficient_data"; label: Localized; summary: Localized; selectedMode: Localized | null; selectedModeKey: ModeKey | null; reasons: Localized[]; evaluatedMetrics: { npv: number | null; roiPct: number | null } };
  timing: { label: Localized; description: Localized };
  flags: Localized[];
};

type Evaluation = { generatedAt: string; methodology: Localized; countries: CountryResult[]; portfolio: { leadingCountry?: string; recommendation: Localized; caveats: Localized[] } };

const catalog = countryCatalog.map((entry) => [entry.code, entry.name, entry.region] as const);

const neutralCalibration: Calibration = {
  demandQuality: 50, resourceFit: 50, competitionAttractiveness: 50, governmentOpenness: 50, cageDistance: 50, politicalRisk: 50, economicRisk: 50, competitiveRisk: 50, operationalRisk: 50, internalReadiness: 50, timePressure: 50, controlNeed: 50, ipSensitivity: 50,
};

const objectiveOptions: { value: Objective; label: Localized; detail: Localized }[] = [
  { value: "market", label: loc("Desarrollo de mercado", "Market development"), detail: loc("Capturar penetración, cuota y margen", "Capture penetration, share and margin") },
  { value: "resources", label: loc("Acceso a recursos", "Resource access"), detail: loc("Asegurar inputs, talento o proveedores críticos", "Secure critical inputs, talent or suppliers") },
  { value: "learning", label: loc("Aprendizaje", "Learning"), detail: loc("Acceder a capacidades, innovación o mejores prácticas", "Reach capabilities, innovation or best practice") },
  { value: "coordination", label: loc("Coordinación", "Coordination"), detail: loc("Crear una plataforma regional o global", "Build a regional or global platform") },
];

const financeModes: { key: ModeKey; label: Localized; commitment: CommitmentLevel }[] = entryModes.map((mode) => ({
  key: mode.key as ModeKey,
  label: mode.label,
  commitment: mode.commitment,
}));

type CalibrationGroup = "opportunity" | "distance_risk" | "entry";

const CALIBRATION_GROUPS: { id: CalibrationGroup; label: Localized }[] = [
  { id: "opportunity", label: loc("Oportunidad", "Opportunity") },
  { id: "distance_risk", label: loc("Distancia y riesgo", "Distance and risk") },
  { id: "entry", label: loc("Entrada", "Entry") },
];

const calibrationFields: { key: keyof Calibration; label: Localized; group: CalibrationGroup; help: Localized; reverse?: boolean }[] = [
  { key: "demandQuality", label: loc("Calidad de la demanda", "Quality of demand"), group: "opportunity", help: loc("Adecuación de segmentos, disposición a pagar y propuesta de valor.", "Fit of the segments, willingness to pay and the value proposition.") },
  { key: "resourceFit", label: loc("Encaje de recursos", "Resource fit"), group: "opportunity", help: loc("Talento, insumos, infraestructura y activos que apoyan la ventaja competitiva.", "Talent, inputs, infrastructure and assets that support the competitive advantage.") },
  { key: "competitionAttractiveness", label: loc("Contexto competitivo", "Competitive context"), group: "opportunity", help: loc("Rivalidad, barreras, poder de canal y rentabilidad estructural.", "Rivalry, barriers, channel power and structural profitability.") },
  { key: "governmentOpenness", label: loc("Apertura e incentivos", "Openness and incentives"), group: "opportunity", help: loc("Regulación, inversión extranjera, apoyo público y facilidad operativa.", "Regulation, foreign investment, public support and ease of operating.") },
  { key: "cageDistance", label: loc("Distancia CAGE", "CAGE distance"), group: "distance_risk", help: loc("Diferencia cultural, administrativa, geográfica y económica respecto al país base.", "Cultural, administrative, geographic and economic difference from the home country."), reverse: true },
  { key: "politicalRisk", label: loc("Riesgo político", "Political risk"), group: "distance_risk", help: loc("Estabilidad, expropiación, transferibilidad de fondos, seguridad y conflicto.", "Stability, expropriation, transferability of funds, security and conflict."), reverse: true },
  { key: "economicRisk", label: loc("Riesgo económico", "Economic risk"), group: "distance_risk", help: loc("Volatilidad de crecimiento, inflación, divisa y costes de inputs.", "Volatility of growth, inflation, currency and input costs."), reverse: true },
  { key: "competitiveRisk", label: loc("Riesgo competitivo", "Competitive risk"), group: "distance_risk", help: loc("Corrupción, carteles, redes y lógicas competitivas no transparentes.", "Corruption, cartels, networks and competitive logics that are not transparent."), reverse: true },
  { key: "operationalRisk", label: loc("Riesgo operativo", "Operational risk"), group: "distance_risk", help: loc("Fiabilidad de infraestructura, proveedores, burocracia y restricciones locales.", "Reliability of infrastructure, suppliers, bureaucracy and local constraints."), reverse: true },
  { key: "internalReadiness", label: loc("Capacidad interna", "Internal capability"), group: "entry", help: loc("Recursos, experiencia, talento directivo y capacidad de ejecutar la entrada.", "Resources, experience, management talent and the capacity to execute the entry.") },
  { key: "timePressure", label: loc("Presión temporal", "Time pressure"), group: "entry", help: loc("Urgencia de la ventana de oportunidad o riesgo de preempción competitiva.", "Urgency of the window of opportunity, or the risk of competitive pre-emption.") },
  { key: "controlNeed", label: loc("Necesidad de control", "Need for control"), group: "entry", help: loc("Necesidad de controlar cliente, marca, datos, calidad y operaciones.", "The need to control the customer, the brand, the data, quality and operations.") },
  { key: "ipSensitivity", label: loc("Sensibilidad de IP", "IP sensitivity"), group: "entry", help: loc("Riesgo estratégico de transferencia o apropiación de tecnología y conocimiento.", "Strategic risk that technology and know-how are transferred or appropriated."), reverse: true },
];

type MarketMetricKey = "gdpUsd" | "gdpPerCapita" | "gdpGrowth" | "fdiInflowUsd" | "fdiInflowPctGdp";
type MarketManualKey = MarketMetricKey | "governance";
type FinancialReferenceKey = "taxRatePct" | "fxRateToReportingCurrency";
function documentedCount(candidate: Candidate) { return calibrationFields.filter((field) => (candidate.notes[field.key]?.rationale ?? "").trim().length > 0).length; }
function blankData(): MarketData { return { sourceStatus: "unavailable", manualFields: [] }; }
/**
 * Los separadores de miles y decimales siguen al idioma elegido, no al del navegador. El
 * proveedor de idioma ya escribe la elección en `documentElement.lang` cada vez que cambia,
 * así que se lee de ahí y estas funciones siguen siendo llamables desde cualquier sitio.
 */
function numberLocale() {
  return typeof document !== "undefined" && document.documentElement.lang === "en" ? "en-GB" : "es-ES";
}
function formatNumber(value: number | null | undefined, options: Intl.NumberFormatOptions = {}) { return value === null || value === undefined ? "—" : new Intl.NumberFormat(numberLocale(), options).format(value); }
function formatBillions(value: number | null | undefined) { return value === null || value === undefined ? "—" : `US$ ${new Intl.NumberFormat(numberLocale(), { notation: "compact", maximumFractionDigits: 1 }).format(value)}`; }
function formatMoney(value: number | null | undefined, currency?: string | null) { return value === null || value === undefined ? "—" : new Intl.NumberFormat(numberLocale(), { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(value); }
function formatUpdatedAt(value: string | null | undefined, pending: string) { return value ? new Date(value).toLocaleString(numberLocale(), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : pending; }
function scoreStyle(score: number) { return score >= 70 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : score >= 50 ? "text-amber-800 bg-amber-50 border-amber-200" : "text-rose-700 bg-rose-50 border-rose-200"; }
function scoreTone(score: number) { return score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500"; }
function decisionStyle(action: CountryResult["investmentRecommendation"]["action"]) { return action === "advance" ? "decision-advance" : action === "test" ? "decision-test" : action === "discard" ? "decision-discard" : "decision-incomplete"; }

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t, lang, ui } = useLanguage();
  const [activeTab, setActiveTab] = useState("prep");
  const [caseId, setCaseId] = useState<number | null>(null);
  const [caseDocumentId, setCaseDocumentId] = useState<number | null>(null);
  const [strategySubTab, setStrategySubTab] = useState<"ambition" | "positioning" | "entry" | "partnering" | "coherence">("ambition");
  const [scenarioName, setScenarioName] = useState(ui("hmNewAnalysis"));
  const [companyName, setCompanyName] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [valueProposition, setValueProposition] = useState("");
  const [objective, setObjective] = useState<Objective>("market");
  const [horizonYears, setHorizonYears] = useState("3");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [activeCountry, setActiveCountry] = useState<string | undefined>();
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [financialByCountry, setFinancialByCountry] = useState<Record<string, FinancialAssumptions>>({});
  const [investmentThresholds, setInvestmentThresholds] = useState<InvestmentThresholds>({
    currency: null,
    advanceMinRiskAdjusted: 65,
    testMinRiskAdjusted: 50,
    minConfidence: 60,
    advanceMinNpv: 0,
    testMinNpv: 0,
    advanceMinRoiPct: 20,
    testMinRoiPct: 0,
    advanceMaxPaybackYears: 5,
    testMaxInitialInvestment: null,
  });
  const [comparisonCodes, setComparisonCodes] = useState<string[]>([]);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [savedScenarioId, setSavedScenarioId] = useState<number | null>(null);
  const [governanceLoadingCodes, setGovernanceLoadingCodes] = useState<string[]>([]);
  const [governanceErrors, setGovernanceErrors] = useState<Record<string, string>>({});
  const [marketLoadingCodes, setMarketLoadingCodes] = useState<string[]>([]);
  const [editingMarketCode, setEditingMarketCode] = useState<string | null>(null);
  const marketRefreshQueue = useRef<Promise<unknown>>(Promise.resolve());
  /** Marca que el cambio de caso viene de restaurar un escenario, no de abrir otro caso. */
  const restoringScenario = useRef(false);
  const [popMin, setPopMin] = useState("0");
  const [gdpMin, setGdpMin] = useState("0");
  const [growthMin, setGrowthMin] = useState("-100");
  const [excludedCodes, setExcludedCodes] = useState("");
  const [weights, setWeights] = useState({ market: 28, resources: 16, competition: 16, government: 10, distance: 10, risk: 20 });

  const sourcesQuery = trpc.strategy.getPublicSources.useQuery();
  const financialSourcesQuery = trpc.strategy.getFinancialPublicSources.useQuery();
  const scenariosQuery = trpc.strategy.listScenarios.useQuery(undefined, { enabled: isAuthenticated });
  const fetchData = trpc.strategy.fetchMarketData.useMutation();
  const fetchFinancialData = trpc.strategy.fetchCountryFinancialData.useMutation();
  const fetchGovernanceData = trpc.strategy.fetchGovernanceData.useMutation();
  const evaluation = trpc.strategy.evaluate.useMutation();
  const saveScenario = trpc.strategy.saveScenario.useMutation();
  const updateScenario = trpc.strategy.updateScenario.useMutation();
  const duplicateScenario = trpc.strategy.duplicateScenario.useMutation();
  const deleteScenario = trpc.strategy.deleteScenario.useMutation();
  const trpcUtils = trpc.useUtils();
  const approvalsQuery = trpc.strategy.listApprovals.useQuery(
    { scenarioId: savedScenarioId ?? 0 },
    { enabled: isAuthenticated && savedScenarioId !== null }
  );
  const proposeBlock = trpc.ai.proposeBlock.useMutation();
  const critiqueBlock = trpc.ai.critique.useMutation();

  const activeCandidate = candidates.find((candidate) => candidate.code === activeCountry) ?? candidates[0];
  const excluded = useMemo(() => new Set(excludedCodes.toUpperCase().split(",").map((code) => code.trim()).filter(Boolean)), [excludedCodes]);
  const screenedCandidates = useMemo(() => candidates.filter((candidate) => {
    const data = marketData[candidate.code];
    if (excluded.has(candidate.code)) return false;
    if (!data || data.sourceStatus === "unavailable") return true;
    if (Number(popMin) > 0 && (data.population ?? 0) < Number(popMin) * 1_000_000) return false;
    if (Number(gdpMin) > 0 && (data.gdpUsd ?? 0) < Number(gdpMin) * 1_000_000_000) return false;
    if (Number(growthMin) > -100 && (data.gdpGrowth ?? -100) < Number(growthMin)) return false;
    return true;
  }), [candidates, marketData, excluded, popMin, gdpMin, growthMin]);

  /**
   * La preparación se guarda con el progreso de la ruta: es la misma pregunta —por dónde va
   * este caso— leída antes de empezar en lugar de durante.
   */
  const routeProgress = trpc.globalStrategy.getRouteProgress.useQuery({ caseId: caseId ?? 0 }, { enabled: caseId !== null });
  const saveRouteProgress = trpc.globalStrategy.saveRouteProgress.useMutation({
    onSuccess: () => trpcUtils.globalStrategy.getRouteProgress.invalidate({ caseId: caseId ?? 0 }),
  });
  const preparation = sanitisePreparation(routeProgress.data);

  /**
   * Una sola fuente por dato. La tesis es la dueña de la empresa, la industria y el país
   * porque vive en el caso, y de un caso pueden colgar varios escenarios.
   */
  const thesisQuery = trpc.globalStrategy.getThesis.useQuery({ caseId: caseId ?? 0 }, { enabled: caseId !== null });
  const caseQuery = trpc.case.get.useQuery({ caseId: caseId ?? 0 }, { enabled: caseId !== null });
  const identitySource = {
    company: thesisQuery.data?.thesis.company ?? null,
    industryLabel: thesisQuery.data?.thesis.industryId ? pick(industryById(thesisQuery.data.thesis.industryId).label, lang) : null,
    countryCode: thesisQuery.data?.thesis.countryCode ?? null,
    caseTitle: caseQuery.data?.title ?? null,
  };

  function togglePreparation(itemId: string, next: boolean) {
    if (caseId === null) return;
    const current = routeProgress.data ?? { confirmed: [], skipped: [], gathered: [] };
    const gathered = next
      ? Array.from(new Set([...preparation.gathered, itemId]))
      : preparation.gathered.filter((entry) => entry !== itemId);
    saveRouteProgress.mutate({ caseId, payload: { confirmed: current.confirmed, skipped: current.skipped, gathered } });
  }

  const identityLocal = {
    company: companyName,
    industry,
    scenarioName,
    candidateCodes: candidates.map((candidate) => candidate.code),
  };
  const divergences = identityDivergences(identitySource, identityLocal);

  /**
   * Rellenar un hueco es seguro y se hace solo; cambiar un valor escrito no lo es y no se
   * hace nunca. Si los dos existen y no coinciden, el aviso lo dice y alinearlos es un clic,
   * pero el clic lo da una persona.
   */
  useEffect(() => {
    const fill = identityPrefill(identitySource, identityLocal);
    if (fill.company !== undefined) setCompanyName(fill.company);
    if (fill.industry !== undefined) setIndustry(fill.industry);
    if (fill.scenarioName !== undefined) setScenarioName(fill.scenarioName);
    // Solo se mira cuando cambia el dueño: así escribir en el campo no vuelve a dispararlo.
  }, [identitySource.company, identitySource.industryLabel, identitySource.caseTitle]);

  const selectedObjective = objectiveOptions.find((option) => option.value === objective)!;
  const formValid = companyName.trim() && homeCountry.trim() && industry.trim() && businessModel.trim() && screenedCandidates.length > 0;

  useEffect(() => {
    if (savedScenarioId !== null) setSavedScenarioId(null);
  // A gate belongs to a point-in-time scenario and must not survive a material input change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyName, homeCountry, industry, businessModel, valueProposition, objective, horizonYears, candidates, marketData, financialByCountry, investmentThresholds, weights, excludedCodes, popMin, gdpMin, growthMin]);

  function addCandidate() {
    const found = catalog.find(([code]) => code === selectedCode);
    if (!found) return;
    if (candidates.some((candidate) => candidate.code === found[0])) { toast.info(ui("hmAlreadyAdded")); return; }
    if (candidates.length >= 12) { toast.error(ui("hmMaxTwelve")); return; }
    const candidate = { code: found[0], name: found[1], region: found[2], calibration: { ...neutralCalibration }, notes: {} as CalibrationNotes, assessment: { ...emptyAssessment } };
    setCandidates((current) => [...current, candidate]);
    setActiveCountry(candidate.code);
    setSelectedCode("");
    setResult(null);
    void enqueueCountryRefresh(candidate.code);
  }

  function removeCandidate(code: string) {
    setCandidates((current) => current.filter((candidate) => candidate.code !== code));
    if (activeCountry === code) setActiveCountry(undefined);
    setResult(null);
  }

  function updateAssessment(next: CountryAssessmentState) {
    if (!activeCandidate) return;
    setResult(null);
    setCandidates((current) => current.map((candidate) => candidate.code === activeCandidate.code ? { ...candidate, assessment: next } : candidate));
  }

  function updateCalibrationNote(key: keyof Calibration, rationale: string) {
    if (!activeCandidate) return;
    setResult(null);
    setCandidates((current) => current.map((candidate) => candidate.code === activeCandidate.code ? { ...candidate, notes: { ...candidate.notes, [key]: { rationale } } } : candidate));
  }

  function updateCalibration(key: keyof Calibration, value: number) {
    if (!activeCandidate) return;
    setCandidates((current) => current.map((candidate) => candidate.code === activeCandidate.code ? { ...candidate, calibration: { ...candidate.calibration, [key]: value } } : candidate));
    setResult(null);
  }

  function updateMarketMetric(code: string, key: MarketMetricKey, value: string) {
    setMarketData((current) => {
      const data = current[code] ?? blankData();
      const manualFields = new Set(data.manualFields ?? []);
      manualFields.add(key);
      return { ...current, [code]: { ...data, [key]: value === "" ? null : Number(value), manualFields: Array.from(manualFields) } };
    });
    setResult(null);
    setSavedScenarioId(null);
  }

  function restorePublicMarketMetric(code: string, key: MarketMetricKey) {
    void refreshCountryData([code], false, key);
  }

  function updateGovernanceMetric(code: string, value: string) {
    const parsed = Number(value);
    const score = value === "" || !Number.isFinite(parsed) ? null : Math.max(0, Math.min(100, parsed));
    setMarketData((current) => {
      const data = current[code] ?? blankData();
      const manualFields = new Set(data.manualFields ?? []);
      manualFields.add("governance");
      return {
        ...current,
        [code]: {
          ...data,
          governance: { politicalStability: score, governmentEffectiveness: score, regulatoryQuality: score, ruleOfLaw: score, controlOfCorruption: score, sourceYear: data.governance?.sourceYear ?? null, sourceStatus: score === null ? "unavailable" : "partial" },
          manualFields: Array.from(manualFields),
        },
      };
    });
    setResult(null);
    setSavedScenarioId(null);
  }

  function restorePublicGovernance(code: string) {
    setMarketData((current) => ({ ...current, [code]: { ...(current[code] ?? blankData()), manualFields: (current[code]?.manualFields ?? []).filter((field) => field !== "governance") } }));
    void retryGovernance(code, true);
  }

  function updateCountryFinancialMetric(code: string, key: FinancialReferenceKey, value: string) {
    setFinancialByCountry((current) => ({
      ...current,
      [code]: { ...current[code], [key]: value === "" ? null : Number(value), ...(key === "taxRatePct" ? { taxRateDataMode: "manual" as const } : { fxRateDataMode: "manual" as const }) },
    }));
    setResult(null);
    setSavedScenarioId(null);
  }

  function restorePublicFinancialMetric(code: string, key: FinancialReferenceKey) {
    void refreshCountryData([code], false, undefined, key);
  }

  function updateFinancial(key: keyof Omit<FinancialAssumptions, "modeProfiles" | "sensitivityScenarios">, value: string) {
    if (!activeCandidate) return;
    setFinancialByCountry((current) => ({
      ...current,
      [activeCandidate.code]: {
        ...current[activeCandidate.code],
        [key]: key === "currency" || key === "reportingCurrency" ? value.toUpperCase() : (value === "" ? null : Number(value)),
        ...(key === "taxRatePct" ? { taxRateDataMode: "manual" as const } : {}),
        ...(key === "fxRateToReportingCurrency" ? { fxRateDataMode: "manual" as const } : {}),
      },
    }));
    setResult(null);
    setSavedScenarioId(null);
  }

  function updateSensitivity(scenario: "optimistic" | "conservative", key: keyof Sensitivity, value: string) {
    if (!activeCandidate) return;
    setFinancialByCountry((current) => ({
      ...current,
      [activeCandidate.code]: {
        ...current[activeCandidate.code],
        sensitivityScenarios: {
          ...current[activeCandidate.code]?.sensitivityScenarios,
          [scenario]: { ...current[activeCandidate.code]?.sensitivityScenarios?.[scenario], [key]: value === "" ? null : Number(value) },
        },
      },
    }));
    setResult(null);
    setSavedScenarioId(null);
  }

  function updateModeFinancial(mode: ModeKey, key: keyof FinancialProfile, value: string) {
    if (!activeCandidate) return;
    setFinancialByCountry((current) => ({
      ...current,
      [activeCandidate.code]: {
        ...current[activeCandidate.code],
        modeProfiles: {
          ...current[activeCandidate.code]?.modeProfiles,
          [mode]: { ...current[activeCandidate.code]?.modeProfiles?.[mode], [key]: value === "" ? null : Number(value) },
        },
      },
    }));
    setResult(null);
  }

  function updateThreshold(key: keyof InvestmentThresholds, value: string) {
    setInvestmentThresholds((current) => ({
      ...current,
      [key]: key === "currency" ? (value.trim() ? value.toUpperCase() : null) : (value === "" ? null : Number(value)),
    }));
    setResult(null);
  }

  function toggleComparison(code: string) {
    setComparisonCodes((current) => current.includes(code)
      ? current.filter((item) => item !== code)
      : current.length >= 4 ? (toast.info(ui("hmMaxFourCompare")), current) : [...current, code]);
  }

  async function refreshCountryData(countryCodes: string[], showFeedback: boolean, restoreMetric?: MarketMetricKey, restoreFinancialMetric?: FinancialReferenceKey, attempt = 0): Promise<void> {
    try {
      const [fresh, financialReferences] = await Promise.all([
        fetchData.mutateAsync({ countryCodes }),
        fetchFinancialData.mutateAsync({ countryCodes, reportingCurrency: "USD" }),
      ]);
      setMarketData((current) => ({
        ...current,
        ...Object.fromEntries(countryCodes.map((code) => {
          const previous = current[code];
          const preservedFields = (previous?.manualFields ?? []).filter((field) => field !== restoreMetric) as MarketMetricKey[];
          const preservedValues = Object.fromEntries(preservedFields.map((field) => [field, previous?.[field] ?? null]));
          return [code, { ...fresh[code], ...preservedValues, manualFields: preservedFields }];
        })),
      }));
      setFinancialByCountry((current) => ({ ...current, ...Object.fromEntries(countryCodes.map((code) => {
        const reference = financialReferences[code];
        const existing = current[code] ?? {};
        return [code, {
          ...existing,
          currency: existing.currency ?? reference?.fx.localCurrency ?? null,
          reportingCurrency: existing.reportingCurrency ?? reference?.fx.reportingCurrency ?? "USD",
          taxReference: reference?.tax ?? null,
          fxReference: reference?.fx ?? null,
          taxRatePct: restoreFinancialMetric === "taxRatePct" || existing.taxRateDataMode !== "manual" ? reference?.tax.ratePct ?? null : existing.taxRatePct,
          fxRateToReportingCurrency: restoreFinancialMetric === "fxRateToReportingCurrency" || existing.fxRateDataMode !== "manual" ? reference?.fx.rateToReportingCurrency ?? null : existing.fxRateToReportingCurrency,
          taxRateDataMode: restoreFinancialMetric === "taxRatePct" || existing.taxRateDataMode !== "manual" ? "public" : "manual",
          fxRateDataMode: restoreFinancialMetric === "fxRateToReportingCurrency" || existing.fxRateDataMode !== "manual" ? "public" : "manual",
        }];
      })) }));
      setResult(null);
      setSavedScenarioId(null);
      setGovernanceErrors((current) => {
        const next = { ...current };
        countryCodes.forEach((code) => delete next[code]);
        return next;
      });
      setGovernanceLoadingCodes((current) => Array.from(new Set([...current, ...countryCodes])));
      void fetchGovernanceData.mutateAsync({ countryCodes }).then((governance) => {
        setMarketData((current) => Object.fromEntries(Object.entries(current).map(([code, data]) => [code, governance[code] && !data.manualFields?.includes("governance") ? { ...data, governance: governance[code], sourceYear: Math.max(data.sourceYear ?? 0, governance[code].sourceYear ?? 0) || null, lastUpdatedAt: new Date().toISOString() } : data])));
        const unavailableCodes = countryCodes.filter((code) => !governance[code] || governance[code].sourceStatus === "unavailable");
        if (unavailableCodes.length) setGovernanceErrors((current) => ({ ...current, ...Object.fromEntries(unavailableCodes.map((code) => [code, ui("hmWgiNoData")])) }));
      }).catch(() => {
        setGovernanceErrors((current) => ({ ...current, ...Object.fromEntries(countryCodes.map((code) => [code, ui("hmWgiUnreachable")])) }));
        if (showFeedback) toast.warning(ui("hmWgiPartial"));
      }).finally(() => {
        setGovernanceLoadingCodes((current) => current.filter((code) => !countryCodes.includes(code)));
      });
      if (showFeedback) {
        const liveCount = Object.values(fresh).filter((data) => data.sourceStatus === "live").length;
        const taxCount = Object.values(financialReferences).filter((reference) => reference.tax.sourceStatus === "live").length;
        const fxCount = Object.values(financialReferences).filter((reference) => reference.fx.sourceStatus === "live").length;
        toast.success(`${ui("hmIndicatorsVisible")}: ${liveCount}/${countryCodes.length} ${ui("hmIndicatorsMacro")}, ${taxCount} ${ui("hmIndicatorsTaxes")}, ${fxCount} FX. ${ui("hmIndicatorsWgiBackground")}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const temporary = /service unavailable|unexpected token|failed to fetch|network/i.test(message);
      if (temporary && attempt < 1) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        return refreshCountryData(countryCodes, showFeedback, restoreMetric, restoreFinancialMetric, attempt + 1);
      }
      toast.error(ui(temporary ? "hmSourceUnavailable" : "hmRefreshFailed"));
    }
  }

  async function refreshData() {
    if (!candidates.length) { toast.error(ui("hmAddCountryFirst")); return; }
    await refreshCountryData(candidates.map((candidate) => candidate.code), true);
  }

  function enqueueCountryRefresh(code: string) {
    setMarketLoadingCodes((current) => Array.from(new Set([...current, code])));
    marketRefreshQueue.current = marketRefreshQueue.current
      .catch(() => undefined)
      .then(() => refreshCountryData([code], false))
      .finally(() => setMarketLoadingCodes((current) => current.filter((item) => item !== code)));
  }

  async function retryGovernance(code: string, restoreManual = false) {
    setGovernanceErrors((current) => {
      const next = { ...current };
      delete next[code];
      return next;
    });
    setGovernanceLoadingCodes((current) => Array.from(new Set([...current, code])));
    try {
      const governance = await fetchGovernanceData.mutateAsync({ countryCodes: [code] });
      const refreshed = governance[code];
      if (!refreshed || refreshed.sourceStatus === "unavailable") {
        setGovernanceErrors((current) => ({ ...current, [code]: ui("hmWgiNoData") }));
        toast.error(ui("hmWgiKeepOthers"));
        return;
      }
      setMarketData((current) => {
        const currentData = current[code] ?? blankData();
        if (currentData.manualFields?.includes("governance") && !restoreManual) return current;
        return { ...current, [code]: { ...currentData, governance: refreshed, sourceYear: Math.max(currentData.sourceYear ?? 0, refreshed.sourceYear ?? 0) || null, lastUpdatedAt: new Date().toISOString(), manualFields: restoreManual ? (currentData.manualFields ?? []).filter((field) => field !== "governance") : currentData.manualFields } };
      });
      toast.success(ui("hmWgiRefreshed"));
    } catch {
      setGovernanceErrors((current) => ({ ...current, [code]: ui("hmWgiUnreachable") }));
      toast.error(ui("hmWgiRetryFailed"));
    } finally {
      setGovernanceLoadingCodes((current) => current.filter((item) => item !== code));
    }
  }

  function buildInput() {
    return {
      companyName: companyName.trim(), homeCountry: homeCountry.trim(), industry: industry.trim(), businessModel: businessModel.trim(), valueProposition: valueProposition.trim(), objective, horizonYears: Number(horizonYears) || 3,
      countryInputs: screenedCandidates.map(({ code, name, calibration, notes, assessment, landscape }) => ({ code, name: pick(name, lang), calibration, calibrationNotes: notes, assessment, competitiveLandscape: landscape ?? null })),
      marketData: Object.fromEntries(screenedCandidates.map((candidate) => [candidate.code, marketData[candidate.code] ?? blankData()])),
      financialByCountry: Object.fromEntries(screenedCandidates.map((candidate) => [candidate.code, financialByCountry[candidate.code] ?? {}])),
      investmentThresholds,
      weights,
    };
  }

  async function runEvaluation() {
    if (!formValid) { toast.error(ui("hmIncompleteProfile")); return; }
    try {
      const assessed = await evaluation.mutateAsync(buildInput());
      setResult(assessed as Evaluation);
      setActiveTab("decision");
      toast.success(ui("hmEvaluationDone"));
    } catch (error) { toast.error(t(readLocalizedError(error)) || ui("hmEvaluationFailed")); }
  }

  /**
   * Rehidratar un escenario guardado.
   *
   * Lo guardado es la entrada completa de la evaluación, así que abrir un escenario es
   * repartir ese documento por el estado del formulario. La región de cada país no viaja en
   * la entrada —no interviene en el cálculo— y se recupera del catálogo.
   */
  /**
   * Cambiar de caso vacía el formulario de escenario.
   *
   * El caso es la unidad de análisis: su mandato, sus evidencias y sus cuatro módulos se
   * cargan solos porque cuelgan del identificador. Lo que no colgaba de nada era el
   * formulario —perfil, países, calibración, economía— y se quedaba del caso anterior, de
   * modo que una empresa nueva heredaba los mercados y los juicios de la anterior sin que
   * nada lo advirtiera. Eso no es un inconveniente de interfaz: es contaminación entre
   * análisis.
   *
   * Abrir un escenario guardado del archivo es la excepción, porque allí escenario y caso
   * llegan juntos y coherentes; por eso `applyScenario` fija el caso con la marca puesta.
   */
  function resetScenarioForm() {
    setScenarioName(ui("hmNewAnalysis"));
    setCompanyName("");
    setHomeCountry("");
    setIndustry("");
    setBusinessModel("");
    setValueProposition("");
    setObjective("market");
    setHorizonYears("3");
    setCandidates([]);
    setSelectedCode("");
    setActiveCountry(undefined);
    setMarketData({});
    setFinancialByCountry({});
    setComparisonCodes([]);
    setResult(null);
    setSavedScenarioId(null);
    setCaseDocumentId(null);
    setStrategySubTab("ambition");
    setPopMin("0");
    setGdpMin("0");
    setGrowthMin("-100");
    setExcludedCodes("");
    setGovernanceErrors({});
  }

  function changeCase(nextCaseId: number | null) {
    if (nextCaseId === caseId) return;
    if (!restoringScenario.current) {
      resetScenarioForm();
      if (nextCaseId !== null) toast.info(ui("hmNewCaseCleared"));
    }
    setCaseId(nextCaseId);
  }

  function applyScenario(scenarioId: number, name: string, input: ReturnType<typeof buildInput>, savedResult: Evaluation | null, linkedCaseId: number | null) {
    setScenarioName(name);
    setCompanyName(input.companyName ?? "");
    setHomeCountry(input.homeCountry ?? "");
    setIndustry(input.industry ?? "");
    setBusinessModel(input.businessModel ?? "");
    setValueProposition(input.valueProposition ?? "");
    setObjective((input.objective ?? "market") as Objective);
    setHorizonYears(String(input.horizonYears ?? 3));

    const restored: Candidate[] = (input.countryInputs ?? []).map((country) => ({
      code: country.code,
      name: country.name,
      region: countryCatalog.find((entry) => entry.code === country.code)?.region ?? "europe",
      calibration: country.calibration,
      notes: country.calibrationNotes ?? {},
      assessment: country.assessment ?? { ...emptyAssessment },
      landscape: country.competitiveLandscape ?? null,
    }));
    setCandidates(restored);
    setActiveCountry(restored[0]?.code);
    setComparisonCodes(restored.slice(0, 3).map((candidate) => candidate.code));
    setMarketData(input.marketData ?? {});
    setFinancialByCountry(input.financialByCountry ?? {});
    if (input.investmentThresholds) setInvestmentThresholds(input.investmentThresholds);
    if (input.weights) setWeights(input.weights);

    // Los filtros de cribado son del momento, no del escenario: se dejan abiertos para no
    // esconder países que el análisis guardado sí incluía.
    setPopMin("0");
    setGdpMin("0");
    setGrowthMin("-100");
    setExcludedCodes("");

    setResult(savedResult);
    setSavedScenarioId(scenarioId);
    if (linkedCaseId !== null) {
      restoringScenario.current = true;
      setCaseId(linkedCaseId);
      restoringScenario.current = false;
    }
    setActiveTab(savedResult ? "decision" : "calibrate");
  }

  async function updateSavedScenario() {
    if (savedScenarioId === null) return;
    if (!formValid) { toast.error(ui("hmIncompleteScenario")); return; }
    try {
      const updated = await updateScenario.mutateAsync({
        scenarioId: savedScenarioId,
        name: scenarioName.trim() || ui("hmUntitledAnalysis"),
        caseId: caseId,
        evaluation: buildInput(),
      });
      setResult(updated.result as Evaluation);
      trpcUtils.strategy.listScenarios.invalidate();
      toast.success(ui("hmScenarioUpdated"));
    } catch (error) { toast.error(t(readLocalizedError(error)) || ui("hmScenarioUpdateFailed")); }
  }

  async function persistScenario() {
    if (!formValid) { toast.error(ui("hmNothingToSave")); return; }
    try {
      const saved = await saveScenario.mutateAsync({ name: scenarioName.trim() || ui("hmUntitledAnalysis"), evaluation: buildInput() });
      if (caseId !== null) await updateScenario.mutateAsync({ scenarioId: saved.id, caseId });
      setResult(saved.result as Evaluation);
      setSavedScenarioId(saved.id);
      scenariosQuery.refetch();
      toast.success(ui("hmScenarioSaved"));
    } catch (error) { toast.error(t(readLocalizedError(error)) || ui("hmSaveFirstLogin")); }
  }

  async function exportPdfReport() {
    if (!result) { toast.error(ui("hmGenerateFirst")); return; }
    try {
      const { downloadStrategyPdf } = await import("@/lib/strategyReportPdf");
      downloadStrategyPdf({
        scenarioName,
        companyName,
        homeCountry,
        industry,
        businessModel,
        valueProposition,
        objectiveLabel: t(selectedObjective.label),
        horizonYears,
        generatedAt: result.generatedAt,
        lang,
        // El PDF se imprime en un idioma: todo lo del dominio se resuelve aquí, al generarlo.
        portfolio: {
          ...result.portfolio,
          recommendation: t(result.portfolio.recommendation),
          caveats: pickAll(result.portfolio.caveats, lang),
        },
        thresholds: investmentThresholds,
        countries: result.countries.map((country) => ({
          ...country,
          timing: { label: t(country.timing.label), description: t(country.timing.description) },
          flags: pickAll(country.flags, lang),
          investmentRecommendation: {
            ...country.investmentRecommendation,
            label: t(country.investmentRecommendation.label),
            summary: t(country.investmentRecommendation.summary),
            selectedMode: country.investmentRecommendation.selectedMode === null ? null : t(country.investmentRecommendation.selectedMode),
            reasons: pickAll(country.investmentRecommendation.reasons, lang),
          },
          financial: {
            ...country.financial,
            missingInputs: pickAll(country.financial.missingInputs, lang),
            methodology: t(country.financial.methodology),
            alternatives: country.financial.alternatives.map((alternative) => ({
              ...alternative,
              mode: t(alternative.mode),
              missingInputs: pickAll(alternative.missingInputs, lang),
            })),
            scenarios: country.financial.scenarios.map((scenario) => ({
              ...scenario,
              label: t(scenario.label),
              note: t(scenario.note),
              missingInputs: pickAll(scenario.missingInputs, lang),
              financial: scenario.financial === null ? null : {
                ...scenario.financial,
                alternatives: scenario.financial.alternatives.map((alternative) => ({
                  ...alternative,
                  mode: t(alternative.mode),
                  missingInputs: pickAll(alternative.missingInputs, lang),
                })),
              },
            })),
          },
          entryModes: country.entryModes.map((mode) => ({
            mode: t(mode.mode),
            commitment: t(commitmentLabel(mode.commitment)),
            rationale: t(mode.rationale),
          })),
        })),
      });
      toast.success(ui("hmPdfDone"));
    } catch (error) {
      toast.error(t(readLocalizedError(error)) || ui("hmPdfFailed"));
    }
  }

  return (
    <DashboardLayout>
      <div className="studio-shell">
        <header className="studio-header">
          <div>
            <div className="eyebrow"><Compass className="h-3.5 w-3.5" /> Global Entry Strategy Studio</div>
            <h1>{ui("hmTagline")}</h1>
            <p>{ui("hmSubtitle")}</p>
          </div>
          <div className="header-actions">
            <div className="scenario-name"><Label htmlFor="scenario">{ui("hmScenario")}</Label><Input id="scenario" value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} /></div><LanguageSwitch />
            <Button variant="outline" onClick={exportPdfReport} disabled={!result}><FileDown className="mr-2 h-4 w-4" /> PDF</Button>
            <div className="flex items-center gap-2">
              {savedScenarioId !== null && (
                <Button onClick={updateSavedScenario} disabled={updateScenario.isPending || !formValid}>
                  {updateScenario.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Actualizar
                </Button>
              )}
              <Button variant={savedScenarioId === null ? "default" : "outline"} onClick={persistScenario} disabled={saveScenario.isPending || !formValid}>
                <Save className="mr-2 h-4 w-4" /> {savedScenarioId === null ? "Guardar" : "Guardar como nuevo"}
              </Button>
            </div>
          </div>
        </header>

        <div className="strategic-note"><Sparkles className="h-4 w-4" /><span><strong>{ui("hmPrincipleBold")}</strong> {ui("hmPrincipleText")}</span></div>

        <div className="mt-5"><OnboardingGuide mandateReady={Boolean(companyName.trim() && homeCountry.trim() && industry.trim() && businessModel.trim())} candidateCount={candidates.length} dataReady={candidates.some((candidate) => marketData[candidate.code]?.sourceStatus !== "unavailable")} financialReady={candidates.some((candidate) => financialByCountry[candidate.code]?.tamYearOne !== null && financialByCountry[candidate.code]?.tamYearOne !== undefined)} evaluationReady={Boolean(result)} onNavigate={setActiveTab} /></div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-7">
          {/*
            El modo no se elige: se deduce. Un caso con tesis enunciada enseña el tablero de
            supuestos; uno sin ella, la ruta guiada. El tablero se calla solo cuando no hay
            tesis, así que los dos pueden vivir aquí sin pisarse.
          */}
          {caseId !== null && <AssumptionBoard
              caseId={caseId}
              onGoToThesis={() => setActiveTab("case")}
              economicsFor={(countryCode) => {
                const country = result?.countries.find((entry) => entry.code === countryCode);
                if (!country) return null;
                return {
                  npv: country.investmentRecommendation.evaluatedMetrics.npv,
                  roiPct: country.investmentRecommendation.evaluatedMetrics.roiPct,
                  currency: country.financial.reportingCurrency,
                  action: country.investmentRecommendation.action,
                  stackDeclared: country.financial.stack.status !== "not_declared",
                };
              }}
            />}
          <GuidedRoutePanel
            caseId={caseId}
            scenario={{
              briefComplete: Boolean(formValid),
              candidateCount: candidates.length,
              screenedCount: screenedCandidates.length,
              // Se cuenta como evaluado el país cuyo marco del capítulo 6 llega al 80%:
              // exigir el 100% dejaría la ruta parada por un ítem sin evidencia disponible.
              assessedCountries: screenedCandidates.filter((candidate) => assessmentProgress(candidate.assessment).pct >= 80).length,
              financialReady: screenedCandidates.some((candidate) => {
                const assumptions = financialByCountry[candidate.code];
                return Boolean(assumptions?.tamYearOne && assumptions?.operatingMarginPct !== undefined && assumptions?.discountRatePct);
              }),
              hasResult: result !== null,
              approvalCount: approvalsQuery.data?.length ?? 0,
            }}
            onGo={(target, subTab) => {
              if (subTab) setStrategySubTab(subTab);
              setActiveTab(target);
            }}
          />

          <TabsList className="studio-tabs">
            <TabsTrigger value="prep"><ListChecks className="mr-2 h-4 w-4" /> {ui("tabPrep")}</TabsTrigger>
            <TabsTrigger value="case"><FileText className="mr-2 h-4 w-4" /> {ui("tabCase")}</TabsTrigger>
            <TabsTrigger value="brief"><Building2 className="mr-2 h-4 w-4" /> {ui("tabBrief")}</TabsTrigger>
            <TabsTrigger value="ambition"><Compass className="mr-2 h-4 w-4" /> {ui("tabStrategy")}</TabsTrigger>
            <TabsTrigger value="screen"><Globe2 className="mr-2 h-4 w-4" /> {ui("tabMarkets")}</TabsTrigger>
            <TabsTrigger value="calibrate"><SlidersHorizontal className="mr-2 h-4 w-4" /> {ui("tabCalibration")}</TabsTrigger>
            <TabsTrigger value="finance"><CircleDollarSign className="mr-2 h-4 w-4" /> {ui("tabEconomics")}</TabsTrigger>
            <TabsTrigger value="compare"><Columns3 className="mr-2 h-4 w-4" /> {ui("tabCompare")}</TabsTrigger>
            <TabsTrigger value="decision"><Target className="mr-2 h-4 w-4" /> {ui("tabDecision")}</TabsTrigger>
            <TabsTrigger value="approval"><ClipboardCheck className="mr-2 h-4 w-4" /> {ui("tabGates")}</TabsTrigger>
          </TabsList>

          <TabsContent value="prep" className="mt-6">
            <PreparationPanel
              gathered={preparation.gathered}
              canEdit={caseId !== null}
              candidateCount={candidates.length}
              onToggle={togglePreparation}
              onStart={() => setActiveTab(caseId === null ? "case" : "brief")}
            />
          </TabsContent>

          <TabsContent value="case" className="mt-6 space-y-6">{caseId !== null && <ThesisPanel caseId={caseId} suggestions={{ company: companyName, countryCode: candidates[0]?.code }} />}<CaseWorkspace suggestedTitle={scenarioName} caseId={caseId} onCaseSelected={changeCase} decisionContext={[companyName, industry, valueProposition].filter(Boolean).join(" · ")} defaults={{ companyName, homeCountry, industry }} activeDocumentId={caseDocumentId} onActiveDocumentChange={setCaseDocumentId} /></TabsContent>
          <TabsContent value="ambition" className="mt-6"><GlobalStrategyPanel caseId={caseId} subTab={strategySubTab} onSubTabChange={setStrategySubTab} /></TabsContent>
              <TabsContent value="brief" className="tab-enter">
            <div className="grid gap-6 xl:grid-cols-[1.45fr_.8fr]">
              <Card className="strategic-card"><CardHeader><div className="step-tag">{ui("hmPart2Ch5")}</div><CardTitle>{ui("hmBriefTitle")}</CardTitle><CardDescription>{ui("hmBriefDesc")}</CardDescription></CardHeader><CardContent className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2"><Field label={ui("hmCompany")} required><Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder={ui("hmCompanyPh")} />{caseId !== null && <IdentityNotice field="company" divergences={divergences} onGoToOwner={() => setActiveTab("case")} onAdopt={setCompanyName} />}</Field><Field label={ui("hmHomeCountry")} required><Input value={homeCountry} onChange={(event) => setHomeCountry(event.target.value)} placeholder={ui("hmHomeCountryPh")} /></Field><Field label={ui("hmIndustry")} required><Input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder={ui("hmIndustryPh")} />{caseId !== null && <IdentityNotice field="industry" divergences={divergences} onGoToOwner={() => setActiveTab("case")} onAdopt={setIndustry} />}</Field><Field label={ui("hmBusinessModel")} required><Input value={businessModel} onChange={(event) => setBusinessModel(event.target.value)} placeholder={ui("hmBusinessModelPh")} /></Field></div>
                <Field label={ui("hmValueProp")}><Textarea value={valueProposition} onChange={(event) => setValueProposition(event.target.value)} placeholder={ui("hmValuePropPh")} className="min-h-28" /></Field>
                <div className="grid gap-5 md:grid-cols-[1fr_160px]"><Field label={ui("hmObjective")} required><Select value={objective} onValueChange={(value) => setObjective(value as Objective)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{objectiveOptions.map((option) => <SelectItem value={option.value} key={option.value}>{t(option.label)}</SelectItem>)}</SelectContent></Select></Field><Field label={ui("hmHorizon")} required><Input type="number" min="1" max="25" value={horizonYears} onChange={(event) => setHorizonYears(event.target.value)} /></Field></div>
              </CardContent></Card>
              <Card className="framework-card"><CardHeader><div className="step-tag">{ui("hmFrameworkTag")}</div><CardTitle>{ui("hmFrameworkTitle")}</CardTitle></CardHeader><CardContent className="space-y-5"><FrameworkStep n="01" title={ui("hmStep1")} text={ui("hmStep1Text")} /><FrameworkStep n="02" title={ui("hmStep2")} text={ui("hmStep2Text")} /><FrameworkStep n="03" title={ui("hmStep3")} text={ui("hmStep3Text")} /><FrameworkStep n="04" title={ui("hmStep4")} text={ui("hmStep4Text")} /><div className="objective-box"><Target className="h-5 w-5" /><div><span>{ui("hmChosenObjective")}</span><strong>{t(selectedObjective.label)}</strong><p>{t(selectedObjective.detail)}</p></div></div></CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="screen" className="tab-enter">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
              <Card className="strategic-card"><CardHeader><div className="step-tag">{ui("hmPart2Ch6")}</div><CardTitle>{ui("hmUniverseTitle")}</CardTitle><CardDescription>{ui("hmUniverseDesc")}</CardDescription></CardHeader><CardContent className="space-y-6">
                {caseId !== null && <IdentityNotice field="country" divergences={divergences} onGoToOwner={() => setActiveTab("case")} />}
                <div className="flex gap-3"><Select value={selectedCode} onValueChange={setSelectedCode}><SelectTrigger className="flex-1"><SelectValue placeholder={ui("hmPickCountry")} /></SelectTrigger><SelectContent>{COUNTRY_REGIONS.map(({ id: region, label }) => <div key={region}><div className="select-label">{t(label)}</div>{catalog.filter((item) => item[2] === region).map(([code, name]) => <SelectItem key={code} value={code}>{t(name)}</SelectItem>)}</div>)}</SelectContent></Select><Button onClick={addCandidate} disabled={!selectedCode}><Plus className="mr-2 h-4 w-4" /> {ui("hmAdd")}</Button></div>
                <div className="candidate-grid">{candidates.length ? candidates.map((candidate) => <button key={candidate.code} className={`candidate-chip ${activeCountry === candidate.code ? "active" : ""} ${!screenedCandidates.some((item) => item.code === candidate.code) ? "excluded" : ""}`} onClick={() => { setActiveCountry(candidate.code); setActiveTab("calibrate"); }}><span className="country-code">{candidate.code}</span><span><strong>{t(candidate.name)}</strong><small>{t(regionLabel(candidate.region))}</small></span><span role="button" aria-label={`Eliminar ${candidate.name}`} onClick={(event) => { event.stopPropagation(); removeCandidate(candidate.code); }}><X className="h-4 w-4" /></span></button>) : <EmptyState icon={MapPinned} title={ui("hmNoCandidates")} text={ui("hmNoCandidatesDesc")} />}</div>
                <div className="divider" />
                <div><h3 className="section-heading">{ui("hmScreenRules")}</h3><p className="section-help">{ui("hmScreenRulesDesc")}</p></div>
                <div className="grid gap-4 md:grid-cols-3"><Field label={ui("hmMinPopulation")}><Input type="number" min="0" value={popMin} onChange={(event) => setPopMin(event.target.value)} /></Field><Field label={ui("hmMinGdp")}><Input type="number" min="0" value={gdpMin} onChange={(event) => setGdpMin(event.target.value)} /></Field><Field label={ui("hmMinGrowth")}><Input type="number" value={growthMin === "-100" ? "" : growthMin} placeholder={ui("hmNoFilter")} onChange={(event) => setGrowthMin(event.target.value || "-100")} /></Field></div>
                <Field label={ui("hmExcludeIso")}><Input value={excludedCodes} onChange={(event) => setExcludedCodes(event.target.value)} placeholder={ui("hmExcludeIsoPh")} /></Field>
                <div className="screen-summary"><div><span>{ui("hmCandidates")}</span><strong>{candidates.length}</strong></div><ChevronRight className="h-4 w-4" /><div><span>{ui("hmPassFilter")}</span><strong>{screenedCandidates.length}</strong></div><Button className="ml-auto" variant="outline" onClick={refreshData} disabled={fetchData.isPending || fetchFinancialData.isPending || !candidates.length}>{fetchData.isPending || fetchFinancialData.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Actualizar mercado y fiscal</Button></div>
              </CardContent></Card>
              <Card className="data-card"><CardHeader><div className="flex items-center justify-between"><div><div className="step-tag">{ui("hmExternalData")}</div><CardTitle>{ui("hmFactualBase")}</CardTitle></div><Database className="h-6 w-6 text-sky-700" /></div><CardDescription>{ui("hmFactualBaseDesc")}</CardDescription></CardHeader><CardContent className="space-y-3">{[...(sourcesQuery.data ?? []), ...(financialSourcesQuery.data ?? [])].map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer" className="source-row"><div><strong>{source.name}</strong><p>{t(source.coverage)}</p></div><Badge variant="outline" className={source.live ? "source-live" : ""}>{t(source.status)}</Badge></a>)}</CardContent></Card>
            </div>
            {candidates.length > 0 && <MarketComparisonTable candidates={candidates} marketData={marketData} financialByCountry={financialByCountry} governanceLoadingCodes={governanceLoadingCodes} marketLoadingCodes={marketLoadingCodes} governanceErrors={governanceErrors} editingCode={editingMarketCode} onToggleEditing={setEditingMarketCode} onMarketChange={updateMarketMetric} onRestoreMarket={restorePublicMarketMetric} onFinancialChange={updateCountryFinancialMetric} onRestoreFinancial={restorePublicFinancialMetric} onRetryGovernance={retryGovernance} onGovernanceChange={updateGovernanceMetric} onRestoreGovernance={restorePublicGovernance} />}
          </TabsContent>

          <TabsContent value="calibrate" className="tab-enter">
            <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
              <Card className="strategic-card"><CardHeader><div className="step-tag">{ui("hmContextTag")}</div><CardTitle>{ui("hmCalibrateTitle")}</CardTitle><CardDescription>{ui("hmCalibrateDesc")}</CardDescription></CardHeader><CardContent>{candidates.length ? <div className="space-y-3">{candidates.map((candidate) => <button key={candidate.code} onClick={() => setActiveCountry(candidate.code)} className={`country-selector ${activeCandidate?.code === candidate.code ? "selected" : ""}`}><span className="country-code">{candidate.code}</span><span><strong>{t(candidate.name)}</strong><small>{t(regionLabel(candidate.region))}</small></span><ChevronRight className="ml-auto h-4 w-4" /></button>)}</div> : <EmptyState icon={Globe2} title={ui("hmDefineMarketsFirst")} text={ui("hmDefineMarketsFirstDesc")} />}
                <div className="method-box"><FileCheck2 className="h-5 w-5" /><p><strong>{ui("hmDisciplineBold")}</strong> {ui("hmDisciplineText")}</p></div>
              </CardContent></Card>
              <Card className="calibration-card"><CardHeader><div className="flex items-center justify-between"><div><div className="step-tag">{ui("hmActiveCountry")}</div><CardTitle>{activeCandidate ? t(activeCandidate.name) : ui("hmPickACountry")}</CardTitle></div>{activeCandidate && <div className="flex items-center gap-2"><Badge variant="outline">{documentedCount(activeCandidate)}/{calibrationFields.length} {ui("hmJustified")} · {assessmentProgress(activeCandidate.assessment).pct}% {ui("hmAssessed")}</Badge><Badge className="country-badge">{activeCandidate.code}</Badge></div>}</div></CardHeader><CardContent>{activeCandidate ? <div className="space-y-8">{CALIBRATION_GROUPS.map((group) => <section key={group.id}><h3 className="calibration-group">{t(group.label)}</h3><div className="space-y-5">{calibrationFields.filter((field) => field.group === group.id).map((field) => <div key={field.key} className="slider-row"><div className="slider-meta"><div><strong>{t(field.label)}</strong><span>{t(field.help)}</span></div><output className={field.reverse ? "risk-output" : ""}>{activeCandidate.calibration[field.key]}</output></div><Slider min={0} max={100} step={5} value={[activeCandidate.calibration[field.key]]} onValueChange={([value]) => updateCalibration(field.key, value)} /><Input className="calibration-rationale" value={activeCandidate.notes[field.key]?.rationale ?? ""} onChange={(event) => updateCalibrationNote(field.key, event.target.value)} placeholder={ui("hmRationalePh")} aria-label={`${ui("hmRationaleFor")} ${t(field.label)}`} /></div>)}</div></section>)}</div> : <EmptyState icon={SlidersHorizontal} title={ui("hmNoActiveCountry")} text={ui("hmNoActiveCountryDesc")} />}</CardContent></Card>{activeCandidate && <CompetitorMapPanel
                landscape={activeCandidate.landscape}
                onChange={(next) => setCandidates((current) => current.map((entry) => (entry.code === activeCandidate.code ? { ...entry, landscape: next } : entry)))}
                stack={financialByCountry[activeCandidate.code]?.revenueStack}
                currency={financialByCountry[activeCandidate.code]?.currency ?? null}
                computed={result?.countries.find((entry) => entry.code === activeCandidate.code)?.landscape ?? null}
              />}
              {activeCandidate && <Card className="assessment-card"><CardContent className="pt-6"><CountryAssessmentPanel
                countryName={activeCandidate.name}
                assessment={activeCandidate.assessment}
                onChange={updateAssessment}
                onSuggestBlock={caseDocumentId ? async (blockKey) => {
                  try {
                    return await proposeBlock.mutateAsync({ documentId: caseDocumentId, blockKey, countryName: t(activeCandidate.name), lang, context: [companyName, industry].filter(Boolean).join(" · ") || undefined });
                  } catch (error) {
                    toast.error(t(readLocalizedError(error)) || ui("hmCopilotFailed"));
                    return null;
                  }
                } : undefined}
                onCritiqueBlock={caseDocumentId ? async (blockKey, ratings) => {
                  try {
                    const result = await critiqueBlock.mutateAsync({ documentId: caseDocumentId, blockKey, countryName: t(activeCandidate.name), lang, ratings });
                    return result.objections;
                  } catch (error) {
                    toast.error(t(readLocalizedError(error)) || ui("hmReviewerFailed"));
                    return null;
                  }
                } : undefined}
              /></CardContent></Card>}
            </div>
            <Card className="weights-card mt-6"><CardHeader><div className="flex items-center justify-between"><div><div className="step-tag">{ui("hmWeightingTag")}</div><CardTitle>{ui("hmWeightingTitle")}</CardTitle><CardDescription>{ui("hmWeightingDesc")}</CardDescription></div><Badge variant="outline">Total: {Object.values(weights).reduce((sum, value) => sum + value, 0)}</Badge></div></CardHeader><CardContent><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{([ ["market", "Mercado"], ["resources", "Recursos"], ["competition", "Competencia"], ["government", "Gobierno"], ["distance", "Encaje CAGE"], ["risk", "Seguridad / riesgo"] ] as [keyof typeof weights, string][]).map(([key, label]) => <div key={key} className="weight-control"><div><span>{label}</span><strong>{weights[key]}%</strong></div><Slider min={0} max={50} step={1} value={[weights[key]]} onValueChange={([value]) => { setWeights((current) => ({ ...current, [key]: value })); setResult(null); }} /></div>)}</div></CardContent></Card>
          </TabsContent>

          <TabsContent value="finance" className="tab-enter">
            <div className="finance-intro"><div><div className="eyebrow"><CircleDollarSign className="h-3.5 w-3.5" /> {ui("hmFinanceEyebrow")}</div><h2>{ui("hmFinanceTitle")}</h2><p>{ui("hmFinanceDesc")}</p></div><div className="formula-chip">{ui("hmFcfFormula")}<br />TV = FCFₙ₊₁ / (r − g)</div></div>
            <div className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
              <Card className="strategic-card"><CardHeader><div className="step-tag">{ui("hmActiveMarket")}</div><CardTitle>{activeCandidate ? t(activeCandidate.name) : ui("hmPickAMarket")}</CardTitle><CardDescription>{ui("hmPerCountryPre")} <strong>{ui("hmRefreshMarketTax")}</strong> {ui("hmPerCountryTail")}</CardDescription></CardHeader><CardContent>{candidates.length ? <div className="space-y-2">{candidates.map((candidate) => <button key={candidate.code} onClick={() => setActiveCountry(candidate.code)} className={`country-selector ${activeCandidate?.code === candidate.code ? "selected" : ""}`}><span className="country-code">{candidate.code}</span><span><strong>{t(candidate.name)}</strong><small>{financialByCountry[candidate.code]?.taxReference?.sourceStatus === "live" ? ui("hmTaxFxUpdated") : ui("hmCompleteAssumptions")}</small></span><ChevronRight className="ml-auto h-4 w-4" /></button>)}</div> : <EmptyState icon={CircleDollarSign} title={ui("hmAddMarketsFirst")} text={ui("hmAddMarketsFirstDesc")} />}</CardContent></Card>
              <div className="space-y-6">
                <Card className="financial-card"><CardHeader><div className="step-tag">{activeCandidate ? `${ui("hmAssumptionsTag")} · ${activeCandidate.code}` : ui("hmAssumptionsTag")}</div><CardTitle>{ui("hmEntryCashFlow")}</CardTitle><CardDescription>{ui("hmEntryCashFlowPre")} <strong>{ui("hmManual")}</strong>{ui("hmEntryCashFlowTail")}</CardDescription></CardHeader><CardContent>{activeCandidate ? <div className="space-y-7">
                  <section><h3 className="finance-section-title">{ui("hmCurrencyConvention")}</h3><div className="mt-4 grid gap-4 md:grid-cols-3"><Field label={ui("hmLocalCurrency")}><Input value={financialByCountry[activeCandidate.code]?.currency ?? ""} placeholder="MXN" maxLength={10} onChange={(event) => updateFinancial("currency", event.target.value)} /></Field><Field label={ui("hmReportingCurrency")}><Input value={financialByCountry[activeCandidate.code]?.reportingCurrency ?? ""} placeholder="USD" maxLength={10} onChange={(event) => updateFinancial("reportingCurrency", event.target.value)} /></Field><Field label={ui("hmFxReportLocal")}><Input type="number" min="0" step="0.0001" value={financialByCountry[activeCandidate.code]?.fxRateToReportingCurrency ?? ""} placeholder={ui("hmFromSource")} onChange={(event) => updateFinancial("fxRateToReportingCurrency", event.target.value)} /></Field></div><FinancialSourceStatus label={ui("hmExchangeRate")} source={financialByCountry[activeCandidate.code]?.fxReference} mode={financialByCountry[activeCandidate.code]?.fxRateDataMode} /></section>
                  <section><h3 className="finance-section-title">{ui("hmMarketSizeTitle")}</h3><div className="mt-4 grid gap-4 md:grid-cols-3"><Field label={ui("hmTamYearOne")}><Input type="number" min="0" value={financialByCountry[activeCandidate.code]?.tamYearOne ?? ""} placeholder={`${ui("hmEg")} 50000000`} onChange={(event) => updateFinancial("tamYearOne", event.target.value)} /></Field><Field label={ui("hmAnnualGrowth")}><Input type="number" value={financialByCountry[activeCandidate.code]?.annualMarketGrowthPct ?? ""} placeholder={`${ui("hmEg")} 6`} onChange={(event) => updateFinancial("annualMarketGrowthPct", event.target.value)} /></Field><Field label={ui("hmSamPct")}><Input type="number" min="0" max="100" value={financialByCountry[activeCandidate.code]?.samPct ?? ""} placeholder={`${ui("hmEg")} 30`} onChange={(event) => updateFinancial("samPct", event.target.value)} /></Field><Field label={ui("hmSomYearOne")}><Input type="number" min="0" max="100" value={financialByCountry[activeCandidate.code]?.somPctYearOne ?? ""} placeholder={`${ui("hmEg")} 1`} onChange={(event) => updateFinancial("somPctYearOne", event.target.value)} /></Field><Field label={`${ui("hmSomAtYear")} ${horizonYears} ${ui("hmOfSam")}`}><Input type="number" min="0" max="100" value={financialByCountry[activeCandidate.code]?.somPctHorizon ?? ""} placeholder={`${ui("hmEg")} 4`} onChange={(event) => updateFinancial("somPctHorizon", event.target.value)} /></Field><Field label={ui("hmOperatingMargin")}><Input type="number" value={financialByCountry[activeCandidate.code]?.operatingMarginPct ?? ""} placeholder={`${ui("hmEg")} 18`} onChange={(event) => updateFinancial("operatingMarginPct", event.target.value)} /></Field><Field label={ui("hmTaxRate")}><Input type="number" min="0" max="100" value={financialByCountry[activeCandidate.code]?.taxRatePct ?? ""} placeholder={ui("hmFromSource")} onChange={(event) => updateFinancial("taxRatePct", event.target.value)} /></Field><Field label={ui("hmWorkingCapital")}><Input type="number" value={financialByCountry[activeCandidate.code]?.workingCapitalPctRevenue ?? ""} placeholder={`${ui("hmEg")} 12`} onChange={(event) => updateFinancial("workingCapitalPctRevenue", event.target.value)} /></Field><Field label={ui("hmDiscountRate")}><Input type="number" min="0" value={financialByCountry[activeCandidate.code]?.discountRatePct ?? ""} placeholder={`${ui("hmEg")} 10`} onChange={(event) => updateFinancial("discountRatePct", event.target.value)} /></Field><Field label={ui("hmTerminalGrowth")}><Input type="number" value={financialByCountry[activeCandidate.code]?.terminalGrowthPct ?? ""} placeholder={`${ui("hmEg")} 2`} onChange={(event) => updateFinancial("terminalGrowthPct", event.target.value)} /></Field></div><FinancialSourceStatus label={ui("hmCorporateTax")} source={financialByCountry[activeCandidate.code]?.taxReference} mode={financialByCountry[activeCandidate.code]?.taxRateDataMode} /></section>
                  <section className="scenario-section"><div className="scenario-heading"><div><h3 className="finance-section-title">{ui("hmScenarioSensitivity")}</h3><p className="section-help">{ui("hmScenarioSensitivityDesc")}</p></div><Badge variant="outline">{ui("hmHypothetical")}</Badge></div><div className="scenario-input-grid"><ScenarioInputCard label={ui("hmScenarioBase")} tone="base" values={{ priceRevenuePct: 0, operatingMarginPctPoints: 0, fxRatePct: 0 }} readOnly /><ScenarioInputCard label={ui("hmScenarioOptimistic")} tone="optimistic" values={financialByCountry[activeCandidate.code]?.sensitivityScenarios?.optimistic} onChange={(key, value) => updateSensitivity("optimistic", key, value)} /><ScenarioInputCard label={ui("hmScenarioConservative")} tone="conservative" values={financialByCountry[activeCandidate.code]?.sensitivityScenarios?.conservative} onChange={(key, value) => updateSensitivity("conservative", key, value)} /></div></section>
                  <RevenueStackPanel
                    stack={financialByCountry[activeCandidate.code]?.revenueStack}
                    onChange={(next) => setFinancialByCountry((current) => ({ ...current, [activeCandidate.code]: { ...(current[activeCandidate.code] ?? {}), revenueStack: next } }))}
                    currency={financialByCountry[activeCandidate.code]?.reportingCurrency ?? financialByCountry[activeCandidate.code]?.currency ?? null}
                    computed={result?.countries.find((entry) => entry.code === activeCandidate.code)?.financial.stack ?? null}
                    plausibility={result?.countries.find((entry) => entry.code === activeCandidate.code)?.financial.plausibility ?? null}
                  />
                  <section><div className="flex items-end justify-between gap-4"><div><h3 className="finance-section-title">{ui("hmPerModeEconomics")}</h3><p className="section-help">{ui("hmPerModeEconomicsDesc")}</p></div><Badge variant="outline">{horizonYears} {ui("hmYears")}</Badge></div><div className="overflow-x-auto mt-4"><table className="finance-input-table"><thead><tr><th>{ui("hmMode")}</th><th>{ui("hmCommitment")}</th><th>{ui("hmInitialInvestment")}</th><th>{ui("hmAnnualCost")}</th><th>{ui("hmRevenueCapture")}</th></tr></thead><tbody>{financeModes.map((mode) => <tr key={mode.key}><td><strong>{t(mode.label)}</strong></td><td><Badge variant="outline">{t(commitmentLabel(mode.commitment))}</Badge></td><td><Input type="number" min="0" value={financialByCountry[activeCandidate.code]?.modeProfiles?.[mode.key]?.initialInvestment ?? ""} onChange={(event) => updateModeFinancial(mode.key, "initialInvestment", event.target.value)} placeholder="0" /></td><td><Input type="number" min="0" value={financialByCountry[activeCandidate.code]?.modeProfiles?.[mode.key]?.annualOperatingCost ?? ""} onChange={(event) => updateModeFinancial(mode.key, "annualOperatingCost", event.target.value)} placeholder="0" /></td><td><Input type="number" min="0" max="100" value={financialByCountry[activeCandidate.code]?.modeProfiles?.[mode.key]?.revenueCapturePct ?? ""} onChange={(event) => updateModeFinancial(mode.key, "revenueCapturePct", event.target.value)} placeholder="100" /></td></tr>)}</tbody></table></div></section>
                  <div className="finance-note"><CircleAlert className="h-4 w-4" /><p><strong>{ui("hmConventionBold")}</strong> {ui("hmConventionText")}</p></div></div> : <EmptyState icon={CircleDollarSign} title={ui("hmNoActiveCountry")} text={ui("hmPickMarketLeft")} />}</CardContent></Card>
                <Card className="threshold-card"><CardHeader><div className="step-tag">{ui("hmGovernanceTag")}</div><CardTitle>{ui("hmThresholdsTitle")}</CardTitle><CardDescription>{ui("hmThresholdsPre")} <strong>{ui("hmAdvance")}</strong>, <strong>{ui("hmTest")}</strong> {ui("hmOr")} <strong>{ui("hmDiscard")}</strong>{ui("hmThresholdsTail")}</CardDescription></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-3"><Field label={ui("hmThresholdCurrency")}><Input value={investmentThresholds.currency ?? ""} placeholder={ui("hmSameAsReporting")} maxLength={10} onChange={(event) => updateThreshold("currency", event.target.value)} /></Field><Field label={ui("hmRiskAdjAdvance")}><Input type="number" min="0" max="100" value={investmentThresholds.advanceMinRiskAdjusted ?? ""} onChange={(event) => updateThreshold("advanceMinRiskAdjusted", event.target.value)} /></Field><Field label={ui("hmRiskAdjTest")}><Input type="number" min="0" max="100" value={investmentThresholds.testMinRiskAdjusted ?? ""} onChange={(event) => updateThreshold("testMinRiskAdjusted", event.target.value)} /></Field><Field label={ui("hmMinConfidence")}><Input type="number" min="0" max="100" value={investmentThresholds.minConfidence ?? ""} onChange={(event) => updateThreshold("minConfidence", event.target.value)} /></Field><Field label={ui("hmMinNpvAdvance")}><Input type="number" value={investmentThresholds.advanceMinNpv ?? ""} onChange={(event) => updateThreshold("advanceMinNpv", event.target.value)} /></Field><Field label={ui("hmMinNpvTest")}><Input type="number" value={investmentThresholds.testMinNpv ?? ""} onChange={(event) => updateThreshold("testMinNpv", event.target.value)} /></Field><Field label={ui("hmMinRoiAdvance")}><Input type="number" value={investmentThresholds.advanceMinRoiPct ?? ""} onChange={(event) => updateThreshold("advanceMinRoiPct", event.target.value)} /></Field><Field label={ui("hmMinRoiTest")}><Input type="number" value={investmentThresholds.testMinRoiPct ?? ""} onChange={(event) => updateThreshold("testMinRoiPct", event.target.value)} /></Field><Field label={ui("hmMaxPayback")}><Input type="number" min="1" value={investmentThresholds.advanceMaxPaybackYears ?? ""} onChange={(event) => updateThreshold("advanceMaxPaybackYears", event.target.value)} /></Field><Field label={ui("hmMaxInvestment")}><Input type="number" min="0" value={investmentThresholds.testMaxInitialInvestment ?? ""} placeholder={ui("hmNoLimit")} onChange={(event) => updateThreshold("testMaxInitialInvestment", event.target.value)} /></Field></div><div className="threshold-rule"><ShieldCheck className="h-4 w-4" /><p><strong>{ui("hmRuleBold")}</strong> {ui("hmRuleText")}</p></div></CardContent></Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compare" className="tab-enter">
            <div className="comparison-header"><div><div className="eyebrow"><Columns3 className="h-3.5 w-3.5" /> {ui("hmCompareEyebrow")}</div><h2>{ui("hmCompareTitle")}</h2><p>{ui("hmCompareDesc")}</p></div>{result && <Button onClick={() => setActiveTab("decision")}><Target className="mr-2 h-4 w-4" /> {ui("hmGoToDecision")}</Button>}</div>
            <Card className="comparison-picker"><CardContent><div className="comparison-picks">{candidates.map((candidate) => <button key={candidate.code} onClick={() => toggleComparison(candidate.code)} className={`compare-pick ${comparisonCodes.includes(candidate.code) ? "chosen" : ""}`}><span className="country-code">{candidate.code}</span><span>{t(candidate.name)}</span>{comparisonCodes.includes(candidate.code) && <CheckCircle2 className="ml-auto h-4 w-4" />}</button>)}</div></CardContent></Card>
            {!comparisonCodes.length ? <EmptyState icon={Columns3} title={ui("hmPickToCompare")} text={ui("hmPickToCompareDesc")} /> : <CountryComparison countries={comparisonCodes.map((code) => ({ candidate: candidates.find((candidate) => candidate.code === code)!, data: marketData[code] ?? blankData(), result: result?.countries.find((country) => country.code === code) }))} />}
          </TabsContent>

          <TabsContent value="decision" className="tab-enter">
            {!result ? <div className="decision-empty"><div className="decision-empty-icon"><Target className="h-8 w-8" /></div><h2>{ui("hmDecisionTitle")}</h2><p>{ui("hmDecisionDesc")}</p><Button size="lg" onClick={runEvaluation} disabled={evaluation.isPending || !formValid}>{evaluation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />} {ui("hmGenerateAssessment")}</Button><span className="validity-note">{formValid ? `${screenedCandidates.length} ${ui("hmMarketsReady")}` : ui("hmMissingMandate")}</span></div> : <div className="space-y-6"><section className="decision-hero"><div><div className="eyebrow"><CheckCircle2 className="h-3.5 w-3.5" /> {ui("hmDecisionEyebrow")}</div><h2>{result.portfolio.leadingCountry ?? ui("hmComparisonDone")}</h2><p>{t(result.portfolio.recommendation)}</p></div><div className="hero-score"><span>{ui("hmLeadingScore")}</span><strong>{result.countries[0]?.scores.riskAdjusted ?? "—"}<small>/100</small></strong><Button variant="outline" onClick={runEvaluation} disabled={evaluation.isPending}><RefreshCw className="mr-2 h-4 w-4" /> {ui("hmRecalculate")}</Button></div></section>
              <div className="grid gap-6 xl:grid-cols-[1.32fr_.68fr]"><Card className="ranking-card"><CardHeader><CardTitle>{ui("hmMarketPriority")}</CardTitle><CardDescription>{ui("hmMarketPriorityDesc")}</CardDescription></CardHeader><CardContent className="space-y-4">{result.countries.map((country, index) => <div className="ranking-row" key={country.code}><div className="rank-index">{index + 1}</div><div className="rank-country"><strong>{country.name}</strong><span>{t(country.timing.label)}</span></div><div className="score-bar"><div><span>{ui("hmStep2")} {country.scores.attractiveness}</span><span>{ui("hmSafety")} {country.scores.safety}</span></div><div className="bar-track"><div className="bar-fill attractiveness" style={{ width: `${country.scores.attractiveness}%` }} /><div className="bar-marker" style={{ left: `${country.scores.safety}%` }} /></div></div><div className={`score-pill ${scoreStyle(country.scores.riskAdjusted)}`}>{country.scores.riskAdjusted}</div></div>)}</CardContent></Card><Card className="readout-card"><CardHeader><CardTitle>{ui("hmHowToRead")}</CardTitle></CardHeader><CardContent><Readout icon={Target} title={ui("hmStep2")} text={ui("hmAttractivenessHelp")} /><Readout icon={ShieldCheck} title={ui("hmSafety")} text={ui("hmSafetyHelp")} /><Readout icon={FileCheck2} title={ui("hmConfidence")} text={ui("hmConfidenceHelp")} /></CardContent></Card></div>
              <Card className="recommendations-card"><CardHeader><div><CardTitle>{ui("hmRouteTitle")}</CardTitle><CardDescription>{ui("hmRouteDesc")}</CardDescription></div><Button variant="outline" onClick={exportPdfReport}><FileDown className="mr-2 h-4 w-4" /> {ui("hmDetailedPdf")}</Button></CardHeader><CardContent><div className="recommendation-grid">{result.countries.map((country) => <article className="country-recommendation" key={country.code}><div className="recommendation-top"><div><span className="country-code">{country.code}</span><h3>{country.name}</h3></div><div className={`score-pill ${scoreStyle(country.scores.riskAdjusted)}`}>{country.scores.riskAdjusted}</div></div><div className="timing-box"><ArrowUpRight className="h-4 w-4" /><div><strong>{t(country.timing.label)}</strong><p>{t(country.timing.description)}</p></div></div><CountryLens country={country} /><div className="mode-list">{country.entryModes.map((mode, idx) => <div className="mode-row" key={t(mode.mode)}><span>{idx + 1}</span><div><strong>{t(mode.mode)}</strong><p>{t(mode.rationale)}</p></div><Badge variant="outline">{t(commitmentLabel(mode.commitment))}</Badge></div>)}</div><div className={`investment-decision ${decisionStyle(country.investmentRecommendation.action)}`}><div><span>{ui("hmThresholdDecision")}</span><strong>{t(country.investmentRecommendation.label)}</strong></div><p>{t(country.investmentRecommendation.summary)}</p></div><div className="financial-readout"><div className="financial-readout-head"><span>{ui("hmEconomicViability")}</span>{country.financial.status === "ok" ? <Badge className="source-live">{ui("hmFullCashFlow")}</Badge> : <Badge variant="outline">{ui("hmPendingAssumptions")}</Badge>}</div>{country.financial.status === "ok" && <div className="financial-market-summary"><span>{ui("hmTamHorizon")} <b>{formatMoney(country.financial.market.tamAtHorizon, country.financial.currency)}</b></span><span>{ui("hmSomRevenue")} <b>{formatMoney(country.financial.market.somRevenueAtHorizon, country.financial.currency)}</b></span></div>}{country.financial.alternatives.map((alternative) => <div className="financial-alternative" key={alternative.key}><strong>{t(alternative.mode)}</strong>{alternative.status === "ok" ? <div><span>ROI <b>{formatNumber(alternative.roiPct, { maximumFractionDigits: 1 })}%</b></span><span>NPV <b>{formatMoney(alternative.npv, country.financial.currency)}</b></span><span>TV <b>{formatMoney(alternative.presentValueTerminal, country.financial.currency)}</b></span>{alternative.paybackYear && <span>{ui("hmPayback")} <b>{ui("hmYear")} {alternative.paybackYear}</b></span>}</div> : <p>{ui("hmMissingColon")}: {pickAll(alternative.missingInputs.slice(0, 2), lang).join(", ")}.</p>}</div>)}</div><ScenarioOutcome country={country} />{country.flags.length > 0 && <div className="flag-list">{country.flags.map((flag) => <p key={flag.es}><AlertTriangle className="h-3.5 w-3.5" /> {t(flag)}</p>)}</div>}<div className="confidence-row"><span>{ui("hmEvidenceConfidence")}</span><Progress value={country.scores.confidence} /><strong>{country.scores.confidence}%</strong></div></article>)}</div></CardContent></Card>
              {caseId !== null && <DecisionMemoSection
                caseId={caseId}
                countryNameFor={(code) => {
                  const candidate = candidates.find((entry) => entry.code === code);
                  return candidate ? t(candidate.name) : code;
                }}
                economicsFor={(code) => {
                  const country = result?.countries.find((entry) => entry.code === code);
                  return country ? country.investmentRecommendation.summary : null;
                }}
                marketFor={(code) => result?.countries.find((entry) => entry.code === code)?.landscape.findings ?? []}
              />}

              <section className="caveat-callout"><CircleAlert className="h-5 w-5" /><div><strong>{ui("hmDecisionCondition")}</strong><p>{t(result.portfolio.caveats[0])} {ui("hmDecisionConditionTail")}</p></div></section>
            </div>}
          </TabsContent>

          <TabsContent value="approval" className="tab-enter">
            <ApprovalWorkspace scenarioId={savedScenarioId} countries={result?.countries ?? []} />
          </TabsContent>
        </Tabs>

        <ScenarioArchive
          isAuthenticated={isAuthenticated}
          currentScenarioId={savedScenarioId}
          onOpen={(scenario) => applyScenario(scenario.id, scenario.name, scenario.inputJson as ReturnType<typeof buildInput>, (scenario.resultJson as Evaluation | null) ?? null, scenario.caseId)}
        />
      </div>
    </DashboardLayout>
  );
}

function MarketComparisonTable({ candidates, marketData, financialByCountry, governanceLoadingCodes, marketLoadingCodes, governanceErrors, editingCode, onToggleEditing, onMarketChange, onRestoreMarket, onFinancialChange, onRestoreFinancial, onRetryGovernance, onGovernanceChange, onRestoreGovernance }: { candidates: Candidate[]; marketData: Record<string, MarketData>; financialByCountry: Record<string, FinancialAssumptions>; governanceLoadingCodes: string[]; marketLoadingCodes: string[]; governanceErrors: Record<string, string>; editingCode: string | null; onToggleEditing: (code: string | null) => void; onMarketChange: (code: string, key: MarketMetricKey, value: string) => void; onRestoreMarket: (code: string, key: MarketMetricKey) => void; onFinancialChange: (code: string, key: FinancialReferenceKey, value: string) => void; onRestoreFinancial: (code: string, key: FinancialReferenceKey) => void; onRetryGovernance: (code: string) => void; onGovernanceChange: (code: string, value: string) => void; onRestoreGovernance: (code: string) => void }) {
  const { t, ui } = useLanguage();
  return <Card className="metric-card mt-6"><CardHeader><div className="market-table-heading"><div><CardTitle>{ui("hmIndicatorsTitle")}</CardTitle><CardDescription>{ui("hmIndicatorsPre")} <strong>{ui("hmEdit")}</strong> {ui("hmIndicatorsTail")}</CardDescription></div><Badge variant="outline">{candidates.length} mercado{candidates.length === 1 ? "" : "s"}</Badge></div></CardHeader><CardContent><div className="market-table-guide"><span><strong>{ui("hmLastUpdateBold")}</strong> {ui("hmLastUpdateText")}</span><span><strong>{ui("hmRetryWgiBold")}</strong> {ui("hmRetryWgiText")}</span><span><strong>{ui("hmRestoreBold")}</strong> {ui("hmRestoreText")}</span></div><div className="overflow-x-auto"><table className="metrics-table editable-metrics-table"><thead><tr><th>{ui("hmColMarket")}</th><th>{ui("hmColStatus")}</th><th>{ui("hmColGdp")}</th><th>{ui("hmColGdpPc")}</th><th>{ui("hmColRealGdp")}</th><th>{ui("hmColFdi")}</th><th>{ui("hmColFdiGdp")}</th><th>{ui("hmColCorpTax")}</th><th>{ui("hmColFx")}</th><th>WGI</th><th>{ui("hmColLastUpdate")}</th></tr></thead><tbody>{candidates.map((candidate) => {
    const data = marketData[candidate.code] ?? blankData();
    const finance = financialByCountry[candidate.code] ?? {};
    const passes = true;
    const governance = data.governance;
    const governanceValues = governance ? [governance.politicalStability, governance.governmentEffectiveness, governance.regulatoryQuality, governance.ruleOfLaw, governance.controlOfCorruption].filter((value): value is number => value !== null) : [];
    const governanceAverage = governanceValues.length ? governanceValues.reduce((sum, value) => sum + value, 0) / governanceValues.length : null;
    const editing = editingCode === candidate.code;
    const governanceLoading = governanceLoadingCodes.includes(candidate.code);
    const governanceError = governanceErrors[candidate.code];
    const manual = new Set(data.manualFields ?? []);
    return <tr key={candidate.code} className={!passes ? "muted-row" : ""}><td className="market-name-cell"><strong>{t(candidate.name)}</strong><span>{candidate.code}</span><Button size="sm" variant={editing ? "secondary" : "outline"} className="market-edit-button" onClick={() => onToggleEditing(editing ? null : candidate.code)}><Pencil className="mr-1 h-3 w-3" /> {editing ? ui("hmClose") : ui("hmEdit")}</Button></td><td>{marketLoadingCodes.includes(candidate.code) ? <span className="metric-loading"><Loader2 className="h-3 w-3 animate-spin" /> {ui("hmUpdating")}</span> : <StatusBadge status={data.sourceStatus} />}</td><EditableMarketMetric editing={editing} value={data.gdpUsd} format={formatBillions} manual={manual.has("gdpUsd")} title={ui("hmGdpHelp")} onChange={(value) => onMarketChange(candidate.code, "gdpUsd", value)} onRestore={() => onRestoreMarket(candidate.code, "gdpUsd")} /><EditableMarketMetric editing={editing} value={data.gdpPerCapita} format={(value) => value === null || value === undefined ? "—" : `US$ ${formatNumber(value, { maximumFractionDigits: 0 })}`} manual={manual.has("gdpPerCapita")} title={ui("hmGdpPcHelp")} onChange={(value) => onMarketChange(candidate.code, "gdpPerCapita", value)} onRestore={() => onRestoreMarket(candidate.code, "gdpPerCapita")} /><EditableMarketMetric editing={editing} value={data.gdpGrowth} format={(value) => value === null || value === undefined ? "—" : `${formatNumber(value, { maximumFractionDigits: 1 })}%`} manual={manual.has("gdpGrowth")} title={ui("hmGdpGrowthHelp")} onChange={(value) => onMarketChange(candidate.code, "gdpGrowth", value)} onRestore={() => onRestoreMarket(candidate.code, "gdpGrowth")} /><EditableMarketMetric editing={editing} value={data.fdiInflowUsd} format={formatBillions} manual={manual.has("fdiInflowUsd")} title={ui("hmFdiHelp")} onChange={(value) => onMarketChange(candidate.code, "fdiInflowUsd", value)} onRestore={() => onRestoreMarket(candidate.code, "fdiInflowUsd")} /><EditableMarketMetric editing={editing} value={data.fdiInflowPctGdp} format={(value) => value === null || value === undefined ? "—" : `${formatNumber(value, { maximumFractionDigits: 1 })}%`} manual={manual.has("fdiInflowPctGdp")} title={ui("hmFdiGdpHelp")} onChange={(value) => onMarketChange(candidate.code, "fdiInflowPctGdp", value)} onRestore={() => onRestoreMarket(candidate.code, "fdiInflowPctGdp")} /><EditableFinancialMetric editing={editing} value={finance.taxRatePct} format={(value) => value === null || value === undefined ? "—" : `${formatNumber(value, { maximumFractionDigits: 1 })}%`} manual={finance.taxRateDataMode === "manual"} title={ui("hmTaxHelp")} onChange={(value) => onFinancialChange(candidate.code, "taxRatePct", value)} onRestore={() => onRestoreFinancial(candidate.code, "taxRatePct")} /><EditableFinancialMetric editing={editing} value={finance.fxRateToReportingCurrency} format={(value) => value === null || value === undefined ? "—" : `${formatNumber(value, { maximumFractionDigits: 4 })} ${finance.reportingCurrency || "USD"}/${finance.currency || "local"}`} manual={finance.fxRateDataMode === "manual"} title={ui("hmFxHelp")} onChange={(value) => onFinancialChange(candidate.code, "fxRateToReportingCurrency", value)} onRestore={() => onRestoreFinancial(candidate.code, "fxRateToReportingCurrency")} /><td className="wgi-cell">{editing ? <EditableGovernanceMetric value={governanceAverage} manual={manual.has("governance")} onChange={(value) => onGovernanceChange(candidate.code, value)} onRestore={() => onRestoreGovernance(candidate.code)} /> : governanceLoading ? <span className="metric-loading"><Loader2 className="h-3 w-3 animate-spin" /> {ui("hmLoading")}</span> : governanceError ? <div className="wgi-retry"><span>{governanceError}</span><Button size="sm" variant="outline" onClick={() => onRetryGovernance(candidate.code)}><RotateCcw className="mr-1 h-3 w-3" /> {ui("hmRetryWgi")}</Button></div> : governanceAverage === null ? "—" : <div className="metric-value"><strong>{formatNumber(governanceAverage, { maximumFractionDigits: 0 })}/100</strong>{manual && <Badge variant="outline" className="manual-badge">{ui("hmManualTag")}</Badge>}<small>{governance?.sourceYear ?? ""}</small></div>}</td><td className="updated-at-cell"><strong>{formatUpdatedAt(data.lastUpdatedAt, ui("hmPending"))}</strong>{data.manualFields?.length ? <small>{data.manualFields.length} {ui(data.manualFields.length === 1 ? "hmManualAdjustment" : "hmManualAdjustments")}</small> : <small>{ui("hmPublicSource")}</small>}</td></tr>;
  })}</tbody></table></div></CardContent></Card>;
}

function EditableMarketMetric({ editing, value, format, manual, title, onChange, onRestore }: { editing: boolean; value: number | null | undefined; format: (value: number | null | undefined) => string; manual: boolean; title: string; onChange: (value: string) => void; onRestore: () => void }) {
  const { ui } = useLanguage();
  return <td title={title}>{editing ? <div className="metric-editor"><Input type="number" value={value ?? ""} onChange={(event) => onChange(event.target.value)} /><MetricSourceBadge manual={manual} onRestore={onRestore} /></div> : <div className="metric-value">{format(value)}{manual && <Badge variant="outline" className="manual-badge">{ui("hmManualTag")}</Badge>}</div>}</td>;
}
function EditableGovernanceMetric({ value, manual, onChange, onRestore }: { value: number | null; manual: boolean; onChange: (value: string) => void; onRestore: () => void }) {
  return <div className="metric-editor governance-editor"><Input type="number" min="0" max="100" value={value ?? ""} onChange={(event) => onChange(event.target.value)} /><MetricSourceBadge manual={manual} onRestore={onRestore} /></div>;
}
function EditableFinancialMetric({ editing, value, format, manual, title, onChange, onRestore }: { editing: boolean; value: number | null | undefined; format: (value: number | null | undefined) => string; manual: boolean; title: string; onChange: (value: string) => void; onRestore: () => void }) {
  const { ui } = useLanguage();
  return <td title={title}>{editing ? <div className="metric-editor"><Input type="number" step="any" value={value ?? ""} onChange={(event) => onChange(event.target.value)} /><MetricSourceBadge manual={manual} onRestore={onRestore} /></div> : <div className="metric-value">{format(value)}{manual ? <Badge variant="outline" className="manual-badge">{ui("hmManualTag")}</Badge> : <Badge variant="outline" className="public-badge">{ui("hmPublicTag")}</Badge>}</div>}</td>;
}
function MetricSourceBadge({ manual, onRestore }: { manual: boolean; onRestore: () => void }) {
  const { ui } = useLanguage();
  return manual ? <Button type="button" size="icon" variant="ghost" className="metric-restore" title={ui("hmRestorePublic")} aria-label={ui("hmRestorePublic")} onClick={onRestore}><RotateCcw className="h-3.5 w-3.5" /></Button> : <span className="metric-public-label">{ui("hmPublicTag")}</span>; }

function CountryComparison({ countries }: { countries: { candidate: Candidate; data: MarketData; result?: CountryResult }[] }) {
  const { t, ui } = useLanguage();
  return <div className="comparison-board" style={{ gridTemplateColumns: `repeat(${Math.min(countries.length, 4)}, minmax(260px, 1fr))` }}>{countries.map(({ candidate, data, result }) => {
    const governance = data.governance;
    const governanceValues = governance ? [governance.politicalStability, governance.governmentEffectiveness, governance.regulatoryQuality, governance.ruleOfLaw, governance.controlOfCorruption].filter((value): value is number => value !== null) : [];
    const governanceAverage = governanceValues.length ? governanceValues.reduce((sum, value) => sum + value, 0) / governanceValues.length : null;
    const bestAlternative = result?.financial.alternatives.filter((alternative) => alternative.status === "ok").sort((a, b) => (b.npv ?? -Infinity) - (a.npv ?? -Infinity))[0];
    return <article key={candidate.code} className="comparison-country"><header><span className="country-code">{candidate.code}</span><div><h3>{t(candidate.name)}</h3><p>{t(regionLabel(candidate.region))}</p></div>{result && <div className={`score-pill ${scoreStyle(result.scores.riskAdjusted)}`}>{result.scores.riskAdjusted}</div>}</header><ComparisonMetric label={ui("hmGdp")} value={formatBillions(data.gdpUsd)} /><ComparisonMetric label={ui("hmGdpGrowth")} value={data.gdpGrowth === null || data.gdpGrowth === undefined ? "—" : `${formatNumber(data.gdpGrowth, { maximumFractionDigits: 1 })}%`} /><ComparisonMetric label={ui("hmFdiUnctad")} value={formatBillions(data.fdiInflowUsd)} /><ComparisonMetric label={ui("hmGovernanceWgi")} value={governanceAverage === null ? "—" : `${formatNumber(governanceAverage, { maximumFractionDigits: 0 })}/100`} /><ComparisonMetric label={ui("hmDecision")} value={result ? t(result.investmentRecommendation.label) : ui("hmGenerateFirstShort")} /><ComparisonMetric label={ui("hmStep2")} value={result ? `${result.scores.attractiveness}/100` : ui("hmGenerateFirstShort")} tone={result ? scoreTone(result.scores.attractiveness) : undefined} /><ComparisonMetric label={ui("hmSafety")} value={result ? `${result.scores.safety}/100` : ui("hmGenerateFirstShort")} tone={result ? scoreTone(result.scores.safety) : undefined} /><ComparisonMetric label={ui("hmTamAtHorizon")} value={result ? formatMoney(result.financial.market.tamAtHorizon, result.financial.currency) : ui("hmGenerateFirstShort")} /><ComparisonMetric label={ui("hmSomAtHorizon")} value={result ? formatMoney(result.financial.market.somRevenueAtHorizon, result.financial.currency) : ui("hmGenerateFirstShort")} /><div className="comparison-mode"><span>{ui("hmLeadingAlternative")}</span>{bestAlternative ? <><strong>{t(bestAlternative.mode)}</strong><div><b>ROI {formatNumber(bestAlternative.roiPct, { maximumFractionDigits: 1 })}%</b><b>NPV {formatMoney(bestAlternative.npv, result?.financial.currency)}</b></div></> : <p>{result ? ui("hmCompleteAlternative") : `${ui("hmGenerateFirstShort")}.`}</p>}</div>{result && <ScenarioOutcome country={result} compact />}{result?.flags.length ? <div className="comparison-flags">{result.flags.slice(0, 2).map((flag) => <p key={flag.es}><AlertTriangle className="h-3.5 w-3.5" /> {t(flag)}</p>)}</div> : null}</article>;
  })}</div>;
}

function ScenarioOutcome({ country, compact = false }: { country: CountryResult; compact?: boolean }) {
  const { t, ui } = useLanguage();
  const selectedKey = country.investmentRecommendation.selectedModeKey;
  const scenarios = country.financial.scenarios.map((scenario) => ({
    ...scenario,
    alternative: scenario.financial?.alternatives.find((alternative) => alternative.key === selectedKey) ?? scenario.financial?.alternatives.find((alternative) => alternative.status === "ok"),
  }));
  return <div className={`scenario-outcome ${compact ? "compact" : ""}`}><div className="scenario-outcome-heading"><span>{compact ? ui("hmSensitivity") : ui("hmSensitivitySelected")}</span>{!compact && <small>{ui("hmThreeScenarios")}</small>}</div><div className="scenario-outcome-grid">{scenarios.map((scenario) => <div className={`scenario-outcome-row ${scenario.key} ${scenario.status !== "ok" ? "incomplete" : ""}`} key={scenario.key}><strong>{t(scenario.label)}</strong>{scenario.alternative ? <><span>NPV <b>{formatMoney(scenario.alternative.npv, scenario.financial?.currency)}</b></span><span>ROI <b>{formatNumber(scenario.alternative.roiPct, { maximumFractionDigits: 1 })}%</b></span></> : <small>{scenario.status === "insufficient_data" ? ui("hmCompleteSensitivities") : ui("hmNotMeaningful")}</small>}</div>)}</div></div>;
}

function CountryLens({ country }: { country: CountryResult }) {
  const { t, ui } = useLanguage();
  const { opportunityRisk, profile, growthVariability, summary } = country.assessment;
  return (
    <div className="country-lens">
      <div className="country-lens-head">
        <span>{ui("hmOppRiskMatrix")}</span>
        <Badge variant="outline">{t(opportunityRisk.label)}</Badge>
      </div>
      <p>{t(opportunityRisk.reading)}</p>
      <div className="country-lens-meta">
        <span>{ui("hmOpportunity")} <b>{opportunityRisk.opportunity}</b></span>
        <span>{ui("hmRisk")} <b>{opportunityRisk.risk}</b></span>
        {profile.best && <span>{ui("hmProfile")} <b>{t(profile.best.label)}</b></span>}
        {growthVariability.coefficientOfVariation !== null && (
          <span>{ui("hmGrowthVolatility")} <b>{growthVariability.coefficientOfVariation}</b> ({growthVariability.observations} {ui("hmYears")})</span>
        )}
        <span>{ui("hmChapter6Assessment")} <b>{summary.assessedItems}/{summary.totalItems}</b></span>
      </div>
    </div>
  );
}

function ComparisonMetric({ label, value, tone }: { label: string; value: string; tone?: string }) { return <div className="comparison-metric"><span>{label}</span><strong>{value}</strong>{tone && <i className={tone} />}</div>; }
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <div className="field"><Label>{label}{required && <span className="required">*</span>}</Label>{children}</div>; }
function FrameworkStep({ n, title, text }: { n: string; title: string; text: string }) { return <div className="framework-step"><span>{n}</span><div><strong>{title}</strong><p>{text}</p></div></div>; }
function EmptyState({ icon: Icon, title, text }: { icon: typeof Globe2; title: string; text: string }) { return <div className="empty-state"><Icon className="h-6 w-6" /><strong>{title}</strong><p>{text}</p></div>; }
function StatusBadge({ status }: { status: Status }) {
  const { ui } = useLanguage();
  const label = status === "live" ? ui("hmStatusComplete") : status === "partial" ? ui("hmStatusPartial") : ui("hmStatusEmpty");
  const tone = status === "live" ? "status-live" : status === "partial" ? "status-partial" : "status-empty";
  return <Badge variant="outline" className={tone}>{label}</Badge>;
}
function Readout({ icon: Icon, title, text }: { icon: typeof Target; title: string; text: string }) { return <div className="readout"><Icon className="h-4 w-4" /><div><strong>{title}</strong><p>{text}</p></div></div>; }
function FinancialSourceStatus({ label, source, mode }: { label: string; source?: Provenance | null; mode?: "public" | "manual" }) {
  const { t, ui } = useLanguage();
  if (!source) return <div className="financial-source-status"><Badge variant="outline" className="status-empty">{ui("hmNoSource")}</Badge><span>{label}: {ui("hmNoSourcePre")} <strong>{ui("hmRefreshMarketTax")}</strong> {ui("hmNoSourceTail")}</span></div>;
  const config = source.sourceStatus === "live" ? "status-live" : source.sourceStatus === "partial" ? "status-partial" : "status-empty";
  return <div className="financial-source-status"><Badge variant="outline" className={mode === "manual" ? "status-partial" : config}>{mode === "manual" ? ui("hmManualTag") : source.sourceStatus === "live" ? ui("hmPublicTag") : ui("hmUnavailable")}</Badge><span><strong>{label}:</strong> <a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.sourceName}</a>{source.sourceYear ? ` · ${source.sourceYear}` : ""}{source.observedAt ? ` · ${ui("hmObserved")} ${source.observedAt}` : ""}. {t(source.note)}</span></div>;
}
function ScenarioInputCard({ label, tone, values, readOnly, onChange }: { label: string; tone: "base" | "optimistic" | "conservative"; values?: Sensitivity; readOnly?: boolean; onChange?: (key: keyof Sensitivity, value: string) => void }) {
  const { ui } = useLanguage();
  const fields: { key: keyof Sensitivity; label: string; suffix: string }[] = [
    { key: "priceRevenuePct", label: ui("hmPriceRevenue"), suffix: "%" },
    { key: "operatingMarginPctPoints", label: ui("hmMarginShort"), suffix: ui("hmPercentagePoints") },
    { key: "fxRatePct", label: "FX", suffix: "%" },
  ];
  return <div className={`scenario-input-card ${tone}`}><div className="scenario-card-heading"><strong>{label}</strong><span>{readOnly ? ui("hmNoVariation") : tone === "optimistic" ? ui("hmHypotheticalUp") : ui("hmHypotheticalDown")}</span></div>{fields.map((field) => <label key={field.key}><span>{field.label} <small>{field.suffix}</small></span><Input type="number" value={values?.[field.key] ?? ""} placeholder={readOnly ? "0" : ui("hmEnterValue")} readOnly={readOnly} onChange={(event) => onChange?.(field.key, event.target.value)} /></label>)}</div>;
}
