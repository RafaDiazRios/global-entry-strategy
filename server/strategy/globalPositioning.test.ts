import { describe, expect, it } from "vitest";
import { emptyPositioningInput, POSITIONINGS, type PositioningInput } from "@shared/domain/globalPositioning";
import {
  configurationLabel,
  deriveErrc,
  diagnoseValueChain,
  diagnoseValueCurve,
  positioningCompleteness,
  positioningWarnings,
  resolvePositioning,
  resourceGap,
} from "./globalPositioning";

describe("los ocho posicionamientos de la Tabla 5.4", () => {
  it("cubre las ocho combinaciones sin repetir ninguna", () => {
    const keys = POSITIONINGS.map((option) => `${option.scope}/${option.advantage}/${option.standardization}`);
    expect(new Set(keys).size).toBe(8);
  });

  it("resuelve los ejemplos del libro", () => {
    // Swatch e Intel: nicho, diferenciado, estandarizado (p. 190).
    expect(resolvePositioning({ scope: "niche", advantage: "differentiated", standardization: "standardized" })?.examples).toContain("Swatch");
    // Carrefour: nicho, coste, adaptativo.
    expect(resolvePositioning({ scope: "niche", advantage: "cost", standardization: "adaptive" })?.examples).toContain("Carrefour");
    // Unilever: amplio, diferenciado, adaptativo.
    expect(resolvePositioning({ scope: "broad", advantage: "differentiated", standardization: "adaptive" })?.examples).toContain("Unilever");
  });

  it("no resuelve nada mientras falte una dimensión", () => {
    expect(resolvePositioning({ scope: "broad", advantage: "cost", standardization: null })).toBeNull();
  });
});

/**
 * Ejemplo 5.3, p. 195: Yellow Tail entra en el mercado estadounidense creando un espacio
 * nuevo. El libro describe la jugada en cuatro rasgos; aquí se comprueba que la rejilla
 * ERRC sale sola de comparar las dos curvas, sin que nadie la rellene a mano.
 */
function yellowTail(): PositioningInput {
  const input = emptyPositioningInput();
  input.scope = "niche";
  input.advantage = "cost";
  input.standardization = "standardized";
  input.competitors = [{ id: "premium", label: "Bodegas premium" }];
  input.valueCurve = [
    { id: "terminology", label: "Lenguaje enológico y prestigio", asIs: 4, toBe: 0, competitors: { premium: 5 }, note: null },
    { id: "range", label: "Amplitud de la gama", asIs: 4, toBe: 1, competitors: { premium: 5 }, note: null },
    { id: "price", label: "Precio asequible", asIs: 2, toBe: 4, competitors: { premium: 1 }, note: null },
    { id: "brand_simplicity", label: "Marca simple y reconocible", asIs: null, toBe: 5, competitors: { premium: 2 }, note: null },
    { id: "supermarket", label: "Distribución en supermercado", asIs: null, toBe: 5, competitors: { premium: 1 }, note: null },
    { id: "quality", label: "Calidad de la uva", asIs: 3, toBe: 3, competitors: { premium: 5 }, note: null },
  ];
  return input;
}

describe("curva de valor y rejilla ERRC", () => {
  it("deduce las cuatro acciones a partir de las dos curvas", () => {
    const errc = deriveErrc(yellowTail().valueCurve);
    const byId = Object.fromEntries(errc.map((entry) => [entry.attributeId, entry.action]));
    expect(byId.terminology).toBe("eliminate");
    expect(byId.range).toBe("reduce");
    expect(byId.price).toBe("raise");
    expect(byId.brand_simplicity).toBe("create");
    expect(byId.quality).toBe("keep");
  });

  it("ignora los atributos sin curva propuesta en lugar de inventarles acción", () => {
    const attributes = [{ id: "x", label: "Sin decidir", asIs: 3, toBe: null, competitors: {}, note: null }];
    expect(deriveErrc(attributes)).toHaveLength(0);
  });

  it("mide la divergencia frente al competidor más parecido", () => {
    const diagnosis = diagnoseValueCurve(yellowTail());
    expect(diagnosis.divergence).not.toBeNull();
    expect(diagnosis.divergence as number).toBeGreaterThan(0.5);
    expect(diagnosis.note).toBeNull();
  });

  it("avisa cuando la curva propuesta es la del sector con otro nombre", () => {
    const input = emptyPositioningInput();
    input.competitors = [{ id: "rival", label: "Rival" }];
    input.valueCurve = [
      { id: "a", label: "Calidad", asIs: 3, toBe: 3, competitors: { rival: 3 }, note: null },
      { id: "b", label: "Precio", asIs: 2, toBe: 2, competitors: { rival: 2 }, note: null },
    ];
    const diagnosis = diagnoseValueCurve(input);
    expect(diagnosis.divergence).toBe(0);
    expect(diagnosis.undifferentiated).toHaveLength(2);
    expect(diagnosis.note).toMatch(/espacio nuevo/);
  });

  it("dice que no hay nada que comparar cuando falta el competidor", () => {
    const input = emptyPositioningInput();
    input.valueCurve = [{ id: "a", label: "Calidad", asIs: 3, toBe: 4, competitors: {}, note: null }];
    expect(diagnoseValueCurve(input).note).toMatch(/competidores/);
  });
});

