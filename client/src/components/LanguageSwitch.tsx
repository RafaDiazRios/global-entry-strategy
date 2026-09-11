import { Languages } from "lucide-react";
import { LANGUAGES, LANGUAGE_NAMES } from "@shared/i18n";
import { useLanguage } from "@/i18n";

/**
 * Conmutador de idioma.
 *
 * Cambia al instante porque los dos idiomas viajan juntos en los datos: no hay que volver a
 * pedir nada al servidor ni recalcular el análisis.
 */
export function LanguageSwitch() {
  const { lang, setLang, ui } = useLanguage();
  return (
    <div className="flex items-center gap-1" role="group" aria-label={ui("language")}>
      <Languages className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      {LANGUAGES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={lang === option}
          onClick={() => setLang(option)}
          className={`rounded px-1.5 py-0.5 text-xs uppercase tracking-wide transition-colors ${
            lang === option ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          title={LANGUAGE_NAMES[option]}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
