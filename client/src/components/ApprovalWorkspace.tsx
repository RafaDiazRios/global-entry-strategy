import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CalendarClock, CheckCircle2, CircleDotDashed, ClipboardCheck, Loader2, PauseCircle, PlayCircle, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ApprovalCountry = { code: string; name: string; investmentRecommendation: { action: "advance" | "test" | "discard" | "insufficient_data"; label: string; selectedMode: string | null } };
type ApprovalAction = "advance" | "test";
type ApprovalStatus = "not_started" | "in_review" | "approved" | "changes_requested" | "on_hold" | "closed";
type MilestoneStatus = "pending" | "in_progress" | "blocked" | "complete" | "not_applicable";

const approvalStatusLabels: Record<ApprovalStatus, string> = { not_started: "No iniciado", in_review: "En revisión", approved: "Aprobado", changes_requested: "Cambios solicitados", on_hold: "En pausa", closed: "Cerrado" };
const milestoneLabels: Record<MilestoneStatus, string> = { pending: "Pendiente", in_progress: "En curso", blocked: "Bloqueado", complete: "Completado", not_applicable: "No aplica" };

function initialReviewDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}
function asTimestamp(date: string) { return new Date(`${date}T12:00:00`).getTime(); }
function displayDate(value: Date | string | null) { return value ? new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "Sin fecha"; }
function statusClass(status: string) { return status === "approved" || status === "complete" ? "approval-complete" : status === "blocked" || status === "changes_requested" ? "approval-blocked" : status === "on_hold" ? "approval-hold" : "approval-pending"; }

