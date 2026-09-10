import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();

/** Tipos de salida del router, para tipar props sin repetir la forma de cada respuesta. */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
