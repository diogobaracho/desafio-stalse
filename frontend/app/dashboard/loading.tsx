import { useTranslations } from "next-intl";

import { StateMessage } from "@/components/StateMessage";

export default function Loading() {
  const t = useTranslations("dashboard");
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <StateMessage variant="loading" title={t("loading")} />
    </div>
  );
}