describe("configuración de la cadena de valor", () => {
  it("clasifica la configuración dominante y lista los movimientos pendientes", () => {
    const input = emptyPositioningInput();
    input.valueChain = {
      rnd: { current: "local", target: "global" },
      sourcing_production: { current: "local", target: "regional" },
      marketing: { current: "local", target: "local" },
      customer_services: { current: "local", target: "local" },
      finances: { current: "regional", target: "global" },
      hrm: { current: "local", target: "local" },
    };
    const diagnosis = diagnoseValueChain(input);
    expect(diagnosis.currentConfiguration).toBe("multinational");
    expect(diagnosis.moves).toHaveLength(3);
    expect(diagnosis.moves.every((move) => move.direction === "centralizar")).toBe(true);
    expect(configurationLabel("global")).toBe("Configuración global");
  });

  it("no clasifica nada mientras la matriz esté vacía", () => {
    expect(diagnoseValueChain(emptyPositioningInput()).currentConfiguration).toBeNull();
  });
});

describe("Transfer-Adapt-Create", () => {
  it("saca la lista de lo que hay que crear, que es la entrada del módulo de build-borrow-buy", () => {
    const input = emptyPositioningInput();
    input.tac = [
      { id: "1", kind: "competency", label: "Gestión de cadena de suministro", functionId: "sourcing_production", tag: "transfer", note: null },
      { id: "2", kind: "competency", label: "Conocimiento del consumidor local", functionId: "marketing", tag: "adapt", note: null },
      { id: "3", kind: "asset", label: "Red de almacenes", functionId: "sourcing_production", tag: "create", note: null },
      { id: "4", kind: "resource", label: "Licencia de operación", functionId: null, tag: "create", note: null },
      { id: "5", kind: "asset", label: "Marca reconocida", functionId: "marketing", tag: null, note: null },
    ];
    const gap = resourceGap(input);
    expect(gap.toCreate.map((entry) => entry.label)).toEqual(["Red de almacenes", "Licencia de operación"]);
    expect(gap.untagged).toHaveLength(1);
    // Dos de cuatro etiquetadas hay que crearlas y una adaptarla: (2 + 0.5) / 4.
    expect(gap.creationLoad).toBeCloseTo(0.625, 3);
  });

  it("no calcula carga de creación sin capacidades etiquetadas", () => {
    expect(resourceGap(emptyPositioningInput()).creationLoad).toBeNull();
  });
});

describe("avisos de coherencia", () => {
  it("bloquea mientras no se declare la liability of foreignness", () => {
    const warnings = positioningWarnings(emptyPositioningInput());
    const blocker = warnings.find((warning) => warning.id === "liability_of_foreignness");
    expect(blocker?.severity).toBe("block");
    expect(blocker?.provenance).toBe("p. 198");
  });

  it("señala una propuesta estandarizada gestionada país a país", () => {
    const input = emptyPositioningInput();
    input.scope = "broad";
    input.advantage = "cost";
    input.standardization = "standardized";
    input.valueChain = {
      rnd: { current: "local", target: "local" },
      sourcing_production: { current: "local", target: "local" },
      marketing: { current: "local", target: "local" },
      customer_services: { current: "local", target: "local" },
      finances: { current: "local", target: "local" },
      hrm: { current: "local", target: "local" },
    };
    const ids = positioningWarnings(input).map((warning) => warning.id);
    expect(ids).toContain("standardized_but_multilocal");
    expect(ids).toContain("cost_without_integration");
  });

  it("no da el módulo por completo con capacidades sin etiquetar", () => {
    const input = yellowTail();
    input.positioningRationale = "Nicho de no consumidores de vino, precio asequible y marca simple.";
    input.tac = [{ id: "1", kind: "asset", label: "Marca", functionId: "marketing", tag: null, note: null }];
    const completeness = positioningCompleteness(input);
    expect(completeness.complete).toBe(false);
    expect(completeness.missing).toContain("Transfer-Adapt-Create sin capacidades sin etiquetar");
  });
});
