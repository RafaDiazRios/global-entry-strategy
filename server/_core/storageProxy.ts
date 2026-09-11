import type { Express, Request, Response } from "express";
import { storageGetSignedUrl } from "../storage";
import { authenticateRequest } from "./auth";

/**
 * Sirve los ficheros almacenados mediante una redirección a una URL firmada de corta
 * duración. Exige sesión: los documentos de un caso no son públicos.
 */
export function registerStorageProxy(app: Express) {
  app.get("/files/*", async (req: Request, res: Response) => {
    const key = decodeURIComponent(String(req.params[0] ?? "")).replace(/^\/+/, "");
    if (!key || key.includes("..")) {
      res.status(400).json({ error: "invalid key" });
      return;
    }
    try {
      const user = await authenticateRequest(req);
      if (!user) {
        res.status(401).json({ error: "session required" });
        return;
      }
      res.redirect(307, await storageGetSignedUrl(key));
    } catch (error) {
      console.error("[Storage] No se pudo firmar la descarga", error);
      res.status(500).json({ error: "no se pudo servir el fichero" });
    }
  });
}
