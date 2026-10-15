import { expect, test, type Locator } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 401, json: { error: "unauthorized" } }),
  );
});

// Seek the real CSS animation so this verifies its full journey without a
// wall-clock delay or depending on which frame CI happens to render first.
async function seek(animationTarget: Locator, progress: number) {
  await animationTarget.evaluate(async (element, progress) => {
    const animation = element.getAnimations()[0];
    if (!animation?.effect) throw new Error("Expected a running sky animation");
    animation.pause();
    const timing = animation.effect.getTiming();
    animation.currentTime =
      Number(timing.delay) + Number(timing.duration) * progress;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
  }, progress);
}

async function center(element: Locator) {
  return element.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  });
}

test("the desktop sky loops its connections and sends shooting stars across Orion and the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/login");
  const constellation = page.locator(".signin-constellation");
  await expect(constellation.locator("[data-star]")).toHaveCount(7);
  expect(
    await constellation.evaluate(
      (element) =>
        new DOMMatrixReadOnly(getComputedStyle(element).transform).m41,
    ),
  ).toBeCloseTo(192, 1);

  const connection = page.locator(".signin-connection-loop");
  await expect(connection).toHaveCount(1);
  expect(
    await connection.evaluate(
      (element) => element.getAnimations()[0].effect!.getTiming().iterations,
    ),
  ).toBe(Infinity);
  await seek(connection, 0.1);
  const initial = await connection.evaluate(
    (element) => getComputedStyle(element).strokeDashoffset,
  );
  await seek(connection, 0.6);
  expect(
    await connection.evaluate(
      (element) => getComputedStyle(element).strokeDashoffset,
    ),
  ).not.toBe(initial);
  await seek(connection, 1.1);
  expect(
    await connection.evaluate(
      (element) => getComputedStyle(element).strokeDashoffset,
    ),
  ).toBe(initial);

  const beltStar = await center(
    constellation.locator('[data-star="alnilam"] circle').first(),
  );
  for (const meteor of await page.locator(".signin-meteor").all()) {
    const head = meteor.locator(".signin-meteor-head");
    await seek(meteor, 0);
    expect((await center(head)).x).toBeLessThan(0);
    await seek(meteor, 0.175);
    const crossing = await center(head);
    expect(
      Math.hypot(crossing.x - beltStar.x, crossing.y - beltStar.y),
    ).toBeLessThan(1);
    await seek(meteor, 0.35);
    expect((await center(head)).x).toBeGreaterThan(1440);
  }
  const email = page.getByLabel("Email", { exact: true });
  await email.click();
  await expect(email).toBeFocused();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(1440);
});

test("system and saved reduced-motion preferences leave a static sky and usable narrow sign-in", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  for (const preference of ["system", "saved"]) {
    await page.emulateMedia({
      reducedMotion: preference === "system" ? "reduce" : "no-preference",
    });
    if (preference === "saved") {
      await page.addInitScript(() =>
        localStorage.setItem(
          "xpresstend.accessibility",
          JSON.stringify({ motion: "reduce" }),
        ),
      );
    }
    await page.goto("/#/login");
    await expect(page.locator(".signin-meteor").first()).toHaveCSS(
      "display",
      "none",
    );
    const connection = page.locator(".signin-connection-loop");
    await expect(connection).toHaveCSS("animation-name", "none");
    expect(
      await page
        .locator(".signin-sky")
        .evaluate(
          (element) =>
            element
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === "running").length,
        ),
    ).toBe(0);
    await page
      .getByLabel("Email", { exact: true })
      .fill("preview@example.invalid");
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
      "preview@example.invalid",
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
  }
});
