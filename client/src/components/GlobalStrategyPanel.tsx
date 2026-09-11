import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Compass, DoorOpen, Handshake, Info, Layers, Loader2, Save, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { useLanguage } from "@/i18n";
import type { Localized } from "@shared/i18n";
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

type SubTab = "ambition" | "positioning" | "entry" | "partnering" | "coherence";

type Props = {
  caseId: number | null;
  /** Pestaña activa, controlada desde fuera para que la ruta guiada pueda llevar aquí. */
  subTab?: SubTab;
  onSubTabChange?: (tab: SubTab) => void;
};

export function GlobalStrategyPanel({ caseId, subTab, onSubTabChange }: Props) {
  const { ui } = useLanguage();
  if (caseId === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{ui("gsTitle")}</CardTitle>
          <CardDescription>{ui("gsNoCase")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return <Loaded caseId={caseId} subTab={subTab} onSubTabChange={onSubTabChange} />;
}

function Loaded({ caseId, subTab, onSubTabChange }: { caseId: number; subTab?: SubTab; onSubTabChange?: (tab: SubTab) => void }) {
  const { ui } = useLanguage();
  const reference = trpc.globalStrategy.reference.useQuery();
  if (reference.isLoading || !reference.data) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> {ui("gsLoading")}
      </div>
    );
  }
  return (
    <Tabs value={subTab ?? "ambition"} onValueChange={(value) => onSubTabChange?.(value as SubTab)} className="space-y-6">
      {/*
        La fila crece en alto y envuelve en lugar de desbordarse. Con cuatro sub-pestañas
        cabía en una línea; al entrar Coherencia como quinta, en pantallas estrechas la
        última quedaba cortada fuera del contenedor y parecía que no existía.
      */}
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="ambition"><Compass className="mr-2 h-4 w-4" />{ui("gsSubAmbition")}</TabsTrigger>
        <TabsTrigger value="positioning"><Layers className="mr-2 h-4 w-4" />{ui("gsSubPositioning")}</TabsTrigger>
        <TabsTrigger value="entry"><DoorOpen className="mr-2 h-4 w-4" />{ui("gsSubEntry")}</TabsTrigger>
        <TabsTrigger value="partnering"><Handshake className="mr-2 h-4 w-4" />{ui("gsSubPartnering")}</TabsTrigger>
        <TabsTrigger value="coherence"><ShieldCheck className="mr-2 h-4 w-4" />{ui("gsSubCoherence")}</TabsTrigger>
      </TabsList>
      <TabsContent value="ambition"><AmbitionBlock caseId={caseId} reference={reference.data} /></TabsContent>
      <TabsContent value="positioning"><PositioningBlock caseId={caseId} reference={reference.data} /></TabsContent>
      <TabsContent value="entry"><EntryBlock caseId={caseId} reference={reference.data} /></TabsContent>
      <TabsContent value="partnering"><PartneringBlock caseId={caseId} reference={reference.data} /></TabsContent>
      <TabsContent value="coherence"><CoherenceBlock caseId={caseId} onGo={onSubTabChange} /></TabsContent>
    </Tabs>
  );
}

type Reference = RouterOutputs["globalStrategy"]["reference"];

/* ------------------------------------------------------------------------------------ */
/* M1 — Ambición                                                                         */
/* ------------------------------------------------------------------------------------ */

