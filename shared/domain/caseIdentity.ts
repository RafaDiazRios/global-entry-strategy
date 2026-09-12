/**
 * Quién es el dueño de cada dato que aparece dos veces.
 *
 * La empresa se escribía en la tesis y otra vez en el mandato. La industria, igual. El país
 * se nombraba en la tesis y había que volver a añadirlo como candidato. Pedir dos veces lo
 * mismo no es solo trabajo de más: invita a que las dos copias digan cosas distintas, y
 * entonces el informe de la fase 7 y el memo de la tesis hablan de empresas diferentes sin
 * que nadie lo note.
 *
 * La regla es una sola: cada dato tiene un dueño, y donde vuelve a aparecer se rellena solo.
 *
 * El dueño es la tesis, y no el mandato, porque la tesis vive en el caso y el caso persiste;
 * el mandato es parte de un escenario, y de un caso pueden colgar varios escenarios. Poner al
 * dueño en el sitio efímero habría obligado a elegir cuál de tres escenarios manda.
 *
 * Y una decisión que importa más que las otras: rellenar solo nunca pisa lo que alguien haya
 * escrito. Si los dos valores existen y no coinciden, la herramienta no elige: enseña los
 * dos, dice cuál es el dueño y ofrece alinearlos. Resolver la contradicción por su cuenta
 * sería la única forma de que esta herramienta perdiera la discusión sin darse cuenta.
 */

import { loc, pick, type Lang, type Localized } from "../i18n";

export type IdentityFieldId = "company" | "industry" | "country" | "caseTitle";

export type IdentityField = {
  id: IdentityFieldId;
  label: Localized;
  /** Dónde se escribe, para poder mandar allí a quien quiera cambiarlo. */
  ownerLabel: Localized;
  /** Por qué el dueño es ese y no el otro sitio. */
  why: Localized;
};

export const IDENTITY_FIELDS: IdentityField[] = [
  {
    id: "company",
    label: loc("Empresa", "Company"),
    ownerLabel: loc("la tesis, en la pestaña del caso", "the thesis, in the case tab"),
    why: loc(
      "La empresa es del caso, y del caso pueden colgar varios escenarios.",
      "The company belongs to the case, and a case can have several scenarios hanging from it."
    ),
  },
  {
    id: "industry",
    label: loc("Industria", "Industry"),
    ownerLabel: loc("la tesis, en la pestaña del caso", "the thesis, in the case tab"),
    why: loc(
      "La industria elige la cadena de aprobación y la taxonomía de modos: cambiarla cambia el análisis entero.",
      "The industry picks the approval chain and the mode taxonomy: changing it changes the whole analysis."
    ),
  },
  {
    id: "country",
    label: loc("País de la tesis", "Thesis country"),
    ownerLabel: loc("la tesis, en la pestaña del caso", "the thesis, in the case tab"),
    why: loc(
      "Si el país de la tesis no está entre los candidatos, el memo se queda sin números y no dice por qué.",
      "If the thesis country is not among the candidates, the memo has no figures and does not say why."
    ),
  },
  {
    id: "caseTitle",
    label: loc("Nombre", "Name"),
    ownerLabel: loc("el caso", "the case"),
    why: loc(
      "El escenario es una versión del caso: heredar su nombre evita tener dos títulos para lo mismo.",
      "The scenario is a version of the case: inheriting its name avoids having two titles for the same thing."
    ),
  },
];

export function identityField(id: IdentityFieldId): IdentityField {
  return IDENTITY_FIELDS.find((field) => field.id === id) ?? IDENTITY_FIELDS[0];
}

/* ------------------------------------------------------------------------------------ */
/* Divergencias                                                                          */
/* ------------------------------------------------------------------------------------ */

export type IdentitySource = {
  /** Lo que dice el dueño. Vacío significa que todavía no se ha escrito. */
  company: string | null;
  industryLabel: string | null;
  countryCode: string | null;
  caseTitle: string | null;
};

export type IdentityLocal = {
  company: string;
  industry: string;
  scenarioName: string;
  /** Códigos de los países candidatos, para saber si el de la tesis está entre ellos. */
  candidateCodes: string[];
};

export type IdentityDivergence = {
  field: IdentityFieldId;
  /** Lo que dice el dueño. */
  owned: string;
  /** Lo que dice la copia. Vacío cuando el problema es una ausencia, no una diferencia. */
  local: string;
  kind: "differs" | "missing";
  note: Localized;
};

/** Compara ignorando mayúsculas, acentos y espacios de sobra: «Citi » y «citi» son lo mismo. */
function sameText(a: string, b: string) {
  const clean = (value: string) => value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return clean(a) === clean(b);
}

export function identityDivergences(source: IdentitySource, local: IdentityLocal): IdentityDivergence[] {
  const divergences: IdentityDivergence[] = [];

  const compare = (field: IdentityFieldId, owned: string | null, value: string) => {
    const ownedText = (owned ?? "").trim();
    const localText = value.trim();
    if (!ownedText || !localText || sameText(ownedText, localText)) return;
    divergences.push({
      field,
      owned: ownedText,
      local: localText,
      kind: "differs",
      note: loc(
        `La tesis dice «${ownedText}» y aquí pone «${localText}». Una de las dos hay que corregirla antes de que el informe y el memo hablen de cosas distintas.`,
        `The thesis says “${ownedText}” and this says “${localText}”. One of the two has to be corrected before the report and the memo talk about different things.`
      ),
    });
  };

  compare("company", source.company, local.company);
  compare("industry", source.industryLabel, local.industry);
  compare("caseTitle", source.caseTitle, local.scenarioName);

  const country = (source.countryCode ?? "").trim().toUpperCase();
  if (country && !local.candidateCodes.map((code) => code.toUpperCase()).includes(country)) {
    divergences.push({
      field: "country",
      owned: country,
      local: "",
      kind: "missing",
      note: loc(
        `La tesis es sobre ${country} y ese país no está entre los candidatos. Añádalo en la fase 3 o el memo se quedará sin caso económico sin decir por qué.`,
        `The thesis is about ${country} and that country is not among the candidates. Add it in phase 3, or the memo will have no economic case and will not say why.`
      ),
    });
  }

  return divergences;
}

/**
 * Qué hay que rellenar porque está vacío. Se separa de las divergencias a propósito: rellenar
 * un hueco es seguro y se puede hacer solo; cambiar un valor escrito no lo es.
 */
export function identityPrefill(source: IdentitySource, local: IdentityLocal): Partial<Record<"company" | "industry" | "scenarioName", string>> {
  const fill: Partial<Record<"company" | "industry" | "scenarioName", string>> = {};
  if (!local.company.trim() && (source.company ?? "").trim()) fill.company = source.company!.trim();
  if (!local.industry.trim() && (source.industryLabel ?? "").trim()) fill.industry = source.industryLabel!.trim();
  if (!local.scenarioName.trim() && (source.caseTitle ?? "").trim()) fill.scenarioName = source.caseTitle!.trim();
  return fill;
}

/** Para el aviso de un campo concreto, sin tener que recorrer la lista fuera. */
export function divergenceFor(divergences: IdentityDivergence[], field: IdentityFieldId, lang: Lang): string | null {
  const found = divergences.find((entry) => entry.field === field);
  return found ? pick(found.note, lang) : null;
}
