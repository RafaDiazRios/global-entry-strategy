import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Archive, Copy, FolderOpen, Loader2, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/i18n";
import { readLocalizedError } from "@shared/localizedError";
import { loc, type Localized } from "@shared/i18n";
import { localizedError } from "@shared/localizedError";

/**
 * Archivo de escenarios guardados.
 *
 * Antes de esto los escenarios se guardaban y no se podían volver a abrir, que es tanto
 * como no guardarlos. Aquí se listan todos, se buscan, se abren en el formulario, se
 * duplican para explorar una variante sin perder la original, se renombran y se borran.
 */

type Props = {
  isAuthenticated: boolean;
  currentScenarioId: number | null;
  onOpen: (scenario: { id: number; name: string; inputJson: unknown; resultJson: unknown; caseId: number | null }) => void;
};

const OBJECTIVE_LABELS: Record<string, Localized> = {
  market: loc("Mercado", "Market"),
  resources: loc("Recursos", "Resources"),
  learning: loc("Aprendizaje", "Learning"),
  coordination: loc("Coordinación", "Coordination"),
};

export function ScenarioArchive({ isAuthenticated, currentScenarioId, onOpen }: Props) {
  const { lang, t, ui } = useLanguage();
  const utils = trpc.useUtils();
  const scenarios = trpc.strategy.listScenarios.useQuery(undefined, { enabled: isAuthenticated });
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const update = trpc.strategy.updateScenario.useMutation();
  const duplicate = trpc.strategy.duplicateScenario.useMutation();
  const remove = trpc.strategy.deleteScenario.useMutation();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = scenarios.data ?? [];
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.name, row.companyName, row.industry, row.homeCountry].filter(Boolean).some((field) => String(field).toLowerCase().includes(needle))
    );
  }, [scenarios.data, query]);

  async function open(scenarioId: number) {
    setBusyId(scenarioId);
    try {
      const row = await utils.strategy.getScenario.fetch({ scenarioId });
      if (!row) throw localizedError("El escenario ya no existe.", "That scenario no longer exists.");
      onOpen({ id: row.id, name: row.name, inputJson: row.inputJson, resultJson: row.resultJson, caseId: row.caseId ?? null });
      toast.success(`«${row.name}» ${ui("saOpened")}`);
    } catch (error) {
      toast.error(t(readLocalizedError(error)) || ui("saOpenFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmRename(scenarioId: number) {
    const name = renameValue.trim();
    if (name.length < 2) { toast.error(ui("saNameTooShort")); return; }
    try {
      await update.mutateAsync({ scenarioId, name });
      setRenaming(null);
      utils.strategy.listScenarios.invalidate();
    } catch (error) {
      toast.error(t(readLocalizedError(error)) || ui("saRenameFailed"));
    }
  }

  async function clone(scenarioId: number, name: string) {
    try {
      await duplicate.mutateAsync({ scenarioId, name: `${name} (${ui("saCopySuffix")})`.slice(0, 180) });
      utils.strategy.listScenarios.invalidate();
      toast.success(ui("saDuplicated"));
    } catch (error) {
      toast.error(t(readLocalizedError(error)) || ui("saDuplicateFailed"));
    }
  }

  async function destroy(scenarioId: number, name: string) {
    if (!window.confirm(`${ui("saConfirmDeletePre")} «${name}» ${ui("saConfirmDeleteTail")}`)) return;
    try {
      const outcome = await remove.mutateAsync({ scenarioId });
      utils.strategy.listScenarios.invalidate();
      toast.success(outcome.deletedApprovals ? `${ui("saDeletedWithGatesPre")} ${outcome.deletedApprovals} ${ui("saDeletedWithGates")}` : ui("saDeleted"));
    } catch (error) {
      toast.error(t(readLocalizedError(error)) || ui("saDeleteFailed"));
    }
  }

  return (
    <section className="history-strip">
      <div>
        <div className="step-tag">{ui("saArchive")}</div>
        <h2>{ui("saTitle")}</h2>
        {isAuthenticated && (scenarios.data?.length ?? 0) > 0 && (
          <Input className="mt-3 max-w-xs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ui("saSearchPh")} aria-label={ui("saSearchLabel")} />
        )}
      </div>

      <div className="history-list">
        {!isAuthenticated ? (
          <span>{ui("saSignIn")}</span>
        ) : scenarios.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : !filtered.length ? (
          <span>{query ? ui("saNoMatch") : ui("saEmpty")}</span>
        ) : (
          filtered.map((scenario) => (
            <div className="history-item" key={scenario.id}>
              <div className="min-w-0">
                {renaming === scenario.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-8 max-w-xs"
                      value={renameValue}
                      autoFocus
                      onChange={(event) => setRenameValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") confirmRename(scenario.id);
                        if (event.key === "Escape") setRenaming(null);
                      }}
                      aria-label={ui("saRenameLabel")}
                    />
                    <Button size="sm" onClick={() => confirmRename(scenario.id)} disabled={update.isPending}>{ui("saSave")}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>{ui("saCancel")}</Button>
                  </div>
                ) : (
                  <>
                    <strong className="flex items-center gap-2">
                      {scenario.name}
                      {currentScenarioId === scenario.id && <Badge variant="outline">{ui("saOpenTag")}</Badge>}
                    </strong>
                    <span>
                      {[scenario.companyName, scenario.industry].filter(Boolean).join(" · ")}
                      {scenario.updatedAt ? ` · ${new Date(scenario.updatedAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <Badge variant="outline">{t(OBJECTIVE_LABELS[scenario.objective]) || scenario.objective}</Badge>
                {scenario.caseId && <Badge variant="outline">{ui("saCase")} #{scenario.caseId}</Badge>}
                <Button size="sm" variant="outline" onClick={() => open(scenario.id)} disabled={busyId === scenario.id}>
                  {busyId === scenario.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <FolderOpen className="mr-1 h-3.5 w-3.5" />} {ui("saOpen")}
                </Button>
                <Button size="sm" variant="ghost" aria-label={`${ui("saRename")} ${scenario.name}`} onClick={() => { setRenaming(scenario.id); setRenameValue(scenario.name); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" aria-label={`${ui("saDuplicate")} ${scenario.name}`} onClick={() => clone(scenario.id, scenario.name)} disabled={duplicate.isPending}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" aria-label={`${ui("saDelete")} ${scenario.name}`} onClick={() => destroy(scenario.id, scenario.name)} disabled={remove.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {isAuthenticated && (scenarios.data?.length ?? 0) > 0 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Archive className="h-3.5 w-3.5" />
          {ui("saFootnote")}
        </p>
      )}
    </section>
  );
}
