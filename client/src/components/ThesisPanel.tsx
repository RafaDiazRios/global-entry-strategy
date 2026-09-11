import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/i18n";
import { emptyThesisInput, type ThesisInput } from "@shared/domain/thesis";
import { industry, type IndustryId } from "@shared/domain/industries";

/**
 * El formulario de la tesis. Nueve campos, y tres de ellos —presencia previa, restricción del
 * grupo y puerta regulatoria— son los que separan esto de un formulario de juguete.
 *
 * Vive en la pestaña del caso porque es ahí donde se dice qué hay que decidir. El tablero de
 * supuestos, que es la superficie de trabajo, vive arriba junto a la ruta guiada.
 */

const select =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function ThesisPanel({ caseId }: { caseId: number }) {
  const { t, ui } = useLanguage();
  const utils = trpc.useUtils();
  const reference = trpc.globalStrategy.reference.useQuery();
  const query = trpc.globalStrategy.getThesis.useQuery({ caseId });
  const [draft, setDraft] = useState<ThesisInput>(emptyThesisInput());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (query.data && !dirty) setDraft(query.data.thesis);
  }, [query.data, dirty]);

  const save = trpc.globalStrategy.saveThesis.useMutation({
    onSuccess: () => {
      setDirty(false);
      utils.globalStrategy.getThesis.invalidate({ caseId });
      toast.success(ui("thToastSaved"));
    },
    onError: (error) => toast.error(error.message),
  });

  if (!reference.data) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> {ui("gsLoading")}
      </div>
    );
  }

  const update = (patch: Partial<ThesisInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  const modes = industry(draft.industryId).modes;
  const answers = query.data?.answers ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4" /> {ui("thTitle")}
        </CardTitle>
        <CardDescription>{ui("thDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{ui("thCompany")}</Label>
            <Input value={draft.company ?? ""} onChange={(event) => update({ company: event.target.value || null })} />
          </div>
          <div>
            <Label>{ui("thIndustry")}</Label>
            <select
              className={select}
              value={draft.industryId ?? "generic"}
              onChange={(event) => update({ industryId: event.target.value as IndustryId, modeKey: null })}
            >
              {reference.data.industries.map((entry) => (
                <option key={entry.id} value={entry.id}>{t(entry.label)}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">{t(industry(draft.industryId).description)}</p>
          </div>
          <div>
            <Label>{ui("thCountry")}</Label>
            <Input
              maxLength={3}
              placeholder="NL"
              value={draft.countryCode ?? ""}
              onChange={(event) => update({ countryCode: event.target.value.toUpperCase() || null })}
            />
          </div>
          <div>
            <Label>{ui("thProduct")}</Label>
            <Input value={draft.product ?? ""} onChange={(event) => update({ product: event.target.value || null })} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>{ui("thStance")}</Label>
            <select className={select} value={draft.stance ?? ""} onChange={(event) => update({ stance: (event.target.value || null) as ThesisInput["stance"] })}>
              <option value="">{ui("gsUndecided")}</option>
              {reference.data.thesisStances.map((entry) => <option key={entry.id} value={entry.id}>{t(entry.label)}</option>)}
            </select>
          </div>
          <div>
            <Label>{ui("thEntryKind")}</Label>
            <select className={select} value={draft.entryKind ?? ""} onChange={(event) => update({ entryKind: (event.target.value || null) as ThesisInput["entryKind"] })}>
              <option value="">{ui("gsUndecided")}</option>
              {reference.data.entryKinds.map((entry) => <option key={entry.id} value={entry.id}>{t(entry.label)}</option>)}
            </select>
          </div>
          <div>
            <Label>{ui("thPresence")}</Label>
            <select className={select} value={draft.presence ?? ""} onChange={(event) => update({ presence: (event.target.value || null) as ThesisInput["presence"] })}>
              <option value="">{ui("gsUndecided")}</option>
              {reference.data.countryPresence.map((entry) => <option key={entry.id} value={entry.id}>{t(entry.label)}</option>)}
            </select>
          </div>
        </div>
        {draft.presence && (
          <p className="-mt-2 text-xs text-muted-foreground">
            {t(reference.data.countryPresence.find((entry) => entry.id === draft.presence)?.consequence)}
          </p>
        )}

        <div className="rounded-md border p-3">
          <div className="text-sm font-medium">{ui("thGroupConstraint")}</div>
          <p className="mb-3 text-xs text-muted-foreground">{ui("thGroupConstraintHelp")}</p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{ui("thDeclaredStrategy")}</Label>
              <Textarea
                rows={2}
                placeholder={ui("thDeclaredStrategyPh")}
                value={draft.groupConstraint.declaredStrategy ?? ""}
                onChange={(event) => update({ groupConstraint: { ...draft.groupConstraint, declaredStrategy: event.target.value || null } })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">{ui("thReturnThreshold")}</Label>
                <Input
                  type="number"
                  value={draft.groupConstraint.returnThresholdPct ?? ""}
                  onChange={(event) => update({ groupConstraint: { ...draft.groupConstraint, returnThresholdPct: event.target.value === "" ? null : Number(event.target.value) } })}
                />
              </div>
              <div>
                <Label className="text-xs">{ui("thEntities")}</Label>
                <Input
                  value={draft.groupConstraint.availableEntities ?? ""}
                  onChange={(event) => update({ groupConstraint: { ...draft.groupConstraint, availableEntities: event.target.value || null } })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border p-3">
          <div className="text-sm font-medium">{ui("thRegGate")}</div>
          <p className="mb-3 text-xs text-muted-foreground">{ui("thRegGateHelp")}</p>
          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <div>
              <Label className="text-xs">{ui("thRequiresLicence")}</Label>
              <select
                className={select}
                value={draft.regulatoryGate.requiresLicence === null ? "" : draft.regulatoryGate.requiresLicence ? "yes" : "no"}
                onChange={(event) => update({ regulatoryGate: { ...draft.regulatoryGate, requiresLicence: event.target.value === "" ? null : event.target.value === "yes" } })}
              >
                <option value="">—</option>
                <option value="yes">{ui("thYes")}</option>
                <option value="no">{ui("thNo")}</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">{ui("thLicenceRoute")}</Label>
              <Input
                value={draft.regulatoryGate.licenceRoute ?? ""}
                onChange={(event) => update({ regulatoryGate: { ...draft.regulatoryGate, licenceRoute: event.target.value || null } })}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Label>{ui("thMode")}</Label>
            <select className={select} value={draft.modeKey ?? ""} onChange={(event) => update({ modeKey: event.target.value || null })}>
              <option value="">{ui("thModeUndecided")}</option>
              {modes.map((mode) => <option key={mode.key} value={mode.key}>{t(mode.label)}</option>)}
            </select>
            {draft.modeKey && (
              <div className="mt-1 flex flex-wrap gap-1">
                {modes.find((mode) => mode.key === draft.modeKey)?.requiresPartner && (
                  <Badge variant="outline" className="text-[11px]">{ui("thRequiresPartner")}</Badge>
                )}
                {modes.find((mode) => mode.key === draft.modeKey)?.requiresLicence && (
                  <Badge variant="outline" className="text-[11px]">{ui("thRequiresLicenceTag")}</Badge>
                )}
              </div>
            )}
          </div>
          <div>
            <Label>{ui("thHorizon")}</Label>
            <Input
              type="number"
              min={1}
              max={120}
              value={draft.horizonMonths ?? ""}
              onChange={(event) => update({ horizonMonths: event.target.value === "" ? null : Number(event.target.value) })}
            />
          </div>
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <div>
              <Label>{ui("thCommitment")}</Label>
              <Input
                type="number"
                value={draft.commitment.amount ?? ""}
                onChange={(event) => update({ commitment: { ...draft.commitment, amount: event.target.value === "" ? null : Number(event.target.value) } })}
              />
            </div>
            <div>
              <Label>{ui("thCurrency")}</Label>
              <Input
                maxLength={8}
                value={draft.commitment.currency ?? ""}
                onChange={(event) => update({ commitment: { ...draft.commitment, currency: event.target.value || null } })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{ui("thReasons")}</Label>
          {draft.reasons.map((reason, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={reason}
                placeholder={ui("thReasonPh")}
                onChange={(event) => update({ reasons: draft.reasons.map((item, position) => (position === index ? event.target.value : item)) })}
              />
              <Button variant="ghost" size="sm" onClick={() => update({ reasons: draft.reasons.filter((_, position) => position !== index) })}>
                {ui("gsRemove")}
              </Button>
            </div>
          ))}
          {draft.reasons.length < 3 && (
            <Button variant="outline" size="sm" onClick={() => update({ reasons: [...draft.reasons, ""] })}>
              {ui("thAddReason")}
            </Button>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => save.mutate({ caseId, payload: { thesis: draft, answers } })} disabled={!dirty || save.isPending}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {dirty ? ui("gsSave") : ui("gsSaved")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
