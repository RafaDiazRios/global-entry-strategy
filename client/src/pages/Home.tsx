import DashboardLayout from "@/components/DashboardLayout";
import ApprovalWorkspace from "@/components/ApprovalWorkspace";
import OnboardingGuide from "@/components/OnboardingGuide";
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
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Building2,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CircleAlert,
  CircleDollarSign,
  Columns3,
  Compass,
  Database,
  FileCheck2,
  FileDown,
  Globe2,
  Loader2,
  MapPinned,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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

type Candidate = { code: string; name: string; region: string; calibration: Calibration };
type ModeKey = "greenfield" | "acquisition" | "alliance" | "licensing" | "distributor" | "office" | "digital";
type FinancialProfile = { initialInvestment?: number | null; annualOperatingCost?: number | null; revenueCapturePct?: number | null };
type Provenance = { sourceStatus: Status; sourceName: string; sourceUrl: string; sourceYear?: number | null; observedAt?: string | null; retrievedAt: string; note: string };
type Sensitivity = { priceRevenuePct?: number | null; operatingMarginPctPoints?: number | null; fxRatePct?: number | null };
type FinancialAssumptions = { currency?: string | null; reportingCurrency?: string | null; fxRateToReportingCurrency?: number | null; fxRateDataMode?: "public" | "manual"; fxReference?: Provenance | null; tamYearOne?: number | null; annualMarketGrowthPct?: number | null; samPct?: number | null; somPctYearOne?: number | null; somPctHorizon?: number | null; operatingMarginPct?: number | null; taxRatePct?: number | null; taxRateDataMode?: "public" | "manual"; taxReference?: Provenance | null; workingCapitalPctRevenue?: number | null; discountRatePct?: number | null; terminalGrowthPct?: number | null; sensitivityScenarios?: { optimistic?: Sensitivity; conservative?: Sensitivity }; modeProfiles?: Partial<Record<ModeKey, FinancialProfile>> };
type InvestmentThresholds = { currency?: string | null; advanceMinRiskAdjusted?: number | null; testMinRiskAdjusted?: number | null; minConfidence?: number | null; advanceMinNpv?: number | null; testMinNpv?: number | null; advanceMinRoiPct?: number | null; testMinRoiPct?: number | null; advanceMaxPaybackYears?: number | null; testMaxInitialInvestment?: number | null };

type FinancialAlternative = { key: ModeKey; mode: string; status: "ok" | "insufficient_data" | "not_meaningful"; roiPct: number | null; npv: number | null; paybackYear: number | null; initialInvestment: number | null; annualOperatingCost: number | null; revenueCapturePct: number | null; cumulativeFreeCashFlow: number | null; terminalValue: number | null; presentValueTerminal: number | null; annualProjection: { year: number; revenue: number; operatingProfit: number; taxes: number; changeInWorkingCapital: number; freeCashFlow: number; presentValue: number }[]; missingInputs: string[] };
type FinancialCase = { status: "ok" | "insufficient_data"; currency: string | null; localCurrency: string | null; reportingCurrency: string | null; fxRateToReportingCurrency: number | null; horizonYears: number; assumptions: { taxRatePct: number | null; workingCapitalPctRevenue: number | null; discountRatePct: number | null; terminalGrowthPct: number | null }; market: { tamYearOne: number | null; tamAtHorizon: number | null; samAtHorizon: number | null; somRevenueYearOne: number | null; somRevenueAtHorizon: number | null }; alternatives: FinancialAlternative[]; missingInputs: string[]; methodology: string };
type FinancialScenario = { key: "base" | "optimistic" | "conservative"; label: string; priceRevenuePct: number | null; operatingMarginPctPoints: number | null; fxRatePct: number | null; status: "ok" | "insufficient_data" | "not_meaningful"; financial: FinancialCase | null; missingInputs: string[]; note: string };

type CountryResult = {
  code: string;
  name: string;
  data: MarketData;
  scores: { market: number; resources: number; competition: number; government: number; distanceFit: number; safety: number; attractiveness: number; riskAdjusted: number; confidence: number };
  entryModes: { mode: string; score: number; rationale: string; commitment: string }[];
  financial: FinancialCase & { scenarios: FinancialScenario[] };
  investmentRecommendation: { action: "advance" | "test" | "discard" | "insufficient_data"; label: string; summary: string; selectedMode: string | null; selectedModeKey: ModeKey | null; reasons: string[] };
  timing: { label: string; description: string };
  flags: string[];
};

type Evaluation = { generatedAt: string; methodology: string; countries: CountryResult[]; portfolio: { leadingCountry?: string; recommendation: string; caveats: string[] } };

const catalog = [
  ["DE", "Alemania", "Europa"], ["FR", "Francia", "Europa"], ["GB", "Reino Unido", "Europa"], ["ES", "España", "Europa"], ["PL", "Polonia", "Europa"], ["IT", "Italia", "Europa"],
  ["US", "Estados Unidos", "Américas"], ["CA", "Canadá", "Américas"], ["MX", "México", "Américas"], ["BR", "Brasil", "Américas"], ["CL", "Chile", "Américas"], ["CO", "Colombia", "Américas"],
  ["CN", "China", "Asia-Pacífico"], ["JP", "Japón", "Asia-Pacífico"], ["KR", "Corea del Sur", "Asia-Pacífico"], ["IN", "India", "Asia-Pacífico"], ["ID", "Indonesia", "Asia-Pacífico"], ["SG", "Singapur", "Asia-Pacífico"], ["AU", "Australia", "Asia-Pacífico"],
  ["AE", "Emiratos Árabes Unidos", "Oriente Medio y África"], ["SA", "Arabia Saudí", "Oriente Medio y África"], ["ZA", "Sudáfrica", "Oriente Medio y África"], ["NG", "Nigeria", "Oriente Medio y África"], ["EG", "Egipto", "Oriente Medio y África"],
] as const;

const neutralCalibration: Calibration = {
  demandQuality: 50, resourceFit: 50, competitionAttractiveness: 50, governmentOpenness: 50, cageDistance: 50, politicalRisk: 50, economicRisk: 50, competitiveRisk: 50, operationalRisk: 50, internalReadiness: 50, timePressure: 50, controlNeed: 50, ipSensitivity: 50,
};

const objectiveOptions: { value: Objective; label: string; detail: string }[] = [
  { value: "market", label: "Desarrollo de mercado", detail: "Capturar penetración, cuota y margen" },
  { value: "resources", label: "Acceso a recursos", detail: "Asegurar inputs, talento o proveedores críticos" },
  { value: "learning", label: "Aprendizaje", detail: "Acceder a capacidades, innovación o mejores prácticas" },
  { value: "coordination", label: "Coordinación", detail: "Crear una plataforma regional o global" },
];

const financeModes: { key: ModeKey; label: string; commitment: string }[] = [
  { key: "greenfield", label: "Filial propia / greenfield", commitment: "Alto" },
  { key: "acquisition", label: "Adquisición", commitment: "Alto" },
  { key: "alliance", label: "Joint venture o alianza", commitment: "Medio" },
  { key: "licensing", label: "Licencia o franquicia", commitment: "Bajo" },
  { key: "distributor", label: "Agente o distribuidor", commitment: "Bajo" },
  { key: "office", label: "Oficina / observatorio", commitment: "Bajo" },
  { key: "digital", label: "Entrada digital o híbrida", commitment: "Bajo" },
];

