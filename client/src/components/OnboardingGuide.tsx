import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ChevronRight, Circle, HelpCircle, X } from "lucide-react";
import { useState } from "react";

type GuideStep = { tab: string; number: string; title: string; text: string; ready: boolean };

export default function OnboardingGuide({ mandateReady, candidateCount, dataReady, financialReady, evaluationReady, onNavigate }: { mandateReady: boolean; candidateCount: number; dataReady: boolean; financialReady: boolean; evaluationReady: boolean; onNavigate: (tab: string) => void }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return <Button variant="outline" size="sm" className="guide-reopen" onClick={() => setVisible(true)}><HelpCircle className="mr-2 h-4 w-4" /> Ver guía de uso</Button>;
  const steps: GuideStep[] = [
    { tab: "brief", number: "1", title: "Defina el mandato", text: "Empresa, país base, industria y modelo de negocio.", ready: mandateReady },
    { tab: "screen", number: "2", title: "Añada y actualice mercados", text: `${candidateCount ? `${candidateCount} candidato${candidateCount === 1 ? "" : "s"} añadido${candidateCount === 1 ? "" : "s"}; los datos cargan automáticamente.` : "Seleccione países; los datos se cargarán automáticamente."}`, ready: candidateCount > 0 && dataReady },
    { tab: "calibrate", number: "3", title: "Calibre factores locales", text: "Ajuste oportunidad, distancia, riesgo y capacidades de ejecución.", ready: candidateCount > 0 },
    { tab: "finance", number: "4", title: "Complete economía y escenarios", text: "Introduzca TAM/SAM/SOM, costes y sensibilidades antes de comparar retornos.", ready: financialReady },
    { tab: "decision", number: "5", title: "Genere la evaluación", text: "Revise umbrales, alternativas y alertas; guarde el escenario para activar gates.", ready: evaluationReady },
  ];
  return <Card className="onboarding-card"><CardContent>
    <div className="onboarding-heading"><div><div className="eyebrow"><HelpCircle className="h-3.5 w-3.5" /> guía de primera evaluación</div><h2>Cómo funciona el flujo</h2><p>Los campos se incorporan al borrador en cuanto los edita. <strong>No pulse Enter para confirmar:</strong> use los botones indicados para actualizar fuentes, generar el análisis, guardar el escenario o crear un gate.</p></div><Button variant="ghost" size="icon" aria-label="Ocultar guía" onClick={() => setVisible(false)}><X className="h-4 w-4" /></Button></div>
    <div className="guide-steps">{steps.map((step, index) => <button type="button" className="guide-step" key={step.tab} onClick={() => onNavigate(step.tab)}><span className={`guide-number ${step.ready ? "complete" : ""}`}>{step.ready ? <CheckCircle2 className="h-4 w-4" /> : step.number}</span><span><strong>{step.title}</strong><small>{step.text}</small></span>{index < steps.length - 1 && <ChevronRight className="guide-arrow h-4 w-4" />}</button>)}</div>
    <div className="guide-footnote"><Circle className="h-3.5 w-3.5" /><span><strong>Secuencia recomendada:</strong> la herramienta no calcula ni guarda automáticamente. Puede volver a cualquier fase y recalcular cuando cambie un supuesto.</span><Badge variant="outline">Datos incompletos se muestran como “—”</Badge></div>
  </CardContent></Card>;
}
