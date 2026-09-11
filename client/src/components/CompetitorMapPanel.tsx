import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n";
import {
  emptyCompetitiveLandscape,
  emptyCompetitor,
  type CompetitiveLandscape,
  type Competitor,
} from "@shared/domain/competitiveLandscape";
import type { RevenueStack } from "@shared/domain/revenueStack";
import type { Localized } from "@shared/i18n";

/**
 * El mapa de competidores de un país.
 *
 * Vive al lado de la calibración y no la sustituye. La puntuación de rivalidad del capítulo 6
 * entra en el índice que compara países; esto entra en el argumento que se defiende. Son dos
 * usos distintos del mismo hecho y conviene no confundirlos.
 *
 * Como el resto de la herramienta, no calcula al escribir: lo que se ve abajo viene de la
 * última evaluación.
 */

export type ComputedLandscape = {
  status: "ok" | "not_declared";
  declaredSharePct: number;
  unattributedSharePct: number;
  hhi: number | null;
  bandLabel: Localized;
  bandReading: Localized;
  impliedSharePct: number | null;
  impliedUnits: number | null;
  acquisitionSpend: number | null;
  findings: Localized[];
};

type Props = {
  landscape: CompetitiveLandscape | null | undefined;
  onChange: (next: CompetitiveLandscape) => void;
  stack: RevenueStack | null | undefined;
  currency: string | null;
  computed?: ComputedLandscape | null;
};

const select =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

let sequence = 0;
function nextId() {
  sequence += 1;
  return `rival_${Date.now().toString(36)}_${sequence}`;
}

function asNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function CompetitorMapPanel({ landscape, onChange, stack, currency, computed }: Props) {
  const { lang, t, ui } = useLanguage();
  const current = landscape ?? emptyCompetitiveLandscape();
  const drivers = stack?.drivers ?? [];

  const update = (next: Partial<CompetitiveLandscape>) => onChange({ ...current, ...next });
  const updateCompetitor = (id: string, changes: Partial<Competitor>) =>
    update({ competitors: current.competitors.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)) });

  const number = (value: number | null) =>
    value === null ? "—" : new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-GB", { maximumFractionDigits: 0 }).format(value);

  return (
    <Card className="competitor-map-card">
      <CardHeader>
        <CardTitle>{ui("clTitle")}</CardTitle>
        <CardDescription>{ui("clDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label className="text-xs">{ui("clMarketUnits")}</Label>
            <Input type="number" min="0" value={current.marketUnits ?? ""} onChange={(event) => update({ marketUnits: asNumber(event.target.value) })} />
            <p className="mt-1 text-[11px] text-muted-foreground">{ui("clMarketUnitsHelp")}</p>
          </div>
          <div>
            <Label className="text-xs">{ui("clUnitLabel")}</Label>
            <Input value={current.unitLabel ?? ""} placeholder={ui("clUnitPlaceholder")} onChange={(event) => update({ unitLabel: event.target.value || null })} />
          </div>
          <div>
            <Label className="text-xs">{ui("clDriver")}</Label>
            <select className={select} value={current.driverId ?? ""} onChange={(event) => update({ driverId: event.target.value || null })}>
              <option value="">{ui("clDriverNone")}</option>
              {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.label || driver.id}</option>)}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">{ui("clDriverHelp")}</p>
          </div>
          <div>
            <Label className="text-xs">{ui("clAcquisitionCost")}{currency ? ` · ${currency}` : ""}</Label>
            <Input type="number" value={current.acquisitionCost ?? ""} onChange={(event) => update({ acquisitionCost: asNumber(event.target.value) })} />
          </div>
        </div>

        <section>
          <div className="stack-section-head">
            <h3 className="finance-section-title">{ui("clCompetitors")}</h3>
            <Button size="sm" variant="outline" onClick={() => update({ competitors: [...current.competitors, emptyCompetitor(nextId())] })}>
              <Plus className="mr-1 h-3.5 w-3.5" /> {ui("clAddCompetitor")}
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {current.competitors.map((competitor) => (
              <div className="competitor-row" key={competitor.id}>
                <Input aria-label={ui("clName")} placeholder={ui("clName")} value={competitor.name} onChange={(event) => updateCompetitor(competitor.id, { name: event.target.value })} />
                <Input type="number" min="0" max="100" aria-label={ui("clShare")} placeholder={ui("clShare")} value={competitor.sharePct ?? ""} onChange={(event) => updateCompetitor(competitor.id, { sharePct: asNumber(event.target.value) })} />
                <Input aria-label={ui("clHoldReason")} placeholder={ui("clHoldReasonPlaceholder")} value={competitor.holdReason ?? ""} onChange={(event) => updateCompetitor(competitor.id, { holdReason: event.target.value || null })} />
                <Button size="icon" variant="ghost" aria-label={`${ui("clRemove")} ${competitor.name}`} onClick={() => update({ competitors: current.competitors.filter((entry) => entry.id !== competitor.id) })}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="landscape-reading">
          <h3 className="finance-section-title">{ui("clReadingTitle")}</h3>
          {computed && computed.status === "ok" ? (
            <>
              <div className="landscape-metrics">
                <div><span>{ui("clDeclaredShare")}</span><strong>{computed.declaredSharePct}%</strong></div>
                <div><span>{ui("clUnattributed")}</span><strong>{computed.unattributedSharePct}%</strong></div>
                <div><span>{ui("clConcentration")}</span><strong>{t(computed.bandLabel)}{computed.hhi === null ? "" : ` · ${number(computed.hhi)}`}</strong></div>
                <div><span>{ui("clImpliedShare")}</span><strong>{computed.impliedSharePct === null ? "—" : `${computed.impliedSharePct}%`}</strong></div>
                <div><span>{ui("clAcquisitionSpend")}</span><strong>{number(computed.acquisitionSpend)}{currency && computed.acquisitionSpend !== null ? ` ${currency}` : ""}</strong></div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t(computed.bandReading)}</p>
              {computed.findings.length > 0 && (
                <ul className="landscape-findings">
                  <li className="landscape-findings-title">{ui("clFindings")}</li>
                  {computed.findings.map((finding, index) => <li key={index}>{t(finding)}</li>)}
                </ul>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{ui("clReadingPending")}</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
