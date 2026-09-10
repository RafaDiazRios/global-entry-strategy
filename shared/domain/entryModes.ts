/**
 * Catálogo de modos de entrada y su perfil según la Tabla 7.4 del libro.
 *
 * Philippe Lasserre y Felipe Monteiro, *Global Strategic Management*, 5.ª ed.
 * (Bloomsbury Academic, 2023), «Comparing various entry modes», Tabla 7.4, p. 271.
 *
 * La tabla del libro describe **características** de cada modo (inversión inicial alta,
 * entrada lenta, fuga tecnológica baja...), no su conveniencia. La conveniencia se
 * calcula en `server/strategy/entryModeScoring.ts` cruzando estas características con
 * las necesidades y restricciones del caso.
 *
 * Escala de conversión de las etiquetas del libro:
 *   Nil = 5 · Low = 25 · Low/Medium = 40 · Medium = 55 · Medium/High = 70 · High = 85 · Quick = 85 · Slow = 20
 */

export type EntryModeKey =
  | "greenfield"
  | "acquisition"
  | "alliance"
  | "licensing"
  | "distributor"
  | "office"
  | "digital";

/** Modelo económico que aplica a cada modo. Determina cómo se construye el flujo de caja. */
export type EconomicModel = "operator" | "royalty" | "channel" | "cost_only";

export type EntryModeCriterionKey =
  | "upFrontInvestment"
  | "speedOfEntry"
  | "marketPenetration"
  | "marketControl"
  | "politicalRiskExposure"
  | "technologicalLeakage"
  | "managerialComplexity"
  | "financialReturnPotential";

export type EntryModeProfile = Record<EntryModeCriterionKey, number>;

export type EntryModeDefinition = {
  key: EntryModeKey;
  /** Etiqueta mostrada en la interfaz y en el informe. */
  label: string;
  commitment: "Bajo" | "Medio" | "Alto";
  economicModel: EconomicModel;
  /** Perfil de la Tabla 7.4, p. 271. */
  profile: EntryModeProfile;
  rationale: string;
  /** Procedencia del perfil: literal del libro o derivado. */
  provenance: string;
};

export const entryModeCriteria: {
  key: EntryModeCriterionKey;
  label: string;
  /** Cómo se interpreta el valor del perfil: qué significa un valor alto. */
  highMeans: string;
  defaultWeight: number;
}[] = [
  { key: "upFrontInvestment", label: "Inversión inicial", highMeans: "Exige mucho capital y dedicación directiva por adelantado", defaultWeight: 15 },
  { key: "speedOfEntry", label: "Velocidad de entrada", highMeans: "Permite estar operando pronto", defaultWeight: 12 },
  { key: "marketPenetration", label: "Penetración de mercado", highMeans: "Alcanza cuota y cobertura altas", defaultWeight: 15 },
  { key: "marketControl", label: "Control del mercado", highMeans: "Conserva el conocimiento y la relación con el cliente", defaultWeight: 13 },
  { key: "politicalRiskExposure", label: "Exposición a riesgo político", highMeans: "Deja mucho capital expuesto a decisiones políticas", defaultWeight: 15 },
  { key: "technologicalLeakage", label: "Fuga tecnológica", highMeans: "Alto riesgo de apropiación de tecnología o conocimiento", defaultWeight: 12 },
  { key: "managerialComplexity", label: "Complejidad de gestión", highMeans: "Exige capacidad directiva y coordinación intensas", defaultWeight: 8 },
  { key: "financialReturnPotential", label: "Retorno potencial", highMeans: "Mayor valor absoluto capturable", defaultWeight: 10 },
];

