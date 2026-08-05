/**
 * Asserts that controls look like controls.
 *
 *   pnpm verify:affordance
 *
 * Norman's signifier problem, checked mechanically. The existing suites cannot
 * see this class of bug and demonstrably did not: flows.ts drives every one of
 * these controls with isVisible(), which Playwright returns true for on an
 * `opacity: 0` element — which is exactly how a delete button nobody could see
 * shipped with a passing test.
 *
 * Runs at 1440px and at 390px. The 390px pass is the one that matters most:
 * there is no hover on a phone, so anything that only appears on hover is
 * simply gone.
 */
import type { Page } from "playwright";
import { createChecker, gotoAuthed, withContext } from "./harness";

const { check, report } = createChecker();

const WIDTHS = [1440, 390];

/** Parks the pointer away from content so no :hover state is in play. */
async function unhover(page: Page): Promise<void> {
  await page.mouse.move(0, 0);
  await page.waitForTimeout(220); // outlast the 0.15s opacity transition
}

type Sample = { label: string; own: number; effective: number };

async function main(): Promise<void> {
  await withContext(async (context) => {
    const page = await context.newPage();

    await gotoAuthed(page, "/");
    const hrefs = await page.$$eval('a[href^="/plan/"]', (nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href") ?? ""),
    );
    if (hrefs.length === 0) throw new Error("No plans — run `pnpm seed:demo` first.");
    const plan = hrefs[0];

    const routes = [
      { label: "list · cards", path: "/?view=cards" },
      { label: "list · table", path: "/?view=table" },
      { label: "roadmap · timeline", path: `${plan}?view=timeline` },
      { label: "roadmap · tree", path: `${plan}?view=tree` },
      { label: "roadmap · route", path: `${plan}?view=route` },
      { label: "assessments", path: "/assessments" },
    ];

    for (const width of WIDTHS) {
      console.log(`\n[affordance] ${width}px`);
      await page.setViewportSize({ width, height: 900 });

      for (const route of routes) {
        await gotoAuthed(page, route.path);
        await unhover(page);

        // ── Nothing clickable is invisible ────────────────────────────
        // No named inner functions inside evaluate: tsx compiles these with
        // esbuild's keep-names, whose __name helper does not exist in the page.
        const quiet: Sample[] = await page.evaluate(() => {
          const out: { label: string; own: number; effective: number }[] = [];
          for (const node of Array.from(document.querySelectorAll<HTMLElement>(".tp-quiet"))) {
            const own = Number(getComputedStyle(node).opacity);
            // Opacity multiplies down the tree. Both numbers matter and they
            // fail differently: `own` catches a control hidden relative to its
            // surroundings, `effective` catches one inside a hidden ancestor.
            let effective = own;
            let parent: HTMLElement | null = node.parentElement;
            while (parent) {
              effective *= Number(getComputedStyle(parent).opacity);
              parent = parent.parentElement;
            }
            out.push({
              label: node.getAttribute("aria-label") ?? node.textContent?.trim().slice(0, 30) ?? "(unlabelled)",
              own,
              effective,
            });
          }
          return out;
        });

        // A locked phase card is deliberately at 0.7, so its controls land at
        // 0.385 — as prominent as everything else in that card, which is the
        // point. What must never happen is the control being suppressed on its
        // own account, or the whole thing being effectively invisible.
        const suppressed = quiet.filter((entry) => entry.own < 0.4);
        const invisible = quiet.filter((entry) => entry.effective < 0.2);
        check(
          `${route.label}: every held-back control is visible without hovering (${quiet.length})`,
          suppressed.length === 0 && invisible.length === 0,
          [...suppressed, ...invisible]
            .map((entry) => `${entry.label} @ own ${entry.own.toFixed(2)}, effective ${entry.effective.toFixed(2)}`)
            .join(", "),
        );

        // ── Editable text says it is editable ─────────────────────────
        const editable = await page.evaluate(() => {
          const nodes = Array.from(document.querySelectorAll<HTMLElement>(".tp-editable"));
          const bare: string[] = [];
          for (const node of nodes) {
            const style = getComputedStyle(node);
            if (style.borderBottomStyle === "none" || parseFloat(style.borderBottomWidth) === 0) {
              bare.push(node.getAttribute("aria-label") ?? "(unlabelled)");
            }
          }
          return { total: nodes.length, bare };
        });

        if (editable.total > 0) {
          check(
            `${route.label}: editable text carries an underline (${editable.total})`,
            editable.bare.length === 0,
            editable.bare.join(", "),
          );
        }

        // ── A control must not look like a label ──────────────────────
        const mute = await page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>("button.tp-tag, button.tp-pill"))
            .filter((node) => node.querySelector("svg") === null)
            .map((node) => node.getAttribute("aria-label") ?? node.textContent?.trim().slice(0, 30) ?? "?"),
        );
        check(
          `${route.label}: no menu button is drawn as a plain label`,
          mute.length === 0,
          mute.join(", "),
        );
      }

      // ── Focus is visible on everything focusable ────────────────────
      // Driven with real Tab presses, not node.focus(): :focus-visible is
      // deliberately heuristic and does not match programmatic focus on a link
      // or a button, so a JS-focused element would report no ring even when
      // keyboard users get one. One route per width — the rule is global, so a
      // gap here is a gap everywhere.
      await gotoAuthed(page, `${plan}?view=timeline`);
      await page.evaluate(() => document.body.focus());

      const gaps: string[] = [];
      let checked = 0;
      const seen = new Set<string>();

      for (let i = 0; i < 40; i += 1) {
        await page.keyboard.press("Tab");
        // Focus must *change* something visible. Asserting merely that an
        // outline exists is far too weak: browsers supply their own
        // `outline: auto`, and most cards carry a resting box-shadow, so such a
        // check passes even with every project rule deleted. What actually
        // breaks is `outline: none` with no replacement — which is what the
        // search field had, and this comparison is what catches it.
        const focused = await page.evaluate(() => {
          const node = document.activeElement as HTMLElement | null;
          if (!node || node === document.body) return null;

          // Read focused, then blurred, then restore. Written as a loop rather
          // than a helper because a named function here is compiled with
          // esbuild's keep-names and its __name helper does not exist in the
          // page — which is how this threw the first time.
          const readings: string[] = [];
          for (const lit of [true, false]) {
            if (!lit) node.blur();
            const style = getComputedStyle(node);
            // .tp-card-link draws its ring on the stretched ::after instead.
            const after = getComputedStyle(node, "::after");
            readings.push(
              [
                style.outlineStyle,
                style.outlineWidth,
                style.outlineColor,
                style.boxShadow,
                style.borderColor,
                after.outlineStyle,
                after.outlineWidth,
              ].join("|"),
            );
          }
          node.focus();

          return {
            id: `${node.tagName}.${node.className}.${node.getAttribute("aria-label") ?? ""}`,
            label: `<${node.tagName.toLowerCase()}> ${node.getAttribute("aria-label") ?? node.className}`,
            drawn: readings[0] !== readings[1],
          };
        });

        if (!focused || seen.has(focused.id)) continue;
        seen.add(focused.id);
        checked += 1;
        if (!focused.drawn) gaps.push(focused.label);
      }

      check(
        `focus is drawn on every element reachable by Tab (${checked} checked)`,
        gaps.length === 0,
        gaps.slice(0, 5).join(" | "),
      );

      // ── A disabled control looks disabled ───────────────────────────
      const disabled = await page.evaluate(() => {
        const probe = document.createElement("button");
        probe.className = "tp-btn tp-btn-primary";
        probe.textContent = "probe";
        document.body.appendChild(probe);
        const live = Number(getComputedStyle(probe).opacity);
        probe.disabled = true;
        const dead = Number(getComputedStyle(probe).opacity);
        const cursor = getComputedStyle(probe).cursor;
        probe.remove();
        return { live, dead, cursor };
      });

      check(
        "a disabled control is visually distinct from a live one",
        disabled.dead < disabled.live,
        `enabled ${disabled.live}, disabled ${disabled.dead} (cursor ${disabled.cursor})`,
      );
    }

    // ── Reduced motion ─────────────────────────────────────────────────
    // Emulated rather than assumed: the rule has to beat inline transitions
    // that dnd-kit writes at runtime, which is the reason it carries
    // !important, and only a real page can show whether it does.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoAuthed(page, `${plan}?view=timeline`);

    const motion = await page.evaluate(() => {
      const probe = document.createElement("button");
      probe.className = "tp-btn tp-btn-primary";
      // Exactly how dnd-kit sets it on a sortable item.
      probe.style.transition = "transform 250ms ease";
      document.body.appendChild(probe);
      const durations = getComputedStyle(probe).transitionDuration;
      probe.remove();

      const animated = Array.from(document.querySelectorAll<HTMLElement>("body *")).filter((node) =>
        getComputedStyle(node)
          .transitionDuration.split(",")
          .some((value) => parseFloat(value) > 0.05),
      ).length;

      return { inlineDurations: durations, animated };
    });

    check(
      "reduced motion overrides even an inline transition",
      motion.inlineDurations.split(",").every((value) => parseFloat(value) <= 0.001),
      `inline transition-duration resolved to ${motion.inlineDurations}`,
    );
    check(
      "reduced motion leaves nothing on the page animating",
      motion.animated === 0,
      `${motion.animated} element(s) still transition for longer than 50ms`,
    );

    await page.emulateMedia({ reducedMotion: null });

    report("affordance");
  });
}

main().catch((error: unknown) => {
  console.error(`[affordance] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
