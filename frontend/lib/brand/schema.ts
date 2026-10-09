import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected a #RRGGBB color");
const link = z.string().refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), {
  message: "Expected an absolute http(s) URL or a path starting with /",
});

/**
 * White-label brand configuration (ADR-0011). Every brand name and contact detail shown in
 * the UI comes from here - never from source code.
 */
export const brandSchema = z.object({
  productName: z.string().min(1),
  companyName: z.string().min(1),
  tagline: z.record(z.string(), z.string()).optional(),
  logo: z.object({ src: link, alt: z.string().min(1) }),
  favicon: link.optional(),
  colors: z.object({
    primary: hexColor,
    primaryContrast: hexColor,
    accent: hexColor,
  }),
  contact: z.object({
    email: z.email(),
    phone: z.string().min(1).optional(),
    website: z.url().optional(),
    address: z.string().min(1).optional(),
    hours: z.record(z.string(), z.string()).optional(),
  }),
  social: z.array(z.object({ label: z.string().min(1), url: z.url() })).default([]),
});

export type Brand = z.infer<typeof brandSchema>;

/** Picks the value for the active locale, falling back to pt-BR, then to any value. */
export function localized(value: Record<string, string> | undefined, locale: string): string | undefined {
  if (!value) return undefined;
  return value[locale] ?? value["pt-BR"] ?? Object.values(value)[0];
}