const calibrationFields: { key: keyof Calibration; label: string; group: string; help: string; reverse?: boolean }[] = [
  { key: "demandQuality", label: "Calidad de la demanda", group: "Oportunidad", help: "Adecuación de segmentos, disposición a pagar y propuesta de valor." },
  { key: "resourceFit", label: "Encaje de recursos", group: "Oportunidad", help: "Talento, insumos, infraestructura y activos que apoyan la ventaja competitiva." },
  { key: "competitionAttractiveness", label: "Contexto competitivo", group: "Oportunidad", help: "Rivalidad, barreras, poder de canal y rentabilidad estructural." },
  { key: "governmentOpenness", label: "Apertura e incentivos", group: "Oportunidad", help: "Regulación, inversión extranjera, apoyo público y facilidad operativa." },
  { key: "cageDistance", label: "Distancia CAGE", group: "Distancia y riesgo", help: "Diferencia cultural, administrativa, geográfica y económica respecto al país base.", reverse: true },
  { key: "politicalRisk", label: "Riesgo político", group: "Distancia y riesgo", help: "Estabilidad, expropiación, transferibilidad de fondos, seguridad y conflicto.", reverse: true },
  { key: "economicRisk", label: "Riesgo económico", group: "Distancia y riesgo", help: "Volatilidad de crecimiento, inflación, divisa y costes de inputs.", reverse: true },
  { key: "competitiveRisk", label: "Riesgo competitivo", group: "Distancia y riesgo", help: "Corrupción, carteles, redes y lógicas competitivas no transparentes.", reverse: true },
  { key: "operationalRisk", label: "Riesgo operativo", group: "Distancia y riesgo", help: "Fiabilidad de infraestructura, proveedores, burocracia y restricciones locales.", reverse: true },
  { key: "internalReadiness", label: "Capacidad interna", group: "Entrada", help: "Recursos, experiencia, talento directivo y capacidad de ejecutar la entrada." },
  { key: "timePressure", label: "Presión temporal", group: "Entrada", help: "Urgencia de la ventana de oportunidad o riesgo de preempción competitiva." },
  { key: "controlNeed", label: "Necesidad de control", group: "Entrada", help: "Necesidad de controlar cliente, marca, datos, calidad y operaciones." },
  { key: "ipSensitivity", label: "Sensibilidad de IP", group: "Entrada", help: "Riesgo estratégico de transferencia o apropiación de tecnología y conocimiento.", reverse: true },
];

