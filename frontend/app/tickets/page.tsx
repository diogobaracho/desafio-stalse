import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TicketsView } from "@/components/TicketsView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tickets");
  return { title: t("title") };
}

export default async function TicketsPage() {
  const t = await getTranslations("tickets");
  return (
    <>
      <header className="page-header">
        <h1>{t("title")}</h1>
        <p className="muted">{t("subtitle")}</p>
      </header>
      <TicketsView />
    </>
  );
}
