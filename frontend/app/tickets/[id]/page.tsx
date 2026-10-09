import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { StateMessage } from "@/components/StateMessage";
import { TicketDetail } from "@/components/TicketDetail";
import { ApiError } from "@/lib/api/client";
import { isReadOnly } from "@/lib/api/health";
import { getTicket } from "@/lib/api/tickets";
import type { Ticket } from "@/lib/api/types";
import { errorMessageKey } from "@/lib/errors";

type Props = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations("ticket");
  return { title: t("title", { id: (await params).id }) };
}

export default async function TicketPage({ params }: Props) {
  const id = parseId((await params).id);
  if (id === null) notFound();

  const t = await getTranslations();
  let ticket: Ticket;
  try {
    ticket = await getTicket(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return (
      <>
        <BackLink label={t("common.backToList")} />
        <StateMessage
          variant="error"
          title={t("ticket.errorTitle")}
          description={t(errorMessageKey(error))}
        />
      </>
    );
  }
  const readOnly = await isReadOnly();

  return (
    <>
      <BackLink label={t("common.backToList")} />
      <section className="card border-0 shadow-sm bg-warning-subtle mt-3 mb-4">
        <div className="card-body p-4">
          <h1 className="display-6 mb-2">
            {t("ticket.title", { id: ticket.id })} — {ticket.subject}
          </h1>
          <p className="lead mb-0">{t("ticket.triageHint")}</p>
        </div>
      </section>
      <TicketDetail initialTicket={ticket} readOnly={readOnly} />
    </>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <p className="mb-0 mt-3">
      <Link href="/tickets" className="btn btn-outline-primary rounded-pill">
        ← {label}
      </Link>
    </p>
  );
}
