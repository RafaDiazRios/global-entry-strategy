import { CheckCircle2, Circle, Compass, Globe2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/i18n";
import { DATA_ORIGINS, preparationChecklist, summarisePreparation } from "@shared/domain/preparation";

/**
 * La pantalla de preparación.
 *
 * Es lo primero que se ve y lo único que se puede leer antes de tener nada. No pide ningún
 * dato: dice cuáles va a hacer falta pedir, a quién, y cuántos de ellos hay que conseguir
 * una vez por cada país, que es el número que nadie calcula a tiempo.
 *
 * Las casillas se guardan con el caso. No desbloquean ni bloquean nada —marcar una casilla
 * no hace que exista el dato— pero convierten una lista en un encargo repartible, que es
 * para lo que sirve de verdad.
 */

type Props = {
  gathered: string[];
  onToggle: (itemId: string, next: boolean) => void;
  canEdit: boolean;
  candidateCount: number;
  onStart: () => void;
};

export function PreparationPanel({ gathered, onToggle, canEdit, candidateCount, onStart }: Props) {
  const { t, ui } = useLanguage();
  const groups = preparationChecklist();
  const summary = summarisePreparation({ gathered });

  return (
    <div className="preparation space-y-5">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ui("prepEyebrow")}</span>
          </div>
          <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-[#183c2e]">{ui("prepTitle")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{ui("prepIntro")}</p>

          <div className="prep-summary">
            <div>
              <span>{ui("prepGathered")}</span>
              <strong>{summary.gathered} {ui("prepOf")} {summary.total}</strong>
            </div>
            <div>
              <span>{ui("prepPendingFieldwork")}</span>
              <strong>{summary.pendingFieldwork}</strong>
            </div>
            <div>
              <span>{ui("prepPendingPublic")}</span>
              <strong>{summary.pendingPublic}</strong>
            </div>
            <div>
              <span>{ui("prepPerCountry")}</span>
              <strong>
                {summary.perCountryCount}
                {candidateCount > 0 && <em> × {candidateCount} = {summary.perCountryCount * candidateCount}</em>}
              </strong>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">{ui("prepCalendarNote")}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={onStart}><Globe2 className="mr-2 h-4 w-4" /> {ui("prepGoToRoute")}</Button>
            {!canEdit && <span className="text-xs text-muted-foreground">{ui("prepSignIn")}</span>}
          </div>
        </CardContent>
      </Card>

      {groups.map((group) => (
        <Card key={group.id}>
          <CardContent className="pt-6">
            <h3 className="prep-group-title">{t(group.label)}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t(group.intro)}</p>

            <ul className="prep-list">
              {group.items.map((item) => {
                const done = gathered.includes(item.id);
                const origin = DATA_ORIGINS.find((entry) => entry.id === item.origin);
                return (
                  <li key={item.id} className={done ? "is-done" : ""}>
                    <button
                      type="button"
                      className="prep-check"
                      disabled={!canEdit}
                      aria-label={`${ui("prepMarkGathered")}: ${t(item.what)}`}
                      aria-pressed={done}
                      onClick={() => onToggle(item.id, !done)}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </button>
                    <div className="prep-body">
                      <div className="prep-what">
                        <span>{t(item.what)}</span>
                        {origin && <Badge variant="outline" className="prep-origin" title={t(origin.help)}>{t(origin.label)}</Badge>}
                        {item.perCountry && <Badge variant="outline" className="prep-percountry">{ui("prepPerCountryTag")}</Badge>}
                      </div>
                      <small>{t(item.where)}</small>
                      <small className="prep-needed">
                        {ui("prepNeededBy")} {item.neededBy.length} {item.neededBy.length === 1 ? ui("prepStepCount") : ui("prepStepsCount")}
                        {": "}
                        {item.neededBy.map((step) => `${step.order}. ${t(step.title)}`).join(" · ")}
                      </small>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
