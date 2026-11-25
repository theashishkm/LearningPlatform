import { expect, test } from "@playwright/test";

test("redirects a signed-out visitor from the private dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Learning Hub" })).toBeVisible();
});

test("blocks guest password updates and rejects a missing recovery token", async ({ page }) => {
  await page.goto("/recover/password");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/recover/confirm");
  await expect(page).toHaveURL(/\/recover\?error=1$/);
  await expect(page.getByRole("alert").filter({ hasText: "Recovery is temporarily unavailable" })).toBeVisible();
});
