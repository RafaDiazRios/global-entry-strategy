import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Compass, DoorOpen, Handshake, Layers, Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import {
  emptyAmbitionInput,
  industryDemandFor,
  regionSet,
  type AmbitionInput,
  type RegionSetId,
} from "@shared/domain/globalAmbition";
import { emptyEntryStrategyInput, type Band, type ClimateBand, type EntryStrategyInput } from "@shared/domain/entryStrategy";
import { emptyPartneringInput, type PartneringInput } from "@shared/domain/partnering";
import {
  emptyPositioningInput,
  VALUE_CHAIN_FUNCTIONS,
  type PositioningInput,
  type ValueChainLevel,
} from "@shared/domain/globalPositioning";

/**
 * Capítulo 5: ambición global y posicionamiento.
 *
 * El panel no puntúa nada por su cuenta. Recoge las respuestas del analista y enseña lo que
 * el capítulo deduce de ellas —los índices, la casilla del mapa, la rejilla ERRC, la lista
 * de capacidades a crear— siempre con la página del libro de la que sale cada cosa.
 */

const select =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type SubTab = "ambition" | "positioning" | "entry" | "partnering";

type Props = {
  caseId: number | null;
  /** Pestaña activa, controlada desde fuera para que la ruta guiada pueda llevar aquí. */
  subTab?: SubTab;
  onSubTabChange?: (tab: SubTab) => void;
};

export function GlobalStrategyPanel({ caseId, subTab, onSubTabChange }: Props) {
  if (caseId === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estrategia global</CardTitle>
          <CardDescription>
            La ambición y el posicionamiento se analizan sobre un caso. Cree o seleccione uno en la pestaña de caso para
            empezar.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return <Loaded caseId={caseId} subTab={subTab} onSubTabChange={onSubTabChange} />;
}

function Loaded({ caseId, subTab, onSubTabChange }: { caseId: number; subTab?: SubTab; onSubTabChange?: (tab: SubTab) => void }) {
  const reference = trpc.globalStrategy.reference.useQuery();
  if (reference.isLoading || !reference.data) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando las tablas del capítulo 5…
      </div>
    );
  }
  return (
    <Tabs value={subTab ?? "ambition"} onValueChange={(value) => onSubTabChange?.(value as SubTab)} className="space-y-6">
      <TabsList>
        <TabsTrigger value="ambition"><Compass className="mr-2 h-4 w-4" />Ambición global</TabsTrigger>
        <TabsTrigger value="positioning"><Layers className="mr-2 h-4 w-4" />Posicionamiento</TabsTrigger>
        <TabsTrigger value="entry"><DoorOpen className="mr-2 h-4 w-4" />Entrada</TabsTrigger>
        <TabsTrigger value="partnering"><Handshake className="mr-2 h-4 w-4" />Vía y socio</TabsTrigger>
      </TabsList>
      <TabsContent value="ambition"><AmbitionBlock caseId={caseId} reference={reference.data} /></TabsContent>
      <TabsContent value="positioning"><PositioningBlock caseId={caseId} reference={reference.data} /></TabsContent>
      <TabsContent value="entry"><EntryBlock caseId={caseId} reference={reference.data} /></TabsContent>
      <TabsContent value="partnering"><PartneringBlock caseId={caseId} reference={reference.data} /></TabsContent>
    </Tabs>
  );
}

type Reference = RouterOutputs["globalStrategy"]["reference"];

/* ------------------------------------------------------------------------------------ */
/* M1 — Ambición                                                                         */
/* ------------------------------------------------------------------------------------ */

