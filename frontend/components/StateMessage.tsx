import type { ReactNode } from "react";

import styles from "./StateMessage.module.css";

type Variant = "loading" | "empty" | "error";

interface Props {
  variant: Variant;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** One consistent component for loading / empty / error states (announced to screen readers). */
export function StateMessage({ variant, title, description, action }: Props) {
  return (
    <div
      className={`${styles.box} ${styles[variant]}`}
      role={variant === "error" ? "alert" : "status"}
      aria-busy={variant === "loading" || undefined}
      data-state={variant}
    >
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.actions}>{action}</div>}
    </div>
  );
}
