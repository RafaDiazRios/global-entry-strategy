import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  assessmentBlocks,
  assessmentScaleMax,
  incentiveFamilies,
  incentiveWeightNote,
  itemPath,
  lifeCycleClusters,
  sustainabilityChecks,
  type AssessmentBlock,
  type AssessmentBlockKey,
  type AssessmentValue,
  type LifeCycleCluster,
} from "@shared/domain/countryAssessment";
import { useLanguage } from "@/i18n";
import type { Localized } from "@shared/i18n";

/**
 * Panel de evaluación detallada del capítulo 6.
 *
 * Se genera enteramente a partir de `shared/domain/countryAssessment`: añadir una dimensión
 * al marco la hace aparecer aquí sin tocar este componente.
 */

export type CountryAssessmentState = {
  ratings: Record<string, AssessmentValue>;
  notes: Record<string, string>;
  incentives: string[];
  sustainabilityConcerns: string[];
  lifeCycleCluster: LifeCycleCluster | null;
  easeOfDoingBusinessScore: number | null;
};

export const emptyAssessment: CountryAssessmentState = {
  ratings: {},
  notes: {},
  incentives: [],
  sustainabilityConcerns: [],
  lifeCycleCluster: null,
  easeOfDoingBusinessScore: null,
};

export function assessmentProgress(assessment: CountryAssessmentState) {
  const total = assessmentBlocks.reduce((sum, block) => sum + block.groups.reduce((groupSum, group) => groupSum + group.items.length, 0), 0);
  const assessed = Object.values(assessment.ratings).filter((value) => value !== null && value !== undefined).length;
  return { assessed, total, pct: total === 0 ? 0 : Math.round((assessed / total) * 100) };
}

function blockProgress(assessment: CountryAssessmentState, block: AssessmentBlock) {
  const items = block.groups.flatMap((group) => group.items.map((item) => itemPath(block.key, group.key, item.key)));
  const assessed = items.filter((path) => assessment.ratings[path] !== null && assessment.ratings[path] !== undefined).length;
  return { assessed, total: items.length };
}

const scaleValues = Array.from({ length: assessmentScaleMax + 1 }, (_, index) => index);

export type BlockProposal = {
  ratings: { itemPath: string; value: number; rationale: string; evidenceQuotes: string[] }[];
  discarded: { reason: string; itemPath: string }[];
  unresolved: string[];
};

export type BlockObjection = { itemPath: string | null; objection: string; severity: string };

type Props = {
  countryName: Localized | string;
  assessment: CountryAssessmentState;
  onChange: (next: CountryAssessmentState) => void;
  /** Propuesta del copiloto para un bloque. Ausente cuando no hay documento de caso activo. */
  onSuggestBlock?: (blockKey: AssessmentBlockKey) => Promise<BlockProposal | null>;
  onCritiqueBlock?: (blockKey: AssessmentBlockKey, ratings: { itemPath: string; value: number; rationale?: string | null }[]) => Promise<BlockObjection[] | null>;
};

