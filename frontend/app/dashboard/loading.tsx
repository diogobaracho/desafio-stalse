import { useTranslations } from "next-intl";

import { StateMessage } from "@/components/StateMessage";

export default function Loading() {
  const t = useTranslations("dashboard");
  return (
    <div className="mt-4">
      <StateMessage variant="loading" title={t("loading")} />
    </div>
  );
}
