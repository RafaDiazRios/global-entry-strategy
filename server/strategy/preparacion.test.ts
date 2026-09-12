import { describe, expect, it } from "vitest";
import { LANGUAGES, pick } from "@shared/i18n";
import { GUIDED_STEPS } from "@shared/domain/guidedRoute";
import {
  PREPARATION_ITEM_IDS,
  preparationChecklist,
  sanitisePreparation,
  summarisePreparation,
} from "@shared/domain/preparation";

/**
 * La lista de preparación.
 *
 * Se deriva de lo que cada paso dice necesitar, así que la prueba que importa es que no
 * pueda quedarse desfasada: todo dato que pida un paso aparece, y nada aparece que ningún
 * paso pida. Una lista de preparación que no cubre lo que la ruta va a exigir es peor que
 * no tenerla, porque promete que no habrá sorpresas.
 */

const allBring = GUIDED_STEPS.flatMap((step) => step.bring);

describe("lista de preparación", () => {
  it("cubre exactamente lo que la ruta pide, sin repetir ni inventar", () => {
    const fromSteps = new Set(allBring.map((data) => data.id));
    const fromList = new Set(PREPARATION_ITEM_IDS);
    expect(Array.from(fromList).sort()).toEqual(Array.from(fromSteps).sort());
    // Cada identificador aparece una sola vez en la lista, aunque lo pidan varios pasos.
    expect(PREPARATION_ITEM_IDS.length).toBe(new Set(PREPARATION_ITEM_IDS).size);
  });

  it("agrupa por de quién habla el dato, y las cinco familias tienen algo", () => {
    const groups = preparationChecklist();
    expect(groups.map((group) => group.id)).toEqual(["case", "company", "group", "countries", "competitors"]);
    for (const group of groups) expect(group.items.length, group.id).toBeGreaterThan(0);
  });

  it("anota qué pasos piden cada dato y pone primero lo que sostiene más cosas", () => {
    for (const group of preparationChecklist()) {
      for (const item of group.items) {
        expect(item.neededBy.length, item.id).toBeGreaterThan(0);
        for (const step of item.neededBy) {
          expect(GUIDED_STEPS.some((entry) => entry.id === step.id)).toBe(true);
        }
      }
      const counts = group.items.map((item) => item.neededBy.length);
      expect(counts).toEqual([...counts].sort((a, b) => b - a));
    }
  });

  it("distingue lo que hay que conseguir una vez por país", () => {
    const items = preparationChecklist().flatMap((group) => group.items);
    const perCountry = items.filter((item) => item.perCountry);
    expect(perCountry.length).toBeGreaterThan(3);
    // El impuesto y el tipo de cambio son por país, y se descargan solos.
    const tax = items.find((item) => item.id === "tax_and_fx")!;
    expect(tax.perCountry).toBe(true);
    expect(tax.origin).toBe("public_source");
    // Las ventas por región se piden una vez, no por país.
    expect(items.find((item) => item.id === "sales_by_region")!.perCountry).toBe(false);
  });

  it("el resumen separa lo barato de lo que marca el calendario", () => {
    const vacio = summarisePreparation({ gathered: [] });
    expect(vacio.gathered).toBe(0);
    expect(vacio.total).toBe(PREPARATION_ITEM_IDS.length);
    expect(vacio.pendingPublic).toBeGreaterThan(0);
    expect(vacio.pendingFieldwork).toBeGreaterThan(vacio.pendingPublic);

    const conUno = summarisePreparation({ gathered: ["tax_and_fx"] });
    expect(conUno.gathered).toBe(1);
    expect(conUno.pendingPublic).toBe(vacio.pendingPublic - 1);
  });

  it("descarta identificadores que ya no existen al leer lo guardado", () => {
    const limpio = sanitisePreparation({ gathered: ["tax_and_fx", "un_dato_que_se_borro"] });
    expect(limpio.gathered).toEqual(["tax_and_fx"]);
    expect(sanitisePreparation(null).gathered).toEqual([]);
    expect(sanitisePreparation(undefined).gathered).toEqual([]);
  });

  it("todo dato dice qué es y dónde se consigue, en los dos idiomas", () => {
    for (const group of preparationChecklist()) {
      for (const lang of LANGUAGES) {
        expect(pick(group.label, lang).trim()).not.toBe("");
        expect(pick(group.intro, lang).trim()).not.toBe("");
        for (const item of group.items) {
          expect(pick(item.what, lang).trim(), `${item.id}.what.${lang}`).not.toBe("");
          expect(pick(item.where, lang).trim(), `${item.id}.where.${lang}`).not.toBe("");
          expect(pick(item.what, lang)).not.toContain("[object Object]");
          expect(pick(item.where, lang)).not.toContain("undefined");
        }
      }
    }
  });
});
