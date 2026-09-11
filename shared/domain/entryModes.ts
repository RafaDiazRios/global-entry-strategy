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
 *
 * Bilingüe: cada etiqueta lleva su par `{ es, en }` junto a la definición del modo.
 */

import { loc, type Localized } from "../i18n";

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

/** Nivel de compromiso como identificador; la etiqueta vive en `commitmentLevels`. */
export type CommitmentLevel = "low" | "medium" | "high";

export const commitmentLevels: { id: CommitmentLevel; label: Localized }[] = [
  { id: "low", label: loc("Bajo", "Low") },
  { id: "medium", label: loc("Medio", "Medium") },
  { id: "high", label: loc("Alto", "High") },
];

export function commitmentLabel(id: CommitmentLevel): Localized {
  return commitmentLevels.find((level) => level.id === id)?.label ?? loc(id, id);
}

export type EntryModeDefinition = {
  key: EntryModeKey;
  /** Etiqueta mostrada en la interfaz y en el informe. */
  label: Localized;
  commitment: CommitmentLevel;
  economicModel: EconomicModel;
  /** Perfil de la Tabla 7.4, p. 271. */
  profile: EntryModeProfile;
  rationale: Localized;
  /** Procedencia del perfil: literal del libro o derivado. */
  provenance: Localized;
};

export const entryModeCriteria: {
  key: EntryModeCriterionKey;
  label: Localized;
  /** Cómo se interpreta el valor del perfil: qué significa un valor alto. */
  highMeans: Localized;
  defaultWeight: number;
}[] = [
  { key: "upFrontInvestment", label: loc("Inversión inicial", "Up-front investment"), highMeans: loc("Exige mucho capital y dedicación directiva por adelantado", "Demands heavy capital and management attention up front"), defaultWeight: 15 },
  { key: "speedOfEntry", label: loc("Velocidad de entrada", "Speed of entry"), highMeans: loc("Permite estar operando pronto", "Gets the firm operating quickly"), defaultWeight: 12 },
  { key: "marketPenetration", label: loc("Penetración de mercado", "Market penetration"), highMeans: loc("Alcanza cuota y cobertura altas", "Reaches high share and coverage"), defaultWeight: 15 },
  { key: "marketControl", label: loc("Control del mercado", "Market control"), highMeans: loc("Conserva el conocimiento y la relación con el cliente", "Keeps the knowledge and the customer relationship in-house"), defaultWeight: 13 },
  { key: "politicalRiskExposure", label: loc("Exposición a riesgo político", "Political risk exposure"), highMeans: loc("Deja mucho capital expuesto a decisiones políticas", "Leaves a lot of capital exposed to political decisions"), defaultWeight: 15 },
  { key: "technologicalLeakage", label: loc("Fuga tecnológica", "Technological leakage"), highMeans: loc("Alto riesgo de apropiación de tecnología o conocimiento", "High risk that technology or know-how is appropriated"), defaultWeight: 12 },
  { key: "managerialComplexity", label: loc("Complejidad de gestión", "Managerial complexity"), highMeans: loc("Exige capacidad directiva y coordinación intensas", "Demands intense managerial capacity and coordination"), defaultWeight: 8 },
  { key: "financialReturnPotential", label: loc("Retorno potencial", "Financial return potential"), highMeans: loc("Mayor valor absoluto capturable", "Larger absolute value that can be captured"), defaultWeight: 10 },
];

