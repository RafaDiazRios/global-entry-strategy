/**
 * La preparación: qué hay que reunir antes de empezar.
 *
 * Un análisis de entrada se atasca casi siempre por el mismo sitio, y no es el análisis.
 * Es que a mitad de la fase 5 alguien descubre que necesita las ventas por región, las pide,
 * y se le va una semana. La ruta guiada dice en cada paso qué hace falta, que está bien para
 * avanzar y es inútil para preparar: nadie va a leer doce pasos antes de la primera reunión.
 *
 * Esta lista es la misma información leída al revés. En vez de por paso, agrupada por de
 * quién habla el dato, que es como se consigue de verdad: una conversación con control de
 * gestión, otra con finanzas, una tarde de escritorio y una llamada a alguien del mercado.
 *
 * No se declara aparte. Se deriva de lo que cada paso dice necesitar, y por eso no puede
 * quedarse desfasada: si mañana un paso pide un dato nuevo, aparece aquí solo.
 *
 * Lo que sí añade es lo que la vista por pasos no puede decir: cuántos pasos dependen de un
 * dato —los que sostienen tres cosas se piden primero— y si hay que conseguirlo una vez o
 * una vez por país, que multiplica el trabajo y nadie lo calcula a tiempo.
 */

import { DATA_ORIGINS, DATA_SUBJECTS, GUIDED_STEPS, type DataOrigin, type DataSubject, type StepId } from "./guidedRoute";
import type { Localized } from "../i18n";

export type PreparationItem = {
  id: string;
  about: DataSubject;
  what: Localized;
  origin: DataOrigin;
  where: Localized;
  perCountry: boolean;
  /** Qué pasos lo piden. Cuantos más, antes hay que conseguirlo. */
  neededBy: { id: StepId; order: number; title: Localized }[];
};

export type PreparationGroup = {
  id: DataSubject;
  label: Localized;
  intro: Localized;
  items: PreparationItem[];
};

/**
 * Un dato que piden dos pasos aparece una vez, con los dos pasos anotados. Repetirlo haría
 * la lista más larga y menos útil, y sugeriría un trabajo que no existe.
 */
export function preparationChecklist(): PreparationGroup[] {
  const byId = new Map<string, PreparationItem>();

  for (const step of GUIDED_STEPS) {
    for (const data of step.bring) {
      const existing = byId.get(data.id);
      if (existing) {
        existing.neededBy.push({ id: step.id, order: step.order, title: step.title });
        existing.perCountry = existing.perCountry || Boolean(data.perCountry);
        continue;
      }
      byId.set(data.id, {
        id: data.id,
        about: data.about,
        what: data.what,
        origin: data.origin,
        where: data.where,
        perCountry: Boolean(data.perCountry),
        neededBy: [{ id: step.id, order: step.order, title: step.title }],
      });
    }
  }

  const items = Array.from(byId.values());
  return DATA_SUBJECTS.map((subject) => ({
    id: subject.id,
    label: subject.label,
    intro: subject.intro,
    items: items
      .filter((item) => item.about === subject.id)
      // Lo que sostiene más pasos va primero: es lo que más cuesta si llega tarde.
      .sort((a, b) => b.neededBy.length - a.neededBy.length || a.neededBy[0].order - b.neededBy[0].order),
  })).filter((group) => group.items.length > 0);
}

export const PREPARATION_ITEM_IDS = preparationChecklist().flatMap((group) => group.items.map((item) => item.id));

export type PreparationProgress = { gathered: string[] };

export function emptyPreparation(): PreparationProgress {
  return { gathered: [] };
}

export type PreparationSummary = {
  total: number;
  gathered: number;
  /** Lo que hay que conseguir una vez por país: multiplica con el número de candidatos. */
  perCountryCount: number;
  /** Cuánto de lo que falta se descarga solo, que es la parte barata. */
  pendingPublic: number;
  /** Cuánto de lo que falta exige salir a preguntar. Es la que marca el calendario. */
  pendingFieldwork: number;
};

const FIELDWORK: DataOrigin[] = ["field_research", "company", "group_decision"];

export function summarisePreparation(progress: PreparationProgress): PreparationSummary {
  const items = preparationChecklist().flatMap((group) => group.items);
  const pending = items.filter((item) => !progress.gathered.includes(item.id));
  return {
    total: items.length,
    gathered: items.length - pending.length,
    perCountryCount: items.filter((item) => item.perCountry).length,
    pendingPublic: pending.filter((item) => item.origin === "public_source").length,
    pendingFieldwork: pending.filter((item) => FIELDWORK.includes(item.origin)).length,
  };
}

/** Los identificadores que existen de verdad, para descartar basura al leer lo guardado. */
export function sanitisePreparation(progress: Partial<PreparationProgress> | null | undefined): PreparationProgress {
  const known = new Set(PREPARATION_ITEM_IDS);
  return { gathered: (progress?.gathered ?? []).filter((id) => known.has(id)) };
}

export { DATA_ORIGINS, DATA_SUBJECTS };
