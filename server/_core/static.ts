import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Servir el cliente ya compilado.
 *
 * Vive aparte de `vite.ts` a propósito: en producción la imagen solo instala dependencias
 * de producción, y `vite` no es una de ellas. Si esta función compartiera fichero con el
 * servidor de desarrollo, el `import` de vite viajaría hasta el paquete final y el proceso
 * moriría al arrancar con `Cannot find package 'vite'`.
 */
export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