function blankData(): MarketData { return { sourceStatus: "unavailable" }; }
function formatNumber(value: number | null | undefined, options: Intl.NumberFormatOptions = {}) { return value === null || value === undefined ? "—" : new Intl.NumberFormat("es-ES", options).format(value); }
function formatBillions(value: number | null | undefined) { return value === null || value === undefined ? "—" : `US$ ${new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`; }
function formatMoney(value: number | null | undefined, currency?: string | null) { return value === null || value === undefined ? "—" : new Intl.NumberFormat("es-ES", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(value); }
function scoreStyle(score: number) { return score >= 70 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : score >= 50 ? "text-amber-800 bg-amber-50 border-amber-200" : "text-rose-700 bg-rose-50 border-rose-200"; }
function scoreTone(score: number) { return score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500"; }
function decisionStyle(action: CountryResult["investmentRecommendation"]["action"]) { return action === "advance" ? "decision-advance" : action === "test" ? "decision-test" : action === "discard" ? "decision-discard" : "decision-incomplete"; }

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("brief");
  const [scenarioName, setScenarioName] = useState("Nuevo análisis");
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
    if (candidates.some((candidate) => candidate.code === found[0])) { toast.info("El país ya está en la comparación."); return; }
    if (candidates.length >= 12) { toast.error("El análisis admite hasta 12 países por escenario."); return; }
    const candidate = { code: found[0], name: found[1], region: found[2], calibration: { ...neutralCalibration } };
    setCandidates((current) => [...current, candidate]);
    setActiveCountry(candidate.code);
    setSelectedCode("");
    setResult(null);
    void refreshCountryData([candidate.code], false);
  }

  function removeCandidate(code: string) {
    setCandidates((current) => current.filter((candidate) => candidate.code !== code));
    if (activeCountry === code) setActiveCountry(undefined);
    setResult(null);
  }

  function updateCalibration(key: keyof Calibration, value: number) {
    if (!activeCandidate) return;
    setCandidates((current) => current.map((candidate) => candidate.code === activeCandidate.code ? { ...candidate, calibration: { ...candidate.calibration, [key]: value } } : candidate));
    setResult(null);
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
      : current.length >= 4 ? (toast.info("La vista lado a lado admite hasta cuatro países."), current) : [...current, code]);
  }

  async function refreshCountryData(countryCodes: string[], showFeedback: boolean) {
    try {
      const [fresh, financialReferences] = await Promise.all([
        fetchData.mutateAsync({ countryCodes }),
        fetchFinancialData.mutateAsync({ countryCodes, reportingCurrency: "USD" }),
      ]);
      setMarketData((current) => ({ ...current, ...fresh }));
      setFinancialByCountry((current) => ({ ...current, ...Object.fromEntries(countryCodes.map((code) => {
        const reference = financialReferences[code];
        const existing = current[code] ?? {};
        return [code, {
          ...existing,
          currency: existing.currency ?? reference?.fx.localCurrency ?? null,
          reportingCurrency: existing.reportingCurrency ?? reference?.fx.reportingCurrency ?? "USD",
          taxReference: reference?.tax ?? null,
          fxReference: reference?.fx ?? null,
          taxRatePct: existing.taxRateDataMode === "manual" ? existing.taxRatePct : reference?.tax.ratePct ?? null,
          fxRateToReportingCurrency: existing.fxRateDataMode === "manual" ? existing.fxRateToReportingCurrency : reference?.fx.rateToReportingCurrency ?? null,
          taxRateDataMode: existing.taxRateDataMode === "manual" ? "manual" : "public",
          fxRateDataMode: existing.fxRateDataMode === "manual" ? "manual" : "public",
        }];
      })) }));
      setResult(null);
      setSavedScenarioId(null);
      setGovernanceLoadingCodes((current) => Array.from(new Set([...current, ...countryCodes])));
      void fetchGovernanceData.mutateAsync({ countryCodes }).then((governance) => {
        setMarketData((current) => Object.fromEntries(Object.entries(current).map(([code, data]) => [code, governance[code] ? { ...data, governance: governance[code], sourceYear: Math.max(data.sourceYear ?? 0, governance[code].sourceYear ?? 0) || null } : data])));
      }).catch(() => {
        if (showFeedback) toast.warning("Los indicadores macro y financieros se actualizaron; WGI no respondió y se puede intentar de nuevo.");
      }).finally(() => {
        setGovernanceLoadingCodes((current) => current.filter((code) => !countryCodes.includes(code)));
      });
      if (showFeedback) {
        const liveCount = Object.values(fresh).filter((data) => data.sourceStatus === "live").length;
        const taxCount = Object.values(financialReferences).filter((reference) => reference.tax.sourceStatus === "live").length;
        const fxCount = Object.values(financialReferences).filter((reference) => reference.fx.sourceStatus === "live").length;
        toast.success(`Indicadores visibles: ${liveCount}/${countryCodes.length} macro, ${taxCount} impuestos y ${fxCount} FX. WGI sigue cargando en segundo plano.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron actualizar los datos públicos.");
    }
  }

  async function refreshData() {
    if (!candidates.length) { toast.error("Añada primero al menos un país candidato."); return; }
    await refreshCountryData(candidates.map((candidate) => candidate.code), true);
  }

  function buildInput() {
    return {
      companyName: companyName.trim(), homeCountry: homeCountry.trim(), industry: industry.trim(), businessModel: businessModel.trim(), valueProposition: valueProposition.trim(), objective, horizonYears: Number(horizonYears) || 3,
      countryInputs: screenedCandidates.map(({ code, name, calibration }) => ({ code, name, calibration })),
      marketData: Object.fromEntries(screenedCandidates.map((candidate) => [candidate.code, marketData[candidate.code] ?? blankData()])),
      financialByCountry: Object.fromEntries(screenedCandidates.map((candidate) => [candidate.code, financialByCountry[candidate.code] ?? {}])),
      investmentThresholds,
      weights,
    };
  }

  async function runEvaluation() {
    if (!formValid) { toast.error("Complete el perfil de empresa y mantenga al menos un país tras el filtro."); return; }
    try {
      const assessed = await evaluation.mutateAsync(buildInput());
      setResult(assessed as Evaluation);
      setActiveTab("decision");
      toast.success("Análisis estratégico generado. Revise supuestos y alertas antes de decidir.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo generar la evaluación."); }
  }

  async function persistScenario() {
    if (!formValid) { toast.error("No hay un escenario completo que guardar."); return; }
    try {
      const saved = await saveScenario.mutateAsync({ name: scenarioName.trim() || "Análisis sin título", evaluation: buildInput() });
      setResult(saved.result as Evaluation);
      setSavedScenarioId(saved.id);
      scenariosQuery.refetch();
      toast.success("Escenario guardado en el historial personal.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Inicie sesión para guardar el escenario."); }
  }

  async function exportPdfReport() {
    if (!result) { toast.error("Genere primero una evaluación para exportarla."); return; }
    try {
      const { downloadStrategyPdf } = await import("@/lib/strategyReportPdf");
      downloadStrategyPdf({
        scenarioName,
        companyName,
        homeCountry,
        industry,
        businessModel,
        valueProposition,
        objectiveLabel: selectedObjective.label,
        horizonYears,
        generatedAt: result.generatedAt,
        portfolio: result.portfolio,
        thresholds: investmentThresholds,
        countries: result.countries,
      });
      toast.success("Informe PDF detallado generado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el informe PDF.");
    }
  }

  return (
    <DashboardLayout>
      <div className="studio-shell">
        <header className="studio-header">
          <div>
            <div className="eyebrow"><Compass className="h-3.5 w-3.5" /> Global Entry Strategy Studio</div>
            <h1>Diseñe antes de entrar.</h1>
            <p>Un instrumento de juicio estratégico. No un ranking universal de países.</p>
          </div>
          <div className="header-actions">
            <div className="scenario-name"><Label htmlFor="scenario">Escenario</Label><Input id="scenario" value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} /></div>
            <Button variant="outline" onClick={exportPdfReport} disabled={!result}><FileDown className="mr-2 h-4 w-4" /> PDF</Button>
            <Button onClick={persistScenario} disabled={saveScenario.isPending || !formValid}><Save className="mr-2 h-4 w-4" /> Guardar</Button>
          </div>
        </header>

        <div className="strategic-note"><Sparkles className="h-4 w-4" /><span><strong>Principio de uso:</strong> el modelo estructura evidencia y supuestos; no sustituye el caso financiero, la investigación de mercado ni la debida diligencia.</span></div>

        <div className="mt-5"><OnboardingGuide mandateReady={Boolean(companyName.trim() && homeCountry.trim() && industry.trim() && businessModel.trim())} candidateCount={candidates.length} dataReady={candidates.some((candidate) => marketData[candidate.code]?.sourceStatus !== "unavailable")} financialReady={candidates.some((candidate) => financialByCountry[candidate.code]?.tamYearOne !== null && financialByCountry[candidate.code]?.tamYearOne !== undefined)} evaluationReady={Boolean(result)} onNavigate={setActiveTab} /></div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-7">
          <TabsList className="studio-tabs">
            <TabsTrigger value="brief"><Building2 className="mr-2 h-4 w-4" /> 1. Mandato</TabsTrigger>
            <TabsTrigger value="screen"><Globe2 className="mr-2 h-4 w-4" /> 2. Mercados</TabsTrigger>
            <TabsTrigger value="calibrate"><SlidersHorizontal className="mr-2 h-4 w-4" /> 3. Calibración</TabsTrigger>
            <TabsTrigger value="finance"><CircleDollarSign className="mr-2 h-4 w-4" /> 4. Economía</TabsTrigger>
            <TabsTrigger value="compare"><Columns3 className="mr-2 h-4 w-4" /> 5. Comparar</TabsTrigger>
            <TabsTrigger value="decision"><Target className="mr-2 h-4 w-4" /> 6. Decisión</TabsTrigger>
            <TabsTrigger value="approval"><ClipboardCheck className="mr-2 h-4 w-4" /> 7. Gates</TabsTrigger>
          </TabsList>

          <TabsContent value="brief" className="tab-enter">
            <div className="grid gap-6 xl:grid-cols-[1.45fr_.8fr]">
              <Card className="strategic-card"><CardHeader><div className="step-tag">PARTE II · CAPÍTULO 5</div><CardTitle>Defina el mandato antes de puntuar países</CardTitle><CardDescription>El resultado depende de la ambición, la propuesta de valor y las capacidades de la empresa, no solo de la macroeconomía.</CardDescription></CardHeader><CardContent className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2"><Field label="Empresa o proyecto" required><Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Nombre o identificador del caso" /></Field><Field label="País base" required><Input value={homeCountry} onChange={(event) => setHomeCountry(event.target.value)} placeholder="País desde el que se expande" /></Field><Field label="Industria / subindustria" required><Input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="Ej. software B2B, equipamiento médico" /></Field><Field label="Modelo de negocio" required><Input value={businessModel} onChange={(event) => setBusinessModel(event.target.value)} placeholder="Ej. B2B, B2C, SaaS, franquicia" /></Field></div>
                <Field label="Propuesta de valor y ventaja relevante"><Textarea value={valueProposition} onChange={(event) => setValueProposition(event.target.value)} placeholder="¿Qué necesidad resuelve y qué activo, capacidad o posición hace defendible la oferta?" className="min-h-28" /></Field>
                <div className="grid gap-5 md:grid-cols-[1fr_160px]"><Field label="Objetivo principal de entrada" required><Select value={objective} onValueChange={(value) => setObjective(value as Objective)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{objectiveOptions.map((option) => <SelectItem value={option.value} key={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></Field><Field label="Horizonte (años)" required><Input type="number" min="1" max="25" value={horizonYears} onChange={(event) => setHorizonYears(event.target.value)} /></Field></div>
              </CardContent></Card>
              <Card className="framework-card"><CardHeader><div className="step-tag">MARCO DE DECISIÓN</div><CardTitle>Cuatro decisiones conectadas</CardTitle></CardHeader><CardContent className="space-y-5"><FrameworkStep n="01" title="Ambición" text="Definir el papel que debe jugar la geografía en la estrategia global." /><FrameworkStep n="02" title="Atractividad" text="Evaluar mercado, recursos, competencia, distancia, riesgo e incentivos." /><FrameworkStep n="03" title="Entrada" text="Decidir momento, secuencia, control, compromiso y modo de entrada." /><FrameworkStep n="04" title="Ejecución" text="Asegurar encaje, viabilidad financiera y gobernanza de la alternativa." /><div className="objective-box"><Target className="h-5 w-5" /><div><span>Objetivo elegido</span><strong>{selectedObjective.label}</strong><p>{selectedObjective.detail}</p></div></div></CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="screen" className="tab-enter">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
              <Card className="strategic-card"><CardHeader><div className="step-tag">PARTE II · CAPÍTULO 6</div><CardTitle>Construya un universo defendible</CardTitle><CardDescription>Añada los países que quiere explorar. Después aplique filtros transparentes y exclusiones explícitas; el sistema no presupone mercados candidatos.</CardDescription></CardHeader><CardContent className="space-y-6">
                <div className="flex gap-3"><Select value={selectedCode} onValueChange={setSelectedCode}><SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar país del catálogo" /></SelectTrigger><SelectContent>{["Europa", "Américas", "Asia-Pacífico", "Oriente Medio y África"].map((region) => <div key={region}><div className="select-label">{region}</div>{catalog.filter((item) => item[2] === region).map(([code, name]) => <SelectItem key={code} value={code}>{name}</SelectItem>)}</div>)}</SelectContent></Select><Button onClick={addCandidate} disabled={!selectedCode}><Plus className="mr-2 h-4 w-4" /> Añadir</Button></div>
                <div className="candidate-grid">{candidates.length ? candidates.map((candidate) => <button key={candidate.code} className={`candidate-chip ${activeCountry === candidate.code ? "active" : ""} ${!screenedCandidates.some((item) => item.code === candidate.code) ? "excluded" : ""}`} onClick={() => { setActiveCountry(candidate.code); setActiveTab("calibrate"); }}><span className="country-code">{candidate.code}</span><span><strong>{candidate.name}</strong><small>{candidate.region}</small></span><span role="button" aria-label={`Eliminar ${candidate.name}`} onClick={(event) => { event.stopPropagation(); removeCandidate(candidate.code); }}><X className="h-4 w-4" /></span></button>) : <EmptyState icon={MapPinned} title="Aún no hay mercados candidatos" text="Añada un país del catálogo para comenzar. Puede comparar hasta 12 en cada escenario." />}</div>
                <div className="divider" />
                <div><h3 className="section-heading">Reglas de preselección</h3><p className="section-help">Se aplican tras actualizar datos. Un candidato que no pasa la regla se excluye de la evaluación, pero permanece visible para revisión.</p></div>
                <div className="grid gap-4 md:grid-cols-3"><Field label="Población mínima (M)"><Input type="number" min="0" value={popMin} onChange={(event) => setPopMin(event.target.value)} /></Field><Field label="PIB mínimo (US$ B)"><Input type="number" min="0" value={gdpMin} onChange={(event) => setGdpMin(event.target.value)} /></Field><Field label="Crecimiento mínimo (%)"><Input type="number" value={growthMin === "-100" ? "" : growthMin} placeholder="Sin filtro" onChange={(event) => setGrowthMin(event.target.value || "-100")} /></Field></div>
                <Field label="Excluir por código ISO (opcional)"><Input value={excludedCodes} onChange={(event) => setExcludedCodes(event.target.value)} placeholder="Ej. BR, IN" /></Field>
                <div className="screen-summary"><div><span>Candidatos</span><strong>{candidates.length}</strong></div><ChevronRight className="h-4 w-4" /><div><span>Pasan filtro</span><strong>{screenedCandidates.length}</strong></div><Button className="ml-auto" variant="outline" onClick={refreshData} disabled={fetchData.isPending || fetchFinancialData.isPending || !candidates.length}>{fetchData.isPending || fetchFinancialData.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Actualizar mercado y fiscal</Button></div>
              </CardContent></Card>
              <Card className="data-card"><CardHeader><div className="flex items-center justify-between"><div><div className="step-tag">DATOS EXTERNOS</div><CardTitle>Base factual</CardTitle></div><Database className="h-6 w-6 text-sky-700" /></div><CardDescription>Los indicadores macroeconómicos, fiscales y de divisa se actualizan desde fuentes públicas. Los factores estratégicos se califican separadamente para no fingir una precisión inexistente.</CardDescription></CardHeader><CardContent className="space-y-3">{[...(sourcesQuery.data ?? []), ...(financialSourcesQuery.data ?? [])].map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer" className="source-row"><div><strong>{source.name}</strong><p>{source.coverage}</p></div><Badge variant="outline" className={source.status === "Conectado" ? "source-live" : ""}>{source.status}</Badge></a>)}</CardContent></Card>
            </div>
            {candidates.length > 0 && <Card className="metric-card mt-6"><CardHeader><CardTitle>Indicadores actualizados</CardTitle><CardDescription>PIB, crecimiento, IED, impuesto y FX se muestran en primer lugar. WGI se carga después porque la fuente oficial es más pesada; la celda indicará “Cargando” mientras llega.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="metrics-table"><thead><tr><th>Mercado</th><th>Estado</th><th>PIB</th><th>PIB / hab.</th><th>PIB real</th><th>IED neta</th><th>IED / PIB</th><th>WGI</th><th>Año</th></tr></thead><tbody>{candidates.map((candidate) => { const data = marketData[candidate.code] ?? blankData(); const passes = screenedCandidates.some((item) => item.code === candidate.code); const governance = data.governance; const governanceAverage = governance ? [governance.politicalStability, governance.governmentEffectiveness, governance.regulatoryQuality, governance.ruleOfLaw, governance.controlOfCorruption].filter((value): value is number => value !== null).reduce((sum, value, _, all) => sum + value / all.length, 0) : null; const governanceLoading = governanceLoadingCodes.includes(candidate.code); return <tr key={candidate.code} className={!passes ? "muted-row" : ""}><td><strong>{candidate.name}</strong><span>{candidate.code}</span></td><td><StatusBadge status={data.sourceStatus} /></td><td>{formatBillions(data.gdpUsd)}</td><td>{data.gdpPerCapita ? `US$ ${formatNumber(data.gdpPerCapita, { maximumFractionDigits: 0 })}` : "—"}</td><td>{data.gdpGrowth !== null && data.gdpGrowth !== undefined ? `${formatNumber(data.gdpGrowth, { maximumFractionDigits: 1 })}%` : "—"}</td><td>{formatBillions(data.fdiInflowUsd)}</td><td>{data.fdiInflowPctGdp !== null && data.fdiInflowPctGdp !== undefined ? `${formatNumber(data.fdiInflowPctGdp, { maximumFractionDigits: 1 })}%` : "—"}</td><td>{governanceLoading ? <span className="metric-loading"><Loader2 className="h-3 w-3 animate-spin" /> Cargando</span> : governanceAverage === null ? "—" : `${formatNumber(governanceAverage, { maximumFractionDigits: 0 })}/100`}</td><td>{data.sourceYear ?? "—"}</td></tr>; })}</tbody></table></div></CardContent></Card>}
          </TabsContent>

          <TabsContent value="calibrate" className="tab-enter">
            <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
              <Card className="strategic-card"><CardHeader><div className="step-tag">CONTEXTUALICE LA EVIDENCIA</div><CardTitle>Calibre los factores no reducibles a macrodatos</CardTitle><CardDescription>Use una escala de 0 a 100. Los factores de riesgo y distancia se leen como exposición: 100 equivale a la exposición más alta.</CardDescription></CardHeader><CardContent>{candidates.length ? <div className="space-y-3">{candidates.map((candidate) => <button key={candidate.code} onClick={() => setActiveCountry(candidate.code)} className={`country-selector ${activeCandidate?.code === candidate.code ? "selected" : ""}`}><span className="country-code">{candidate.code}</span><span><strong>{candidate.name}</strong><small>{candidate.region}</small></span><ChevronRight className="ml-auto h-4 w-4" /></button>)}</div> : <EmptyState icon={Globe2} title="Primero defina los mercados" text="Añada candidatos en la fase 2 para poder calibrar su atractivo estratégico." />}
                <div className="method-box"><FileCheck2 className="h-5 w-5" /><p><strong>Disciplina analítica:</strong> cada puntuación debe poder justificarse con una fuente, entrevista, prueba de mercado, asesor local o supuesto explícito.</p></div>
              </CardContent></Card>
              <Card className="calibration-card"><CardHeader><div className="flex items-center justify-between"><div><div className="step-tag">PAÍS ACTIVO</div><CardTitle>{activeCandidate ? activeCandidate.name : "Seleccione un país"}</CardTitle></div>{activeCandidate && <Badge className="country-badge">{activeCandidate.code}</Badge>}</div></CardHeader><CardContent>{activeCandidate ? <div className="space-y-8">{["Oportunidad", "Distancia y riesgo", "Entrada"].map((group) => <section key={group}><h3 className="calibration-group">{group}</h3><div className="space-y-5">{calibrationFields.filter((field) => field.group === group).map((field) => <div key={field.key} className="slider-row"><div className="slider-meta"><div><strong>{field.label}</strong><span>{field.help}</span></div><output className={field.reverse ? "risk-output" : ""}>{activeCandidate.calibration[field.key]}</output></div><Slider min={0} max={100} step={5} value={[activeCandidate.calibration[field.key]]} onValueChange={([value]) => updateCalibration(field.key, value)} /></div>)}</div></section>)}</div> : <EmptyState icon={SlidersHorizontal} title="Sin país activo" text="Seleccione un mercado candidato para asignar los supuestos específicos del caso." />}</CardContent></Card>
            </div>
            <Card className="weights-card mt-6"><CardHeader><div className="flex items-center justify-between"><div><div className="step-tag">LÓGICA DE PONDERACIÓN</div><CardTitle>Exprese las prioridades del mandato</CardTitle><CardDescription>Los pesos no son “verdad”; hacen visibles los trade-offs. El motor normaliza los pesos automáticamente.</CardDescription></div><Badge variant="outline">Total: {Object.values(weights).reduce((sum, value) => sum + value, 0)}</Badge></div></CardHeader><CardContent><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{([ ["market", "Mercado"], ["resources", "Recursos"], ["competition", "Competencia"], ["government", "Gobierno"], ["distance", "Encaje CAGE"], ["risk", "Seguridad / riesgo"] ] as [keyof typeof weights, string][]).map(([key, label]) => <div key={key} className="weight-control"><div><span>{label}</span><strong>{weights[key]}%</strong></div><Slider min={0} max={50} step={1} value={[weights[key]]} onValueChange={([value]) => { setWeights((current) => ({ ...current, [key]: value })); setResult(null); }} /></div>)}</div></CardContent></Card>
          </TabsContent>

          <TabsContent value="finance" className="tab-enter">
            <div className="finance-intro"><div><div className="eyebrow"><CircleDollarSign className="h-3.5 w-3.5" /> caso económico y sensibilidad</div><h2>Modele el flujo de caja y sométalo a presión.</h2><p>La actualización pública completa moneda, tipo de cambio e impuesto corporativo; los tres continúan siendo editables. Los escenarios alteran precio/ingreso, margen operativo y FX sin cambiar la tesis base.</p></div><div className="formula-chip">FCF = EBIT − impuestos − Δ capital de trabajo<br />TV = FCFₙ₊₁ / (r − g)</div></div>
            <div className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
              <Card className="strategic-card"><CardHeader><div className="step-tag">MERCADO ACTIVO</div><CardTitle>{activeCandidate?.name ?? "Seleccione un mercado"}</CardTitle><CardDescription>Los supuestos se registran por país. Pulse <strong>Actualizar mercado y fiscal</strong> en la fase 2 para cargar fuentes públicas; no requiere Enter.</CardDescription></CardHeader><CardContent>{candidates.length ? <div className="space-y-2">{candidates.map((candidate) => <button key={candidate.code} onClick={() => setActiveCountry(candidate.code)} className={`country-selector ${activeCandidate?.code === candidate.code ? "selected" : ""}`}><span className="country-code">{candidate.code}</span><span><strong>{candidate.name}</strong><small>{financialByCountry[candidate.code]?.taxReference?.sourceStatus === "live" ? "Impuesto y FX actualizados" : "Complete o actualice los supuestos"}</small></span><ChevronRight className="ml-auto h-4 w-4" /></button>)}</div> : <EmptyState icon={CircleDollarSign} title="Primero añada mercados" text="La estimación TAM/SAM/SOM se configura de forma separada para cada país candidato." />}</CardContent></Card>
              <div className="space-y-6">
                <Card className="financial-card"><CardHeader><div className="step-tag">{activeCandidate ? `SUPUESTOS · ${activeCandidate.code}` : "SUPUESTOS"}</div><CardTitle>Flujo de caja de entrada</CardTitle><CardDescription>El valor terminal se calcula por perpetuidad y exige que la tasa de descuento supere el crecimiento terminal. La edición de impuesto o FX cambia su estado a <strong>manual</strong>; actualizar vuelve a cargar la referencia pública.</CardDescription></CardHeader><CardContent>{activeCandidate ? <div className="space-y-7">
                  <section><h3 className="finance-section-title">Mercado y convención monetaria</h3><div className="mt-4 grid gap-4 md:grid-cols-3"><Field label="Moneda local"><Input value={financialByCountry[activeCandidate.code]?.currency ?? ""} placeholder="MXN" maxLength={10} onChange={(event) => updateFinancial("currency", event.target.value)} /></Field><Field label="Moneda de reporte"><Input value={financialByCountry[activeCandidate.code]?.reportingCurrency ?? ""} placeholder="USD" maxLength={10} onChange={(event) => updateFinancial("reportingCurrency", event.target.value)} /></Field><Field label="FX reporte / local"><Input type="number" min="0" step="0.0001" value={financialByCountry[activeCandidate.code]?.fxRateToReportingCurrency ?? ""} placeholder="Se actualiza desde fuente" onChange={(event) => updateFinancial("fxRateToReportingCurrency", event.target.value)} /></Field></div><FinancialSourceStatus label="Tipo de cambio" source={financialByCountry[activeCandidate.code]?.fxReference} mode={financialByCountry[activeCandidate.code]?.fxRateDataMode} /></section>
                  <section><h3 className="finance-section-title">Tamaño de mercado y flujo libre</h3><div className="mt-4 grid gap-4 md:grid-cols-3"><Field label="TAM año 1"><Input type="number" min="0" value={financialByCountry[activeCandidate.code]?.tamYearOne ?? ""} placeholder="Ej. 50000000" onChange={(event) => updateFinancial("tamYearOne", event.target.value)} /></Field><Field label="Crecimiento anual (%)"><Input type="number" value={financialByCountry[activeCandidate.code]?.annualMarketGrowthPct ?? ""} placeholder="Ej. 6" onChange={(event) => updateFinancial("annualMarketGrowthPct", event.target.value)} /></Field><Field label="SAM (% TAM)"><Input type="number" min="0" max="100" value={financialByCountry[activeCandidate.code]?.samPct ?? ""} placeholder="Ej. 30" onChange={(event) => updateFinancial("samPct", event.target.value)} /></Field><Field label="SOM año 1 (% SAM)"><Input type="number" min="0" max="100" value={financialByCountry[activeCandidate.code]?.somPctYearOne ?? ""} placeholder="Ej. 1" onChange={(event) => updateFinancial("somPctYearOne", event.target.value)} /></Field><Field label={`SOM año ${horizonYears} (% SAM)`}><Input type="number" min="0" max="100" value={financialByCountry[activeCandidate.code]?.somPctHorizon ?? ""} placeholder="Ej. 4" onChange={(event) => updateFinancial("somPctHorizon", event.target.value)} /></Field><Field label="Margen operativo (%)"><Input type="number" value={financialByCountry[activeCandidate.code]?.operatingMarginPct ?? ""} placeholder="Ej. 18" onChange={(event) => updateFinancial("operatingMarginPct", event.target.value)} /></Field><Field label="Tasa fiscal (%)"><Input type="number" min="0" max="100" value={financialByCountry[activeCandidate.code]?.taxRatePct ?? ""} placeholder="Se actualiza desde fuente" onChange={(event) => updateFinancial("taxRatePct", event.target.value)} /></Field><Field label="Capital de trabajo (% ingresos)"><Input type="number" value={financialByCountry[activeCandidate.code]?.workingCapitalPctRevenue ?? ""} placeholder="Ej. 12" onChange={(event) => updateFinancial("workingCapitalPctRevenue", event.target.value)} /></Field><Field label="Tasa de descuento (%)"><Input type="number" min="0" value={financialByCountry[activeCandidate.code]?.discountRatePct ?? ""} placeholder="Ej. 10" onChange={(event) => updateFinancial("discountRatePct", event.target.value)} /></Field><Field label="Crecimiento terminal (%)"><Input type="number" value={financialByCountry[activeCandidate.code]?.terminalGrowthPct ?? ""} placeholder="Ej. 2" onChange={(event) => updateFinancial("terminalGrowthPct", event.target.value)} /></Field></div><FinancialSourceStatus label="Impuesto corporativo" source={financialByCountry[activeCandidate.code]?.taxReference} mode={financialByCountry[activeCandidate.code]?.taxRateDataMode} /></section>
                  <section className="scenario-section"><div className="scenario-heading"><div><h3 className="finance-section-title">Sensibilidad por escenarios</h3><p className="section-help">Base mantiene sus supuestos actuales. En los escenarios optimista y conservador, exprese precio/ingreso y FX como variación porcentual; el margen es una variación en puntos porcentuales.</p></div><Badge variant="outline">Hipotético</Badge></div><div className="scenario-input-grid"><ScenarioInputCard label="Base" tone="base" values={{ priceRevenuePct: 0, operatingMarginPctPoints: 0, fxRatePct: 0 }} readOnly /><ScenarioInputCard label="Optimista" tone="optimistic" values={financialByCountry[activeCandidate.code]?.sensitivityScenarios?.optimistic} onChange={(key, value) => updateSensitivity("optimistic", key, value)} /><ScenarioInputCard label="Conservador" tone="conservative" values={financialByCountry[activeCandidate.code]?.sensitivityScenarios?.conservative} onChange={(key, value) => updateSensitivity("conservative", key, value)} /></div></section>
                  <section><div className="flex items-end justify-between gap-4"><div><h3 className="finance-section-title">Economía por alternativa de entrada</h3><p className="section-help">La inversión inicial se registra en t=0. El coste anual, la captura de ingresos y el capital de trabajo alimentan los flujos libres después de impuestos.</p></div><Badge variant="outline">{horizonYears} años</Badge></div><div className="overflow-x-auto mt-4"><table className="finance-input-table"><thead><tr><th>Modo</th><th>Compromiso</th><th>Inversión inicial</th><th>Coste anual</th><th>Captura de ingresos (%)</th></tr></thead><tbody>{financeModes.map((mode) => <tr key={mode.key}><td><strong>{mode.label}</strong></td><td><Badge variant="outline">{mode.commitment}</Badge></td><td><Input type="number" min="0" value={financialByCountry[activeCandidate.code]?.modeProfiles?.[mode.key]?.initialInvestment ?? ""} onChange={(event) => updateModeFinancial(mode.key, "initialInvestment", event.target.value)} placeholder="0" /></td><td><Input type="number" min="0" value={financialByCountry[activeCandidate.code]?.modeProfiles?.[mode.key]?.annualOperatingCost ?? ""} onChange={(event) => updateModeFinancial(mode.key, "annualOperatingCost", event.target.value)} placeholder="0" /></td><td><Input type="number" min="0" max="100" value={financialByCountry[activeCandidate.code]?.modeProfiles?.[mode.key]?.revenueCapturePct ?? ""} onChange={(event) => updateModeFinancial(mode.key, "revenueCapturePct", event.target.value)} placeholder="100" /></td></tr>)}</tbody></table></div></section>
                  <div className="finance-note"><CircleAlert className="h-4 w-4" /><p><strong>Convención:</strong> ROI = (flujo libre acumulado − inversión inicial) / inversión inicial y excluye el valor terminal. NPV incluye flujos libres descontados y valor terminal. No se incorporan financiación, depreciación, amortización, retenciones ni cambios fiscales futuros; añádalos en un modelo corporativo si son materiales.</p></div></div> : <EmptyState icon={CircleDollarSign} title="Sin país activo" text="Seleccione un mercado en la columna izquierda para introducir el caso económico." />}</CardContent></Card>
                <Card className="threshold-card"><CardHeader><div className="step-tag">GOBIERNO DE INVERSIÓN</div><CardTitle>Umbrales de decisión</CardTitle><CardDescription>Estas reglas determinan si una alternativa se clasifica como <strong>Avanzar</strong>, <strong>Probar</strong> o <strong>Descartar</strong>. Una recomendación solo se genera con evidencia financiera completa y moneda consistente.</CardDescription></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-3"><Field label="Moneda de umbrales"><Input value={investmentThresholds.currency ?? ""} placeholder="Igual a moneda de reporte" maxLength={10} onChange={(event) => updateThreshold("currency", event.target.value)} /></Field><Field label="Riesgo ajustado · avanzar"><Input type="number" min="0" max="100" value={investmentThresholds.advanceMinRiskAdjusted ?? ""} onChange={(event) => updateThreshold("advanceMinRiskAdjusted", event.target.value)} /></Field><Field label="Riesgo ajustado · probar"><Input type="number" min="0" max="100" value={investmentThresholds.testMinRiskAdjusted ?? ""} onChange={(event) => updateThreshold("testMinRiskAdjusted", event.target.value)} /></Field><Field label="Confianza mínima (%)"><Input type="number" min="0" max="100" value={investmentThresholds.minConfidence ?? ""} onChange={(event) => updateThreshold("minConfidence", event.target.value)} /></Field><Field label="NPV mínimo · avanzar"><Input type="number" value={investmentThresholds.advanceMinNpv ?? ""} onChange={(event) => updateThreshold("advanceMinNpv", event.target.value)} /></Field><Field label="NPV mínimo · probar"><Input type="number" value={investmentThresholds.testMinNpv ?? ""} onChange={(event) => updateThreshold("testMinNpv", event.target.value)} /></Field><Field label="ROI mínimo · avanzar (%)"><Input type="number" value={investmentThresholds.advanceMinRoiPct ?? ""} onChange={(event) => updateThreshold("advanceMinRoiPct", event.target.value)} /></Field><Field label="ROI mínimo · probar (%)"><Input type="number" value={investmentThresholds.testMinRoiPct ?? ""} onChange={(event) => updateThreshold("testMinRoiPct", event.target.value)} /></Field><Field label="Recuperación máx. · avanzar (años)"><Input type="number" min="1" value={investmentThresholds.advanceMaxPaybackYears ?? ""} onChange={(event) => updateThreshold("advanceMaxPaybackYears", event.target.value)} /></Field><Field label="Inversión máx. · prueba"><Input type="number" min="0" value={investmentThresholds.testMaxInitialInvestment ?? ""} placeholder="Sin límite" onChange={(event) => updateThreshold("testMaxInitialInvestment", event.target.value)} /></Field></div><div className="threshold-rule"><ShieldCheck className="h-4 w-4" /><p><strong>Regla:</strong> “Avanzar” requiere superar todos los umbrales de avance. “Probar” exige superar los mínimos de prueba y permite una entrada reversible. “Descartar” significa no asignar inversión material con la evidencia actual. El límite de inversión para prueba es opcional.</p></div></CardContent></Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compare" className="tab-enter">
            <div className="comparison-header"><div><div className="eyebrow"><Columns3 className="h-3.5 w-3.5" /> comparación de predecisión</div><h2>Vea los mercados bajo la misma lente.</h2><p>Seleccione hasta cuatro países. La vista compara evidencia, supuestos y resultados, sin ocultar los datos ausentes.</p></div>{result && <Button onClick={() => setActiveTab("decision")}><Target className="mr-2 h-4 w-4" /> Ir a decisión</Button>}</div>
            <Card className="comparison-picker"><CardContent><div className="comparison-picks">{candidates.map((candidate) => <button key={candidate.code} onClick={() => toggleComparison(candidate.code)} className={`compare-pick ${comparisonCodes.includes(candidate.code) ? "chosen" : ""}`}><span className="country-code">{candidate.code}</span><span>{candidate.name}</span>{comparisonCodes.includes(candidate.code) && <CheckCircle2 className="ml-auto h-4 w-4" />}</button>)}</div></CardContent></Card>
            {!comparisonCodes.length ? <EmptyState icon={Columns3} title="Seleccione mercados para comparar" text="Elija entre dos y cuatro países para crear una vista lado a lado antes de avanzar a la decisión." /> : <CountryComparison countries={comparisonCodes.map((code) => ({ candidate: candidates.find((candidate) => candidate.code === code)!, data: marketData[code] ?? blankData(), result: result?.countries.find((country) => country.code === code) }))} />}
          </TabsContent>

          <TabsContent value="decision" className="tab-enter">
            {!result ? <div className="decision-empty"><div className="decision-empty-icon"><Target className="h-8 w-8" /></div><h2>La decisión debe seguir a la evidencia.</h2><p>Cuando haya completado el mandato, los mercados y la calibración, genere una lectura comparativa de atractivo, riesgo, timing y modos de entrada.</p><Button size="lg" onClick={runEvaluation} disabled={evaluation.isPending || !formValid}>{evaluation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />} Generar evaluación</Button><span className="validity-note">{formValid ? `${screenedCandidates.length} mercados listos para analizar` : "Faltan datos del mandato o mercados que pasen el filtro"}</span></div> : <div className="space-y-6"><section className="decision-hero"><div><div className="eyebrow"><CheckCircle2 className="h-3.5 w-3.5" /> lectura ajustada por riesgo</div><h2>{result.portfolio.leadingCountry ?? "Comparación completada"}</h2><p>{result.portfolio.recommendation}</p></div><div className="hero-score"><span>Puntuación líder</span><strong>{result.countries[0]?.scores.riskAdjusted ?? "—"}<small>/100</small></strong><Button variant="outline" onClick={runEvaluation} disabled={evaluation.isPending}><RefreshCw className="mr-2 h-4 w-4" /> Recalcular</Button></div></section>
              <div className="grid gap-6 xl:grid-cols-[1.32fr_.68fr]"><Card className="ranking-card"><CardHeader><CardTitle>Prioridad de mercado</CardTitle><CardDescription>Orden basada en la combinación explícita de atractividad y seguridad. La confianza muestra cuánta información está disponible, no la probabilidad de éxito.</CardDescription></CardHeader><CardContent className="space-y-4">{result.countries.map((country, index) => <div className="ranking-row" key={country.code}><div className="rank-index">{index + 1}</div><div className="rank-country"><strong>{country.name}</strong><span>{country.timing.label}</span></div><div className="score-bar"><div><span>Atractividad {country.scores.attractiveness}</span><span>Seguridad {country.scores.safety}</span></div><div className="bar-track"><div className="bar-fill attractiveness" style={{ width: `${country.scores.attractiveness}%` }} /><div className="bar-marker" style={{ left: `${country.scores.safety}%` }} /></div></div><div className={`score-pill ${scoreStyle(country.scores.riskAdjusted)}`}>{country.scores.riskAdjusted}</div></div>)}</CardContent></Card><Card className="readout-card"><CardHeader><CardTitle>Cómo leer el resultado</CardTitle></CardHeader><CardContent><Readout icon={Target} title="Atractividad" text="Mercado, recursos, competencia, gobierno y encaje CAGE." /><Readout icon={ShieldCheck} title="Seguridad" text="Inverso de la exposición política, económica, competitiva y operativa." /><Readout icon={FileCheck2} title="Confianza" text="Cobertura de datos públicos y explicitud de los supuestos introducidos." /></CardContent></Card></div>
              <Card className="recommendations-card"><CardHeader><div><CardTitle>Ruta recomendada por mercado</CardTitle><CardDescription>El modo no se determina solo por puntuación. Cruza atractivo, riesgo, capacidades internas, urgencia, control, IP y apertura regulatoria.</CardDescription></div><Button variant="outline" onClick={exportPdfReport}><FileDown className="mr-2 h-4 w-4" /> PDF detallado</Button></CardHeader><CardContent><div className="recommendation-grid">{result.countries.map((country) => <article className="country-recommendation" key={country.code}><div className="recommendation-top"><div><span className="country-code">{country.code}</span><h3>{country.name}</h3></div><div className={`score-pill ${scoreStyle(country.scores.riskAdjusted)}`}>{country.scores.riskAdjusted}</div></div><div className="timing-box"><ArrowUpRight className="h-4 w-4" /><div><strong>{country.timing.label}</strong><p>{country.timing.description}</p></div></div><div className="mode-list">{country.entryModes.map((mode, idx) => <div className="mode-row" key={mode.mode}><span>{idx + 1}</span><div><strong>{mode.mode}</strong><p>{mode.rationale}</p></div><Badge variant="outline">{mode.commitment}</Badge></div>)}</div><div className={`investment-decision ${decisionStyle(country.investmentRecommendation.action)}`}><div><span>Decisión por umbrales</span><strong>{country.investmentRecommendation.label}</strong></div><p>{country.investmentRecommendation.summary}</p></div><div className="financial-readout"><div className="financial-readout-head"><span>Viabilidad económica</span>{country.financial.status === "ok" ? <Badge className="source-live">Flujo de caja completo</Badge> : <Badge variant="outline">Supuestos pendientes</Badge>}</div>{country.financial.status === "ok" && <div className="financial-market-summary"><span>TAM horizonte <b>{formatMoney(country.financial.market.tamAtHorizon, country.financial.currency)}</b></span><span>SOM ingresos <b>{formatMoney(country.financial.market.somRevenueAtHorizon, country.financial.currency)}</b></span></div>}{country.financial.alternatives.map((alternative) => <div className="financial-alternative" key={alternative.key}><strong>{alternative.mode}</strong>{alternative.status === "ok" ? <div><span>ROI <b>{formatNumber(alternative.roiPct, { maximumFractionDigits: 1 })}%</b></span><span>NPV <b>{formatMoney(alternative.npv, country.financial.currency)}</b></span><span>TV <b>{formatMoney(alternative.presentValueTerminal, country.financial.currency)}</b></span>{alternative.paybackYear && <span>Recup. <b>Año {alternative.paybackYear}</b></span>}</div> : <p>Faltan: {alternative.missingInputs.slice(0, 2).join(", ")}.</p>}</div>)}</div><ScenarioOutcome country={country} />{country.flags.length > 0 && <div className="flag-list">{country.flags.map((flag) => <p key={flag}><AlertTriangle className="h-3.5 w-3.5" /> {flag}</p>)}</div>}<div className="confidence-row"><span>Confianza de evidencia</span><Progress value={country.scores.confidence} /><strong>{country.scores.confidence}%</strong></div></article>)}</div></CardContent></Card>
              <section className="caveat-callout"><CircleAlert className="h-5 w-5" /><div><strong>Condición de decisión</strong><p>{result.portfolio.caveats[0]} Antes de invertir, convierta la alternativa preferida en un caso financiero con escenarios, sensibilidad, ROI/NPV y una revisión legal, regulatoria y de socios.</p></div></section>
            </div>}
          </TabsContent>

          <TabsContent value="approval" className="tab-enter">
            <ApprovalWorkspace scenarioId={savedScenarioId} countries={result?.countries ?? []} />
          </TabsContent>
        </Tabs>

        <section className="history-strip"><div><div className="step-tag">HISTORIAL</div><h2>Escenarios guardados</h2></div><div className="history-list">{!isAuthenticated ? <span>Inicie sesión para conservar análisis.</span> : scenariosQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : scenariosQuery.data?.length ? scenariosQuery.data.slice(0, 4).map((scenario) => <div className="history-item" key={scenario.id}><div><strong>{scenario.name}</strong><span>{scenario.companyName} · {scenario.industry}</span></div><Badge variant="outline">{scenario.objective}</Badge></div>) : <span>Los análisis guardados aparecerán aquí.</span>}</div></section>
      </div>
    </DashboardLayout>
  );
}

function CountryComparison({ countries }: { countries: { candidate: Candidate; data: MarketData; result?: CountryResult }[] }) {
  return <div className="comparison-board" style={{ gridTemplateColumns: `repeat(${Math.min(countries.length, 4)}, minmax(260px, 1fr))` }}>{countries.map(({ candidate, data, result }) => {
    const governance = data.governance;
    const governanceValues = governance ? [governance.politicalStability, governance.governmentEffectiveness, governance.regulatoryQuality, governance.ruleOfLaw, governance.controlOfCorruption].filter((value): value is number => value !== null) : [];
    const governanceAverage = governanceValues.length ? governanceValues.reduce((sum, value) => sum + value, 0) / governanceValues.length : null;
    const bestAlternative = result?.financial.alternatives.filter((alternative) => alternative.status === "ok").sort((a, b) => (b.npv ?? -Infinity) - (a.npv ?? -Infinity))[0];
    return <article key={candidate.code} className="comparison-country"><header><span className="country-code">{candidate.code}</span><div><h3>{candidate.name}</h3><p>{candidate.region}</p></div>{result && <div className={`score-pill ${scoreStyle(result.scores.riskAdjusted)}`}>{result.scores.riskAdjusted}</div>}</header><ComparisonMetric label="PIB" value={formatBillions(data.gdpUsd)} /><ComparisonMetric label="Crecimiento PIB" value={data.gdpGrowth === null || data.gdpGrowth === undefined ? "—" : `${formatNumber(data.gdpGrowth, { maximumFractionDigits: 1 })}%`} /><ComparisonMetric label="IED neta (UNCTAD)" value={formatBillions(data.fdiInflowUsd)} /><ComparisonMetric label="Gobernanza WGI" value={governanceAverage === null ? "—" : `${formatNumber(governanceAverage, { maximumFractionDigits: 0 })}/100`} /><ComparisonMetric label="Decisión" value={result ? result.investmentRecommendation.label : "Genere evaluación"} /><ComparisonMetric label="Atractividad" value={result ? `${result.scores.attractiveness}/100` : "Genere evaluación"} tone={result ? scoreTone(result.scores.attractiveness) : undefined} /><ComparisonMetric label="Seguridad" value={result ? `${result.scores.safety}/100` : "Genere evaluación"} tone={result ? scoreTone(result.scores.safety) : undefined} /><ComparisonMetric label="TAM en horizonte" value={result ? formatMoney(result.financial.market.tamAtHorizon, result.financial.currency) : "Genere evaluación"} /><ComparisonMetric label="SOM · ingresos horizonte" value={result ? formatMoney(result.financial.market.somRevenueAtHorizon, result.financial.currency) : "Genere evaluación"} /><div className="comparison-mode"><span>Alternativa económica líder</span>{bestAlternative ? <><strong>{bestAlternative.mode}</strong><div><b>ROI {formatNumber(bestAlternative.roiPct, { maximumFractionDigits: 1 })}%</b><b>NPV {formatMoney(bestAlternative.npv, result?.financial.currency)}</b></div></> : <p>{result ? "Complete los supuestos financieros de una alternativa." : "Genere evaluación."}</p>}</div>{result && <ScenarioOutcome country={result} compact />}{result?.flags.length ? <div className="comparison-flags">{result.flags.slice(0, 2).map((flag) => <p key={flag}><AlertTriangle className="h-3.5 w-3.5" /> {flag}</p>)}</div> : null}</article>;
  })}</div>;
}

function ScenarioOutcome({ country, compact = false }: { country: CountryResult; compact?: boolean }) {
  const selectedKey = country.investmentRecommendation.selectedModeKey;
  const scenarios = country.financial.scenarios.map((scenario) => ({
    ...scenario,
    alternative: scenario.financial?.alternatives.find((alternative) => alternative.key === selectedKey) ?? scenario.financial?.alternatives.find((alternative) => alternative.status === "ok"),
  }));
  return <div className={`scenario-outcome ${compact ? "compact" : ""}`}><div className="scenario-outcome-heading"><span>{compact ? "Sensibilidad" : "Sensibilidad de la alternativa seleccionada"}</span>{!compact && <small>Base / optimista / conservador</small>}</div><div className="scenario-outcome-grid">{scenarios.map((scenario) => <div className={`scenario-outcome-row ${scenario.key} ${scenario.status !== "ok" ? "incomplete" : ""}`} key={scenario.key}><strong>{scenario.label}</strong>{scenario.alternative ? <><span>NPV <b>{formatMoney(scenario.alternative.npv, scenario.financial?.currency)}</b></span><span>ROI <b>{formatNumber(scenario.alternative.roiPct, { maximumFractionDigits: 1 })}%</b></span></> : <small>{scenario.status === "insufficient_data" ? "Complete sensibilidades" : "No significativo"}</small>}</div>)}</div></div>;
}

function ComparisonMetric({ label, value, tone }: { label: string; value: string; tone?: string }) { return <div className="comparison-metric"><span>{label}</span><strong>{value}</strong>{tone && <i className={tone} />}</div>; }
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <div className="field"><Label>{label}{required && <span className="required">*</span>}</Label>{children}</div>; }
function FrameworkStep({ n, title, text }: { n: string; title: string; text: string }) { return <div className="framework-step"><span>{n}</span><div><strong>{title}</strong><p>{text}</p></div></div>; }
function EmptyState({ icon: Icon, title, text }: { icon: typeof Globe2; title: string; text: string }) { return <div className="empty-state"><Icon className="h-6 w-6" /><strong>{title}</strong><p>{text}</p></div>; }
function StatusBadge({ status }: { status: Status }) { const config = status === "live" ? ["Completo", "status-live"] : status === "partial" ? ["Parcial", "status-partial"] : ["Sin datos", "status-empty"]; return <Badge variant="outline" className={config[1]}>{config[0]}</Badge>; }
function Readout({ icon: Icon, title, text }: { icon: typeof Target; title: string; text: string }) { return <div className="readout"><Icon className="h-4 w-4" /><div><strong>{title}</strong><p>{text}</p></div></div>; }
function FinancialSourceStatus({ label, source, mode }: { label: string; source?: Provenance | null; mode?: "public" | "manual" }) {
  if (!source) return <div className="financial-source-status"><Badge variant="outline" className="status-empty">Sin fuente</Badge><span>{label}: pulse <strong>Actualizar mercado y fiscal</strong> en la fase 2 o introduzca un valor manual.</span></div>;
  const config = source.sourceStatus === "live" ? "status-live" : source.sourceStatus === "partial" ? "status-partial" : "status-empty";
  return <div className="financial-source-status"><Badge variant="outline" className={mode === "manual" ? "status-partial" : config}>{mode === "manual" ? "Manual" : source.sourceStatus === "live" ? "Público" : "No disponible"}</Badge><span><strong>{label}:</strong> <a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.sourceName}</a>{source.sourceYear ? ` · ${source.sourceYear}` : ""}{source.observedAt ? ` · observado ${source.observedAt}` : ""}. {source.note}</span></div>;
}
function ScenarioInputCard({ label, tone, values, readOnly, onChange }: { label: string; tone: "base" | "optimistic" | "conservative"; values?: Sensitivity; readOnly?: boolean; onChange?: (key: keyof Sensitivity, value: string) => void }) {
  const fields: { key: keyof Sensitivity; label: string; suffix: string }[] = [{ key: "priceRevenuePct", label: "Precio / ingreso", suffix: "%" }, { key: "operatingMarginPctPoints", label: "Margen operativo", suffix: "p.p." }, { key: "fxRatePct", label: "FX", suffix: "%" }];
  return <div className={`scenario-input-card ${tone}`}><div className="scenario-card-heading"><strong>{label}</strong><span>{readOnly ? "Sin variación" : tone === "optimistic" ? "Mejora hipotética" : "Tensión hipotética"}</span></div>{fields.map((field) => <label key={field.key}><span>{field.label} <small>{field.suffix}</small></span><Input type="number" value={values?.[field.key] ?? ""} placeholder={readOnly ? "0" : "Introduzca"} readOnly={readOnly} onChange={(event) => onChange?.(field.key, event.target.value)} /></label>)}</div>;
}
