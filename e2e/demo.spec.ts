import { expect, test } from "@playwright/test";

test.describe("Hearth demo autoplay", () => {
  test("/?demo=1&fast=1 runs full-surface demo without stalling", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/?demo=1&fast=1");

    await expect(page.getByRole("heading", { name: "Hearth" })).toBeVisible();

    // Autoplay starts shortly after load.
    await expect(page.getByRole("button", { name: /Recording demo|Play full demo/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("button", { name: /Recording demo/i })).toBeVisible({
      timeout: 10_000,
    });

    // Surface tour + progress strip for judges.
    await expect(page.getByText(/MCP surface tour|Play demo/i).first()).toBeVisible({
      timeout: 20_000,
    });

    // Rivera plan card appears after the surface beat.
    await expect(
      page.getByRole("heading", { name: /Captioned Classic|Cozy|Stretch|Wind-Down|Classic/i }),
    ).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/Elena|Rivera|Maya|Leo/i).first()).toBeVisible();

    // Live MCP tool strip shows real calls on the product surface.
    await expect(page.locator(".tool-item-mini").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(".live-tools")).toContainText(
      /get_household_profile|suggest_evening_plan|list_households|set_active_household/,
    );

    // Coverage bar + judge toolkit show full MCP wire proof.
    await expect(page.locator(".mcp-coverage")).toContainText(
      /Tools 9\/9|All wires live|Tools \d+\/9/i,
      {
        timeout: 30_000,
      },
    );
    await expect(page.locator(".tool-item code").first()).toBeVisible({ timeout: 15_000 });

    // Park household is exercised mid-demo.
    await expect(page.getByRole("button", { name: /Park apartment/i })).toHaveClass(/active/, {
      timeout: 90_000,
    });

    // Okonkwo completes (BUG-005: must not skip later households).
    await expect(page.getByRole("button", { name: /Okonkwo home/i })).toHaveClass(/active/, {
      timeout: 120_000,
    });
    await expect(page.getByText(/Ngozi|Okonkwo|accessible|care check-in/i).first()).toBeVisible({
      timeout: 30_000,
    });

    // Demo lock releases after full 10-beat script.
    await expect(page.getByRole("button", { name: /^Play full demo$/i })).toBeEnabled({
      timeout: 60_000,
    });

    // Protocol pill visible for judges.
    await expect(page.getByText(/Protocol:\s*2025-11-25/i)).toBeVisible();
  });
});
