import { toast } from "sonner";
import { FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/i18n";
import { buildDecisionMemo, type MemoAssumption, type MemoInput } from "@shared/domain/decisionMemo";
import { trpc } from "@/lib/trpc";
import { industry } from "@shared/domain/industries";
import type { Localized } from "@shared/i18n";

/**
 * El memo en pantalla.
 *
 * Pinta exactamente el mismo objeto que imprime el PDF, así que las dos superficies no pueden
 * decir cosas distintas. Se muestra siempre que haya tesis, incluso incompleta: una sección
 * vacía con su motivo escrito es información, y esconderla haría que un memo a medias
 * pareciese terminado.
 */

export function DecisionMemoPanel({ input }: { input: MemoInput | null }) {
  const { lang, ui } = useLanguage();

  if (!input) {
    return (
      <Card className="memo-card">
        <CardHeader>
          <CardTitle>{ui("dmTitle")}</CardTitle>
          <CardDescription>{ui("dmDesc")}</CardDescription>
        </CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">{ui("dmNoThesis")}</p></CardContent>
      </Card>
    );
  }

  const memo = buildDecisionMemo(input, lang);

  async function download() {
    try {
      const { downloadDecisionMemoPdf } = await import("@/lib/decisionMemoPdf");
      downloadDecisionMemoPdf(memo);
      toast.success(ui("dmDownloaded"));
    } catch {
      toast.error(ui("dmFailed"));
    }
  }

  return (
    <Card className="memo-card">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{ui("dmTitle")}</CardTitle>
            <CardDescription>{ui("dmDesc")}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={download}>
            <FileDown className="mr-2 h-4 w-4" /> {ui("dmDownload")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="memo-sheet">
          <div className="memo-head">
            <h3>{memo.subtitle || memo.title}</h3>
            <div className="memo-status">
              <Badge variant="outline">{memo.statusLabel}</Badge>
              <span>{memo.headline}</span>
            </div>
          </div>

          {memo.sections.map((section) => (
            <section className="memo-section" key={section.id}>
              <h4>{section.title}</h4>
              {section.lines.length === 0 ? (
                <p className="memo-empty">{section.emptyNote}</p>
              ) : (
                <ul>
                  {section.lines.map((line, index) => (
                    <li key={index} className={line.tone === "alert" ? "memo-alert" : ""}>
                      <span className="memo-line">
                        {line.text}
                        {line.owner && <em className="memo-owner">— {line.owner}</em>}
                      </span>
                      {line.detail && <small>{line.detail}</small>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <p className="memo-footer">{memo.footer}</p>
        </div>
      </CardContent>
    </Card>
  );
}


/**
 * El contenedor: recoge la tesis del servidor y la economía del análisis, y compone el memo.
 *
 * La composición vive aquí y no en el panel porque el panel solo pinta, y no en el servidor
 * porque la mitad de las piezas —el caso económico, el mapa de competidores— viven en la
 * evaluación del escenario, que es estado del cliente.
 */
export function DecisionMemoSection({
  caseId,
  countryNameFor,
  economicsFor,
  marketFor,
}: {
  caseId: number;
  countryNameFor: (countryCode: string | null) => string | null;
  economicsFor: (countryCode: string | null) => Localized | null;
  marketFor: (countryCode: string | null) => Localized[];
}) {
  const query = trpc.globalStrategy.getThesis.useQuery({ caseId });
  const reference = trpc.globalStrategy.reference.useQuery();

  if (query.isLoading || !query.data || !reference.data) return null;
  const { thesis, verdict, blindSpots, chain } = query.data;
  if (verdict.status === "not_stated") return <DecisionMemoPanel input={null} />;

  const ownerFor = (test: string) => {
    const approver = chain.find((entry) => entry.test === test);
    return approver ? approver.role : null;
  };

  const toAssumption = (entry: (typeof verdict.critical)[number]): MemoAssumption => ({
    claim: entry.slot.claim,
    owner: ownerFor(entry.slot.test),
    belief: entry.answer.belief,
    confidence: entry.answer.confidence,
    evidence: entry.answer.evidence,
    falsifier: entry.answer.falsifier,
  });

  const mode = industry(thesis.industryId).modes.find((entry) => entry.key === thesis.modeKey)?.label ?? null;

  const input: MemoInput = {
    company: thesis.company,
    countryName: countryNameFor(thesis.countryCode),
    product: thesis.product,
    stance: reference.data.thesisStances.find((entry) => entry.id === thesis.stance)?.label ?? null,
    entryKind: reference.data.entryKinds.find((entry) => entry.id === thesis.entryKind)?.label ?? null,
    mode,
    horizonMonths: thesis.horizonMonths,
    commitment: thesis.commitment,
    reasons: thesis.reasons,
    returnThresholdPct: thesis.groupConstraint.returnThresholdPct,
    status: verdict.status,
    headline: verdict.headline,
    killPairs: verdict.killPairs.map((pair) => ({
      claim: pair.assumption.slot.claim,
      owner: pair.approver.role,
      falsifier: pair.assumption.answer.falsifier,
    })),
    openCritical: verdict.critical.filter((entry) => !entry.answered).map(toAssumption),
    answeredCritical: verdict.critical.filter((entry) => entry.answered).map(toAssumption),
    blindSpots: blindSpots.map((spot) => ({ severity: spot.severity, title: spot.title, detail: spot.detail })),
    exclusions: verdict.exclusions.map((exclusion) => ({ reason: exclusion.reason })),
    economics: economicsFor(thesis.countryCode),
    market: marketFor(thesis.countryCode),
    generatedAt: new Date().toISOString(),
  };

  return <DecisionMemoPanel input={input} />;
}
