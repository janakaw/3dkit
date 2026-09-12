/**
 * Client-safe entry point for the shopper's library (see
 * library.server.ts). Requires a verified Supabase session — call it only
 * when signed in (library-query.ts gates on that).
 */
import { createServerFn } from "@tanstack/react-start";
import * as libraryServer from "./library.server";
import type { LibraryEntry } from "./library.server";
import type { DownloadFormat, DownloadLink } from "./download-formats";
import { identityFromContext } from "./identity";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type { LibraryEntry };

export const getLibrary = createServerFn({ method: "POST", strict: { output: false } })
  .middleware([requireSupabaseAuth])
  .handler(({ context }): Promise<LibraryEntry[]> =>
    libraryServer.getLibrary(identityFromContext(context)),
  );

export const getDownloadLink = createServerFn({ method: "POST", strict: { output: false } })
  .middleware([requireSupabaseAuth])
  .validator((data: { lineItemId: string; format: DownloadFormat }) => data)
  .handler(({ data, context }): Promise<DownloadLink> =>
    libraryServer.getDownloadLink(identityFromContext(context), data.lineItemId, data.format),
  );