export function CountryAssessmentPanel({ countryName, assessment, onChange, onSuggestBlock, onCritiqueBlock }: Props) {
  const { t, ui } = useLanguage();
  const progress = assessmentProgress(assessment);
  const [busyBlock, setBusyBlock] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Partial<Record<string, BlockProposal>>>({});
  const [objections, setObjections] = useState<Partial<Record<string, BlockObjection[]>>>({});

  async function requestSuggestion(blockKey: AssessmentBlockKey) {
    if (!onSuggestBlock) return;
    setBusyBlock(`suggest:${blockKey}`);
    try {
      const proposal = await onSuggestBlock(blockKey);
      setProposals((current) => ({ ...current, [blockKey]: proposal ?? undefined }));
    } finally {
      setBusyBlock(null);
    }
  }

  async function requestCritique(blockKey: AssessmentBlockKey) {
    if (!onCritiqueBlock) return;
    const block = assessmentBlocks.find((candidate) => candidate.key === blockKey);
    if (!block) return;
    const ratings = block.groups.flatMap((group) =>
      group.items
        .map((item) => ({ path: itemPath(blockKey, group.key, item.key), item }))
        .filter(({ path }) => assessment.ratings[path] !== null && assessment.ratings[path] !== undefined)
        .map(({ path }) => ({ itemPath: path, value: assessment.ratings[path] as number, rationale: assessment.notes[path] ?? null })),
    );
    setBusyBlock(`critique:${blockKey}`);
    try {
      const result = await onCritiqueBlock(blockKey, ratings);
      setObjections((current) => ({ ...current, [blockKey]: result ?? undefined }));
    } finally {
      setBusyBlock(null);
    }
  }

  /** Aplica una propuesta concreta. Nunca se aplican en bloque sin revisión. */
  function applyProposedRating(blockKey: string, rating: BlockProposal["ratings"][number]) {
    onChange({
      ...assessment,
      ratings: { ...assessment.ratings, [rating.itemPath]: rating.value },
      notes: { ...assessment.notes, [rating.itemPath]: assessment.notes[rating.itemPath] || `${rating.rationale} · ${ui("caCitation")}: «${rating.evidenceQuotes[0] ?? ""}»` },
    });
    setProposals((current) => {
      const proposal = current[blockKey];
      if (!proposal) return current;
      return { ...current, [blockKey]: { ...proposal, ratings: proposal.ratings.filter((entry) => entry.itemPath !== rating.itemPath) } };
    });
  }

  function setRating(path: string, value: number) {
    const current = assessment.ratings[path];
    // Volver a pulsar el valor elegido lo retira: sin evaluar y cero no son lo mismo.
    const next = current === value ? null : value;
    onChange({ ...assessment, ratings: { ...assessment.ratings, [path]: next } });
  }

  function setNote(path: string, note: string) {
    onChange({ ...assessment, notes: { ...assessment.notes, [path]: note } });
  }

  function toggleFromList(list: string[], key: string) {
    return list.includes(key) ? list.filter((entry) => entry !== key) : [...list, key];
  }

  return (
    <div className="assessment-panel space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="step-tag">{ui("caEyebrow")}</div>
          <p className="text-sm text-muted-foreground">
            {t(countryName)}. {ui("caIntroPre")} {assessmentScaleMax} {ui("caIntroTail")}
          </p>
        </div>
        <Badge variant={progress.pct >= 60 ? "default" : "outline"}>
          {progress.assessed}/{progress.total} {ui("caAssessed")} · {progress.pct}%
        </Badge>
      </div>

      <Accordion type="multiple" className="w-full">
        {assessmentBlocks.map((block) => {
          const blockCount = blockProgress(assessment, block);
          return (
            <AccordionItem key={block.key} value={block.key}>
              <AccordionTrigger className="text-left">
                <div className="flex w-full items-center justify-between gap-3 pr-2">
                  <span className="font-medium">{t(block.label)}</span>
                  <span className="text-xs text-muted-foreground">
                    {blockCount.assessed}/{blockCount.total} · {block.direction === "adverse" ? ui("caAdverse") : ui("caFavourable")}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="mb-3 text-sm text-muted-foreground">{t(block.intro)}</p>
                <p className="mb-4 text-xs italic text-muted-foreground">{ui("caSource")}: {t(block.source)}</p>
                <div className="space-y-6">
                  {block.groups.map((group) => (
                    <section key={group.key} className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold">{t(group.label)}</h4>
                        <p className="text-xs text-muted-foreground">{t(group.intro)}</p>
                      </div>
                      <div className="space-y-4">
                        {group.items.map((item) => {
                          const path = itemPath(block.key, group.key, item.key);
                          const value = assessment.ratings[path];
                          return (
                            <div key={item.key} className="assessment-item">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <strong className="text-sm">{t(item.label)}</strong>
                                  <p className="text-xs text-muted-foreground">{t(item.help)}</p>
                                </div>
                                <div className="flex gap-1" role="group" aria-label={t(item.label)}>
                                  {scaleValues.map((scaleValue) => (
                                    <Button
                                      key={scaleValue}
                                      type="button"
                                      size="sm"
                                      variant={value === scaleValue ? "default" : "outline"}
                                      className="h-8 w-8 p-0"
                                      aria-pressed={value === scaleValue}
                                      title={scaleValue === 0 ? t(item.anchorLow) : scaleValue === assessmentScaleMax ? t(item.anchorHigh) : undefined}
                                      onClick={() => setRating(path, scaleValue)}
                                    >
                                      {scaleValue}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                                <span>0 · {t(item.anchorLow)}</span>
                                <span className="text-right">{assessmentScaleMax} · {t(item.anchorHigh)}</span>
                              </div>
                              <Input
                                className="calibration-rationale"
                                value={assessment.notes[path] ?? ""}
                                onChange={(event) => setNote(path, event.target.value)}
                                placeholder={ui("caEvidencePlaceholder")}
                                aria-label={`${ui("caRationaleFor")} ${t(item.label)}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
                {(onSuggestBlock || onCritiqueBlock) && (
                  <div className="assessment-copilot">
                    <div className="flex flex-wrap items-center gap-2">
                      {onSuggestBlock && (
                        <Button size="sm" variant="outline" onClick={() => requestSuggestion(block.key)} disabled={busyBlock !== null}>
                          {busyBlock === `suggest:${block.key}` ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
                          {ui("caPropose")}
                        </Button>
                      )}
                      {onCritiqueBlock && (
                        <Button size="sm" variant="ghost" onClick={() => requestCritique(block.key)} disabled={busyBlock !== null}>
                          {busyBlock === `critique:${block.key}` ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                          {ui("caReview")}
                        </Button>
                      )}
                      <span className="text-xs text-muted-foreground">{ui("caCopilotHint")}</span>
                    </div>

                    {proposals[block.key]?.ratings.length ? (
                      <div className="mt-3 space-y-2">
                        {proposals[block.key]!.ratings.map((rating) => (
                          <div key={rating.itemPath} className="assessment-proposal">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <strong className="text-sm">{rating.itemPath} = {rating.value}/{assessmentScaleMax}</strong>
                                <p className="text-xs text-muted-foreground">{rating.rationale}</p>
                                {rating.evidenceQuotes[0] && <p className="mt-1 text-xs italic text-muted-foreground">«{rating.evidenceQuotes[0]}»</p>}
                              </div>
                              <Button size="sm" onClick={() => applyProposedRating(block.key, rating)}>{ui("caApply")}</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {proposals[block.key] && !proposals[block.key]!.ratings.length && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {ui("caNoProposals")}{" "}
                        {proposals[block.key]!.discarded.length
                          ? `${proposals[block.key]!.discarded.length} ${ui("caDiscardedTail")}`
                          : ui("caNothingSupports")}
                      </p>
                    )}

                    {objections[block.key]?.length ? (
                      <ul className="mt-3 space-y-1">
                        {objections[block.key]!.map((objection, index) => (
                          <li key={index} className="assessment-objection">
                            <Badge variant="outline">{objection.severity}</Badge>
                            <span>{objection.itemPath ? `${objection.itemPath}: ` : ""}{objection.objection}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {objections[block.key]?.length === 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">{ui("caNoObjections")}</p>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}

        <AccordionItem value="context">
          <AccordionTrigger className="text-left">
            <div className="flex w-full items-center justify-between gap-3 pr-2">
              <span className="font-medium">{ui("caContextTitle")}</span>
              <span className="text-xs text-muted-foreground">{assessment.incentives.length} {ui("caIncentivesMarked")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              <section className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold">{ui("caIncentivesTitle")}</h4>
                  <p className="text-xs text-muted-foreground">{t(incentiveWeightNote)}</p>
                  <p className="text-xs italic text-muted-foreground">{ui("caSource")}: {ui("caIncentivesSource")}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {incentiveFamilies.map((family) => (
                    <div key={family.key} className="space-y-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(family.label)}</h5>
                      {family.instruments.map((instrument) => {
                        const key = `${family.key}.${instrument.key}`;
                        const id = `incentive-${key}`;
                        return (
                          <div key={key} className="flex items-start gap-2">
                            <Checkbox
                              id={id}
                              checked={assessment.incentives.includes(key)}
                              onCheckedChange={() => onChange({ ...assessment, incentives: toggleFromList(assessment.incentives, key) })}
                            />
                            <Label htmlFor={id} className="text-xs font-normal leading-snug">{t(instrument.label)}</Label>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold">{ui("caEsgTitle")}</h4>
                  <p className="text-xs text-muted-foreground">{ui("caEsgDesc")}</p>
                  <p className="text-xs italic text-muted-foreground">{ui("caSource")}: {ui("caEsgSource")}</p>
                </div>
                <div className="space-y-2">
                  {sustainabilityChecks.map((check) => {
                    const id = `esg-${check.key}`;
                    return (
                      <div key={check.key} className="flex items-start gap-2">
                        <Checkbox
                          id={id}
                          checked={assessment.sustainabilityConcerns.includes(check.key)}
                          onCheckedChange={() => onChange({ ...assessment, sustainabilityConcerns: toggleFromList(assessment.sustainabilityConcerns, check.key) })}
                        />
                        <Label htmlFor={id} className="text-xs font-normal leading-snug">{t(check.label)}</Label>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lifecycle-cluster" className="text-sm font-semibold">{ui("caLifeCycle")}</Label>
                  <Select
                    value={assessment.lifeCycleCluster ?? "none"}
                    onValueChange={(value) => onChange({ ...assessment, lifeCycleCluster: value === "none" ? null : (value as LifeCycleCluster) })}
                  >
                    <SelectTrigger id="lifecycle-cluster"><SelectValue placeholder={ui("caUnclassified")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{ui("caUnclassified")}</SelectItem>
                      {lifeCycleClusters.map((cluster) => (
                        <SelectItem key={cluster.key} value={cluster.key}>{t(cluster.label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assessment.lifeCycleCluster && (
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        const cluster = lifeCycleClusters.find((entry) => entry.key === assessment.lifeCycleCluster)!;
                        return `${ui("caDemandGrowth")} ${t(cluster.growth).toLowerCase()}, ${ui("caDemandSize")} ${t(cluster.size).toLowerCase()}. ${t(cluster.segmentation)}. ${ui("caDemandValueCurve")}: ${t(cluster.valueCurve)}. ${ui("caDemandCompetition")}: ${t(cluster.competition).toLowerCase()}.`;
                      })()}
                    </p>
                  )}
                  <p className="text-xs italic text-muted-foreground">{ui("caSource")}: {ui("caLifeCycleSource")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ease-score" className="text-sm font-semibold">{ui("caEase")}</Label>
                  <Input
                    id="ease-score"
                    type="number"
                    min={0}
                    max={100}
                    value={assessment.easeOfDoingBusinessScore ?? ""}
                    onChange={(event) => {
                      const raw = event.target.value;
                      onChange({ ...assessment, easeOfDoingBusinessScore: raw === "" ? null : Number(raw) });
                    }}
                    placeholder={ui("caEasePlaceholder")}
                  />
                  <p className="text-xs text-muted-foreground">{ui("caEaseHelp")}</p>
                </div>
              </section>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
