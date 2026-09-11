import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Info, Loader2, Save, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { useLanguage } from "@/i18n";
import type { AssumptionAnswer, Belief } from "@shared/domain/assumptionMap";
import { readEconomics } from "@shared/domain/economicsReading";

/**
 * Lo que el tablero necesita saber del caso económico para poder enseñar la lectura del
 * modelo junto al supuesto. Llega como función y no como dato porque quién es el país lo
 * decide la tesis, y la tesis la conoce este componente, no el que lo monta.
 */
export type EconomicsLookup = (countryCode: string | null) => {
  npv: number | null;
  roiPct: number | null;
  currency: string | null;
  action: "advance" | "test" | "discard" | "insufficient_data";
  stackDeclared: boolean;
} | null;

/**
 * El tablero de supuestos: la superficie de trabajo del modo trabajo.
 *
 * Ocupa el mismo sitio que la ruta guiada porque cumple el mismo papel —decir qué toca ahora—
 * con la diferencia de que aquí lo que toca no lo fija el orden del libro sino de qué depende
 * la tesis. Un caso con tesis enunciada enseña esto; uno sin ella, la ruta.
 *
 * La pregunta que organiza la pantalla es una sola: qué supuesto, si es falso, hace que quién
 * te lo tumbe.
 */

const select =
  "h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type Analysis = RouterOutputs["globalStrategy"]["getThesis"];
type Resolved = Analysis["verdict"]["critical"][number];

