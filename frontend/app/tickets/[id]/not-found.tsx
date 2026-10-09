import Link from "next/link";
import { useTranslations } from "next-intl";

import { StateMessage } from "@/components/StateMessage";

export default function TicketNotFound() {
  const t = useTranslations();
  return (
    <div className="mt-4">
      <h1 className="display-6 mb-3 text-break">{t("ticket.notFoundTitle")}</h1>
      <StateMessage
        variant="empty"
        title={t("ticket.notFoundTitle")}
        description={t("ticket.notFoundDescription")}
        action={
          <Link href="/tickets" className="btn btn-outline-primary rounded-pill">
            ← {t("common.backToList")}
          </Link>
        }
      />
    </div>
  );
}
