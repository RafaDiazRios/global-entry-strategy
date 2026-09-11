/**
 * Superposiciones sectoriales.
 *
 * La herramienta tiene que servir a cualquier industria. Eso no significa soportar cada
 * sector: significa convertir en datos las tres cosas que dependen del sector —la cadena de
 * aprobación, la taxonomía de modos y la pila de ingresos— y dejar que quien trabaje en un
 * sector no cubierto escriba la suya.
 *
 * Se sale con tres: la genérica, servicios financieros y retail y productos de consumo. Con
 * dos, una de las cuales es la genérica, en realidad solo hay una superposición y no se puede
 * saber si la abstracción es real. La tercera es la que prueba que el mecanismo generaliza.
 *
 * Nota sobre los ejes. Los del libro sí generalizan y solo falla el vocabulario: la Fig. 7.1
 * clasifica por control e intensidad de inversión, y eso vale igual para una fábrica que para
 * una sucursal bancaria. Lo que cambia es cómo se llama cada casilla. Por eso los ejes se
 * quedan en el núcleo y la lista de modos es superposición.
 *
 * La pila de ingresos todavía no está aquí: hasta que exista, el veto de finanzas se contesta
 * a mano. Está en el mapa, no en esta entrega.
 */

import { loc, type Localized } from "../i18n";
import type { EconomicModel } from "./entryModes";
import type { Approver } from "./approvalChain";
import { BASE_CHAIN } from "./approvalChain";
import type { ProvenanceOrigin } from "./thesis";

export type IndustryId = "generic" | "financial_services" | "retail_consumer";

/** Un modo de entrada nombrado en el vocabulario del sector, sobre los ejes del libro. */
export type SectorEntryMode = {
  key: string;
  label: Localized;
  control: "weak" | "strong";
  intensity: "low" | "high";
  economicModel: EconomicModel;
  /** Exige pactar gobierno con un tercero. Enciende el módulo de socio. */
  requiresPartner: boolean;
  /** Exige licencia o autorización del supervisor. Enciende la puerta regulatoria. */
  requiresLicence: boolean;
  origin: ProvenanceOrigin;
  provenance: Localized;
};

export type Industry = {
  id: IndustryId;
  label: Localized;
  description: Localized;
  /** Aprobadores que este sector añade a la cadena base. */
  extraApprovers: Approver[];
  modes: SectorEntryMode[];
};

const FROM_BOOK: Localized = loc("Fig. 7.1, p. 263 y Tabla 7.4, p. 271", "Fig. 7.1, p. 263 and Table 7.4, p. 271");

/* ------------------------------------------------------------------------------------ */
/* Genérica — los modos del libro                                                        */
/* ------------------------------------------------------------------------------------ */

const genericModes: SectorEntryMode[] = [
  { key: "greenfield", label: loc("Filial propia / greenfield", "Wholly owned subsidiary / greenfield"), control: "strong", intensity: "high", economicModel: "operator", requiresPartner: false, requiresLicence: false, origin: "book", provenance: FROM_BOOK },
  { key: "acquisition", label: loc("Adquisición", "Acquisition"), control: "strong", intensity: "high", economicModel: "operator", requiresPartner: false, requiresLicence: false, origin: "book", provenance: FROM_BOOK },
  { key: "alliance", label: loc("Empresa conjunta o alianza", "Joint venture or alliance"), control: "weak", intensity: "high", economicModel: "operator", requiresPartner: true, requiresLicence: false, origin: "book", provenance: FROM_BOOK },
  { key: "licensing", label: loc("Licencia o franquicia", "Licensing or franchising"), control: "weak", intensity: "low", economicModel: "royalty", requiresPartner: true, requiresLicence: false, origin: "book", provenance: FROM_BOOK },
  { key: "distributor", label: loc("Agente o distribuidor", "Agent or distributor"), control: "weak", intensity: "low", economicModel: "channel", requiresPartner: true, requiresLicence: false, origin: "book", provenance: FROM_BOOK },
  { key: "office", label: loc("Oficina de representación u observatorio", "Representative office or listening post"), control: "strong", intensity: "low", economicModel: "cost_only", requiresPartner: false, requiresLicence: false, origin: "book", provenance: FROM_BOOK },
  { key: "digital", label: loc("Entrada digital o híbrida", "Digital or hybrid entry"), control: "strong", intensity: "low", economicModel: "operator", requiresPartner: false, requiresLicence: false, origin: "book", provenance: loc("Derivado de la Tabla 7.5, p. 272", "Derived from Table 7.5, p. 272") },
];

/* ------------------------------------------------------------------------------------ */
/* Servicios financieros                                                                 */
/* ------------------------------------------------------------------------------------ */

const FS_PRACTICE: Localized = loc(
  "Convención del sector financiero regulado; no procede del libro.",
  "Practice in regulated financial services; it does not come from the book."
);

