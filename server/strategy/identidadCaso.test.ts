import { describe, expect, it } from "vitest";
import { LANGUAGES, pick } from "@shared/i18n";
import {
  IDENTITY_FIELDS,
  divergenceFor,
  identityDivergences,
  identityPrefill,
  type IdentityLocal,
  type IdentitySource,
} from "@shared/domain/caseIdentity";

/**
 * Una sola fuente por dato.
 *
 * Lo que se prueba es la regla que hace que esto sea seguro: rellenar un hueco se hace solo,
 * cambiar un valor escrito no. Si la herramienta pisara lo que alguien tecleó, el remedio
 * sería peor que la duplicación.
 */

const source: IdentitySource = {
  company: "Citi",
  industryLabel: "Servicios financieros",
  countryCode: "NL",
  caseTitle: "Tarjetas en Países Bajos",
};

const empty: IdentityLocal = { company: "", industry: "", scenarioName: "", candidateCodes: ["NL"] };

describe("identidad del caso", () => {
  it("rellena solo lo que está vacío", () => {
    expect(identityPrefill(source, empty)).toEqual({
      company: "Citi",
      industry: "Servicios financieros",
      scenarioName: "Tarjetas en Países Bajos",
    });
  });

  it("no pisa nunca lo que alguien ha escrito", () => {
    const escrito: IdentityLocal = { ...empty, company: "Citibank España", industry: "Banca" };
    const fill = identityPrefill(source, escrito);
    expect(fill.company).toBeUndefined();
    expect(fill.industry).toBeUndefined();
    expect(fill.scenarioName).toBe("Tarjetas en Países Bajos");
  });

  it("no rellena desde un dueño vacío", () => {
    expect(identityPrefill({ company: null, industryLabel: null, countryCode: null, caseTitle: null }, empty)).toEqual({});
  });

  it("no ve divergencia donde solo hay mayúsculas, acentos o espacios", () => {
    const local: IdentityLocal = { ...empty, company: "  citi ", industry: "servicios financieros", scenarioName: "Tarjetas en Paises Bajos" };
    expect(identityDivergences(source, local)).toEqual([]);
  });

  it("señala la divergencia con los dos valores, sin elegir", () => {
    const local: IdentityLocal = { ...empty, company: "Santander", industry: "Servicios financieros", scenarioName: "Tarjetas en Países Bajos" };
    const divergences = identityDivergences(source, local);
    expect(divergences).toHaveLength(1);
    expect(divergences[0].field).toBe("company");
    expect(divergences[0].owned).toBe("Citi");
    expect(divergences[0].local).toBe("Santander");
    expect(pick(divergences[0].note, "es")).toContain("Citi");
    expect(pick(divergences[0].note, "es")).toContain("Santander");
  });

  it("un hueco no es una divergencia: es algo que se rellenará solo", () => {
    const local: IdentityLocal = { ...empty, scenarioName: "Tarjetas en Países Bajos" };
    expect(identityDivergences(source, local).map((entry) => entry.field)).not.toContain("company");
  });

  it("avisa cuando el país de la tesis no está entre los candidatos", () => {
    const local: IdentityLocal = { ...empty, candidateCodes: ["ES", "PT"], scenarioName: "Tarjetas en Países Bajos" };
    const country = identityDivergences(source, local).find((entry) => entry.field === "country")!;
    expect(country.kind).toBe("missing");
    expect(pick(country.note, "es")).toContain("NL");
    expect(pick(country.note, "es")).toContain("fase 3");
    expect(pick(country.note, "en")).toContain("phase 3");
  });

  it("y se calla cuando sí está, en cualquier caja", () => {
    const local: IdentityLocal = { ...empty, candidateCodes: ["nl"], scenarioName: "Tarjetas en Países Bajos" };
    expect(identityDivergences(source, local).map((entry) => entry.field)).not.toContain("country");
  });

  it("cada campo dice quién manda y por qué, en los dos idiomas", () => {
    expect(IDENTITY_FIELDS).toHaveLength(4);
    for (const field of IDENTITY_FIELDS) {
      for (const lang of LANGUAGES) {
        expect(pick(field.label, lang).trim()).not.toBe("");
        expect(pick(field.ownerLabel, lang).trim()).not.toBe("");
        expect(pick(field.why, lang).trim()).not.toBe("");
      }
    }
  });

  it("devuelve el aviso de un campo concreto sin objetos sueltos", () => {
    const local: IdentityLocal = { ...empty, company: "Santander", scenarioName: "x" };
    const divergences = identityDivergences(source, local);
    for (const lang of LANGUAGES) {
      const note = divergenceFor(divergences, "company", lang)!;
      expect(note).not.toContain("[object Object]");
      expect(note).not.toContain("undefined");
    }
    expect(divergenceFor(divergences, "industry", "es")).toBeNull();
  });
});
