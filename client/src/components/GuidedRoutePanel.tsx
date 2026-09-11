import { useMemo, useState } from "react";
import { BookOpen, Check, ChevronDown, ChevronRight, Circle, Compass, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { evaluateRoute, type RouteSnapshot, type StepState } from "@shared/domain/guidedRoute";
import { useLanguage } from "@/i18n";

/**
 * La ruta guiada, encima de las pestañas.
 *
 * Responde en todo momento a «¿qué hago ahora?» y, para el paso actual, a las tres
 * preguntas que un aprendiz necesita: qué se decide, por qué importa y qué aspecto tiene
 * una respuesta buena. No bloquea nada: las pestañas siguen accesibles y quien sepa lo que
 * busca puede ignorar la ruta entera.
 */

type Props = {
  caseId: number | null;
  /** Estado del formulario de escenario, que vive en la página y no en la base. */
  scenario: {
    briefComplete: boolean;
    candidateCount: number;
    screenedCount: number;
    assessedCountries: number;
    financialReady: boolean;
    hasResult: boolean;
    approvalCount: number;
  };
  onGo: (target: StepState["step"]["target"], subTab?: StepState["step"]["subTab"]) => void;
};

export function GuidedRoutePanel({ caseId, scenario, onGo }: Props) {
  const { t, ui } = useLanguage();
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const enabled = caseId !== null;
  const caseQuery = trpc.case.get.useQuery({ caseId: caseId ?? 0 }, { enabled });
  const evidenceQuery = trpc.case.listEvidence.useQuery({ caseId: caseId ?? 0 }, { enabled });
  const ambition = trpc.globalStrategy.getAmbition.useQuery({ caseId: caseId ?? 0 }, { enabled });
  const positioning = trpc.globalStrategy.getPositioning.useQuery({ caseId: caseId ?? 0 }, { enabled });
  const entry = trpc.globalStrategy.getEntryStrategy.useQuery({ caseId: caseId ?? 0 }, { enabled });
  const partnering = trpc.globalStrategy.getPartnering.useQuery({ caseId: caseId ?? 0 }, { enabled });

  const route = useMemo(() => {
    const snapshot: RouteSnapshot = {
      caseId,
      hasDecisionQuestion: Boolean((caseQuery.data?.decisionQuestion ?? "").trim()),
      documentCount: caseQuery.data?.documents.length ?? 0,
      acceptedEvidenceCount: (evidenceQuery.data ?? []).filter((item) => item.status === "accepted").length,
      briefComplete: scenario.briefComplete,
      ambition: ambition.data?.completeness ?? null,
      ambitionIndicesReady: ambition.data?.indices.gri !== null && ambition.data?.indices.gci !== null,
      positioning: positioning.data?.completeness ?? null,
      valueChainReady:
        (positioning.data?.valueChain.answered ?? 0) === (positioning.data?.valueChain.total ?? 6) &&
        (positioning.data?.resourceGap.untagged.length ?? 1) === 0 &&
        (positioning.data?.input.tac.length ?? 0) > 0,
      candidateCount: scenario.candidateCount,
      screenedCount: scenario.screenedCount,
      assessedCountries: scenario.assessedCountries,
      entry: entry.data?.completeness ?? null,
      partnering: partnering.data?.completeness ?? null,
      financialReady: scenario.financialReady,
      hasResult: scenario.hasResult,
      approvalCount: scenario.approvalCount,
    };
    return evaluateRoute(snapshot);
  }, [caseId, caseQuery.data, evidenceQuery.data, ambition.data, positioning.data, entry.data, partnering.data, scenario]);

  const current = route.current;
  const visible = showAll ? route.steps : route.steps.filter((state) => state.status !== "done" || state.step.order >= (current?.step.order ?? 13) - 1);

  return (
    <Card className="guided-route">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ui("routeEyebrow")}</span>
            <Badge variant="outline">{route.doneCount} {ui("routeOf")} {route.total} {ui("routeProgress")}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAll((value) => !value)}>{showAll ? ui("routeShowPending") : ui("routeShowAll")}</Button>
            <Button variant="ghost" size="sm" aria-label={open ? ui("routeCollapse") : ui("routeExpand")} onClick={() => setOpen((value) => !value)}>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${(route.doneCount / route.total) * 100}%` }} />
        </div>

        {open && (
          <>
            {current ? (
              <div className="mt-5 rounded-md border bg-muted/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{ui("routeStep")} {current.step.order}</Badge>
                  <h3 className="text-base font-semibold">{t(current.step.title)}</h3>
                </div>

                <p className="mt-2 text-sm"><strong>{ui("routeWhatYouDecide")}</strong> {t(current.step.decision)}</p>
                <p className="mt-1 text-sm text-muted-foreground"><strong className="text-foreground">{ui("routeWhyItMatters")}</strong> {t(current.step.why)}</p>

                <div className="mt-3 flex gap-2 rounded-md border-l-2 border-muted-foreground/40 bg-background/60 p-3 text-sm">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p>{t(current.step.example.text)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{current.step.example.source}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground">{ui("routeGoodAnswer")}</div>
                    <ul className="mt-1 space-y-1 text-sm">
                      {current.step.quality.map((item) => (
                        <li key={item.es} className="flex gap-2"><Target className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" />{t(item)}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground">{ui("routeStillMissing")}</div>
                    <ul className="mt-1 space-y-1 text-sm">
                      {current.missing.length ? current.missing.map((item) => <li key={item.es}>{t(item)}</li>) : <li className="text-muted-foreground">{ui("routeNothingMissing")}</li>}
                    </ul>
                    {current.progress !== null && (
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary/70" style={{ width: `${current.progress * 100}%` }} />
                      </div>
                    )}
                  </div>
                </div>

                <Button className="mt-4" onClick={() => onGo(current.step.target, current.step.subTab)}>
                  {ui("routeGoToStep")} {current.step.order}
                </Button>
              </div>
            ) : (
              <div className="mt-5 rounded-md border bg-muted/40 p-4 text-sm">
<strong>{ui("routeComplete")}</strong> {ui("routeCompleteDetail")}
              </div>
            )}

            <ol className="mt-4 space-y-1">
              {visible.map((state) => (
                <li key={state.step.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${state.status === "in_progress" ? "font-medium" : ""}`}
                    onClick={() => onGo(state.step.target, state.step.subTab)}
                  >
                    {state.status === "done" ? (
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className={`h-4 w-4 shrink-0 ${state.status === "in_progress" ? "text-primary" : "text-muted-foreground/40"}`} />
                    )}
                    <span className="w-6 shrink-0 tabular-nums text-muted-foreground">{state.step.order}</span>
                    <span className={state.status === "done" ? "text-muted-foreground line-through" : ""}>{t(state.step.title)}</span>
                    {state.status !== "done" && state.progress !== null && (
                      <span className="ml-auto text-xs text-muted-foreground">{Math.round(state.progress * 100)}%</span>
                    )}
                  </button>
                </li>
              ))}
            </ol>

            {!enabled && (
              <p className="mt-3 text-xs text-muted-foreground">
{ui("routeNoCase")}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