const financialServices: Industry = {
  id: "financial_services",
  label: loc("Servicios financieros", "Financial services"),
  description: loc(
    "El supervisor poda el conjunto de modos antes de que empiece el análisis, y riesgo y cumplimiento firman además de opinar.",
    "The supervisor prunes the set of modes before the analysis starts, and risk and compliance sign off rather than merely opine."
  ),
  extraApprovers: [
    {
      id: "risk",
      role: loc("Riesgo", "Risk"),
      authority: "veto",
      test: "risk_appetite",
      question: loc(
        "¿Cabe en el apetito de riesgo y en la política de crédito del grupo?",
        "Does it fit the group's risk appetite and credit policy?"
      ),
      reads: ["assessment", "economics"],
      origin: "sector",
      provenance: FS_PRACTICE,
    },
    {
      id: "compliance_legal",
      role: loc("Cumplimiento y legal", "Compliance and legal"),
      authority: "veto",
      test: "new_product_approval",
      question: loc(
        "¿Pasa el proceso de aprobación de producto nuevo?",
        "Does it clear the new product approval process?"
      ),
      reads: ["thesis", "assessment"],
      origin: "sector",
      provenance: FS_PRACTICE,
    },
    {
      id: "local_entity_board",
      role: loc("Consejo de la entidad local", "Local entity board"),
      authority: "veto",
      test: "local_entity_board",
      question: loc(
        "¿Lo aprueba el órgano de la entidad que va a emitir el producto?",
        "Does the board of the entity that will issue the product approve it?"
      ),
      reads: ["thesis"],
      origin: "sector",
      provenance: FS_PRACTICE,
    },
    {
      id: "supervisor",
      role: loc("Supervisor", "Supervisor"),
      authority: "veto",
      test: "supervisor_non_objection",
      question: loc("¿Hay no objeción del supervisor?", "Is there a non-objection from the supervisor?"),
      reads: ["thesis"],
      origin: "sector",
      provenance: FS_PRACTICE,
    },
  ],
  modes: [
    { key: "passport_branch", label: loc("Sucursal sobre licencia ya pasaportada", "Branch on an already passported licence"), control: "strong", intensity: "low", economicModel: "operator", requiresPartner: false, requiresLicence: true, origin: "sector", provenance: FS_PRACTICE },
    { key: "local_subsidiary", label: loc("Filial local con licencia propia", "Local subsidiary with its own licence"), control: "strong", intensity: "high", economicModel: "operator", requiresPartner: false, requiresLicence: true, origin: "sector", provenance: FS_PRACTICE },
    { key: "sponsored_issuance", label: loc("Emisión bajo patrocinio de un licenciatario local", "Issuance sponsored by a local licence holder"), control: "weak", intensity: "low", economicModel: "channel", requiresPartner: true, requiresLicence: true, origin: "sector", provenance: FS_PRACTICE },
    { key: "portfolio_acquisition", label: loc("Compra de cartera", "Portfolio acquisition"), control: "strong", intensity: "high", economicModel: "operator", requiresPartner: false, requiresLicence: true, origin: "sector", provenance: FS_PRACTICE },
    { key: "bank_jv", label: loc("Empresa conjunta con entidad local", "Joint venture with a local institution"), control: "weak", intensity: "high", economicModel: "operator", requiresPartner: true, requiresLicence: true, origin: "sector", provenance: FS_PRACTICE },
    { key: "white_label", label: loc("Marca blanca para un tercero", "White label for a third party"), control: "weak", intensity: "low", economicModel: "royalty", requiresPartner: true, requiresLicence: true, origin: "sector", provenance: FS_PRACTICE },
  ],
};

/* ------------------------------------------------------------------------------------ */
/* Retail y productos de consumo                                                         */
/* ------------------------------------------------------------------------------------ */

const RETAIL_PRACTICE: Localized = loc(
  "Convención del sector de distribución y gran consumo; no procede del libro.",
  "Practice in retail and consumer goods; it does not come from the book."
);

