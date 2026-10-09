import { readFileSync } from "node:fs";

import { cache } from "react";

import defaultBrand from "@/config/brand.default.json";

import { type Brand, brandSchema } from "./schema";

/**
 * Server-side only. Reads `BRAND_CONFIG_PATH` at runtime (e.g. a Kubernetes ConfigMap mount), so
 * re-branding needs no rebuild. An invalid file is logged and the default brand is used.
 */
export function loadBrandFrom(path: string | undefined): Brand {
  if (path) {
    try {
      return brandSchema.parse(JSON.parse(readFileSync(path, "utf8")));
    } catch (error) {
      console.error(`[brand] Invalid brand config at ${path}; using default brand.`, error);
    }
  }
  return brandSchema.parse(defaultBrand);
}

export const getBrand = cache((): Brand => loadBrandFrom(process.env.BRAND_CONFIG_PATH));
