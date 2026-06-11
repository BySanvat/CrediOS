import { expect, test } from "@playwright/test";

test("landing loads with product language", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("CrediOS by Sanvat").first()).toBeVisible();
  await expect(page.getByText("No otorga creditos. Te ayuda a entenderlos y administrarlos.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
});

test("login page loads without requiring credentials", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Ingresar a CrediOS" })).toBeVisible();
  await expect(page.getByLabel("Correo")).toBeVisible();
  await expect(page.getByLabel("Contrasena")).toBeVisible();
});

test("private dashboard does not expose app data to an anonymous visitor", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.locator("body")).toContainText(/Ingresar a CrediOS|Supabase todavia no esta configurado/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toHaveCount(0);
});

test("personal finance routes are private", async ({ page }) => {
  await page.goto("/finanzas");

  await expect(page.locator("body")).toContainText(/Ingresar a CrediOS|Supabase todavia no esta configurado/);
  await expect(page.getByRole("heading", { name: "Finanzas personales" })).toHaveCount(0);
});