const retailConsumer: Industry = {
  id: "retail_consumer",
  label: loc("Retail y productos de consumo", "Retail and consumer products"),
  description: loc(
    "Aquí la entrada la mata la cadena de suministro y la normativa de producto antes que el mercado. Es el patrón de los fracasos famosos del sector.",
    "Here an entry is killed by the supply chain and by product regulation before the market kills it. That is the pattern behind the sector's famous failures."
  ),
  extraApprovers: [
    {
      id: "supply_chain",
      role: loc("Cadena de suministro", "Supply chain"),
      authority: "veto",
      test: "supply_chain",
      question: loc(
        "¿Se puede servir el mercado desde la red existente dentro del sobre de coste?",
        "Can the market be served from the existing network within the cost envelope?"
      ),
      reads: ["positioning", "assessment"],
      origin: "sector",
      provenance: RETAIL_PRACTICE,
    },
    {
      id: "product_compliance",
      role: loc("Calidad y normativa de producto", "Quality and product regulation"),
      authority: "veto",
      test: "product_compliance",
      question: loc(
        "¿El producto cumple la normativa local de composición, etiquetado y seguridad?",
        "Does the product comply with local rules on composition, labelling and safety?"
      ),
      reads: ["thesis", "assessment"],
      origin: "sector",
      provenance: RETAIL_PRACTICE,
    },
    {
      id: "brand",
      role: loc("Marca", "Brand"),
      authority: "advisory",
      test: "brand_fit",
      question: loc(
        "¿La posición en ese mercado refuerza o diluye la marca?",
        "Does the position in that market reinforce or dilute the brand?"
      ),
      reads: ["positioning"],
      origin: "sector",
      provenance: RETAIL_PRACTICE,
    },
    {
      id: "responsible_sourcing",
      role: loc("Abastecimiento responsable", "Responsible sourcing"),
      authority: "advisory",
      test: "responsible_sourcing",
      question: loc(
        "¿Las cuestiones ambientales y sociales del país son asumibles para la marca?",
        "Are the country's environmental and social issues acceptable for the brand?"
      ),
      reads: ["assessment"],
      origin: "sector",
      // Por defecto asesor, y es el que más casas promueven a veto. Cambiarlo es justo lo que
      // el mecanismo de superposición existe para permitir.
      provenance: loc(
        "Convención del sector; el libro lo plantea como filtro previo a la inversión (p. 242), no como veto formal.",
        "Sector practice; the book frames it as a filter before investing (p. 242), not as a formal veto."
      ),
    },
  ],
  modes: [
    { key: "own_stores", label: loc("Tiendas propias", "Own stores"), control: "strong", intensity: "high", economicModel: "operator", requiresPartner: false, requiresLicence: false, origin: "sector", provenance: RETAIL_PRACTICE },
    { key: "franchise", label: loc("Franquicia", "Franchise"), control: "weak", intensity: "low", economicModel: "royalty", requiresPartner: true, requiresLicence: false, origin: "sector", provenance: RETAIL_PRACTICE },
    { key: "wholesale", label: loc("Venta mayorista a distribución local", "Wholesale to local retailers"), control: "weak", intensity: "low", economicModel: "channel", requiresPartner: true, requiresLicence: false, origin: "sector", provenance: RETAIL_PRACTICE },
    { key: "marketplace", label: loc("Plataforma o marketplace", "Platform or marketplace"), control: "weak", intensity: "low", economicModel: "channel", requiresPartner: true, requiresLicence: false, origin: "sector", provenance: RETAIL_PRACTICE },
    { key: "direct_online", label: loc("Venta directa en línea", "Direct online sales"), control: "strong", intensity: "low", economicModel: "operator", requiresPartner: false, requiresLicence: false, origin: "sector", provenance: RETAIL_PRACTICE },
    { key: "chain_acquisition", label: loc("Compra de una cadena local", "Acquisition of a local chain"), control: "strong", intensity: "high", economicModel: "operator", requiresPartner: false, requiresLicence: false, origin: "sector", provenance: RETAIL_PRACTICE },
    { key: "retail_jv", label: loc("Empresa conjunta con operador local", "Joint venture with a local operator"), control: "weak", intensity: "high", economicModel: "operator", requiresPartner: true, requiresLicence: false, origin: "sector", provenance: RETAIL_PRACTICE },
  ],
};

/* ------------------------------------------------------------------------------------ */
/* Registro                                                                              */
/* ------------------------------------------------------------------------------------ */

export const INDUSTRIES: Industry[] = [
  {
    id: "generic",
    label: loc("Genérica", "Generic"),
    description: loc(
      "Los modos del capítulo 7 y la cadena de gobierno corporativo, sin añadidos.",
      "The chapter 7 modes and the corporate governance chain, with nothing added."
    ),
    extraApprovers: [],
    modes: genericModes,
  },
  financialServices,
  retailConsumer,
];

export function industry(id: IndustryId | null): Industry {
  return INDUSTRIES.find((entry) => entry.id === id) ?? INDUSTRIES[0];
}

/** La cadena completa: base más lo que añada el sector, con los vetos primero. */
export function resolveChain(id: IndustryId | null): Approver[] {
  const order: Record<string, number> = { veto: 0, decides: 1, advisory: 2 };
  return [...BASE_CHAIN, ...industry(id).extraApprovers].sort(
    (a, b) => order[a.authority] - order[b.authority]
  );
}

export function sectorMode(id: IndustryId | null, key: string | null): SectorEntryMode | null {
  if (!key) return null;
  return industry(id).modes.find((mode) => mode.key === key) ?? null;
}
