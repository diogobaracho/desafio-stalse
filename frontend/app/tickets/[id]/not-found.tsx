import Link from "next/link";
import { useTranslations } from "next-intl";

import { StateMessage } from "@/components/StateMessage";

export default function TicketNotFound() {
  const t = useTranslations();
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h1>{t("ticket.notFoundTitle")}</h1>
      <StateMessage
        variant="empty"
        title={t("ticket.notFoundTitle")}
        description={t("ticket.notFoundDescription")}
        action={<Link href="/tickets">← {t("common.backToList")}</Link>}
      />
    </div>
  );
}
