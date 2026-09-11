/**
 * Motor de coherencia entre módulos.
 *
 * Cada módulo ya vigila sus propias contradicciones. Lo que nadie comprobaba hasta ahora es
 * si los cinco dicen lo mismo: que la ambición declarada tenga consecuencias en los países
 * elegidos, que el modo de entrada sirva al objetivo que se declaró, que lo que el
 * Transfer-Adapt-Create marcó como «crear» se haya resuelto después, y que la vía de acceso
 * no contradiga la fase de la ventana.
 *
 * Las trece reglas son cruces entre módulos, no repeticiones de lo que ya avisa cada uno.
 * Cada una lleva la página del libro de la que sale la incompatibilidad.
 */

import { loc, type Localized } from "../i18n";
import type { AmbitionInput } from "./globalAmbition";
import type { PositioningInput } from "./globalPositioning";
import type { EntryStrategyInput } from "./entryStrategy";
import type { PartneringInput } from "./partnering";

export type ModuleKey = "ambition" | "positioning" | "entry" | "partnering";

export type CoherenceSeverity = "block" | "warn" | "info";

export type CoherenceFinding = {
  id: string;
  severity: CoherenceSeverity;
  /** Los módulos que se contradicen. La interfaz los usa para llevar al usuario allí. */
  modules: ModuleKey[];
  title: Localized;
  detail: Localized;
  provenance: Localized;
};

export type CaseDossier = {
  ambition: AmbitionInput | null;
  positioning: PositioningInput | null;
  entry: EntryStrategyInput | null;
  partnering: PartneringInput | null;
};

/** Peso de cada módulo en el índice de exhaustividad. Suman 100. */
export const MODULE_WEIGHTS: Record<ModuleKey, number> = {
  ambition: 20,
  positioning: 25,
  entry: 30,
  partnering: 25,
};

export const MODULE_LABELS: Record<ModuleKey, Localized> = {
  ambition: loc("Ambición global", "Global ambition"),
  positioning: loc("Posicionamiento", "Positioning"),
  entry: loc("Estrategia de entrada", "Entry strategy"),
  partnering: loc("Vía de acceso y socio", "Access route and partner"),
};
