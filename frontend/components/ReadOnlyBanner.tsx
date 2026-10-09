import { useTranslations } from "next-intl";

import styles from "./StateMessage.module.css";

export function ReadOnlyBanner() {
  const t = useTranslations("readOnly");
  return (
    <div
      className={`${styles.box}`}
      role="note"
      data-testid="read-only-banner"
      style={{ background: "var(--color-warning-bg)", color: "var(--color-warning-text)", marginTop: "1rem" }}
    >
      <p className={styles.title}>
        <span aria-hidden="true">🔒 </span>
        {t("title")}
      </p>
      <p className={styles.description}>{t("description")}</p>
    </div>
  );
}
