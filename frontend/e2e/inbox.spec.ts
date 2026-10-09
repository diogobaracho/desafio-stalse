import { expect, test } from "@playwright/test";

test.describe("Inbox critical path", () => {
  test("list → search → detail → update → confirmed state → dashboard", async ({ page }) => {
    // 1. Ticket list (pt-BR by default)
    await page.goto("/tickets");
    await expect(page.getByRole("heading", { level: 1, name: "Caixa de entrada" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Lista de tickets" })).toBeVisible();

    // 2. Search
    await page.getByLabel("Buscar tickets").fill("Thiago");
    await expect(page.getByText("1 ticket", { exact: true })).toBeVisible();

    // 3. Ticket detail
    await page.getByRole("link", { name: /Aplicativo fecha ao abrir o carrinho/ }).click();
    await expect(page).toHaveURL(/\/tickets\/\d+$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Aplicativo fecha ao abrir o carrinho",
    );

    // 4. Change priority to a different value (works on re-runs against the same database)
    const priorityGroup = page.getByRole("group", { name: "Prioridade" });
    const lowIsCurrent =
      (await priorityGroup.getByRole("button", { name: "Baixa" }).getAttribute("aria-pressed")) === "true";
    const nextLabel = lowIsCurrent ? "Média" : "Baixa";
    await priorityGroup.getByRole("button", { name: nextLabel }).click();
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    // 5. Server-confirmed state, also after a reload
    await expect(page.getByRole("status").filter({ hasText: "Alterações salvas" })).toBeVisible();
    await expect(page.getByTestId("current-priority")).toHaveText(new RegExp(nextLabel));
    await page.reload();
    await expect(page.getByTestId("current-priority")).toHaveText(new RegExp(nextLabel));

    // 6. Dashboard
    await page.getByRole("link", { name: "Painel" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Painel de métricas" })).toBeVisible();
    await expect(page.getByTestId("metrics-provenance")).toContainText("Gerado pelo pipeline de ETL");
    await expect(page.getByRole("region", { name: "Principais categorias" })).toBeVisible();
  });

  test("language can be switched to English and persists", async ({ page }) => {
    await page.goto("/tickets");
    await page.getByLabel("Idioma").selectOption("en");
    await expect(page.getByRole("heading", { level: 1, name: "Inbox" })).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: "Metrics dashboard" })).toBeVisible();
  });

  test("unknown ticket shows the not-found state", async ({ page }) => {
    await page.goto("/tickets/999999");
    await expect(page.getByRole("heading", { name: "Ticket não encontrado" })).toBeVisible();
    await page.getByRole("link", { name: /Voltar para a lista/ }).click();
    await expect(page).toHaveURL(/\/tickets$/);
  });
});