export const entryModes: readonly EntryModeDefinition[] = [
  {
    key: "greenfield",
    label: loc("Filial propia / greenfield", "Wholly owned subsidiary / greenfield"),
    commitment: "high",
    economicModel: "operator",
    profile: { upFrontInvestment: 85, speedOfEntry: 20, marketPenetration: 55, marketControl: 85, politicalRiskExposure: 85, technologicalLeakage: 25, managerialComplexity: 85, financialReturnPotential: 80 },
    rationale: loc("Máximo control y captura de valor, con la máxima movilización de recursos y exposición. La presencia tarda en construirse, así que solo se sostiene en un horizonte largo y con riesgo país limitado.", "Maximum control and value capture, with the maximum mobilization of resources and exposure. Presence takes time to build, so it only holds up over a long horizon and with limited country risk."),
    provenance: loc("Tabla 7.4, p. 271 (columna «Wholly owned»)", "Table 7.4, p. 271 (\u201cWholly owned\u201d column)"),
  },
  {
    key: "acquisition",
    label: loc("Adquisición", "Acquisition"),
    commitment: "high",
    economicModel: "operator",
    profile: { upFrontInvestment: 85, speedOfEntry: 85, marketPenetration: 85, marketControl: 85, politicalRiskExposure: 85, technologicalLeakage: 25, managerialComplexity: 85, financialReturnPotential: 80 },
    rationale: loc("Disponibilidad inmediata de recursos, activos y competencias, y única vía real cuando la ventana competitiva ya se ha cerrado. Exige capacidad de integración intercultural y absorber una prima de adquisición.", "Immediate availability of resources, assets and competencies, and the only real route once the competitive window has closed. It demands cross-cultural integration capability and absorbing an acquisition premium."),
    provenance: loc("Tabla 7.4, p. 271 (columna «Acquisition»)", "Table 7.4, p. 271 (\u201cAcquisition\u201d column)"),
  },
  {
    key: "alliance",
    label: loc("Joint venture o alianza", "Joint venture or alliance"),
    commitment: "medium",
    economicModel: "operator",
    profile: { upFrontInvestment: 55, speedOfEntry: 85, marketPenetration: 70, marketControl: 55, politicalRiskExposure: 55, technologicalLeakage: 70, managerialComplexity: 85, financialReturnPotential: 70 },
    rationale: loc("Comparte riesgo y aporta legitimidad y acceso local. Su valor teórico se ve lastrado con frecuencia por una mala implementación: exige análisis de encaje del socio y gobierno explícito.", "Shares risk and brings legitimacy and local access. Its theoretical value is often dragged down by poor implementation: it demands partner-fit analysis and explicit governance."),
    provenance: loc("Tabla 7.4, p. 271 (columna «Joint venture»)", "Table 7.4, p. 271 (\u201cJoint venture\u201d column)"),
  },
  {
    key: "licensing",
    label: loc("Licencia o franquicia", "Licensing or franchising"),
    commitment: "low",
    economicModel: "royalty",
    profile: { upFrontInvestment: 25, speedOfEntry: 55, marketPenetration: 40, marketControl: 5, politicalRiskExposure: 25, technologicalLeakage: 85, managerialComplexity: 25, financialReturnPotential: 55 },
    rationale: loc("Muy rentable en términos de retorno sobre una inversión mínima, pero de valor absoluto pequeño. El licenciatario puede apropiarse de la tecnología y convertirse en competidor.", "Highly profitable as a return on a minimal investment, but small in absolute value. The licensee may appropriate the technology and turn into a competitor."),
    provenance: loc("Tabla 7.4, p. 271 (columna «Licensing»); retorno = «Low risk; High return; Low payout»", "Table 7.4, p. 271 (\u201cLicensing\u201d column); return = \u201cLow risk; High return; Low payout\u201d"),
  },
  {
    key: "distributor",
    label: loc("Agente o distribuidor", "Agent or distributor"),
    commitment: "low",
    economicModel: "channel",
    profile: { upFrontInvestment: 25, speedOfEntry: 70, marketPenetration: 40, marketControl: 15, politicalRiskExposure: 25, technologicalLeakage: 25, managerialComplexity: 25, financialReturnPotential: 45 },
    rationale: loc("Vía económica de probar demanda y cobertura. Genera conflicto de interés cuando las ventas superan el punto en que la comisión excede el coste fijo de una filial propia.", "A cheap way to test demand and coverage. It creates a conflict of interest once sales pass the point where the commission exceeds the fixed cost of a wholly owned subsidiary."),
    provenance: loc("Tabla 7.4, p. 271 (columna «Agent-distributor»)", "Table 7.4, p. 271 (\u201cAgent-distributor\u201d column)"),
  },
  {
    key: "office",
    label: loc("Oficina de representación / observatorio", "Representative office / listening post"),
    commitment: "low",
    economicModel: "cost_only",
    profile: { upFrontInvestment: 40, speedOfEntry: 20, marketPenetration: 25, marketControl: 25, politicalRiskExposure: 25, technologicalLeakage: 25, managerialComplexity: 55, financialReturnPotential: 30 },
    rationale: loc("Cabeza de puente frugal para recoger información, construir contactos y preparar una entrada mayor. No genera ingresos por sí misma: su valor es el de la opción que abre.", "A frugal bridgehead for gathering information, building contacts and preparing a larger entry. It generates no revenue by itself: its value is the option it opens."),
    provenance: loc("Tabla 7.4, p. 271 (columna «Representative office»)", "Table 7.4, p. 271 (\u201cRepresentative office\u201d column)"),
  },
  {
    key: "digital",
    label: loc("Entrada digital o híbrida", "Digital or hybrid entry"),
    commitment: "low",
    economicModel: "operator",
    profile: { upFrontInvestment: 40, speedOfEntry: 85, marketPenetration: 55, marketControl: 70, politicalRiskExposure: 25, technologicalLeakage: 55, managerialComplexity: 55, financialReturnPotential: 70 },
    rationale: loc("Adecuada cuando la entrega es puramente digital o híbrida. Requiere validar regulación, localización, pagos y datos, y a menudo una capa física o de socios locales.", "Suitable when delivery is purely digital or hybrid. It requires validating regulation, localization, payments and data, and often a physical or local-partner layer."),
    provenance: loc("Derivado por analogía de la Tabla 7.5, p. 272 («Three models of entry»); no figura como columna en la Tabla 7.4", "Derived by analogy from Table 7.5, p. 272 (\u201cThree models of entry\u201d); it is not a column in Table 7.4"),
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

export const entryDeliveryModels: { value: EntryDeliveryModel; label: Localized; detail: Localized }[] = [
  { value: "relational", label: loc("Relacional", "Relational"), detail: loc("Contratos con entidades locales: distribuidores, socios, logística, personal e inversión productiva.", "Contracts with local entities: distributors, partners, logistics, staff and productive investment.") },
  { value: "digital", label: loc("Digital", "Digital"), detail: loc("Infraestructura de internet propia: entrega puramente digital, descarga o cloud.", "Own internet infrastructure: purely digital delivery, download or cloud.") },
  { value: "hybrid", label: loc("Híbrido", "Hybrid"), detail: loc("Plataformas B2B y B2C con presencia física, personal local, alianzas y socios locales.", "B2B and B2C platforms with physical presence, local staff, alliances and local partners.") },
];
