import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/i18n";
import type { UiKey } from "@/i18n/strings";
import { readLocalizedError } from "@shared/localizedError";
import type { Lang, Localized } from "@shared/i18n";
import { CalendarClock, CheckCircle2, CircleDotDashed, ClipboardCheck, Loader2, PauseCircle, PlayCircle, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ApprovalCountry = { code: string; name: string; investmentRecommendation: { action: "advance" | "test" | "discard" | "insufficient_data"; label: Localized; selectedMode: Localized | null } };
type ApprovalAction = "advance" | "test";
type ApprovalStatus = "not_started" | "in_review" | "approved" | "changes_requested" | "on_hold" | "closed";
type MilestoneStatus = "pending" | "in_progress" | "blocked" | "complete" | "not_applicable";

const approvalStatusLabels: Record<ApprovalStatus, UiKey> = { not_started: "apStatusNotStarted", in_review: "apStatusInReview", approved: "apStatusApproved", changes_requested: "apStatusChanges", on_hold: "apStatusOnHold", closed: "apStatusClosed" };
const milestoneLabels: Record<MilestoneStatus, UiKey> = { pending: "apMsPending", in_progress: "apMsInProgress", blocked: "apMsBlocked", complete: "apMsComplete", not_applicable: "apMsNotApplicable" };

function initialReviewDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}
function asTimestamp(date: string) { return new Date(`${date}T12:00:00`).getTime(); }
function displayDate(value: Date | string | null, lang: Lang, fallback: string) { return value ? new Date(value).toLocaleDateString(lang === "es" ? "es-ES" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }) : fallback; }
function statusClass(status: string) { return status === "approved" || status === "complete" ? "approval-complete" : status === "blocked" || status === "changes_requested" ? "approval-blocked" : status === "on_hold" ? "approval-hold" : "approval-pending"; }

