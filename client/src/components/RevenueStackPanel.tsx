import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n";
import {
  DRIVER_RAMPS,
  DRIVER_UNITS,
  RATE_KINDS,
  STACK_ITEM_KINDS,
  emptyRevenueStack,
  rateKindFitsDriver,
  type DriverRamp,
  type DriverUnit,
  type RateKind,
  type RevenueDriver,
  type RevenueStack,
  type StackItem,
  type StackItemKind,
  type StackLine,
} from "@shared/domain/revenueStack";
import { STACK_TEMPLATES } from "@shared/domain/industries";
import type { Localized } from "@shared/i18n";

/**
 * El editor de la cuenta de resultados.
 *
 * No calcula nada. El cálculo vive en el servidor y llega con la evaluación, igual que el
 * resto del caso económico: la herramienta no recalcula al escribir, y decirlo aquí evita
 * que alguien crea que el número de abajo responde a lo que acaba de teclear.
 *
 * Tampoco normaliza. Si los repartos de coste fijo no suman cien, lo dice y sigue; repartir
 * por su cuenta escondería una línea que alguien olvidó.
 */

type ComputedLine = {
  lineId: string;
  label: string;
  revenue: number;
  directCost: number;
  contribution: number;
  allocatedFixedCost: number;
  operatingProfit: number;
};

export type ComputedStack = {
  status: "ok" | "insufficient_data" | "not_declared";
  years: { year: number; revenue: number; directCost: number; contribution: number; allocatedFixedCost: number; operatingProfit: number; lines: ComputedLine[] }[];
  missingInputs: Localized[];
  warnings: Localized[];
};

export type ComputedPlausibility = {
  status: "ok" | "above_som" | "far_below_som" | "no_market";
  note: Localized;
};

type Props = {
  stack: RevenueStack | null | undefined;
  onChange: (next: RevenueStack) => void;
  currency: string | null;
  computed?: ComputedStack | null;
  plausibility?: ComputedPlausibility | null;
};

const select =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

let sequence = 0;
function nextId(prefix: string) {
  sequence += 1;
  return `${prefix}_${Date.now().toString(36)}_${sequence}`;
}

function asNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function RevenueStackPanel({ stack, onChange, currency, computed, plausibility }: Props) {
  const { lang, t, ui } = useLanguage();
  const current = stack ?? emptyRevenueStack();
  const [templateId, setTemplateId] = useState("");

  const update = (next: Partial<RevenueStack>) => onChange({ ...current, ...next });

  const updateDriver = (id: string, changes: Partial<RevenueDriver>) =>
    update({ drivers: current.drivers.map((driver) => (driver.id === id ? { ...driver, ...changes } : driver)) });

  const updateLine = (id: string, changes: Partial<StackLine>) =>
    update({ lines: current.lines.map((line) => (line.id === id ? { ...line, ...changes } : line)) });

  const updateItem = (lineId: string, itemId: string, changes: Partial<StackItem>) =>
    updateLine(lineId, {
      items: current.lines.find((line) => line.id === lineId)?.items.map((item) => (item.id === itemId ? { ...item, ...changes } : item)) ?? [],
    });

  function applyTemplate() {
    const template = STACK_TEMPLATES.find((entry) => entry.id === templateId);
    if (!template) return;
    onChange(template.build(lang));
  }

  const shareTotal = current.lines.reduce((sum, line) => sum + (line.fixedCostSharePct ?? 0), 0);
  const lastYear = computed?.status === "ok" ? computed.years.at(-1) ?? null : null;
  const money = (value: number) =>
    new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-GB", { maximumFractionDigits: 0 }).format(value);

  return (
    <Card className="revenue-stack-card">
      <CardHeader>
        <CardTitle>{ui("rsTitle")}</CardTitle>
        <CardDescription>{ui("rsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="stack-template-row">
          <Label htmlFor="stack-template">{ui("rsTemplate")}</Label>
          <div className="flex flex-wrap items-center gap-2">
            <select id="stack-template" className={`${select} max-w-xs`} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              <option value="">{ui("rsTemplateNone")}</option>
              {STACK_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>{t(template.label)}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" disabled={!templateId} onClick={applyTemplate}>{ui("rsTemplateApply")}</Button>
            <span className="text-xs text-muted-foreground">{ui("rsTemplateWarning")}</span>
            {current.lines.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => onChange(emptyRevenueStack())}>{ui("rsClear")}</Button>
            )}
          </div>
          {templateId && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t(STACK_TEMPLATES.find((entry) => entry.id === templateId)?.description ?? null)}
              {" · "}
              {t(STACK_TEMPLATES.find((entry) => entry.id === templateId)?.provenance ?? null)}
            </p>
          )}
        </div>

        {current.lines.length === 0 && current.drivers.length === 0 ? (
          <div className="stack-empty">
            <strong>{ui("rsNotDeclared")}</strong>
            <p>{ui("rsNotDeclaredHelp")}</p>
          </div>
        ) : null}

        <section>
          <div className="stack-section-head">
            <div>
              <h3 className="finance-section-title">{ui("rsDrivers")}</h3>
              <p className="text-xs text-muted-foreground">{ui("rsDriversHelp")}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => update({ drivers: [...current.drivers, { id: nextId("driver"), label: "", unit: "amount", valueYearOne: null, valueAtHorizon: null, ramp: "linear", valuesByYear: null, note: null }] })}>
              <Plus className="mr-1 h-3.5 w-3.5" /> {ui("rsAddDriver")}
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {current.drivers.map((driver) => (
              <div className="stack-driver-row" key={driver.id}>
                <Input aria-label={ui("rsDriverName")} placeholder={ui("rsDriverName")} value={driver.label} onChange={(event) => updateDriver(driver.id, { label: event.target.value })} />
                <select aria-label={ui("rsDriverUnit")} className={select} value={driver.unit} onChange={(event) => updateDriver(driver.id, { unit: event.target.value as DriverUnit })}>
                  {DRIVER_UNITS.map((unit) => <option key={unit.id} value={unit.id}>{t(unit.label)}</option>)}
                </select>
                <Input type="number" aria-label={ui("rsDriverYearOne")} placeholder={ui("rsDriverYearOne")} value={driver.valueYearOne ?? ""} onChange={(event) => updateDriver(driver.id, { valueYearOne: asNumber(event.target.value) })} />
                <Input type="number" aria-label={ui("rsDriverHorizon")} placeholder={ui("rsDriverHorizon")} value={driver.valueAtHorizon ?? ""} onChange={(event) => updateDriver(driver.id, { valueAtHorizon: asNumber(event.target.value) })} />
                <select aria-label={ui("rsDriverRamp")} className={select} value={driver.ramp} onChange={(event) => updateDriver(driver.id, { ramp: event.target.value as DriverRamp })}>
                  {DRIVER_RAMPS.filter((ramp) => ramp.id !== "manual").map((ramp) => <option key={ramp.id} value={ramp.id}>{t(ramp.label)}</option>)}
                </select>
                <Button size="icon" variant="ghost" aria-label={`${ui("rsRemove")} ${driver.label}`} onClick={() => update({ drivers: current.drivers.filter((entry) => entry.id !== driver.id) })}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="stack-section-head">
            <div>
              <h3 className="finance-section-title">{ui("rsLines")}</h3>
              <p className="text-xs text-muted-foreground">{ui("rsLinesHelp")}</p>
            </div>
            <div className="flex items-center gap-2">
              {current.lines.length > 0 && (
                <Badge variant="outline" className={Math.abs(shareTotal - 100) > 0.5 ? "decision-discard" : ""}>{ui("rsFixedShare")} {shareTotal}</Badge>
              )}
              <Button size="sm" variant="outline" onClick={() => update({ lines: [...current.lines, { id: nextId("line"), label: "", items: [], fixedCostSharePct: current.lines.length === 0 ? 100 : null, note: null }] })}>
                <Plus className="mr-1 h-3.5 w-3.5" /> {ui("rsAddLine")}
              </Button>
            </div>
          </div>

          <div className="mt-3 space-y-4">
            {current.lines.map((line) => (
              <div className="stack-line" key={line.id}>
                <div className="stack-line-head">
                  <Input aria-label={ui("rsLineName")} placeholder={ui("rsLineName")} value={line.label} onChange={(event) => updateLine(line.id, { label: event.target.value })} />
                  <Input type="number" min="0" max="100" aria-label={ui("rsFixedShare")} placeholder={ui("rsFixedShare")} value={line.fixedCostSharePct ?? ""} onChange={(event) => updateLine(line.id, { fixedCostSharePct: asNumber(event.target.value) })} />
                  <Button size="sm" variant="outline" onClick={() => updateLine(line.id, { items: [...line.items, { id: nextId("item"), label: "", kind: "revenue", driverId: current.drivers[0]?.id ?? null, rateKind: "pct_of_driver", rate: null, origin: "user", provenance: null }] })}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> {ui("rsAddItem")}
                  </Button>
                  <Button size="icon" variant="ghost" aria-label={`${ui("rsRemove")} ${line.label}`} onClick={() => update({ lines: current.lines.filter((entry) => entry.id !== line.id) })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="stack-item-list">
                  {line.items.map((item) => {
                    const driver = current.drivers.find((entry) => entry.id === item.driverId) ?? null;
                    const mismatch = !rateKindFitsDriver(item.rateKind, driver?.unit ?? null);
                    return (
                      <div className={`stack-item-row ${item.kind}`} key={item.id}>
                        <Input aria-label={ui("rsItemName")} placeholder={ui("rsItemName")} value={item.label} onChange={(event) => updateItem(line.id, item.id, { label: event.target.value })} />
                        <select aria-label={ui("rsItemKind")} className={select} value={item.kind} onChange={(event) => updateItem(line.id, item.id, { kind: event.target.value as StackItemKind })}>
                          {STACK_ITEM_KINDS.map((kind) => <option key={kind.id} value={kind.id}>{t(kind.label)}</option>)}
                        </select>
                        <select aria-label={ui("rsItemDriver")} className={select} value={item.driverId ?? ""} onChange={(event) => updateItem(line.id, item.id, { driverId: event.target.value || null })}>
                          <option value="">{ui("rsNoDriver")}</option>
                          {current.drivers.map((entry) => <option key={entry.id} value={entry.id}>{entry.label || entry.id}</option>)}
                        </select>
                        <select aria-label={ui("rsItemRateKind")} className={`${select} ${mismatch ? "border-rose-400" : ""}`} value={item.rateKind} onChange={(event) => updateItem(line.id, item.id, { rateKind: event.target.value as RateKind })}>
                          {RATE_KINDS.map((rate) => <option key={rate.id} value={rate.id}>{t(rate.label)}</option>)}
                        </select>
                        <Input type="number" aria-label={ui("rsItemRate")} placeholder={ui("rsItemRate")} value={item.rate ?? ""} onChange={(event) => updateItem(line.id, item.id, { rate: asNumber(event.target.value) })} />
                        <Badge variant="outline">{item.origin === "sector" ? ui("rsSectorTag") : ui("rsUserTag")}</Badge>
                        <Button size="icon" variant="ghost" aria-label={`${ui("rsRemove")} ${item.label}`} onClick={() => updateLine(line.id, { items: line.items.filter((entry) => entry.id !== item.id) })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="stack-result">
          <h3 className="finance-section-title">{ui("rsResultTitle")}</h3>
          <p className="text-xs text-muted-foreground">{ui("rsResultHelp")}</p>

          {lastYear ? (
            <div className="stack-result-table">
              <table>
                <thead>
                  <tr>
                    <th>{ui("rsColLine")}</th>
                    <th>{ui("rsColRevenue")}</th>
                    <th>{ui("rsColDirectCost")}</th>
                    <th>{ui("rsColContribution")}</th>
                    <th>{ui("rsColFixed")}</th>
                    <th>{ui("rsColResult")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lastYear.lines.map((line) => (
                    <tr key={line.lineId}>
                      <td>{line.label}</td>
                      <td>{money(line.revenue)}</td>
                      <td>{money(line.directCost)}</td>
                      <td>{money(line.contribution)}</td>
                      <td>{money(line.allocatedFixedCost)}</td>
                      <td className={line.operatingProfit < 0 ? "stack-negative" : "stack-positive"}>{money(line.operatingProfit)}</td>
                    </tr>
                  ))}
                  <tr className="stack-total-row">
                    <td>{ui("rsTotal")} · {ui("rsAtHorizon")} {currency ? `· ${currency}` : ""}</td>
                    <td>{money(lastYear.revenue)}</td>
                    <td>{money(lastYear.directCost)}</td>
                    <td>{money(lastYear.contribution)}</td>
                    <td>{money(lastYear.allocatedFixedCost)}</td>
                    <td className={lastYear.operatingProfit < 0 ? "stack-negative" : "stack-positive"}>{money(lastYear.operatingProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{ui("rsResultPending")}</p>
          )}

          {computed?.missingInputs.length ? (
            <p className="stack-missing"><strong>{ui("rsMissing")}:</strong> {computed.missingInputs.map((entry) => t(entry)).join(", ")}.</p>
          ) : null}

          {computed?.warnings.length ? (
            <ul className="stack-warnings">
              <li className="stack-warnings-title">{ui("rsWarnings")}</li>
              {computed.warnings.map((warning, index) => <li key={index}>{t(warning)}</li>)}
            </ul>
          ) : null}

          {plausibility && plausibility.status !== "no_market" ? (
            <p className={`stack-plausibility ${plausibility.status}`}>
              <strong>{ui("rsPlausibility")}:</strong> {t(plausibility.note)}
            </p>
          ) : null}
        </section>
      </CardContent>
    </Card>
  );
}
