import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ChevronRight, Circle, HelpCircle, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/i18n";
import type { UiKey } from "@/i18n/strings";

type GuideStep = { tab: string; number: string; title: UiKey; text: string; ready: boolean };

export default function OnboardingGuide({ mandateReady, candidateCount, dataReady, financialReady, evaluationReady, onNavigate }: { mandateReady: boolean; candidateCount: number; dataReady: boolean; financialReady: boolean; evaluationReady: boolean; onNavigate: (tab: string) => void }) {
  const { ui } = useLanguage();
  const [visible, setVisible] = useState(true);
  if (!visible) return <Button variant="outline" size="sm" className="guide-reopen" onClick={() => setVisible(true)}><HelpCircle className="mr-2 h-4 w-4" /> {ui("ogReopen")}</Button>;
  const marketsText = candidateCount
    ? `${candidateCount} ${ui(candidateCount === 1 ? "ogStep2AddedOne" : "ogStep2Added")}`
    : ui("ogStep2Empty");
  const steps: GuideStep[] = [
    { tab: "brief", number: "1", title: "ogStep1Title", text: ui("ogStep1Text"), ready: mandateReady },
    { tab: "screen", number: "2", title: "ogStep2Title", text: marketsText, ready: candidateCount > 0 && dataReady },
    { tab: "calibrate", number: "3", title: "ogStep3Title", text: ui("ogStep3Text"), ready: candidateCount > 0 },
    { tab: "finance", number: "4", title: "ogStep4Title", text: ui("ogStep4Text"), ready: financialReady },
    { tab: "decision", number: "5", title: "ogStep5Title", text: ui("ogStep5Text"), ready: evaluationReady },
  ];
  return <Card className="onboarding-card"><CardContent>
    <div className="onboarding-heading"><div><div className="eyebrow"><HelpCircle className="h-3.5 w-3.5" /> {ui("ogEyebrow")}</div><h2>{ui("ogTitle")}</h2><p>{ui("ogIntroPre")} <strong>{ui("ogIntroBold")}</strong> {ui("ogIntroTail")}</p></div><Button variant="ghost" size="icon" aria-label={ui("ogHide")} onClick={() => setVisible(false)}><X className="h-4 w-4" /></Button></div>
    <div className="guide-steps">{steps.map((step, index) => <button type="button" className="guide-step" key={step.tab} onClick={() => onNavigate(step.tab)}><span className={`guide-number ${step.ready ? "complete" : ""}`}>{step.ready ? <CheckCircle2 className="h-4 w-4" /> : step.number}</span><span><strong>{ui(step.title)}</strong><small>{step.text}</small></span>{index < steps.length - 1 && <ChevronRight className="guide-arrow h-4 w-4" />}</button>)}</div>
    <div className="guide-footnote"><Circle className="h-3.5 w-3.5" /><span><strong>{ui("ogSequenceBold")}</strong> {ui("ogSequenceText")}</span><Badge variant="outline">{ui("ogMissingBadge")}</Badge></div>
  </CardContent></Card>;
}
