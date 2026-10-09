import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";

import en from "@/messages/en.json";
import ptBR from "@/messages/pt-BR.json";

const MESSAGES = { "pt-BR": ptBR, en } as const;

export function renderWithIntl(
  ui: ReactElement,
  { locale = "pt-BR", ...options }: { locale?: keyof typeof MESSAGES } & RenderOptions = {},
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="UTC">
      {ui}
    </NextIntlClientProvider>,
    options,
  );
}
