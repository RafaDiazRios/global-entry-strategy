import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, FileText, Loader2, Quote, Sparkles, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/i18n";
import { readLocalizedError } from "@shared/localizedError";

/**
 * Espacio de trabajo del caso: documentos y libro de evidencias.
 *
 * Lo que propone el copiloto entra como sugerencia y se ve como tal. Nada alimenta la
 * evaluación hasta que se acepta, y toda evidencia lleva su cita y su localizador.
 */

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

type Props = {
  caseId: number | null;
  onCaseSelected: (caseId: number | null) => void;
  /** Contexto del mandato, que se pasa al copiloto para acotar la extracción. */
  decisionContext: string;
  defaults: { companyName: string; homeCountry: string; industry: string };
  /** Nombre que ya tiene el escenario, para no hacer inventar un título distinto al mismo trabajo. */
  suggestedTitle?: string;
  /** Documento sobre el que trabaja el copiloto, compartido con la pestaña de calibración. */
  activeDocumentId: number | null;
  onActiveDocumentChange: (documentId: number | null) => void;
};

export function CaseWorkspace({ caseId, onCaseSelected, decisionContext, defaults, suggestedTitle, activeDocumentId, onActiveDocumentChange }: Props) {
  const { lang, t, ui } = useLanguage();
  const [title, setTitle] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [pastedName, setPastedName] = useState("");
  const setActiveDocumentId = onActiveDocumentChange;
  const fileInput = useRef<HTMLInputElement>(null);

  const casesQuery = trpc.case.list.useQuery();
  const caseQuery = trpc.case.get.useQuery({ caseId: caseId ?? 0 }, { enabled: caseId !== null });
  const evidenceQuery = trpc.case.listEvidence.useQuery({ caseId: caseId ?? 0 }, { enabled: caseId !== null });

  const createCase = trpc.case.create.useMutation();
  const addText = trpc.case.addTextDocument.useMutation();
  const uploadDocument = trpc.case.uploadDocument.useMutation();
  const extract = trpc.ai.extractEvidence.useMutation();
  const setStatus = trpc.case.setEvidenceStatus.useMutation();
  const removeEvidence = trpc.case.deleteEvidence.useMutation();

  const documents = caseQuery.data?.documents ?? [];
  const evidence = evidenceQuery.data ?? [];
  const suggested = evidence.filter((entry) => entry.status === "suggested");
  const accepted = evidence.filter((entry) => entry.status === "accepted");

  function refresh() {
    void caseQuery.refetch();
    void evidenceQuery.refetch();
  }

  async function handleCreateCase() {
    if (title.trim().length < 2) {
      toast.error(ui("cwNeedTitle"));
      return;
    }
    try {
      const created = await createCase.mutateAsync({
        title: title.trim(),
        decisionQuestion: decisionContext || null,
        companyName: defaults.companyName || null,
        homeCountry: defaults.homeCountry || null,
        industry: defaults.industry || null,
      });
      setTitle("");
      await casesQuery.refetch();
      onCaseSelected(created.id);
      toast.success("Caso creado.");
    } catch (error) {
      toast.error(t(readLocalizedError(error)) || ui("cwCreateFailed"));
    }
  }

  async function handleAddText() {
    if (!caseId) return;
    if (pastedText.trim().length < 50) {
      toast.error(ui("cwNeedParagraph"));
      return;
    }
    try {
      const created = await addText.mutateAsync({
        caseId,
        filename: pastedName.trim() || "Texto pegado",
        text: pastedText,
      });
      setPastedText("");
      setPastedName("");
      setActiveDocumentId(created.id);
      refresh();
      toast.success(ui("cwTextAdded"));
    } catch (error) {
      toast.error(t(readLocalizedError(error)) || ui("cwTextFailed"));
    }
  }

  async function handleUpload(file: File) {
    if (!caseId) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(ui("cwTooLarge"));
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Se trocea para no desbordar la pila con ficheros grandes en fromCharCode.
      let binary = "";
      for (let index = 0; index < bytes.length; index += 8192) {
        const chunk = Array.prototype.slice.call(bytes.subarray(index, index + 8192)) as number[];
        binary += String.fromCharCode.apply(null, chunk);
      }
      const created = await uploadDocument.mutateAsync({
        caseId,
        filename: file.name,
        mimeType: file.type || "application/pdf",
        contentBase64: btoa(binary),
      });
      setActiveDocumentId(created.id);
      refresh();
      if (created.textExtracted) {
        toast.success(`Documento subido y texto extraído${created.pages ? ` (${created.pages} páginas)` : ""}. Las citas se podrán verificar.`);
      } else {
        toast.warning(t(created.note) || ui("cwNoExtractableText"));
      }
    } catch (error) {
      toast.error(t(readLocalizedError(error)) || ui("cwUploadFailed"));
    }
  }

  async function handleExtract() {
    if (!caseId || !activeDocumentId) {
      toast.error("Elija un documento del caso.");
      return;
    }
    try {
      const result = await extract.mutateAsync({ caseId, documentId: activeDocumentId, context: decisionContext || undefined, lang });
      refresh();
      const discarded = result.discarded.length;
      toast.success(
        `${result.evidence.filter((entry) => entry.status === "suggested").length} evidencias propuestas.` +
          (discarded ? ` ${discarded} descartadas por no citar o no verificar.` : ""),
      );
    } catch (error) {
      toast.error(t(readLocalizedError(error)) || ui("cwExtractFailed"));
    }
  }

  async function updateStatus(evidenceId: number, status: "accepted" | "rejected") {
    try {
      await setStatus.mutateAsync({ evidenceId, status });
      void evidenceQuery.refetch();
    } catch (error) {
      toast.error(t(readLocalizedError(error)) || ui("cwEvidenceFailed"));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{ui("cwTitle")}</CardTitle>
          <CardDescription>{ui("cwDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[240px] flex-1 space-y-2">
              <Label htmlFor="case-title">{ui("cwNewCase")}</Label>
              <Input id="case-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={(suggestedTitle ?? "").trim() || ui("cwTitlePlaceholder")} />
              {!title.trim() && (suggestedTitle ?? "").trim() && (
                <button type="button" className="identity-source" onClick={() => setTitle(suggestedTitle!.trim())}>{ui("cwUseScenarioName")}: «{suggestedTitle!.trim()}»</button>
              )}
            </div>
            <Button onClick={handleCreateCase} disabled={createCase.isPending}>
              {createCase.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {ui("cwCreateCase")}
            </Button>
          </div>

          {(casesQuery.data?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {casesQuery.data?.map((entry) => (
                <Button
                  key={entry.id}
                  size="sm"
                  variant={entry.id === caseId ? "default" : "outline"}
                  onClick={() => { onCaseSelected(entry.id); setActiveDocumentId(null); }}
                >
                  {entry.title}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {caseId === null ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">{ui("cwPickCase")}</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{ui("cwDocuments")}</CardTitle>
              <CardDescription>{ui("cwDocumentsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="paste-name">{ui("cwSourceName")}</Label>
                  <Input id="paste-name" value={pastedName} onChange={(event) => setPastedName(event.target.value)} placeholder={ui("cwSourcePlaceholder")} />
                  <Label htmlFor="paste-text">{ui("cwCaseText")}</Label>
                  <Textarea id="paste-text" rows={6} value={pastedText} onChange={(event) => setPastedText(event.target.value)} placeholder={ui("cwPastePlaceholder")} />
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <Button onClick={handleAddText} disabled={addText.isPending}>
                    {addText.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />} {ui("cwAddText")}
                  </Button>
                  <input
                    ref={fileInput}
                    id="case-file"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleUpload(file);
                      event.target.value = "";
                    }}
                  />
                  <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={uploadDocument.isPending}>
                    {uploadDocument.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} {ui("cwUploadPdf")}
                  </Button>
                </div>
              </div>

              {documents.length > 0 && (
                <div className="space-y-2">
                  {documents.map((document) => (
                    <button
                      key={document.id}
                      type="button"
                      className={`case-document ${document.id === activeDocumentId ? "is-active" : ""}`}
                      onClick={() => setActiveDocumentId(document.id)}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="flex-1 text-left">{document.filename}</span>
                      <Badge variant="outline">{document.storageKey ? "PDF" : ui("cwText")}</Badge>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleExtract} disabled={extract.isPending || !activeDocumentId}>
                  {extract.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} {ui("cwExtract")}
                </Button>
                <span className="text-xs text-muted-foreground">{ui("cwExtractHint")}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>{ui("cwEvidenceBook")}</CardTitle>
                  <CardDescription>{accepted.length} {ui("cwAcceptedCount")} · {suggested.length} {ui("cwPendingCount")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {evidence.length === 0 && <p className="text-sm text-muted-foreground">{ui("cwNoEvidence")}</p>}
              {evidence.map((entry) => (
                <article key={entry.id} className={`evidence-row status-${entry.status}`}>
                  <div className="evidence-head">
                    <strong>{entry.claim}</strong>
                    <div className="evidence-actions">
                      {entry.status === "suggested" && (
                        <>
                          <Button size="sm" onClick={() => updateStatus(entry.id, "accepted")}>{ui("cwAccept")}</Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(entry.id, "rejected")}>{ui("cwReject")}</Button>
                        </>
                      )}
                      {entry.status === "rejected" && <Badge variant="outline">{ui("cwRejected")}</Badge>}
                      {entry.status === "accepted" && <Badge>{ui("cwAccepted")}</Badge>}
                      <Button size="sm" variant="ghost" onClick={() => removeEvidence.mutateAsync({ evidenceId: entry.id }).then(() => evidenceQuery.refetch())} aria-label={ui("cwDeleteEvidence")}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {entry.quote && (
                    <blockquote className="evidence-quote">
                      <Quote className="h-3.5 w-3.5" />
                      <span>{entry.quote}</span>
                    </blockquote>
                  )}
                  <div className="evidence-meta">
                    <span>{entry.sourceLabel}</span>
                    {entry.locator && <span>· {entry.locator}</span>}
                    {entry.targetPath && <span>· {entry.targetPath}</span>}
                    <span>· {ui("cwReliability")} {entry.reliability}/5</span>
                    {entry.createdBy === "ai" && <span>· {ui("cwAiProposed")}</span>}
                    {entry.quote && !entry.quoteVerified && (
                      <span className="evidence-warning"><AlertTriangle className="h-3 w-3" /> {ui("cwQuoteUnverified")}</span>
                    )}
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
