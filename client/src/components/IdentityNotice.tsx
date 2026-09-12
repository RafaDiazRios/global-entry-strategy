import { AlertTriangle, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";
import { identityField, type IdentityDivergence, type IdentityFieldId } from "@shared/domain/caseIdentity";

/**
 * El aviso que acompaña a un campo que tiene dueño en otro sitio.
 *
 * Dos estados y ninguno más. Cuando coincide, una línea gris que dice de dónde viene y lleva
 * allí. Cuando no coincide, los dos valores y un botón para alinearlos: la herramienta no
 * elige, porque la que sobra puede ser cualquiera de las dos.
 */
export function IdentityNotice({
  field,
  divergences,
  onGoToOwner,
  onAdopt,
}: {
  field: IdentityFieldId;
  divergences: IdentityDivergence[];
  onGoToOwner: () => void;
  onAdopt?: (value: string) => void;
}) {
  const { t, ui } = useLanguage();
  const divergence = divergences.find((entry) => entry.field === field);
  const definition = identityField(field);

  if (!divergence) {
    return (
      <button type="button" className="identity-source" onClick={onGoToOwner} title={t(definition.why)}>
        <Link2 className="h-3 w-3" /> {ui("idFrom")} {t(definition.ownerLabel)}
      </button>
    );
  }

  return (
    <div className="identity-divergence">
      <div className="identity-divergence-head">
        <AlertTriangle className="h-3.5 w-3.5" />
        <strong>{divergence.kind === "missing" ? t(definition.label) : ui("idDivergence")}</strong>
      </div>
      <p>{t(divergence.note)}</p>
      <div className="identity-divergence-actions">
        {divergence.kind === "differs" && onAdopt && (
          <Button size="sm" variant="outline" onClick={() => onAdopt(divergence.owned)}>{ui("idUseThesis")}</Button>
        )}
        <Button size="sm" variant="ghost" onClick={onGoToOwner}>
          {divergence.kind === "missing" ? ui("idCountryMissing") : ui("idChangeThere")}
        </Button>
      </div>
    </div>
  );
}
