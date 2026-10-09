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
      <section className="container-fluid px-0 mb-4">
        <div className="row g-0">
          <div className="col-12">
            <div className="card border-0 shadow-sm bg-primary-subtle">
              <div className="card-body p-4 p-lg-5">
                <h1 className="display-6 mb-2">{t("title")}</h1>
                <p className="lead mb-0">{t("subtitle")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <TicketsView />
    </>
  );
}