function AmbitionBlock({ caseId, reference }: { caseId: number; reference: Reference }) {
  const { t, ui } = useLanguage();
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
      toast.success(ui("amToastSaved"));
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
          <CardTitle>{ui("amMotivesTitle")}</CardTitle>
          <CardDescription>{ui("amMotivesDesc")}</CardDescription>
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
                    {t(motive.label)}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{t(motive.description)}</span>
                  </span>
                </label>
                {entry.selected && (
                  <Input
                    value={entry.justification ?? ""}
                    placeholder={ui("amWhyApplies")}
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
          <CardTitle>{ui("amIndicesTitle")}</CardTitle>
          <CardDescription>
            {analysis?.convention.formula} — {t(reference.industryDemandProvenance)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{ui("amRegions")}</Label>
              <select className={select} value={draft.regionSetId} onChange={(event) => changeRegionSet(event.target.value as RegionSetId)}>
                {reference.regionSets.map((set) => <option key={set.id} value={set.id}>{t(set.label)} · {t(set.provenance)}</option>)}
              </select>
            </div>
            <div>
              <Label>{ui("amIndustryRef")}</Label>
              <select className={select} value={draft.industryId ?? ""} onChange={(event) => pickIndustry(event.target.value)}>
                <option value="">{ui("amManualDemand")}</option>
                {reference.industryDemand.map((row) => <option key={row.id} value={row.id}>{t(row.label)}</option>)}
              </select>
            </div>
          </div>

          <FigureGrid label={ui("amWorldDemand")} regions={regions} values={draft.industryDemand} onChange={(regionId, raw) => figures("industryDemand", regionId, raw)} />
          <FigureGrid label={ui("amCompanyRevenue")} regions={regions} values={draft.companyRevenue} onChange={(regionId, raw) => figures("companyRevenue", regionId, raw)} help={ui("amRevenueHelp")} />
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Label className="mb-0">{ui("amCapabilityByRegion")}</Label>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={draft.capabilityBasis} onChange={(event) => update({ capabilityBasis: event.target.value as AmbitionInput["capabilityBasis"] })}>
                <option value="assets">{ui("amAssets")}</option>
                <option value="personnel">{ui("amPersonnel")}</option>
              </select>
            </div>
            <FigureGrid label="" regions={regions} values={draft.companyCapability} onChange={(regionId, raw) => figures("companyCapability", regionId, raw)} />
          </div>

          {analysis && (
            <div className="rounded-md border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">GRI {analysis.indices.gri === null ? "—" : analysis.indices.gri.toFixed(3)}</Badge>
                <Badge variant="outline">GCI {analysis.indices.gci === null ? "—" : analysis.indices.gci.toFixed(3)}</Badge>
                {analysis.position && <Badge>{t(analysis.position.zone)} · {t(analysis.position.provenance)}</Badge>}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{t(analysis.convention.note)}</p>
              {analysis.gap.note && <p className="mt-2 text-sm">{t(analysis.gap.note)}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("amRoleStageTitle")}</CardTitle>
          <CardDescription>{ui("amRoleStageDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{ui("amRoleToday")}</Label>
            <select className={select} value={draft.currentRole ?? ""} onChange={(event) => update({ currentRole: (event.target.value || null) as AmbitionInput["currentRole"] })}>
              <option value="">{ui("gsUndeclared")}</option>
              {reference.globalRoles.map((role) => <option key={role.id} value={role.id}>{t(role.label)}</option>)}
            </select>
          </div>
          <div>
            <Label>{ui("amRoleTarget")}</Label>
            <select className={select} value={draft.targetRole ?? ""} onChange={(event) => update({ targetRole: (event.target.value || null) as AmbitionInput["targetRole"] })}>
              <option value="">{ui("gsUndeclared")}</option>
              {reference.globalRoles.map((role) => <option key={role.id} value={role.id}>{t(role.label)}</option>)}
            </select>
          </div>
          <div>
            <Label>{ui("amHorizon")}</Label>
            <Input type="number" min={1} max={30} value={draft.targetHorizonYears ?? ""} onChange={(event) => update({ targetHorizonYears: event.target.value ? Number(event.target.value) : null })} />
          </div>
          <div>
            <Label>{ui("amStage")}</Label>
            <select className={select} value={draft.stage ?? ""} onChange={(event) => update({ stage: (event.target.value || null) as AmbitionInput["stage"] })}>
              <option value="">{ui("gsUndeclared")}</option>
              {reference.stages.map((stage) => <option key={stage.id} value={stage.id}>{t(stage.label)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>{ui("amOrgDesign")}</Label>
            <select className={select} value={draft.organizationalPhase ?? ""} onChange={(event) => update({ organizationalPhase: (event.target.value || null) as AmbitionInput["organizationalPhase"] })}>
              <option value="">{ui("gsUndeclared")}</option>
              {reference.organizationalDesigns.map((design) => <option key={design.id} value={design.id}>{t(design.label)}</option>)}
            </select>
            {draft.organizationalPhase && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t(reference.organizationalDesigns.find((design) => design.id === draft.organizationalPhase)?.structure)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("amCountryRolesTitle")}</CardTitle>
          <CardDescription>{ui("amCountryRolesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.countryRoles.map((entry, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[6rem_12rem_1fr_auto]">
              <Input value={entry.countryCode} placeholder="ESP" maxLength={3} onChange={(event) => update({ countryRoles: draft.countryRoles.map((item, position) => (position === index ? { ...item, countryCode: event.target.value.toUpperCase() } : item)) })} />
              <select className={select} value={entry.role ?? ""} onChange={(event) => update({ countryRoles: draft.countryRoles.map((item, position) => (position === index ? { ...item, role: (event.target.value || null) as typeof item.role } : item)) })}>
                <option value="">{ui("amNoRole")}</option>
                {reference.countryRoles.map((role) => <option key={role.id} value={role.id}>{t(role.label)}</option>)}
              </select>
              <Input value={entry.justification ?? ""} placeholder={ui("amCriterion")} onChange={(event) => update({ countryRoles: draft.countryRoles.map((item, position) => (position === index ? { ...item, justification: event.target.value } : item)) })} />
              <Button variant="ghost" size="sm" onClick={() => update({ countryRoles: draft.countryRoles.filter((_, position) => position !== index) })}>{ui("gsRemove")}</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => update({ countryRoles: [...draft.countryRoles, { countryCode: "", role: null, justification: null }] })}>{ui("amAddCountry")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("amLofTitle")}</CardTitle>
          <CardDescription>{ui("amLofDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea rows={3} value={draft.liabilityOfForeignness ?? ""} placeholder={ui("amLofPlaceholder")} onChange={(event) => update({ liabilityOfForeignness: event.target.value })} />
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
  regions: { id: string; label: Localized }[];
  values: Record<string, number | null>;
  onChange: (regionId: string, raw: string) => void;
  help?: string;
}) {
  const { t } = useLanguage();
  return (
    <div>
      {label && <Label>{label}</Label>}
      {help && <p className="mb-1 text-xs text-muted-foreground">{help}</p>}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(regions.length, 4)}, minmax(0, 1fr))` }}>
        {regions.map((region) => (
          <div key={region.id}>
            <span className="text-xs text-muted-foreground">{t(region.label)}</span>
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
  const { t, ui } = useLanguage();
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
      toast.success(ui("poToastSaved"));
    },
    onError: (error) => toast.error(error.message),
  });

  const analysis = query.data;
  const update = (patch: Partial<PositioningInput>) => { setDraft((current) => ({ ...current, ...patch })); setDirty(true); };
  const newId = () => Math.random().toString(36).slice(2, 10);

  // Las etiquetas de los atributos las escribe quien analiza: no se traducen.
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
          <CardTitle>{ui("poTitle")}</CardTitle>
          <CardDescription>{ui("poDescPre")} {t(reference.positioningsProvenance)}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {reference.valuePropositionDimensions.map((dimension) => (
              <div key={dimension.id}>
                <Label>{t(dimension.label)}</Label>
                <select
                  className={select}
                  value={(draft[dimension.id as "scope" | "advantage" | "standardization"] as string) ?? ""}
                  onChange={(event) => update({ [dimension.id]: event.target.value || null } as Partial<PositioningInput>)}
                >
                  <option value="">{ui("gsUndecided")}</option>
                  {dimension.options.map((option) => <option key={option.id} value={option.id}>{t(option.label)}</option>)}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">{t(dimension.question)}</p>
              </div>
            ))}
          </div>
          {analysis?.positioning && (
            <div className="rounded-md border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{t(analysis.positioning.label)}</Badge>
                <span className="text-xs text-muted-foreground">{t(analysis.positioning.familyLabel)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{ui("poExamples")}: {analysis.positioning.examples.join(", ")}.</p>
            </div>
          )}
          <div>
            <Label>{ui("poWhyThis")}</Label>
            <Textarea rows={2} value={draft.positioningRationale ?? ""} onChange={(event) => update({ positioningRationale: event.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("poCurveTitle")}</CardTitle>
          <CardDescription>{ui("poCurveDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            {draft.competitors.map((competitor, index) => (
              <div key={competitor.id}>
                <Label className="text-xs">{ui("poCompetitor")} {index + 1}</Label>
                <Input className="w-40" value={competitor.label} onChange={(event) => update({ competitors: draft.competitors.map((item) => (item.id === competitor.id ? { ...item, label: event.target.value } : item)) })} />
              </div>
            ))}
            {draft.competitors.length < 3 && (
              <Button variant="outline" size="sm" onClick={() => update({ competitors: [...draft.competitors, { id: newId(), label: "" }] })}>{ui("poAddCompetitor")}</Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">{ui("poAttribute")}</th>
                  <th className="py-2 w-20">{ui("poAsIs")}</th>
                  <th className="py-2 w-20">{ui("poToBe")}</th>
                  {draft.competitors.map((competitor) => <th key={competitor.id} className="py-2 w-24">{competitor.label || ui("poCompetitor")}</th>)}
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
                    <td className="py-2"><Button variant="ghost" size="sm" onClick={() => update({ valueCurve: draft.valueCurve.filter((item) => item.id !== attribute.id) })}>{ui("gsRemove")}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="outline" size="sm" onClick={() => update({ valueCurve: [...draft.valueCurve, { id: newId(), label: "", asIs: null, toBe: null, competitors: {}, note: null }] })}>{ui("poAddAttribute")}</Button>

          {analysis && (
            <div className="rounded-md border bg-muted/40 p-4">
              <div className="grid gap-3 sm:grid-cols-4">
                {reference.errcActions.filter((action) => action.id !== "keep").map((action) => (
                  <div key={action.id}>
                    <div className="text-xs font-semibold uppercase text-muted-foreground">{t(action.label)}</div>
                    <ul className="mt-1 space-y-1 text-sm">
                      {(errcByAction[action.id] ?? []).map((label) => <li key={label}>{label}</li>)}
                      {!(errcByAction[action.id] ?? []).length && <li className="text-muted-foreground">—</li>}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {ui("poDivergence")}: {analysis.valueCurve.divergence === null ? ui("poNoData") : analysis.valueCurve.divergence.toFixed(2)}.
                {analysis.valueCurve.note ? ` ${t(analysis.valueCurve.note)}` : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("poChainTitle")}</CardTitle>
          <CardDescription>{ui("poChainDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {VALUE_CHAIN_FUNCTIONS.map((fn) => {
            const cell = draft.valueChain[fn.id] ?? { current: null, target: null };
            return (
              <div key={fn.id} className="grid gap-2 sm:grid-cols-[1fr_9rem_9rem]">
                <div>
                  <div className="text-sm font-medium">{t(fn.label)}</div>
                  <div className="text-xs text-muted-foreground">{t(fn.hints[(cell.target ?? cell.current ?? "global") as ValueChainLevel])}</div>
                </div>
                <LevelSelect label={ui("poAsIs")} value={cell.current} levels={reference.valueChainLevels} onChange={(value) => update({ valueChain: { ...draft.valueChain, [fn.id]: { ...cell, current: value } } })} />
                <LevelSelect label={ui("poTargetLevel")} value={cell.target} levels={reference.valueChainLevels} onChange={(value) => update({ valueChain: { ...draft.valueChain, [fn.id]: { ...cell, target: value } } })} />
              </div>
            );
          })}
          {analysis && (
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <p>
                {ui("poCurrentConfig")}: <strong>{t(configurationName(reference, analysis.valueChain.currentConfiguration)) || ui("poUndeterminedLower")}</strong>. {ui("poTargetConfig")}:{" "}
                <strong>{t(configurationName(reference, analysis.valueChain.targetConfiguration)) || ui("poUndeterminedLower")}</strong>.
              </p>
              {analysis.valueChain.moves.length > 0 && (
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {analysis.valueChain.moves.map((move) => (
                    <li key={move.functionId}>
                      {t(move.label)}: {move.direction === "centralize" ? ui("poCentralize") : ui("poDecentralize")} {ui("poFrom")}{" "}
                      {t(levelLabel(reference, move.from))} {ui("poTo")} {t(levelLabel(reference, move.to))}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("poTacTitle")}</CardTitle>
          <CardDescription>{ui("poTacDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.tac.map((entry) => (
            <div key={entry.id} className="grid gap-2 sm:grid-cols-[8rem_1fr_10rem_8rem_auto]">
              <select className={select} value={entry.kind} onChange={(event) => update({ tac: draft.tac.map((item) => (item.id === entry.id ? { ...item, kind: event.target.value as typeof item.kind } : item)) })}>
                {reference.capabilityKinds.map((kind) => <option key={kind.id} value={kind.id}>{t(kind.label)}</option>)}
              </select>
              <Input value={entry.label} placeholder={ui("poCapPlaceholder")} onChange={(event) => update({ tac: draft.tac.map((item) => (item.id === entry.id ? { ...item, label: event.target.value } : item)) })} />
              <select className={select} value={entry.functionId ?? ""} onChange={(event) => update({ tac: draft.tac.map((item) => (item.id === entry.id ? { ...item, functionId: (event.target.value || null) as typeof item.functionId } : item)) })}>
                <option value="">{ui("poNoFunction")}</option>
                {reference.valueChainFunctions.map((fn) => <option key={fn.id} value={fn.id}>{t(fn.label)}</option>)}
              </select>
              <select className={select} value={entry.tag ?? ""} onChange={(event) => update({ tac: draft.tac.map((item) => (item.id === entry.id ? { ...item, tag: (event.target.value || null) as typeof item.tag } : item)) })}>
                <option value="">{ui("poUntagged")}</option>
                {reference.tacTags.map((tag) => <option key={tag.id} value={tag.id}>{t(tag.label)}</option>)}
              </select>
              <Button variant="ghost" size="sm" onClick={() => update({ tac: draft.tac.filter((item) => item.id !== entry.id) })}>{ui("gsRemove")}</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => update({ tac: [...draft.tac, { id: newId(), kind: "competency", label: "", functionId: null, tag: null, note: null }] })}>{ui("poAddCapability")}</Button>

          {analysis && analysis.resourceGap.toCreate.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <div className="text-xs font-semibold uppercase text-muted-foreground">{ui("poToCreate")}</div>
              <ul className="mt-1 space-y-1">{analysis.resourceGap.toCreate.map((entry) => <li key={entry.id}>{entry.label}</li>)}</ul>
              {analysis.resourceGap.creationLoad !== null && (
                <p className="mt-2 text-xs text-muted-foreground">{ui("poCreationLoad")}: {(analysis.resourceGap.creationLoad * 100).toFixed(0)}% {ui("poCreationLoadTail")}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("amLofTitle")}</CardTitle>
          <CardDescription>{ui("poLofDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{ui("poHandicap")}</Label>
            <Textarea rows={3} value={draft.liabilityOfForeignness.handicap ?? ""} onChange={(event) => update({ liabilityOfForeignness: { ...draft.liabilityOfForeignness, handicap: event.target.value } })} />
          </div>
          <div>
            <Label>{ui("poCompensating")}</Label>
            <Textarea rows={3} value={draft.liabilityOfForeignness.compensatingAdvantage ?? ""} onChange={(event) => update({ liabilityOfForeignness: { ...draft.liabilityOfForeignness, compensatingAdvantage: event.target.value } })} />
          </div>
        </CardContent>
      </Card>

      {analysis && analysis.warnings.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{ui("gsCoherence")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {analysis.warnings.map((warning) => (
              <div key={warning.id} className="flex gap-2 rounded-md border p-3 text-sm">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${warning.severity === "block" ? "text-destructive" : "text-amber-500"}`} />
                <div>
                  <p>{t(warning.message)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(warning.provenance)}</p>
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

function configurationName(reference: Reference, id: string | null): Localized | null {
  if (!id) return null;
  return reference.configurations.find((configuration) => configuration.id === id)?.label ?? null;
}

function levelLabel(reference: Reference, id: string): Localized | string {
  return reference.valueChainLevels.find((level) => level.id === id)?.label ?? id;
}

function LevelSelect({ label, value, levels, onChange }: {
  label: string;
  value: ValueChainLevel | null;
  levels: { id: string; label: Localized }[];
  onChange: (value: ValueChainLevel | null) => void;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <select className={select} value={value ?? ""} onChange={(event) => onChange((event.target.value || null) as ValueChainLevel | null)}>
        <option value="">—</option>
        {levels.map((level) => <option key={level.id} value={level.id}>{t(level.label)}</option>)}
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
  completeness: { answered: number; total: number; missing: Localized[] } | null;
  onSave: () => void;
}) {
  const { t, ui } = useLanguage();
  return (
    <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background/95 p-3 backdrop-blur">
      <div className="text-sm">
        {completeness && (
          <>
            <Badge variant="outline">{completeness.answered}/{completeness.total} {ui("gsAnswered")}</Badge>
            {completeness.missing.length > 0 && (
              <span className="ml-3 text-xs text-muted-foreground">
                {ui("gsStillMissing")}: {completeness.missing.slice(0, 2).map((entry) => t(entry)).join("; ")}
                {completeness.missing.length > 2 ? "…" : ""}
              </span>
            )}
          </>
        )}
      </div>
      <Button onClick={onSave} disabled={!dirty || pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {dirty ? ui("gsSave") : ui("gsSaved")}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------------------------ */
/* M4 — Estrategia de entrada (capítulo 7, primera parte)                                */
/* ------------------------------------------------------------------------------------ */

function EntryBlock({ caseId, reference }: { caseId: number; reference: Reference }) {
  const { t, ui } = useLanguage();
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
      toast.success(ui("enToastSaved"));
    },
    onError: (error) => toast.error(error.message),
  });

  const analysis = query.data;
  const update = (patch: Partial<EntryStrategyInput>) => { setDraft((current) => ({ ...current, ...patch })); setDirty(true); };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{ui("enWhyTitle")}</CardTitle>
          <CardDescription>{t(reference.entryObjectivesProvenance)}. {ui("enWhyDescTail")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-[10rem]">
            <Label>{ui("enCountry")}</Label>
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
                    {t(objective.label)}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {ui("enKpis")}: {objective.kpis.map((kpi) => t(kpi)).join(", ")}. {ui("enTiming")}: {t(objective.timing).toLowerCase()}.
                    </span>
                  </span>
                </label>
                {entry.selected && (
                  <Input value={entry.justification ?? ""} placeholder={ui("enObjectivePlaceholder")} onChange={(event) => update({ objectives: draft.objectives.map((item) => (item.id === objective.id ? { ...item, justification: event.target.value } : item)) })} />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("enWhenTitle")}</CardTitle>
          <CardDescription>{ui("enWhenDescPre")} {t(reference.windowPhasesProvenance)}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{ui("enPhase")}</Label>
              <select className={select} value={draft.phase ?? ""} onChange={(event) => update({ phase: (event.target.value || null) as EntryStrategyInput["phase"] })}>
                <option value="">{ui("gsUndetermined")}</option>
                {reference.windowPhases.map((phase) => <option key={phase.id} value={phase.id}>{t(phase.label)}</option>)}
              </select>
            </div>
            <div>
              <Label>{ui("enStance")}</Label>
              <select className={select} value={draft.timingStance ?? ""} onChange={(event) => update({ timingStance: (event.target.value || null) as EntryStrategyInput["timingStance"] })}>
                <option value="">{ui("gsUndecided")}</option>
                {reference.timingStances.map((stance) => <option key={stance.id} value={stance.id}>{t(stance.label)}</option>)}
              </select>
            </div>
          </div>
          {analysis?.phase && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="text-muted-foreground">{t(analysis.phase.signal)}</p>
              <p className="mt-1">{t(analysis.phase.guidance)}</p>
            </div>
          )}
          <div>
            <Label>{ui("enPhaseEvidence")}</Label>
            <Textarea rows={2} value={draft.phaseEvidence ?? ""} placeholder={ui("enPhaseEvidencePlaceholder")} onChange={(event) => update({ phaseEvidence: event.target.value })} />
          </div>
          <div>
            <Label>{ui("enWhyStance")}</Label>
            <Textarea rows={2} value={draft.timingRationale ?? ""} placeholder={ui("enWhyStancePlaceholder")} onChange={(event) => update({ timingRationale: event.target.value })} />
          </div>
          <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
            <div>
              <div className="font-semibold uppercase">{ui("enFirstMoverPros")}</div>
              <ul className="mt-1 space-y-1">{reference.firstMover.advantages.map((item) => <li key={t(item)}>{t(item)}</li>)}</ul>
            </div>
            <div>
              <div className="font-semibold uppercase">{ui("enFirstMoverCons")}</div>
              <ul className="mt-1 space-y-1">{reference.firstMover.disadvantages.map((item) => <li key={t(item)}>{t(item)}</li>)}</ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("enPaceTitle")}</CardTitle>
          <CardDescription>{t(reference.paceProvenance)}. {ui("enPaceScale")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reference.paceFactors.map((factor) => (
            <div key={factor.id} className="grid gap-2 sm:grid-cols-[1fr_6rem]">
              <div>
                <div className="text-sm font-medium">{t(factor.label)}</div>
                <div className="text-xs text-muted-foreground">
                  {t(factor.question)} {ui("enPaceHighPushes")} {factor.direction === "faster" ? ui("enPaceFast") : ui("enPaceGradual")}.
                </div>
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
              {ui("enPaceSummaryPre")} {analysis.pace.answered} {ui("coOf")} {analysis.pace.total} {ui("enPaceSummaryMid")}{" "}
              <strong>{paceWord(ui, analysis.pace.recommendation)}</strong> ({ui("enPaceIndex")} {analysis.pace.index?.toFixed(2)}).
              <p className="mt-1 text-xs text-muted-foreground">{ui("enPaceNote")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("enHowTitle")}</CardTitle>
          <CardDescription>{ui("enHowDescPre")} {t(reference.modeMappingProvenance)} {ui("enHowDescTail")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>{ui("enAttractiveness")}</Label>
              <select className={select} value={draft.marketAttractiveness ?? ""} onChange={(event) => update({ marketAttractiveness: (event.target.value || null) as Band | null })}>
                <option value="">—</option>
                <option value="low">{ui("enLow")}</option>
                <option value="medium">{ui("enMedium")}</option>
                <option value="high">{ui("enHigh")}</option>
              </select>
            </div>
            <div>
              <Label>{ui("enClimate")}</Label>
              <select className={select} value={draft.politicalClimate ?? ""} onChange={(event) => update({ politicalClimate: (event.target.value || null) as ClimateBand | null })}>
                <option value="">—</option>
                <option value="poor">{ui("enPoor")}</option>
                <option value="medium">{ui("enMedium")}</option>
                <option value="good">{ui("enGood")}</option>
              </select>
            </div>
            <div>
              <Label>{ui("enPreferredMode")}</Label>
              <select className={select} value={draft.preferredMode ?? ""} onChange={(event) => update({ preferredMode: event.target.value || null })}>
                <option value="">{ui("gsUndecided")}</option>
                {reference.entryModes.map((mode) => <option key={mode.key} value={mode.key}>{t(mode.label)}</option>)}
              </select>
            </div>
          </div>

          {analysis?.shortlist && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              {ui("enMapPointsTo")}: {analysis.shortlist.modes.map((mode) => t(mode)).join(", ")}.
              <span className="ml-2 text-xs text-muted-foreground">{t(analysis.shortlist.provenance)}</span>
            </div>
          )}

          <div>
            <Label>{ui("enWhyMode")}</Label>
            <Textarea rows={2} value={draft.modeRationale ?? ""} onChange={(event) => update({ modeRationale: event.target.value })} />
          </div>
          <div>
            <Label>{ui("enGovReq")}</Label>
            <Textarea rows={2} value={draft.governmentRequirements ?? ""} placeholder={ui("enGovReqPlaceholder")} onChange={(event) => update({ governmentRequirements: event.target.value })} />
          </div>
          <div className="max-w-sm">
            <Label>{ui("enDigitalModel")}</Label>
            <select className={select} value={draft.digitalModel ?? ""} onChange={(event) => update({ digitalModel: event.target.value || null })}>
              <option value="">{ui("enNotApplicable")}</option>
              {reference.digitalEntryModels.map((model) => <option key={model.id} value={model.id}>{t(model.label)}</option>)}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">{t(reference.digitalEntryProvenance)}</p>
          </div>
        </CardContent>
      </Card>

      {analysis && analysis.warnings.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{ui("gsCoherence")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {analysis.warnings.map((warning) => (
              <div key={warning.id} className="flex gap-2 rounded-md border p-3 text-sm">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${warning.severity === "block" ? "text-destructive" : "text-amber-500"}`} />
                <div>
                  <p>{t(warning.message)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(warning.provenance)}</p>
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

/** El ritmo se calcula con identificadores; la palabra la pone la interfaz. */
function paceWord(ui: (key: "enPaceFast" | "enPaceGradual" | "enPaceBalanced") => string, recommendation: string | null) {
  if (recommendation === "rapido") return ui("enPaceFast");
  if (recommendation === "gradual") return ui("enPaceGradual");
  return ui("enPaceBalanced");
}

/* ------------------------------------------------------------------------------------ */
/* M5 — Vía de acceso y socio (capítulos 7 y 8)                                          */
/* ------------------------------------------------------------------------------------ */

function PartneringBlock({ caseId, reference }: { caseId: number; reference: Reference }) {
  const { t, ui } = useLanguage();
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
      toast.success(ui("paToastSaved"));
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
          <CardTitle>{ui("paGapsTitle")}</CardTitle>
          <CardDescription>{t(reference.bbbProvenance)}. {ui("paGapsDescTail")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importable.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p>{ui("paImportablePre")} {importable.length} {ui("paImportableTail")}</p>
              <Button
                className="mt-2"
                size="sm"
                variant="outline"
                onClick={() => update({ gaps: [...draft.gaps, ...importable.map((entry) => ({ id: newId(), label: entry.label, axes: {}, chosenRoute: null, note: null }))] })}
              >
                {ui("paBring")}
              </Button>
            </div>
          )}

          {draft.gaps.map((gap) => {
            const verdict = verdictFor(gap.id);
            return (
              <div key={gap.id} className="space-y-3 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Input value={gap.label} placeholder={ui("paGapPlaceholder")} onChange={(event) => update({ gaps: draft.gaps.map((item) => (item.id === gap.id ? { ...item, label: event.target.value } : item)) })} />
                  <Button variant="ghost" size="sm" onClick={() => update({ gaps: draft.gaps.filter((item) => item.id !== gap.id) })}>{ui("gsRemove")}</Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {reference.bbbAxes.map((axis) => (
                    <div key={axis.id} className="grid grid-cols-[1fr_5rem] items-center gap-2">
                      <div>
                        <div className="text-sm">{t(axis.label)}</div>
                        <div className="text-xs text-muted-foreground">{t(axis.question)}</div>
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
                    <Label className="text-xs">{ui("paChosenRoute")}</Label>
                    <select className={select} value={gap.chosenRoute ?? ""} onChange={(event) => update({ gaps: draft.gaps.map((item) => (item.id === gap.id ? { ...item, chosenRoute: (event.target.value || null) as typeof item.chosenRoute } : item)) })}>
                      <option value="">{ui("gsUndecided")}</option>
                      {reference.bbbRoutes.map((route) => <option key={route.id} value={route.id}>{t(route.label)}</option>)}
                    </select>
                  </div>
                  {verdict && (
                    <div className="self-end text-sm">
                      {verdict.route ? (
                        <>
                          <Badge variant={verdict.divergesFromChoice ? "outline" : "default"}>
                            {ui("paTreeSays")} {t(reference.bbbRoutes.find((route) => route.id === verdict.route)?.label)}
                          </Badge>
                          <p className="mt-1 text-xs text-muted-foreground">{t(verdict.reason)}</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t(verdict.reason)}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <Button variant="outline" size="sm" onClick={() => update({ gaps: [...draft.gaps, { id: newId(), label: "", axes: {}, chosenRoute: null, note: null }] })}>{ui("paAddCapability")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("paPartnerTitle")}</CardTitle>
          <CardDescription>{t(reference.partnerTypesProvenance)}. {ui("paPartnerDescTail")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>{ui("paPartnerType")}</Label>
              <select className={select} value={draft.partnerType ?? ""} onChange={(event) => update({ partnerType: (event.target.value || null) as PartneringInput["partnerType"] })}>
                <option value="">{ui("paUncharacterized")}</option>
                {reference.partnerTypes.map((type) => <option key={type.id} value={type.id}>{t(type.label)}</option>)}
              </select>
            </div>
            <div>
              <Label>{ui("paCategory")}</Label>
              <select className={select} value={draft.partnerCategory ?? ""} onChange={(event) => update({ partnerCategory: event.target.value || null })}>
                <option value="">{ui("gsUndecided")}</option>
                {reference.partnerCategories.map((category) => <option key={category.id} value={category.id}>{t(category.label)}</option>)}
              </select>
            </div>
            <div>
              <Label>{ui("paName")}</Label>
              <Input value={draft.partnerName ?? ""} onChange={(event) => update({ partnerName: event.target.value || null })} />
            </div>
          </div>

          {analysis?.partner && (
            <div className="grid gap-3 rounded-md border bg-muted/40 p-3 text-sm sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">{ui("paSought")}</div>
                <ul className="mt-1 space-y-1">{analysis.partner.foreignMotives.map((item) => <li key={t(item)}>{t(item)}</li>)}</ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">{ui("paWatch")}</div>
                <ul className="mt-1 space-y-1">{analysis.partner.foreignRisks.map((item) => <li key={t(item)}>{t(item)}</li>)}</ul>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="text-sm font-medium">{ui("paFourFits")} · {t(reference.partnerFitsProvenance)}</div>
            {reference.partnerFits.map((fit) => {
              const entry = draft.fits.find((item) => item.id === fit.id) ?? { id: fit.id, score: null, evidence: null };
              return (
                <div key={fit.id} className="grid gap-2 sm:grid-cols-[1fr_5rem]">
                  <div>
                    <div className="text-sm">{t(fit.label)}</div>
                    <div className="text-xs text-muted-foreground">{t(fit.question)}</div>
                    <Input
                      className="mt-1"
                      value={entry.evidence ?? ""}
                      placeholder={ui("paEvidencePlaceholder")}
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
                {ui("paAveragePre")} {analysis.fits.average}/4 {ui("paAverageMid")} {analysis.fits.answered} {ui("coOf")} {analysis.fits.total} {ui("paAverageTail")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("paOptionTitle")}</CardTitle>
          <CardDescription>{t(reference.realOptionProvenance)}. {ui("paOptionDescTail")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>{ui("paPremium")}</Label>
              <Input type="number" value={draft.realOption.premium ?? ""} onChange={(event) => update({ realOption: { ...draft.realOption, premium: event.target.value === "" ? null : Number(event.target.value) } })} />
            </div>
            <div>
              <Label>{ui("paCurrency")}</Label>
              <Input maxLength={8} value={draft.realOption.currency ?? ""} placeholder="CNY" onChange={(event) => update({ realOption: { ...draft.realOption, currency: event.target.value || null } })} />
            </div>
            <div>
              <Label>{ui("paTrialYears")}</Label>
              <Input type="number" min={0} max={20} value={draft.realOption.trialYears ?? ""} onChange={(event) => update({ realOption: { ...draft.realOption, trialYears: event.target.value === "" ? null : Number(event.target.value) } })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{ui("paTriggers")}</Label>
            {draft.realOption.triggers.map((trigger) => (
              <div key={trigger.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
                <Input value={trigger.signal} placeholder={ui("paSignalPlaceholder")} onChange={(event) => update({ realOption: { ...draft.realOption, triggers: draft.realOption.triggers.map((item) => (item.id === trigger.id ? { ...item, signal: event.target.value } : item)) } })} />
                <Input value={trigger.threshold ?? ""} placeholder={ui("paThresholdPlaceholder")} onChange={(event) => update({ realOption: { ...draft.realOption, triggers: draft.realOption.triggers.map((item) => (item.id === trigger.id ? { ...item, threshold: event.target.value } : item)) } })} />
                <select className={select} value={trigger.stance} onChange={(event) => update({ realOption: { ...draft.realOption, triggers: draft.realOption.triggers.map((item) => (item.id === trigger.id ? { ...item, stance: event.target.value as typeof item.stance } : item)) } })}>
                  <option value="expand">{ui("paExpand")}</option>
                  <option value="hold">{ui("paHold")}</option>
                  <option value="retreat">{ui("paRetreat")}</option>
                </select>
                <Button variant="ghost" size="sm" onClick={() => update({ realOption: { ...draft.realOption, triggers: draft.realOption.triggers.filter((item) => item.id !== trigger.id) } })}>{ui("gsRemove")}</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update({ realOption: { ...draft.realOption, triggers: [...draft.realOption.triggers, { id: newId(), signal: "", threshold: null, stance: "expand" }] } })}>{ui("paAddSignal")}</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{ui("paIfDevelops")}</Label>
              <select className={select} value={draft.realOption.expansionPathId ?? ""} onChange={(event) => update({ realOption: { ...draft.realOption, expansionPathId: event.target.value || null } })}>
                <option value="">{ui("gsUndecided")}</option>
                {reference.optionExpansionPaths.map((path) => <option key={path.id} value={path.id}>{t(path.label)}</option>)}
              </select>
            </div>
            <div>
              <Label>{ui("paIfNot")}</Label>
              <select className={select} value={draft.realOption.retreatPathId ?? ""} onChange={(event) => update({ realOption: { ...draft.realOption, retreatPathId: event.target.value || null } })}>
                <option value="">{ui("gsUndecided")}</option>
                {reference.optionRetreatPaths.map((path) => <option key={path.id} value={path.id}>{t(path.label)}</option>)}
              </select>
            </div>
          </div>

          {analysis && !analysis.option.structured && analysis.option.missing.length > 0 && (
            <p className="text-xs text-muted-foreground">{ui("paOptionMissing")}: {analysis.option.missing.map((entry) => t(entry)).join("; ")}.</p>
          )}
        </CardContent>
      </Card>

      {analysis && analysis.warnings.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{ui("gsCoherence")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {analysis.warnings.map((warning) => (
              <div key={warning.id} className="flex gap-2 rounded-md border p-3 text-sm">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${warning.severity === "block" ? "text-destructive" : "text-amber-500"}`} />
                <div>
                  <p>{t(warning.message)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(warning.provenance)}</p>
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
/* Coherencia entre módulos e índice de exhaustividad                                    */
/* ------------------------------------------------------------------------------------ */

const SEVERITY_ORDER = { block: 0, warn: 1, info: 2 } as const;

function CoherenceBlock({ caseId, onGo }: { caseId: number; onGo?: (tab: SubTab) => void }) {
  const { t, ui } = useLanguage();
  const query = trpc.globalStrategy.coherence.useQuery({ caseId });

  if (query.isLoading || !query.data) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> {ui("coLoading")}
      </div>
    );
  }

  const { findings, index } = query.data;
  const sorted = [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{ui("coIndexTitle")}</CardTitle>
          <CardDescription>{ui("coIndexDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-semibold tabular-nums">{index.pct}%</span>
            <span className="text-sm text-muted-foreground">{ui("coCovered")}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${index.pct}%` }} />
          </div>

          <div className="space-y-2">
            {index.modules.map((module) => (
              <div key={module.key} className="grid grid-cols-[1fr_3rem] items-center gap-3">
                <div>
                  <button
                    type="button"
                    className="text-sm hover:underline"
                    onClick={() => onGo?.(module.key as SubTab)}
                  >
                    {t(module.label)}
                  </button>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {ui("coWeight")} {module.weight}% · {module.answered} {ui("coOf")} {module.total}
                  </span>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary/70" style={{ width: `${module.pct}%` }} />
                  </div>
                </div>
                <span className="text-right text-sm tabular-nums text-muted-foreground">{module.pct}%</span>
              </div>
            ))}
          </div>

          {index.blockers.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <div className="text-xs font-semibold uppercase text-destructive">{ui("coBlockers")}</div>
              <ul className="mt-1 space-y-1">{index.blockers.map((blocker) => <li key={t(blocker)}>{t(blocker)}</li>)}</ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ui("coFindingsTitle")}</CardTitle>
          <CardDescription>{ui("coFindingsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {!sorted.length ? (
            <div className="flex items-center gap-2 rounded-md border p-4 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {ui("coNone")}
            </div>
          ) : (
            sorted.map((finding) => (
              <div key={finding.id} className="rounded-md border p-3 text-sm">
                <div className="flex gap-2">
                  {finding.severity === "info" ? (
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${finding.severity === "block" ? "text-destructive" : "text-amber-500"}`} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{t(finding.title)}</strong>
                      {finding.severity === "block" && <Badge variant="outline" className="border-destructive/50 text-destructive">{ui("coBlocks")}</Badge>}
                    </div>
                    <p className="mt-1">{t(finding.detail)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">{t(finding.provenance)}</span>
                      {finding.modules.map((module) => (
                        <Button key={module} variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={() => onGo?.(module as SubTab)}>
                          {ui("coGoTo")}{" "}
                          {module === "ambition"
                            ? ui("gsSubAmbition")
                            : module === "positioning"
                              ? ui("gsSubPositioning")
                              : module === "entry"
                                ? ui("gsSubEntry")
                                : ui("gsSubPartnering")}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