function AmbitionBlock({ caseId, reference }: { caseId: number; reference: Reference }) {
  const utils = trpc.useUtils();
  const query = trpc.globalStrategy.getAmbition.useQuery({ caseId });
  const [draft, setDraft] = useState<AmbitionInput>(emptyAmbitionInput());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (query.data && !dirty) setDraft(query.data.input);
  }, [query.data, dirty]);

  const save = trpc.globalStrategy.saveAmbition.useMutation({
    onSuccess: () => {
      setDirty(false);
      utils.globalStrategy.getAmbition.invalidate({ caseId });
      toast.success("Ambición guardada");
    },
    onError: (error) => toast.error(error.message),
  });

  const regions = regionSet(draft.regionSetId).regions;
  const analysis = query.data;
  const update = (patch: Partial<AmbitionInput>) => { setDraft((current) => ({ ...current, ...patch })); setDirty(true); };

  const changeRegionSet = (id: RegionSetId) => {
    const blank: Record<string, number | null> = {};
    for (const region of regionSet(id).regions) blank[region.id] = null;
    const demand = draft.industryId ? industryDemandFor(draft.industryId, id) : null;
    update({ regionSetId: id, industryDemand: demand ?? { ...blank }, companyRevenue: { ...blank }, companyCapability: { ...blank } });
  };

  const pickIndustry = (industryId: string) => {
    const demand = industryId ? industryDemandFor(industryId, draft.regionSetId) : null;
    update({ industryId: industryId || null, industryDemand: demand ?? draft.industryDemand });
  };

  const figures = (key: "industryDemand" | "companyRevenue" | "companyCapability", regionId: string, raw: string) => {
    const value = raw.trim() === "" ? null : Number(raw);
    update({ [key]: { ...draft[key], [regionId]: Number.isNaN(value as number) ? null : value } } as Partial<AmbitionInput>);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Motivos de la globalización</CardTitle>
          <CardDescription>Dunning, p. 181. Marcar sin justificar no cuenta como respondido.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reference.motives.map((motive) => {
            const entry = draft.motives.find((item) => item.id === motive.id) ?? { id: motive.id, selected: false, justification: null };
            return (
              <div key={motive.id} className="space-y-2 rounded-md border p-3">
                <label className="flex items-start gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={entry.selected}
                    onChange={(event) => update({ motives: reference.motives.map((option) => {
                      const existing = draft.motives.find((item) => item.id === option.id) ?? { id: option.id, selected: false, justification: null };
                      return option.id === motive.id ? { ...existing, selected: event.target.checked } : existing;
                    }) as AmbitionInput["motives"] })}
                  />
                  <span>
                    {motive.label}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{motive.description}</span>
                  </span>
                </label>
                {entry.selected && (
                  <Input
                    value={entry.justification ?? ""}
                    placeholder="Por qué aplica en este caso"
                    onChange={(event) => update({ motives: draft.motives.map((item) => (item.id === motive.id ? { ...item, justification: event.target.value } : item)) })}
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Índices de globalización</CardTitle>
          <CardDescription>
            {analysis?.convention.formula} — {reference.industryDemandProvenance}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Regiones</Label>
              <select className={select} value={draft.regionSetId} onChange={(event) => changeRegionSet(event.target.value as RegionSetId)}>
                {reference.regionSets.map((set) => <option key={set.id} value={set.id}>{set.label} · {set.provenance}</option>)}
              </select>
            </div>
            <div>
              <Label>Industria de referencia (Tabla 5.2)</Label>
              <select className={select} value={draft.industryId ?? ""} onChange={(event) => pickIndustry(event.target.value)}>
                <option value="">Introducir la demanda a mano</option>
                {reference.industryDemand.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}
              </select>
            </div>
          </div>

          <FigureGrid label="Demanda mundial de la industria (%)" regions={regions} values={draft.industryDemand} onChange={(regionId, raw) => figures("industryDemand", regionId, raw)} />
          <FigureGrid label="Ventas de la empresa por región" regions={regions} values={draft.companyRevenue} onChange={(regionId, raw) => figures("companyRevenue", regionId, raw)} help="En la unidad que prefiera: se normaliza a porcentaje." />
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Label className="mb-0">Capacidad por región</Label>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={draft.capabilityBasis} onChange={(event) => update({ capabilityBasis: event.target.value as AmbitionInput["capabilityBasis"] })}>
                <option value="assets">Activos</option>
                <option value="personnel">Empleo</option>
              </select>
            </div>
            <FigureGrid label="" regions={regions} values={draft.companyCapability} onChange={(regionId, raw) => figures("companyCapability", regionId, raw)} />
          </div>

          {analysis && (
            <div className="rounded-md border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">GRI {analysis.indices.gri === null ? "—" : analysis.indices.gri.toFixed(3)}</Badge>
                <Badge variant="outline">GCI {analysis.indices.gci === null ? "—" : analysis.indices.gci.toFixed(3)}</Badge>
                {analysis.position && <Badge>{analysis.position.zone} · {analysis.position.provenance}</Badge>}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{analysis.convention.note}</p>
              {analysis.gap.note && <p className="mt-2 text-sm">{analysis.gap.note}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rol y etapa</CardTitle>
          <CardDescription>pp. 181-182 para los roles, p. 219 para las etapas, Tabla 5.8 para el diseño organizativo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Rol hoy</Label>
            <select className={select} value={draft.currentRole ?? ""} onChange={(event) => update({ currentRole: (event.target.value || null) as AmbitionInput["currentRole"] })}>
              <option value="">Sin declarar</option>
              {reference.globalRoles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Rol objetivo</Label>
            <select className={select} value={draft.targetRole ?? ""} onChange={(event) => update({ targetRole: (event.target.value || null) as AmbitionInput["targetRole"] })}>
              <option value="">Sin declarar</option>
              {reference.globalRoles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Horizonte (años)</Label>
            <Input type="number" min={1} max={30} value={draft.targetHorizonYears ?? ""} onChange={(event) => update({ targetHorizonYears: event.target.value ? Number(event.target.value) : null })} />
          </div>
          <div>
            <Label>Etapa de globalización</Label>
            <select className={select} value={draft.stage ?? ""} onChange={(event) => update({ stage: (event.target.value || null) as AmbitionInput["stage"] })}>
              <option value="">Sin declarar</option>
              {reference.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>Diseño organizativo (Tabla 5.8)</Label>
            <select className={select} value={draft.organizationalPhase ?? ""} onChange={(event) => update({ organizationalPhase: (event.target.value || null) as AmbitionInput["organizationalPhase"] })}>
              <option value="">Sin declarar</option>
              {reference.organizationalDesigns.map((design) => <option key={design.id} value={design.id}>{design.label}</option>)}
            </select>
            {draft.organizationalPhase && (
              <p className="mt-2 text-xs text-muted-foreground">
                {reference.organizationalDesigns.find((design) => design.id === draft.organizationalPhase)?.structure}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles de país</CardTitle>
          <CardDescription>pp. 187-188. El rol fija la prioridad de inversión y condiciona la estrategia de entrada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.countryRoles.map((entry, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[6rem_12rem_1fr_auto]">
              <Input value={entry.countryCode} placeholder="ESP" maxLength={3} onChange={(event) => update({ countryRoles: draft.countryRoles.map((item, position) => (position === index ? { ...item, countryCode: event.target.value.toUpperCase() } : item)) })} />
              <select className={select} value={entry.role ?? ""} onChange={(event) => update({ countryRoles: draft.countryRoles.map((item, position) => (position === index ? { ...item, role: (event.target.value || null) as typeof item.role } : item)) })}>
                <option value="">Sin rol</option>
                {reference.countryRoles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
              </select>
              <Input value={entry.justification ?? ""} placeholder="Criterio que lo sostiene" onChange={(event) => update({ countryRoles: draft.countryRoles.map((item, position) => (position === index ? { ...item, justification: event.target.value } : item)) })} />
              <Button variant="ghost" size="sm" onClick={() => update({ countryRoles: draft.countryRoles.filter((_, position) => position !== index) })}>Quitar</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => update({ countryRoles: [...draft.countryRoles, { countryCode: "", role: null, justification: null }] })}>Añadir país</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liability of foreignness</CardTitle>
          <CardDescription>p. 198. Campo obligatorio: sin él el módulo no se da por completo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea rows={3} value={draft.liabilityOfForeignness ?? ""} placeholder="Qué desventaja concreta tiene la empresa por ser extranjera aquí, y con qué ventaja superior la compensa" onChange={(event) => update({ liabilityOfForeignness: event.target.value })} />
        </CardContent>
      </Card>

      <SaveBar
        dirty={dirty}
        pending={save.isPending}
        completeness={analysis?.completeness ?? null}
        onSave={() => save.mutate({ caseId, payload: draft })}
      />
    </div>
  );
}

function FigureGrid({ label, regions, values, onChange, help }: {
  label: string;
  regions: { id: string; label: string }[];
  values: Record<string, number | null>;
  onChange: (regionId: string, raw: string) => void;
  help?: string;
}) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      {help && <p className="mb-1 text-xs text-muted-foreground">{help}</p>}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(regions.length, 4)}, minmax(0, 1fr))` }}>
        {regions.map((region) => (
          <div key={region.id}>
            <span className="text-xs text-muted-foreground">{region.label}</span>
            <Input inputMode="decimal" value={values[region.id] ?? ""} onChange={(event) => onChange(region.id, event.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------ */
/* M2 — Posicionamiento                                                                  */
/* ------------------------------------------------------------------------------------ */

function PositioningBlock({ caseId, reference }: { caseId: number; reference: Reference }) {
  const utils = trpc.useUtils();
  const query = trpc.globalStrategy.getPositioning.useQuery({ caseId });
  const [draft, setDraft] = useState<PositioningInput>(emptyPositioningInput());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (query.data && !dirty) setDraft(query.data.input);
  }, [query.data, dirty]);

  const save = trpc.globalStrategy.savePositioning.useMutation({
    onSuccess: () => {
      setDirty(false);
      utils.globalStrategy.getPositioning.invalidate({ caseId });
      toast.success("Posicionamiento guardado");
    },
    onError: (error) => toast.error(error.message),
  });

  const analysis = query.data;
  const update = (patch: Partial<PositioningInput>) => { setDraft((current) => ({ ...current, ...patch })); setDirty(true); };
  const newId = () => Math.random().toString(36).slice(2, 10);

  const errcByAction = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    for (const entry of analysis?.valueCurve.errc ?? []) {
      grouped[entry.action] = grouped[entry.action] ?? [];
      grouped[entry.action].push(entry.label);
    }
    return grouped;
  }, [analysis]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Propuesta de valor</CardTitle>
          <CardDescription>Fig. 5.8, p. 189. Las tres elecciones dan una de las ocho posiciones de la {reference.positioningsProvenance}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {reference.valuePropositionDimensions.map((dimension) => (
              <div key={dimension.id}>
                <Label>{dimension.label}</Label>
                <select
                  className={select}
                  value={(draft[dimension.id as "scope" | "advantage" | "standardization"] as string) ?? ""}
                  onChange={(event) => update({ [dimension.id]: event.target.value || null } as Partial<PositioningInput>)}
                >
                  <option value="">Sin decidir</option>
                  {dimension.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">{dimension.question}</p>
              </div>
            ))}
          </div>
          {analysis?.positioning && (
            <div className="rounded-md border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{analysis.positioning.label}</Badge>
                <span className="text-xs text-muted-foreground">{analysis.positioning.family}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Ejemplos del libro: {analysis.positioning.examples.join(", ")}.</p>
            </div>
          )}
          <div>
            <Label>Por qué esta posición y no otra</Label>
            <Textarea rows={2} value={draft.positioningRationale ?? ""} onChange={(event) => update({ positioningRationale: event.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Curva de valor y rejilla ERRC</CardTitle>
          <CardDescription>
            Fig. 5.9, p. 189, con la rejilla del módulo 10 del programa. La rejilla no se rellena: sale de comparar la curva
            actual con la propuesta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            {draft.competitors.map((competitor, index) => (
              <div key={competitor.id}>
                <Label className="text-xs">Competidor {index + 1}</Label>
                <Input className="w-40" value={competitor.label} onChange={(event) => update({ competitors: draft.competitors.map((item) => (item.id === competitor.id ? { ...item, label: event.target.value } : item)) })} />
              </div>
            ))}
            {draft.competitors.length < 3 && (
              <Button variant="outline" size="sm" onClick={() => update({ competitors: [...draft.competitors, { id: newId(), label: "" }] })}>Añadir competidor</Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Atributo de valor</th>
                  <th className="py-2 w-20">Hoy</th>
                  <th className="py-2 w-20">Propuesta</th>
                  {draft.competitors.map((competitor) => <th key={competitor.id} className="py-2 w-24">{competitor.label || "Competidor"}</th>)}
                  <th />
                </tr>
              </thead>
              <tbody>
                {draft.valueCurve.map((attribute) => (
                  <tr key={attribute.id} className="border-b">
                    <td className="py-2 pr-2">
                      <Input value={attribute.label} onChange={(event) => update({ valueCurve: draft.valueCurve.map((item) => (item.id === attribute.id ? { ...item, label: event.target.value } : item)) })} />
                    </td>
                    <td className="py-2 pr-2"><ScoreInput value={attribute.asIs} onChange={(value) => update({ valueCurve: draft.valueCurve.map((item) => (item.id === attribute.id ? { ...item, asIs: value } : item)) })} /></td>
                    <td className="py-2 pr-2"><ScoreInput value={attribute.toBe} onChange={(value) => update({ valueCurve: draft.valueCurve.map((item) => (item.id === attribute.id ? { ...item, toBe: value } : item)) })} /></td>
                    {draft.competitors.map((competitor) => (
                      <td key={competitor.id} className="py-2 pr-2">
                        <ScoreInput
                          value={attribute.competitors[competitor.id] ?? null}
                          onChange={(value) => update({ valueCurve: draft.valueCurve.map((item) => (item.id === attribute.id ? { ...item, competitors: { ...item.competitors, [competitor.id]: value } } : item)) })}
                        />
                      </td>
                    ))}
                    <td className="py-2"><Button variant="ghost" size="sm" onClick={() => update({ valueCurve: draft.valueCurve.filter((item) => item.id !== attribute.id) })}>Quitar</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="outline" size="sm" onClick={() => update({ valueCurve: [...draft.valueCurve, { id: newId(), label: "", asIs: null, toBe: null, competitors: {}, note: null }] })}>Añadir atributo</Button>

          {analysis && (
            <div className="rounded-md border bg-muted/40 p-4">
              <div className="grid gap-3 sm:grid-cols-4">
                {reference.errcActions.filter((action) => action.id !== "keep").map((action) => (
                  <div key={action.id}>
                    <div className="text-xs font-semibold uppercase text-muted-foreground">{action.label}</div>
                    <ul className="mt-1 space-y-1 text-sm">
                      {(errcByAction[action.id] ?? []).map((label) => <li key={label}>{label}</li>)}
                      {!(errcByAction[action.id] ?? []).length && <li className="text-muted-foreground">—</li>}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Divergencia frente al competidor más parecido: {analysis.valueCurve.divergence === null ? "sin datos" : analysis.valueCurve.divergence.toFixed(2)}.
                {analysis.valueCurve.note ? ` ${analysis.valueCurve.note}` : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de la cadena de valor</CardTitle>
          <CardDescription>Fig. 5.12, p. 193. Dónde se gestiona hoy cada función y dónde debería gestionarse.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {VALUE_CHAIN_FUNCTIONS.map((fn) => {
            const cell = draft.valueChain[fn.id] ?? { current: null, target: null };
            return (
              <div key={fn.id} className="grid gap-2 sm:grid-cols-[1fr_9rem_9rem]">
                <div>
                  <div className="text-sm font-medium">{fn.label}</div>
                  <div className="text-xs text-muted-foreground">{fn.hints[(cell.target ?? cell.current ?? "global") as ValueChainLevel]}</div>
                </div>
                <LevelSelect label="Hoy" value={cell.current} levels={reference.valueChainLevels} onChange={(value) => update({ valueChain: { ...draft.valueChain, [fn.id]: { ...cell, current: value } } })} />
                <LevelSelect label="Objetivo" value={cell.target} levels={reference.valueChainLevels} onChange={(value) => update({ valueChain: { ...draft.valueChain, [fn.id]: { ...cell, target: value } } })} />
              </div>
            );
          })}
          {analysis && (
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <p>
                Configuración actual: <strong>{configurationName(reference, analysis.valueChain.currentConfiguration)}</strong>. Objetivo:{" "}
                <strong>{configurationName(reference, analysis.valueChain.targetConfiguration)}</strong>.
              </p>
              {analysis.valueChain.moves.length > 0 && (
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {analysis.valueChain.moves.map((move) => <li key={move.functionId}>{move.label}: {move.direction} de {move.from} a {move.to}</li>)}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfer, Adapt, Create</CardTitle>
          <CardDescription>Fig. 5.14, p. 199. Lo etiquetado como «crear» es la brecha de recursos que abre la decisión de build-borrow-buy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.tac.map((entry) => (
            <div key={entry.id} className="grid gap-2 sm:grid-cols-[8rem_1fr_10rem_8rem_auto]">
              <select className={select} value={entry.kind} onChange={(event) => update({ tac: draft.tac.map((item) => (item.id === entry.id ? { ...item, kind: event.target.value as typeof item.kind } : item)) })}>
                {reference.capabilityKinds.map((kind) => <option key={kind.id} value={kind.id}>{kind.label}</option>)}
              </select>
              <Input value={entry.label} placeholder="Recurso, activo o competencia" onChange={(event) => update({ tac: draft.tac.map((item) => (item.id === entry.id ? { ...item, label: event.target.value } : item)) })} />
              <select className={select} value={entry.functionId ?? ""} onChange={(event) => update({ tac: draft.tac.map((item) => (item.id === entry.id ? { ...item, functionId: (event.target.value || null) as typeof item.functionId } : item)) })}>
                <option value="">Sin función</option>
                {reference.valueChainFunctions.map((fn) => <option key={fn.id} value={fn.id}>{fn.label}</option>)}
              </select>
              <select className={select} value={entry.tag ?? ""} onChange={(event) => update({ tac: draft.tac.map((item) => (item.id === entry.id ? { ...item, tag: (event.target.value || null) as typeof item.tag } : item)) })}>
                <option value="">Sin etiquetar</option>
                {reference.tacTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.label}</option>)}
              </select>
              <Button variant="ghost" size="sm" onClick={() => update({ tac: draft.tac.filter((item) => item.id !== entry.id) })}>Quitar</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => update({ tac: [...draft.tac, { id: newId(), kind: "competency", label: "", functionId: null, tag: null, note: null }] })}>Añadir capacidad</Button>

          {analysis && analysis.resourceGap.toCreate.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Hay que crear</div>
              <ul className="mt-1 space-y-1">{analysis.resourceGap.toCreate.map((entry) => <li key={entry.id}>{entry.label}</li>)}</ul>
              {analysis.resourceGap.creationLoad !== null && (
                <p className="mt-2 text-xs text-muted-foreground">Carga de creación: {(analysis.resourceGap.creationLoad * 100).toFixed(0)}% de las capacidades etiquetadas no viajan tal cual.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liability of foreignness</CardTitle>
          <CardDescription>p. 198. La desventaja y la ventaja superior que la compensa, por separado.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Desventaja por ser extranjero</Label>
            <Textarea rows={3} value={draft.liabilityOfForeignness.handicap ?? ""} onChange={(event) => update({ liabilityOfForeignness: { ...draft.liabilityOfForeignness, handicap: event.target.value } })} />
          </div>
          <div>
            <Label>Ventaja que la compensa</Label>
            <Textarea rows={3} value={draft.liabilityOfForeignness.compensatingAdvantage ?? ""} onChange={(event) => update({ liabilityOfForeignness: { ...draft.liabilityOfForeignness, compensatingAdvantage: event.target.value } })} />
          </div>
        </CardContent>
      </Card>

      {analysis && analysis.warnings.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Coherencia</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {analysis.warnings.map((warning) => (
              <div key={warning.id} className="flex gap-2 rounded-md border p-3 text-sm">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${warning.severity === "block" ? "text-destructive" : "text-amber-500"}`} />
                <div>
                  <p>{warning.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{warning.provenance}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <SaveBar
        dirty={dirty}
        pending={save.isPending}
        completeness={analysis?.completeness ?? null}
        onSave={() => save.mutate({ caseId, payload: draft })}
      />
    </div>
  );
}

function configurationName(reference: Reference, id: string | null) {
  if (!id) return "sin determinar";
  return reference.configurations.find((configuration) => configuration.id === id)?.label ?? id;
}

function LevelSelect({ label, value, levels, onChange }: {
  label: string;
  value: ValueChainLevel | null;
  levels: { id: string; label: string }[];
  onChange: (value: ValueChainLevel | null) => void;
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <select className={select} value={value ?? ""} onChange={(event) => onChange((event.target.value || null) as ValueChainLevel | null)}>
        <option value="">—</option>
        {levels.map((level) => <option key={level.id} value={level.id}>{level.label}</option>)}
      </select>
    </div>
  );
}

function ScoreInput({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  return (
    <Input
      type="number"
      min={0}
      max={5}
      step={1}
      value={value ?? ""}
      onChange={(event) => {
        const raw = event.target.value;
        if (raw === "") return onChange(null);
        const parsed = Math.max(0, Math.min(5, Number(raw)));
        onChange(Number.isNaN(parsed) ? null : parsed);
      }}
    />
  );
}

function SaveBar({ dirty, pending, completeness, onSave }: {
  dirty: boolean;
  pending: boolean;
  completeness: { answered: number; total: number; missing: string[] } | null;
  onSave: () => void;
}) {
  return (
    <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background/95 p-3 backdrop-blur">
      <div className="text-sm">
        {completeness && (
          <>
            <Badge variant="outline">{completeness.answered}/{completeness.total} respondido</Badge>
            {completeness.missing.length > 0 && (
              <span className="ml-3 text-xs text-muted-foreground">Falta: {completeness.missing.slice(0, 2).join("; ")}{completeness.missing.length > 2 ? "…" : ""}</span>
            )}
          </>
        )}
      </div>
      <Button onClick={onSave} disabled={!dirty || pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {dirty ? "Guardar" : "Guardado"}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------------------------ */
/* M4 — Estrategia de entrada (capítulo 7, primera parte)                                */
/* ------------------------------------------------------------------------------------ */

function EntryBlock({ caseId, reference }: { caseId: number; reference: Reference }) {
  const utils = trpc.useUtils();
  const query = trpc.globalStrategy.getEntryStrategy.useQuery({ caseId });
  const [draft, setDraft] = useState<EntryStrategyInput>(emptyEntryStrategyInput());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (query.data && !dirty) setDraft(query.data.input);
  }, [query.data, dirty]);

  const save = trpc.globalStrategy.saveEntryStrategy.useMutation({
    onSuccess: () => {
      setDirty(false);
      utils.globalStrategy.getEntryStrategy.invalidate({ caseId });
      toast.success("Estrategia de entrada guardada");
    },
    onError: (error) => toast.error(error.message),
  });

  const analysis = query.data;
  const update = (patch: Partial<EntryStrategyInput>) => { setDraft((current) => ({ ...current, ...patch })); setDirty(true); };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Por qué entrar</CardTitle>
          <CardDescription>{reference.entryObjectivesProvenance}. El objetivo condiciona el tipo de país, el momento y el modo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-[10rem]">
            <Label>País</Label>
            <Input value={draft.countryCode ?? ""} maxLength={3} placeholder="CHN" onChange={(event) => update({ countryCode: event.target.value.toUpperCase() || null })} />
          </div>
          {reference.entryObjectives.map((objective) => {
            const entry = draft.objectives.find((item) => item.id === objective.id) ?? { id: objective.id, selected: false, justification: null };
            return (
              <div key={objective.id} className="space-y-2 rounded-md border p-3">
                <label className="flex items-start gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={entry.selected}
                    onChange={(event) => update({ objectives: reference.entryObjectives.map((option) => {
                      const existing = draft.objectives.find((item) => item.id === option.id) ?? { id: option.id, selected: false, justification: null };
                      return option.id === objective.id ? { ...existing, selected: event.target.checked } : existing;
                    }) as EntryStrategyInput["objectives"] })}
                  />
                  <span>
                    {objective.label}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">Indicadores: {objective.kpis.join(", ")}. Momento: {objective.timing.toLowerCase()}.</span>
                  </span>
                </label>
                {entry.selected && (
                  <Input value={entry.justification ?? ""} placeholder="Qué busca la empresa aquí, en concreto" onChange={(event) => update({ objectives: draft.objectives.map((item) => (item.id === objective.id ? { ...item, justification: event.target.value } : item)) })} />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cuándo entrar</CardTitle>
          <CardDescription>Las cuatro fases de la ventana de oportunidad, {reference.windowPhasesProvenance}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Fase de la ventana</Label>
              <select className={select} value={draft.phase ?? ""} onChange={(event) => update({ phase: (event.target.value || null) as EntryStrategyInput["phase"] })}>
                <option value="">Sin determinar</option>
                {reference.windowPhases.map((phase) => <option key={phase.id} value={phase.id}>{phase.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Posición ante el momento</Label>
              <select className={select} value={draft.timingStance ?? ""} onChange={(event) => update({ timingStance: (event.target.value || null) as EntryStrategyInput["timingStance"] })}>
                <option value="">Sin decidir</option>
                {reference.timingStances.map((stance) => <option key={stance.id} value={stance.id}>{stance.label}</option>)}
              </select>
            </div>
          </div>
          {analysis?.phase && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="text-muted-foreground">{analysis.phase.signal}</p>
              <p className="mt-1">{analysis.phase.guidance}</p>
            </div>
          )}
          <div>
            <Label>Evidencia que sostiene esa fase</Label>
            <Textarea rows={2} value={draft.phaseEvidence ?? ""} placeholder="Crecimiento del mercado, número y cuota de competidores, madurez del producto" onChange={(event) => update({ phaseEvidence: event.target.value })} />
          </div>
          <div>
            <Label>Por qué esa posición</Label>
            <Textarea rows={2} value={draft.timingRationale ?? ""} placeholder="Si es primer entrante: qué recurso se pre-empta y quién se beneficiaría del trabajo de apertura" onChange={(event) => update({ timingRationale: event.target.value })} />
          </div>
          <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
            <div>
              <div className="font-semibold uppercase">Ventajas de ser primero</div>
              <ul className="mt-1 space-y-1">{reference.firstMover.advantages.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div>
              <div className="font-semibold uppercase">Desventajas</div>
              <ul className="mt-1 space-y-1">{reference.firstMover.disadvantages.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ritmo de entrada</CardTitle>
          <CardDescription>{reference.paceProvenance}. Escala 0 a 4.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reference.paceFactors.map((factor) => (
            <div key={factor.id} className="grid gap-2 sm:grid-cols-[1fr_6rem]">
              <div>
                <div className="text-sm font-medium">{factor.label}</div>
                <div className="text-xs text-muted-foreground">{factor.question} Un valor alto empuja a un compromiso {factor.direction === "faster" ? "rápido" : "gradual"}.</div>
              </div>
              <Input
                type="number"
                min={0}
                max={4}
                value={draft.paceFactors[factor.id] ?? ""}
                onChange={(event) => {
                  const raw = event.target.value;
                  const value = raw === "" ? null : Math.max(0, Math.min(4, Number(raw)));
                  update({ paceFactors: { ...draft.paceFactors, [factor.id]: Number.isNaN(value as number) ? null : value } });
                }}
              />
            </div>
          ))}
          {analysis?.pace.index !== null && analysis?.pace.recommendation && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              Con {analysis.pace.answered} de {analysis.pace.total} factores contestados, el perfil apunta a un compromiso{" "}
              <strong>{analysis.pace.recommendation === "rapido" ? "rápido" : analysis.pace.recommendation}</strong> (índice {analysis.pace.index?.toFixed(2)}).
              <p className="mt-1 text-xs text-muted-foreground">
                Es una síntesis de los seis factores de la p. 262, no una fórmula del libro: el libro los enumera sin ponderarlos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cómo entrar</CardTitle>
          <CardDescription>El mapa de la {reference.modeMappingProvenance} propone modos según atractivo y clima de inversión; la elección sigue siendo suya.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Atractivo del mercado</Label>
              <select className={select} value={draft.marketAttractiveness ?? ""} onChange={(event) => update({ marketAttractiveness: (event.target.value || null) as Band | null })}>
                <option value="">—</option>
                <option value="low">Bajo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
              </select>
            </div>
            <div>
              <Label>Clima político de inversión</Label>
              <select className={select} value={draft.politicalClimate ?? ""} onChange={(event) => update({ politicalClimate: (event.target.value || null) as ClimateBand | null })}>
                <option value="">—</option>
                <option value="poor">Malo</option>
                <option value="medium">Medio</option>
                <option value="good">Bueno</option>
              </select>
            </div>
            <div>
              <Label>Modo preferido</Label>
              <select className={select} value={draft.preferredMode ?? ""} onChange={(event) => update({ preferredMode: event.target.value || null })}>
                <option value="">Sin decidir</option>
                {reference.entryModes.map((mode) => <option key={mode.key} value={mode.key}>{mode.label}</option>)}
              </select>
            </div>
          </div>

          {analysis?.shortlist && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              El mapa apunta a: {analysis.shortlist.modes.join(", ")}.
              <span className="ml-2 text-xs text-muted-foreground">{analysis.shortlist.provenance}</span>
            </div>
          )}

          <div>
            <Label>Por qué ese modo</Label>
            <Textarea rows={2} value={draft.modeRationale ?? ""} onChange={(event) => update({ modeRationale: event.target.value })} />
          </div>
          <div>
            <Label>Requisitos del gobierno que condicionan el modo</Label>
            <Textarea rows={2} value={draft.governmentRequirements ?? ""} placeholder="Participación local obligatoria, aprobaciones, contenido local, restricciones sectoriales" onChange={(event) => update({ governmentRequirements: event.target.value })} />
          </div>
          <div className="max-w-sm">
            <Label>Modelo de entrada digital (opcional)</Label>
            <select className={select} value={draft.digitalModel ?? ""} onChange={(event) => update({ digitalModel: event.target.value || null })}>
              <option value="">No aplica</option>
              {reference.digitalEntryModels.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">{reference.digitalEntryProvenance}</p>
          </div>
        </CardContent>
      </Card>

      {analysis && analysis.warnings.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Coherencia</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {analysis.warnings.map((warning) => (
              <div key={warning.id} className="flex gap-2 rounded-md border p-3 text-sm">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${warning.severity === "block" ? "text-destructive" : "text-amber-500"}`} />
                <div>
                  <p>{warning.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{warning.provenance}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <SaveBar dirty={dirty} pending={save.isPending} completeness={analysis?.completeness ?? null} onSave={() => save.mutate({ caseId, payload: draft })} />
    </div>
  );
}

/* ------------------------------------------------------------------------------------ */
/* M5 — Vía de acceso y socio (capítulos 7 y 8)                                          */
/* ------------------------------------------------------------------------------------ */

function PartneringBlock({ caseId, reference }: { caseId: number; reference: Reference }) {
  const utils = trpc.useUtils();
  const query = trpc.globalStrategy.getPartnering.useQuery({ caseId });
  const positioning = trpc.globalStrategy.getPositioning.useQuery({ caseId });
  const [draft, setDraft] = useState<PartneringInput>(emptyPartneringInput());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (query.data && !dirty) setDraft(query.data.input);
  }, [query.data, dirty]);

  const save = trpc.globalStrategy.savePartnering.useMutation({
    onSuccess: () => {
      setDirty(false);
      utils.globalStrategy.getPartnering.invalidate({ caseId });
      toast.success("Vía de acceso y socio guardados");
    },
    onError: (error) => toast.error(error.message),
  });

  const analysis = query.data;
  const update = (patch: Partial<PartneringInput>) => { setDraft((current) => ({ ...current, ...patch })); setDirty(true); };
  const newId = () => Math.random().toString(36).slice(2, 10);

  /** Las capacidades marcadas «crear» en el Transfer-Adapt-Create son la entrada natural. */
  const importable = (positioning.data?.resourceGap.toCreate ?? []).filter(
    (entry) => !draft.gaps.some((gap) => gap.label === entry.label)
  );

  const verdictFor = (gapId: string) => analysis?.verdicts.find((verdict) => verdict.gapId === gapId) ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Qué falta y cómo conseguirlo</CardTitle>
          <CardDescription>{reference.bbbProvenance}. El árbol responde en orden y se detiene en la pregunta que decide; no promedia.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importable.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p>Del Transfer-Adapt-Create hay {importable.length} capacidad(es) marcadas como «crear» que aún no están aquí.</p>
              <Button
                className="mt-2"
                size="sm"
                variant="outline"
                onClick={() => update({ gaps: [...draft.gaps, ...importable.map((entry) => ({ id: newId(), label: entry.label, axes: {}, chosenRoute: null, note: null }))] })}
              >
                Traerlas
              </Button>
            </div>
          )}

          {draft.gaps.map((gap) => {
            const verdict = verdictFor(gap.id);
            return (
              <div key={gap.id} className="space-y-3 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Input value={gap.label} placeholder="Capacidad que hay que conseguir" onChange={(event) => update({ gaps: draft.gaps.map((item) => (item.id === gap.id ? { ...item, label: event.target.value } : item)) })} />
                  <Button variant="ghost" size="sm" onClick={() => update({ gaps: draft.gaps.filter((item) => item.id !== gap.id) })}>Quitar</Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {reference.bbbAxes.map((axis) => (
                    <div key={axis.id} className="grid grid-cols-[1fr_5rem] items-center gap-2">
                      <div>
                        <div className="text-sm">{axis.label}</div>
                        <div className="text-xs text-muted-foreground">{axis.question}</div>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={4}
                        value={gap.axes[axis.id] ?? ""}
                        onChange={(event) => {
                          const raw = event.target.value;
                          const value = raw === "" ? null : Math.max(0, Math.min(4, Number(raw)));
                          update({ gaps: draft.gaps.map((item) => (item.id === gap.id ? { ...item, axes: { ...item.axes, [axis.id]: Number.isNaN(value as number) ? null : value } } : item)) });
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid gap-2 sm:grid-cols-[14rem_1fr]">
                  <div>
                    <Label className="text-xs">Vía elegida</Label>
                    <select className={select} value={gap.chosenRoute ?? ""} onChange={(event) => update({ gaps: draft.gaps.map((item) => (item.id === gap.id ? { ...item, chosenRoute: (event.target.value || null) as typeof item.chosenRoute } : item)) })}>
                      <option value="">Sin decidir</option>
                      {reference.bbbRoutes.map((route) => <option key={route.id} value={route.id}>{route.label}</option>)}
                    </select>
                  </div>
                  {verdict && (
                    <div className="self-end text-sm">
                      {verdict.route ? (
                        <>
                          <Badge variant={verdict.divergesFromChoice ? "outline" : "default"}>El árbol dice: {reference.bbbRoutes.find((route) => route.id === verdict.route)?.label}</Badge>
                          <p className="mt-1 text-xs text-muted-foreground">{verdict.reason}</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">{verdict.reason}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <Button variant="outline" size="sm" onClick={() => update({ gaps: [...draft.gaps, { id: newId(), label: "", axes: {}, chosenRoute: null, note: null }] })}>Añadir capacidad</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>El socio</CardTitle>
          <CardDescription>{reference.partnerTypesProvenance}. El tipo de socio cambia lo que se puede esperar y lo que hay que vigilar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Tipo de socio</Label>
              <select className={select} value={draft.partnerType ?? ""} onChange={(event) => update({ partnerType: (event.target.value || null) as PartneringInput["partnerType"] })}>
                <option value="">Sin caracterizar</option>
                {reference.partnerTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Categoría</Label>
              <select className={select} value={draft.partnerCategory ?? ""} onChange={(event) => update({ partnerCategory: event.target.value || null })}>
                <option value="">Sin decidir</option>
                {reference.partnerCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Nombre (si ya hay candidato)</Label>
              <Input value={draft.partnerName ?? ""} onChange={(event) => update({ partnerName: event.target.value || null })} />
            </div>
          </div>

          {analysis?.partner && (
            <div className="grid gap-3 rounded-md border bg-muted/40 p-3 text-sm sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">Lo que se busca en él</div>
                <ul className="mt-1 space-y-1">{analysis.partner.foreignMotives.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">Lo que hay que vigilar</div>
                <ul className="mt-1 space-y-1">{analysis.partner.foreignRisks.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="text-sm font-medium">Las cuatro pruebas de encaje · {reference.partnerFitsProvenance}</div>
            {reference.partnerFits.map((fit) => {
              const entry = draft.fits.find((item) => item.id === fit.id) ?? { id: fit.id, score: null, evidence: null };
              return (
                <div key={fit.id} className="grid gap-2 sm:grid-cols-[1fr_5rem]">
                  <div>
                    <div className="text-sm">{fit.label}</div>
                    <div className="text-xs text-muted-foreground">{fit.question}</div>
                    <Input
                      className="mt-1"
                      value={entry.evidence ?? ""}
                      placeholder="Evidencia concreta, no impresión"
                      onChange={(event) => update({ fits: reference.partnerFits.map((option) => {
                        const existing = draft.fits.find((item) => item.id === option.id) ?? { id: option.id, score: null, evidence: null };
                        return option.id === fit.id ? { ...existing, evidence: event.target.value } : existing;
                      }) as PartneringInput["fits"] })}
                    />
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={4}
                    value={entry.score ?? ""}
                    onChange={(event) => {
                      const raw = event.target.value;
                      const value = raw === "" ? null : Math.max(0, Math.min(4, Number(raw)));
                      update({ fits: reference.partnerFits.map((option) => {
                        const existing = draft.fits.find((item) => item.id === option.id) ?? { id: option.id, score: null, evidence: null };
                        return option.id === fit.id ? { ...existing, score: Number.isNaN(value as number) ? null : value } : existing;
                      }) as PartneringInput["fits"] });
                    }}
                  />
                </div>
              );
            })}
            {analysis && analysis.fits.average !== null && (
              <p className="text-xs text-muted-foreground">
                Media {analysis.fits.average}/4 sobre {analysis.fits.answered} de {analysis.fits.total} pruebas. La media se muestra por comodidad: lo que decide es el encaje más débil, porque las cuatro no se compensan entre sí.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>La entrada como opción real</CardTitle>
          <CardDescription>{reference.realOptionProvenance}. Una inversión preliminar sin señales de salida no es una opción, es una apuesta pequeña.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Prima: inversión preliminar</Label>
              <Input type="number" value={draft.realOption.premium ?? ""} onChange={(event) => update({ realOption: { ...draft.realOption, premium: event.target.value === "" ? null : Number(event.target.value) } })} />
            </div>
            <div>
              <Label>Moneda</Label>
              <Input maxLength={8} value={draft.realOption.currency ?? ""} placeholder="CNY" onChange={(event) => update({ realOption: { ...draft.realOption, currency: event.target.value || null } })} />
            </div>
            <div>
              <Label>Periodo de observación (años)</Label>
              <Input type="number" min={0} max={20} value={draft.realOption.trialYears ?? ""} onChange={(event) => update({ realOption: { ...draft.realOption, trialYears: event.target.value === "" ? null : Number(event.target.value) } })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Señales que disparan la decisión</Label>
            {draft.realOption.triggers.map((trigger) => (
              <div key={trigger.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
                <Input value={trigger.signal} placeholder="Qué se observa" onChange={(event) => update({ realOption: { ...draft.realOption, triggers: draft.realOption.triggers.map((item) => (item.id === trigger.id ? { ...item, signal: event.target.value } : item)) } })} />
                <Input value={trigger.threshold ?? ""} placeholder="Umbral verificable" onChange={(event) => update({ realOption: { ...draft.realOption, triggers: draft.realOption.triggers.map((item) => (item.id === trigger.id ? { ...item, threshold: event.target.value } : item)) } })} />
                <select className={select} value={trigger.stance} onChange={(event) => update({ realOption: { ...draft.realOption, triggers: draft.realOption.triggers.map((item) => (item.id === trigger.id ? { ...item, stance: event.target.value as typeof item.stance } : item)) } })}>
                  <option value="expand">Ampliar</option>
                  <option value="hold">Mantener</option>
                  <option value="retreat">Replegar</option>
                </select>
                <Button variant="ghost" size="sm" onClick={() => update({ realOption: { ...draft.realOption, triggers: draft.realOption.triggers.filter((item) => item.id !== trigger.id) } })}>Quitar</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update({ realOption: { ...draft.realOption, triggers: [...draft.realOption.triggers, { id: newId(), signal: "", threshold: null, stance: "expand" }] } })}>Añadir señal</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Si se desarrolla</Label>
              <select className={select} value={draft.realOption.expansionPathId ?? ""} onChange={(event) => update({ realOption: { ...draft.realOption, expansionPathId: event.target.value || null } })}>
                <option value="">Sin decidir</option>
                {reference.optionExpansionPaths.map((path) => <option key={path.id} value={path.id}>{path.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Si no se desarrolla</Label>
              <select className={select} value={draft.realOption.retreatPathId ?? ""} onChange={(event) => update({ realOption: { ...draft.realOption, retreatPathId: event.target.value || null } })}>
                <option value="">Sin decidir</option>
                {reference.optionRetreatPaths.map((path) => <option key={path.id} value={path.id}>{path.label}</option>)}
              </select>
            </div>
          </div>

          {analysis && !analysis.option.structured && analysis.option.missing.length > 0 && (
            <p className="text-xs text-muted-foreground">Falta para que la opción esté estructurada: {analysis.option.missing.join("; ")}.</p>
          )}
        </CardContent>
      </Card>

      {analysis && analysis.warnings.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Coherencia</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {analysis.warnings.map((warning) => (
              <div key={warning.id} className="flex gap-2 rounded-md border p-3 text-sm">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${warning.severity === "block" ? "text-destructive" : "text-amber-500"}`} />
                <div>
                  <p>{warning.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{warning.provenance}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <SaveBar dirty={dirty} pending={save.isPending} completeness={analysis?.completeness ?? null} onSave={() => save.mutate({ caseId, payload: draft })} />
    </div>
  );
}