export default function ApprovalWorkspace({ scenarioId, countries }: { scenarioId: number | null; countries: ApprovalCountry[] }) {
  const eligibleCountries = countries.filter((country) => country.investmentRecommendation.action === "advance" || country.investmentRecommendation.action === "test");
  const [countryCode, setCountryCode] = useState("");
  const [responsible, setResponsible] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [reviewAt, setReviewAt] = useState(initialReviewDate);
  const [notes, setNotes] = useState("");
  const approvalInput = useMemo(() => ({ scenarioId: scenarioId ?? 1 }), [scenarioId]);
  const workflows = trpc.strategy.listApprovals.useQuery(approvalInput, { enabled: Boolean(scenarioId) });
  const createApproval = trpc.strategy.createApproval.useMutation();
  const updateApproval = trpc.strategy.updateApproval.useMutation();
  const updateMilestone = trpc.strategy.updateApprovalMilestone.useMutation();

  useEffect(() => {
    if (!countryCode && eligibleCountries[0]) setCountryCode(eligibleCountries[0].code);
  }, [countryCode, eligibleCountries]);

  const selectedCountry = eligibleCountries.find((country) => country.code === countryCode);
  async function createWorkflow() {
    if (!scenarioId) { toast.error("Guarde el escenario antes de crear un gate de decisión."); return; }
    if (!selectedCountry) { toast.error("Solo se pueden abrir gates para mercados con recomendación Probar o Avanzar."); return; }
    if (responsible.trim().length < 2) { toast.error("Indique el responsable del gate."); return; }
    try {
      await createApproval.mutateAsync({ scenarioId, countryCode: selectedCountry.code, countryName: selectedCountry.name, recommendation: selectedCountry.investmentRecommendation.action as ApprovalAction, responsible: responsible.trim(), reviewer: reviewer.trim() || null, reviewAt: asTimestamp(reviewAt), notes: notes.trim() || null });
      await workflows.refetch();
      toast.success("Gate creado con cuatro hitos y una revisión programada.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo crear el gate."); }
  }

  return <div className="approval-workspace space-y-6">
    <div className="approval-intro"><div><div className="eyebrow"><ClipboardCheck className="h-3.5 w-3.5" /> gobierno de ejecución</div><h2>Convierta “Probar” o “Avanzar” en un gate de trabajo.</h2><p>El gate documenta responsables, hitos y una fecha de revisión. No autoriza gasto ni una operación financiera: la decisión formal debe seguir las políticas corporativas aplicables.</p></div>{scenarioId && <Badge className="approval-saved"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Escenario guardado</Badge>}</div>
    {!scenarioId ? <Card className="approval-empty"><CardContent><ClipboardCheck className="h-7 w-7" /><div><strong>Primero guarde el escenario actual</strong><p>Pulse <strong>Guardar</strong> en la cabecera después de generar la evaluación. El historial persistente permitirá asociar los gates a esta versión del análisis.</p></div></CardContent></Card> : !eligibleCountries.length ? <Card className="approval-empty"><CardContent><PauseCircle className="h-7 w-7" /><div><strong>No hay gates accionables todavía</strong><p>La herramienta abre gates únicamente para una recomendación de <strong>Probar</strong> o <strong>Avanzar</strong>. Complete la economía, escenarios y umbrales y vuelva a generar la evaluación.</p></div></CardContent></Card> : <>
      <Card className="approval-create-card"><CardHeader><div className="step-tag">NUEVO GATE</div><CardTitle>Asigne una revisión responsable</CardTitle><CardDescription>Se crearán cuatro hitos editables con fechas previas a la revisión. Si ya existe un gate para este mercado y escenario, se recuperará el existente para evitar duplicados.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><ApprovalField label="Mercado"><Select value={countryCode} onValueChange={setCountryCode}><SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger><SelectContent>{eligibleCountries.map((country) => <SelectItem key={country.code} value={country.code}>{country.name} · {country.investmentRecommendation.label}</SelectItem>)}</SelectContent></Select></ApprovalField><ApprovalField label="Responsable" required><Input value={responsible} onChange={(event) => setResponsible(event.target.value)} placeholder="Nombre o cargo" /></ApprovalField><ApprovalField label="Revisor"><Input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Opcional" /></ApprovalField><ApprovalField label="Fecha de revisión" required><Input type="date" value={reviewAt} onChange={(event) => setReviewAt(event.target.value)} /></ApprovalField></div><ApprovalField label="Alcance o condiciones del gate"><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-20" placeholder="Ej. validación fiscal local, prueba de precio, partner shortlist y límite de inversión de prueba." /></ApprovalField><div className="approval-create-footer"><div>{selectedCountry && <><Badge variant="outline" className={selectedCountry.investmentRecommendation.action === "advance" ? "decision-advance" : "decision-test"}>{selectedCountry.investmentRecommendation.label}</Badge><span>{selectedCountry.investmentRecommendation.selectedMode || "Modo pendiente"}</span></>}</div><Button onClick={createWorkflow} disabled={createApproval.isPending || !selectedCountry}>{createApproval.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />} Crear gate</Button></div></CardContent></Card>
      <section className="approval-list"><div className="approval-list-heading"><div><div className="step-tag">GATES ACTIVOS</div><h3>Seguimiento de decisiones</h3></div>{workflows.isFetching && <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />}</div>{workflows.data?.length ? workflows.data.map((workflow) => <Card className="approval-card" key={workflow.id}><CardHeader><div className="approval-card-heading"><div><span className="country-code">{workflow.countryCode}</span><div><CardTitle>{workflow.countryName}</CardTitle><CardDescription>{workflow.recommendation === "advance" ? "Gate para avanzar" : "Gate de prueba"} · Responsable: {workflow.responsible}</CardDescription></div></div><Select value={workflow.status} onValueChange={(value) => updateApproval.mutate({ approvalId: workflow.id, status: value as ApprovalStatus }, { onSuccess: () => workflows.refetch(), onError: () => toast.error("No se pudo actualizar el estado del gate.") })}><SelectTrigger className={`approval-status ${statusClass(workflow.status)}`}><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(approvalStatusLabels) as ApprovalStatus[]).map((status) => <SelectItem key={status} value={status}>{approvalStatusLabels[status]}</SelectItem>)}</SelectContent></Select></div></CardHeader><CardContent><div className="approval-meta"><span><UserRound className="h-3.5 w-3.5" /> Revisor: {workflow.reviewer || "No asignado"}</span><span><CalendarClock className="h-3.5 w-3.5" /> Gate: {displayDate(workflow.reviewAt)}</span></div>{workflow.notes && <p className="approval-notes">{workflow.notes}</p>}<div className="milestone-list">{workflow.milestones.map((milestone) => <div className={`milestone-row ${statusClass(milestone.status)}`} key={milestone.id}><button type="button" title="Cambiar estado" aria-label={`Cambiar estado de ${milestone.title}`} onClick={() => updateMilestone.mutate({ milestoneId: milestone.id, status: milestone.status === "complete" ? "pending" : "complete" }, { onSuccess: () => workflows.refetch(), onError: () => toast.error("No se pudo actualizar el hito.") })}>{milestone.status === "complete" ? <CheckCircle2 className="h-5 w-5" /> : <CircleDotDashed className="h-5 w-5" />}</button><div><strong>{milestone.title}</strong><small>{milestone.responsible || workflow.responsible} · {displayDate(milestone.dueAt)}</small></div><Badge variant="outline">{milestoneLabels[milestone.status]}</Badge></div>)}</div></CardContent></Card>) : <Card className="approval-empty"><CardContent><CalendarClock className="h-7 w-7" /><div><strong>Aún no hay gates para este escenario</strong><p>Asigne un responsable y una fecha para crear el primer flujo de revisión.</p></div></CardContent></Card>}</section>
    </>}
  </div>;
}

function ApprovalField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <div className="field"><Label>{label}{required && <span className="required">*</span>}</Label>{children}</div>; }