export function AssumptionBoard({ caseId, onGoToThesis, economicsFor }: { caseId: number; onGoToThesis?: () => void; economicsFor?: EconomicsLookup }) {
  const { t, ui } = useLanguage();
  const utils = trpc.useUtils();
  const query = trpc.globalStrategy.getThesis.useQuery({ caseId });
  const [answers, setAnswers] = useState<AssumptionAnswer[]>([]);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(true);
  const [showShaping, setShowShaping] = useState(false);

  useEffect(() => {
    if (query.data && !dirty) setAnswers(query.data.answers);
  }, [query.data, dirty]);

  const save = trpc.globalStrategy.saveThesis.useMutation({
    onSuccess: () => {
      setDirty(false);
      utils.globalStrategy.getThesis.invalidate({ caseId });
      toast.success(ui("thToastSaved"));
    },
    onError: (error) => toast.error(error.message),
  });

  if (query.isLoading || !query.data) return null;
  const { verdict, blindSpots, chain, thesis } = query.data;
  const economics: EconomicsContext | null = economicsFor
    ? { figures: economicsFor(thesis.countryCode), returnThresholdPct: thesis.groupConstraint.returnThresholdPct }
    : null;

  // Sin tesis enunciada el tablero no tiene nada que decir: manda la ruta guiada.
  if (verdict.status === "not_stated") return null;

  function patch(slotId: string, change: Partial<AssumptionAnswer>) {
    setAnswers((current) => {
      const existing = current.find((entry) => entry.slotId === slotId);
      const next: AssumptionAnswer = {
        slotId,
        belief: "unknown",
        confidence: null,
        evidence: null,
        falsifier: null,
        ...existing,
        ...change,
      };
      return [...current.filter((entry) => entry.slotId !== slotId), next];
    });
    setDirty(true);
  }

  const statusLabel =
    verdict.status === "blocked" ? ui("abStatusBlocked") : verdict.status === "at_risk" ? ui("abStatusAtRisk") : ui("abStatusClear");

  return (
    <section className="mb-6 rounded-lg border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{ui("abEyebrow")}</div>
          <p className="mt-1 text-sm">{t(verdict.headline)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={verdict.status === "blocked" ? "destructive" : verdict.status === "at_risk" ? "outline" : "default"}>
            {statusLabel}
          </Badge>
          {onGoToThesis && (
            <Button variant="ghost" size="sm" onClick={onGoToThesis}>{ui("abGoToCase")}</Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setOpen((current) => !current)} aria-label={open ? ui("abCollapse") : ui("abExpand")}>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {open && (
        <div className="space-y-5 border-t p-4">
          {verdict.killPairs.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <div className="text-xs font-semibold uppercase text-destructive">{ui("abKillPairs")}</div>
              <ul className="mt-2 space-y-1 text-sm">
                {verdict.killPairs.map((pair, index) => (
                  <li key={`${pair.assumption.slot.id}-${index}`}>
                    <strong>{t(pair.approver.role)}</strong> · {t(pair.assumption.slot.claim)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <AssumptionList
            title={ui("abCritical")}
            assumptions={verdict.critical}
            chain={chain}
            onPatch={patch}
            answers={answers}
            economics={economics}
          />

          {verdict.shaping.length > 0 && (
            <div>
              <Button variant="outline" size="sm" onClick={() => setShowShaping((current) => !current)}>
                {ui("abShaping")} ({verdict.shaping.length})
              </Button>
              {showShaping && (
                <div className="mt-3">
                  <AssumptionList title="" assumptions={verdict.shaping} chain={chain} onPatch={patch} answers={answers} economics={economics} />
                </div>
              )}
            </div>
          )}

          {verdict.unowned.length > 0 && (
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <ShieldAlert className="h-3.5 w-3.5" /> {ui("abGovernanceGap")}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{ui("abGovernanceGapHelp")}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {verdict.unowned.map((entry) => <li key={entry.slot.id}>{t(entry.slot.claim)}</li>)}
              </ul>
            </div>
          )}

          {blindSpots.length > 0 && (
            <div className="rounded-md border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">{ui("abBlindSpots")}</div>
              <ul className="mt-2 space-y-2 text-sm">
                {blindSpots.map((spot) => (
                  <li key={spot.id} className="flex gap-2">
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${spot.severity === "block" ? "text-destructive" : "text-amber-500"}`} />
                    <div>
                      <strong>{t(spot.title)}</strong>
                      <p className="text-muted-foreground">{t(spot.detail)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">{ui("abChain")}</div>
              <p className="mt-1 text-xs text-muted-foreground">{ui("abChainHelp")}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {verdict.verdicts.map((entry) => (
                  <li key={entry.approver.id} className="flex items-center justify-between gap-2">
                    <span>
                      {t(entry.approver.role)}
                      {entry.approver.authority === "veto" && <span className="ml-1 text-xs text-destructive">·&nbsp;{ui("coBlocks")}</span>}
                    </span>
                    <Badge variant={entry.status === "fails" ? "destructive" : entry.status === "clear" ? "default" : "outline"} className="text-[11px]">
                      {entry.status === "fails" ? ui("abFails") : entry.status === "at_risk" ? ui("abAtRisk") : entry.status === "clear" ? ui("abClear") : ui("abNotTested")}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>

            {verdict.exclusions.length > 0 && (
              <div className="rounded-md border p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">{ui("abOutOfScope")}</div>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {verdict.exclusions.map((exclusion) => <li key={exclusion.area}>{t(exclusion.reason)}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => save.mutate({ caseId, payload: { thesis, answers } })} disabled={!dirty || save.isPending}>
              {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {dirty ? ui("gsSave") : ui("gsSaved")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

type EconomicsContext = {
  figures: ReturnType<EconomicsLookup>;
  returnThresholdPct: number | null;
};

function AssumptionList({
  title,
  assumptions,
  chain,
  answers,
  onPatch,
  economics,
}: {
  title: string;
  assumptions: Resolved[];
  chain: Analysis["chain"];
  answers: AssumptionAnswer[];
  economics: EconomicsContext | null;
  onPatch: (slotId: string, change: Partial<AssumptionAnswer>) => void;
}) {
  const { t, ui } = useLanguage();
  // Las etiquetas de creencia y consecuencia salen del dominio, no de una copia aquí: si
  // alguien añade un valor, aparece solo.
  const reference = trpc.globalStrategy.reference.useQuery();
  if (!assumptions.length || !reference.data) return null;
  const { beliefs, consequences } = reference.data;

  return (
    <div className="space-y-3">
      {title && <div className="text-xs font-semibold uppercase text-muted-foreground">{title}</div>}
      {assumptions.map((entry) => {
        const answer = answers.find((candidate) => candidate.slotId === entry.slot.id) ?? entry.answer;
        const owner = chain.find((approver) => approver.test === entry.slot.test) ?? null;
        const missingFalsifier = answer.belief !== "unknown" && !(answer.falsifier ?? "").trim();
        return (
          <div key={entry.slot.id} className="rounded-md border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-sm font-medium">{t(entry.slot.claim)}</p>
              <Badge variant={entry.slot.consequence === "dies" ? "destructive" : "outline"} className="text-[11px]">
                {t(consequences.find((option) => option.id === entry.slot.consequence)?.label)}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {ui("abOwner")}: {owner ? t(owner.role) : ui("abNoOwner")} · {t(entry.slot.provenance)}
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-[9rem_6rem_1fr]">
              <div>
                <Label className="text-xs">{ui("abBelief")}</Label>
                <select
                  className={select}
                  value={answer.belief}
                  onChange={(event) => onPatch(entry.slot.id, { belief: event.target.value as Belief })}
                >
                  {beliefs.map((option) => <option key={option.id} value={option.id}>{t(option.label)}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">{ui("abConfidence")}</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  min={0}
                  max={4}
                  value={answer.confidence ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    const value = raw === "" ? null : Math.max(0, Math.min(4, Number(raw)));
                    onPatch(entry.slot.id, { confidence: Number.isNaN(value as number) ? null : value });
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">{ui("abEvidence")}</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder={ui("abEvidencePh")}
                  value={answer.evidence ?? ""}
                  onChange={(event) => onPatch(entry.slot.id, { evidence: event.target.value || null })}
                />
              </div>
            </div>

            <div className="mt-2">
              <Label className="text-xs">{ui("abFalsifier")}</Label>
              <Input
                className="h-8 text-xs"
                placeholder={ui("abFalsifierPh")}
                value={answer.falsifier ?? ""}
                onChange={(event) => onPatch(entry.slot.id, { falsifier: event.target.value || null })}
              />
              {missingFalsifier && <p className="mt-1 text-xs text-amber-600">{ui("abFalsifierMissing")}</p>}
            </div>

            {/* La lectura del modelo solo existe para el supuesto que el modelo sabe calcular. */}
            {entry.slot.id === "economics_holds" && economics?.figures && (() => {
              const reading = readEconomics({
                npv: economics.figures.npv,
                roiPct: economics.figures.roiPct,
                currency: economics.figures.currency,
                returnThresholdPct: economics.returnThresholdPct,
                action: economics.figures.action,
                stackDeclared: economics.figures.stackDeclared,
                belief: answer.belief,
              });
              const tone =
                reading.verdict === "contradicts" ? "text-rose-700" : reading.verdict === "supports" ? "text-emerald-700" : "text-muted-foreground";
              return (
                <div className="mt-3 rounded-md bg-muted/40 p-2">
                  <p className={`text-xs font-medium ${tone}`}>
                    {ui("erTitle")} · {ui(reading.verdict === "contradicts" ? "erContradicts" : reading.verdict === "supports" ? "erSupports" : "erSilent")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(reading.note)}</p>
                  {reading.conflictsWithBelief && (
                    <p className="mt-1 text-xs font-medium text-rose-700">{ui("erConflict")}</p>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