export default function ApprovalWorkspace({ scenarioId, countries }: { scenarioId: number | null; countries: ApprovalCountry[] }) {
  const { lang, t, ui } = useLanguage();
  const noDate = ui("apNoDate");
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
    if (!scenarioId) { toast.error(ui("apSaveFirst")); return; }
    if (!selectedCountry) { toast.error(ui("apOnlyEligible")); return; }
    if (responsible.trim().length < 2) { toast.error(ui("apNeedResponsible")); return; }
    try {
      await createApproval.mutateAsync({ scenarioId, countryCode: selectedCountry.code, countryName: selectedCountry.name, recommendation: selectedCountry.investmentRecommendation.action as ApprovalAction, responsible: responsible.trim(), reviewer: reviewer.trim() || null, reviewAt: asTimestamp(reviewAt), notes: notes.trim() || null, lang });
      await workflows.refetch();
      toast.success(ui("apCreated"));
    } catch (error) { toast.error(t(readLocalizedError(error)) || ui("apCreateFailed")); }
  }

  return <div className="approval-workspace space-y-6">
    <div className="approval-intro"><div><div className="eyebrow"><ClipboardCheck className="h-3.5 w-3.5" /> {ui("apEyebrow")}</div><h2>{ui("apTitle")}</h2><p>{ui("apDesc")}</p></div>{scenarioId && <Badge className="approval-saved"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {ui("apSavedBadge")}</Badge>}</div>
    {!scenarioId ? <Card className="approval-empty"><CardContent><ClipboardCheck className="h-7 w-7" /><div><strong>{ui("apSaveFirstTitle")}</strong><p>{ui("apSaveFirstDescPre")} <strong>{ui("apSave")}</strong> {ui("apSaveFirstDescTail")}</p></div></CardContent></Card> : !eligibleCountries.length ? <Card className="approval-empty"><CardContent><PauseCircle className="h-7 w-7" /><div><strong>{ui("apNoneTitle")}</strong><p>{ui("apNoneDescPre")} <strong>{ui("apTest")}</strong> / <strong>{ui("apAdvance")}</strong>. {ui("apNoneDescTail")}</p></div></CardContent></Card> : <>
      <Card className="approval-create-card"><CardHeader><div className="step-tag">{ui("apNewGate")}</div><CardTitle>{ui("apAssignTitle")}</CardTitle><CardDescription>{ui("apAssignDesc")}</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><ApprovalField label={ui("apMarket")}><Select value={countryCode} onValueChange={setCountryCode}><SelectTrigger><SelectValue placeholder={ui("apSelect")} /></SelectTrigger><SelectContent>{eligibleCountries.map((country) => <SelectItem key={country.code} value={country.code}>{country.name} · {t(country.investmentRecommendation.label)}</SelectItem>)}</SelectContent></Select></ApprovalField><ApprovalField label={ui("apResponsible")} required><Input value={responsible} onChange={(event) => setResponsible(event.target.value)} placeholder={ui("apNameOrRole")} /></ApprovalField><ApprovalField label={ui("apReviewer")}><Input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder={ui("apOptional")} /></ApprovalField><ApprovalField label={ui("apReviewDate")} required><Input type="date" value={reviewAt} onChange={(event) => setReviewAt(event.target.value)} /></ApprovalField></div><ApprovalField label={ui("apScope")}><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-20" placeholder={ui("apScopePlaceholder")} /></ApprovalField><div className="approval-create-footer"><div>{selectedCountry && <><Badge variant="outline" className={selectedCountry.investmentRecommendation.action === "advance" ? "decision-advance" : "decision-test"}>{t(selectedCountry.investmentRecommendation.label)}</Badge><span>{t(selectedCountry.investmentRecommendation.selectedMode) || ui("apModePending")}</span></>}</div><Button onClick={createWorkflow} disabled={createApproval.isPending || !selectedCountry}>{createApproval.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />} {ui("apCreateGate")}</Button></div></CardContent></Card>
      <section className="approval-list"><div className="approval-list-heading"><div><div className="step-tag">{ui("apActiveGates")}</div><h3>{ui("apTracking")}</h3></div>{workflows.isFetching && <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />}</div>{workflows.data?.length ? workflows.data.map((workflow) => <Card className="approval-card" key={workflow.id}><CardHeader><div className="approval-card-heading"><div><span className="country-code">{workflow.countryCode}</span><div><CardTitle>{workflow.countryName}</CardTitle><CardDescription>{workflow.recommendation === "advance" ? ui("apGateAdvance") : ui("apGateTest")} · {ui("apOwnerPrefix")}: {workflow.responsible}</CardDescription></div></div><Select value={workflow.status} onValueChange={(value) => updateApproval.mutate({ approvalId: workflow.id, status: value as ApprovalStatus }, { onSuccess: () => workflows.refetch(), onError: () => toast.error(ui("apStatusFailed")) })}><SelectTrigger className={`approval-status ${statusClass(workflow.status)}`}><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(approvalStatusLabels) as ApprovalStatus[]).map((status) => <SelectItem key={status} value={status}>{ui(approvalStatusLabels[status])}</SelectItem>)}</SelectContent></Select></div></CardHeader><CardContent><div className="approval-meta"><span><UserRound className="h-3.5 w-3.5" /> {ui("apReviewerPrefix")}: {workflow.reviewer || ui("apUnassigned")}</span><span><CalendarClock className="h-3.5 w-3.5" /> {ui("apGatePrefix")}: {displayDate(workflow.reviewAt, lang, noDate)}</span></div>{workflow.notes && <p className="approval-notes">{workflow.notes}</p>}<div className="milestone-list">{workflow.milestones.map((milestone) => <div className={`milestone-row ${statusClass(milestone.status)}`} key={milestone.id}><button type="button" title={ui("apChangeStatus")} aria-label={`${ui("apChangeStatusOf")} ${milestone.title}`} onClick={() => updateMilestone.mutate({ milestoneId: milestone.id, status: milestone.status === "complete" ? "pending" : "complete" }, { onSuccess: () => workflows.refetch(), onError: () => toast.error(ui("apMilestoneFailed")) })}>{milestone.status === "complete" ? <CheckCircle2 className="h-5 w-5" /> : <CircleDotDashed className="h-5 w-5" />}</button><div><strong>{milestone.title}</strong><small>{milestone.responsible || workflow.responsible} · {displayDate(milestone.dueAt, lang, noDate)}</small></div><Badge variant="outline">{ui(milestoneLabels[milestone.status])}</Badge></div>)}</div></CardContent></Card>) : <Card className="approval-empty"><CardContent><CalendarClock className="h-7 w-7" /><div><strong>{ui("apNoGatesTitle")}</strong><p>{ui("apNoGatesDesc")}</p></div></CardContent></Card>}</section>
    </>}
  </div>;
}

function ApprovalField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <div className="field"><Label>{label}{required && <span className="required">*</span>}</Label>{children}</div>; }
