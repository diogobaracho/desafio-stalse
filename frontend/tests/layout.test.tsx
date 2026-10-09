import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NavLinks } from "@/components/NavLinks";
import { ReadOnlyBanner } from "@/components/ReadOnlyBanner";

import { renderWithIntl } from "./render";
import { routerMock } from "./router";

const setLocale = vi.fn(async (_locale: string) => {});
vi.mock("@/i18n/actions", () => ({ setLocale: (locale: string) => setLocale(locale) }));

describe("layout components", () => {
  it("switches language via the server action and refreshes the page", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LanguageSwitcher />);

    const select = screen.getByLabelText("Idioma");
    expect(select).toHaveValue("pt-BR");

    await user.selectOptions(select, "en");

    await vi.waitFor(() => expect(routerMock.refresh).toHaveBeenCalled());
    expect(setLocale).toHaveBeenCalledWith("en");
  });

  it("marks the current section in the navigation", () => {
    renderWithIntl(<NavLinks />);

    expect(screen.getByRole("link", { name: "Tickets" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Painel" })).not.toHaveAttribute("aria-current");
  });

  it("explains read-only mode", () => {
    renderWithIntl(<ReadOnlyBanner />);

    expect(screen.getByRole("note")).toHaveTextContent("Ambiente somente leitura");
  });

  it("conveys status and priority with text, not color alone", () => {
    renderWithIntl(
      <>
        <StatusBadge status="closed" />
        <PriorityBadge priority="high" />
      </>,
    );

    expect(screen.getByText("Fechado")).toBeInTheDocument();
    expect(screen.getByText("Alta")).toBeInTheDocument();
  });
});