export const entryModes: readonly EntryModeDefinition[] = [
  {
    key: "greenfield",
    label: "Filial propia / greenfield",
    commitment: "Alto",
    economicModel: "operator",
    profile: { upFrontInvestment: 85, speedOfEntry: 20, marketPenetration: 55, marketControl: 85, politicalRiskExposure: 85, technologicalLeakage: 25, managerialComplexity: 85, financialReturnPotential: 80 },
    rationale: "Máximo control y captura de valor, con la máxima movilización de recursos y exposición. La presencia tarda en construirse, así que solo se sostiene en un horizonte largo y con riesgo país limitado.",
    provenance: "Tabla 7.4, p. 271 (columna «Wholly owned»)",
  },
  {
    key: "acquisition",
    label: "Adquisición",
    commitment: "Alto",
    economicModel: "operator",
    profile: { upFrontInvestment: 85, speedOfEntry: 85, marketPenetration: 85, marketControl: 85, politicalRiskExposure: 85, technologicalLeakage: 25, managerialComplexity: 85, financialReturnPotential: 80 },
    rationale: "Disponibilidad inmediata de recursos, activos y competencias, y única vía real cuando la ventana competitiva ya se ha cerrado. Exige capacidad de integración intercultural y absorber una prima de adquisición.",
    provenance: "Tabla 7.4, p. 271 (columna «Acquisition»)",
  },
  {
    key: "alliance",
    label: "Joint venture o alianza",
    commitment: "Medio",
    economicModel: "operator",
    profile: { upFrontInvestment: 55, speedOfEntry: 85, marketPenetration: 70, marketControl: 55, politicalRiskExposure: 55, technologicalLeakage: 70, managerialComplexity: 85, financialReturnPotential: 70 },
    rationale: "Comparte riesgo y aporta legitimidad y acceso local. Su valor teórico se ve lastrado con frecuencia por una mala implementación: exige análisis de encaje del socio y gobierno explícito.",
    provenance: "Tabla 7.4, p. 271 (columna «Joint venture»)",
  },
  {
    key: "licensing",
    label: "Licencia o franquicia",
    commitment: "Bajo",
    economicModel: "royalty",
    profile: { upFrontInvestment: 25, speedOfEntry: 55, marketPenetration: 40, marketControl: 5, politicalRiskExposure: 25, technologicalLeakage: 85, managerialComplexity: 25, financialReturnPotential: 55 },
    rationale: "Muy rentable en términos de retorno sobre una inversión mínima, pero de valor absoluto pequeño. El licenciatario puede apropiarse de la tecnología y convertirse en competidor.",
    provenance: "Tabla 7.4, p. 271 (columna «Licensing»); retorno = «Low risk; High return; Low payout»",
  },
  {
    key: "distributor",
    label: "Agente o distribuidor",
    commitment: "Bajo",
    economicModel: "channel",
    profile: { upFrontInvestment: 25, speedOfEntry: 70, marketPenetration: 40, marketControl: 15, politicalRiskExposure: 25, technologicalLeakage: 25, managerialComplexity: 25, financialReturnPotential: 45 },
    rationale: "Vía económica de probar demanda y cobertura. Genera conflicto de interés cuando las ventas superan el punto en que la comisión excede el coste fijo de una filial propia.",
    provenance: "Tabla 7.4, p. 271 (columna «Agent-distributor»)",
  },
  {
    key: "office",
    label: "Oficina de representación / observatorio",
    commitment: "Bajo",
    economicModel: "cost_only",
    profile: { upFrontInvestment: 40, speedOfEntry: 20, marketPenetration: 25, marketControl: 25, politicalRiskExposure: 25, technologicalLeakage: 25, managerialComplexity: 55, financialReturnPotential: 30 },
    rationale: "Cabeza de puente frugal para recoger información, construir contactos y preparar una entrada mayor. No genera ingresos por sí misma: su valor es el de la opción que abre.",
    provenance: "Tabla 7.4, p. 271 (columna «Representative office»)",
  },
  {
    key: "digital",
    label: "Entrada digital o híbrida",
    commitment: "Bajo",
    economicModel: "operator",
    profile: { upFrontInvestment: 40, speedOfEntry: 85, marketPenetration: 55, marketControl: 70, politicalRiskExposure: 25, technologicalLeakage: 55, managerialComplexity: 55, financialReturnPotential: 70 },
    rationale: "Adecuada cuando la entrega es puramente digital o híbrida. Requiere validar regulación, localización, pagos y datos, y a menudo una capa física o de socios locales.",
    provenance: "Derivado por analogía de la Tabla 7.5, p. 272 («Three models of entry»); no figura como columna en la Tabla 7.4",
  },
] as const;

const modeByKey = new Map(entryModes.map((mode) => [mode.key, mode]));

export function entryMode(key: EntryModeKey): EntryModeDefinition {
  const found = modeByKey.get(key);
  if (!found) throw new Error(`Modo de entrada desconocido: ${key}`);
  return found;
}

export const entryModeKeys = entryModes.map((mode) => mode.key);

/** Modelo de entrega de la oferta en el país de destino. Tabla 7.5, p. 272. */
export type EntryDeliveryModel = "relational" | "digital" | "hybrid";

export const entryDeliveryModels: { value: EntryDeliveryModel; label: string; detail: string }[] = [
  { value: "relational", label: "Relacional", detail: "Contratos con entidades locales: distribuidores, socios, logística, personal e inversión productiva." },
  { value: "digital", label: "Digital", detail: "Infraestructura de internet propia: entrega puramente digital, descarga o cloud." },
  { value: "hybrid", label: "Híbrido", detail: "Plataformas B2B y B2C con presencia física, personal local, alianzas y socios locales." },
];
