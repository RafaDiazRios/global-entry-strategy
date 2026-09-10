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
  type AssessmentValue,
  type LifeCycleCluster,
} from "@shared/domain/countryAssessment";

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

type Props = {
  countryName: string;
  assessment: CountryAssessmentState;
  onChange: (next: CountryAssessmentState) => void;
};

export function CountryAssessmentPanel({ countryName, assessment, onChange }: Props) {
  const progress = assessmentProgress(assessment);

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
          <div className="step-tag">EVALUACIÓN DETALLADA · CAPÍTULO 6</div>
          <p className="text-sm text-muted-foreground">
            {countryName}. Puntúe de 0 a {assessmentScaleMax} solo lo que haya podido contrastar; lo que quede sin evaluar se
            declara como no evaluado y no entra en la puntuación.
          </p>
        </div>
        <Badge variant={progress.pct >= 60 ? "default" : "outline"}>
          {progress.assessed}/{progress.total} evaluados · {progress.pct}%
        </Badge>
      </div>

      <Accordion type="multiple" className="w-full">
        {assessmentBlocks.map((block) => {
          const blockCount = blockProgress(assessment, block);
          return (
            <AccordionItem key={block.key} value={block.key}>
              <AccordionTrigger className="text-left">
                <div className="flex w-full items-center justify-between gap-3 pr-2">
                  <span className="font-medium">{block.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {blockCount.assessed}/{blockCount.total} · {block.direction === "adverse" ? "4 = desfavorable" : "4 = favorable"}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="mb-3 text-sm text-muted-foreground">{block.intro}</p>
                <p className="mb-4 text-xs italic text-muted-foreground">Fuente: {block.source}</p>
                <div className="space-y-6">
                  {block.groups.map((group) => (
                    <section key={group.key} className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold">{group.label}</h4>
                        <p className="text-xs text-muted-foreground">{group.intro}</p>
                      </div>
                      <div className="space-y-4">
                        {group.items.map((item) => {
                          const path = itemPath(block.key, group.key, item.key);
                          const value = assessment.ratings[path];
                          return (
                            <div key={item.key} className="assessment-item">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <strong className="text-sm">{item.label}</strong>
                                  <p className="text-xs text-muted-foreground">{item.help}</p>
                                </div>
                                <div className="flex gap-1" role="group" aria-label={item.label}>
                                  {scaleValues.map((scaleValue) => (
                                    <Button
                                      key={scaleValue}
                                      type="button"
                                      size="sm"
                                      variant={value === scaleValue ? "default" : "outline"}
                                      className="h-8 w-8 p-0"
                                      aria-pressed={value === scaleValue}
                                      title={scaleValue === 0 ? item.anchorLow : scaleValue === assessmentScaleMax ? item.anchorHigh : undefined}
                                      onClick={() => setRating(path, scaleValue)}
                                    >
                                      {scaleValue}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                                <span>0 · {item.anchorLow}</span>
                                <span className="text-right">{assessmentScaleMax} · {item.anchorHigh}</span>
                              </div>
                              <Input
                                className="calibration-rationale"
                                value={assessment.notes[path] ?? ""}
                                onChange={(event) => setNote(path, event.target.value)}
                                placeholder="Evidencia: fuente, entrevista u observación"
                                aria-label={`Justificación de ${item.label}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}

        <AccordionItem value="context">
          <AccordionTrigger className="text-left">
            <div className="flex w-full items-center justify-between gap-3 pr-2">
              <span className="font-medium">Incentivos, sostenibilidad y ciclo de vida</span>
              <span className="text-xs text-muted-foreground">{assessment.incentives.length} incentivos marcados</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              <section className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold">Incentivos a la inversión</h4>
                  <p className="text-xs text-muted-foreground">{incentiveWeightNote}</p>
                  <p className="text-xs italic text-muted-foreground">Fuente: Tabla 6.5, pp. 241-242</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {incentiveFamilies.map((family) => (
                    <div key={family.key} className="space-y-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{family.label}</h5>
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
                            <Label htmlFor={id} className="text-xs font-normal leading-snug">{instrument.label}</Label>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold">Cuestiones ambientales y sociales</h4>
                  <p className="text-xs text-muted-foreground">El libro las plantea como filtro previo a la inversión, no como matiz.</p>
                  <p className="text-xs italic text-muted-foreground">Fuente: p. 242</p>
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
                        <Label htmlFor={id} className="text-xs font-normal leading-snug">{check.label}</Label>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lifecycle-cluster" className="text-sm font-semibold">Cluster de ciclo de vida</Label>
                  <Select
                    value={assessment.lifeCycleCluster ?? "none"}
                    onValueChange={(value) => onChange({ ...assessment, lifeCycleCluster: value === "none" ? null : (value as LifeCycleCluster) })}
                  >
                    <SelectTrigger id="lifecycle-cluster"><SelectValue placeholder="Sin clasificar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin clasificar</SelectItem>
                      {lifeCycleClusters.map((cluster) => (
                        <SelectItem key={cluster.key} value={cluster.key}>{cluster.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assessment.lifeCycleCluster && (
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        const cluster = lifeCycleClusters.find((entry) => entry.key === assessment.lifeCycleCluster)!;
                        return `Demanda típica: crecimiento ${cluster.growth.toLowerCase()}, tamaño ${cluster.size.toLowerCase()}. ${cluster.segmentation}. Curva de valor: ${cluster.valueCurve}. Competencia: ${cluster.competition.toLowerCase()}.`;
                      })()}
                    </p>
                  )}
                  <p className="text-xs italic text-muted-foreground">Fuente: Tabla 6.2, p. 234</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ease-score" className="text-sm font-semibold">Facilidad para hacer negocios (0-100)</Label>
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
                    placeholder="Ej. 67"
                  />
                  <p className="text-xs text-muted-foreground">Puntuación pública del país. Entra en el factor de apertura junto a la política gubernamental.</p>
                </div>
              </section>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
