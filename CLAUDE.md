@AGENTS.md

# Testing

**Every functionality gets a test. A change is not done until `pnpm test` passes.**

```bash
pnpm test          # unit tests (vitest), no database or network
pnpm test:watch    # same, in watch mode
pnpm verify        # the integration suite — needs `pnpm dev` and the dev DB running
```

## Where a test belongs

Put it in `tests/` as a unit test if the logic is pure. That is the default, and
it covers the parts of this app where a mistake is silent rather than loud:

- `src/lib/plan-view-model.ts` — phase and block status, gate numbering and
  scope labels, progress. All five views read this, so a wrong rule here is
  wrong on every screen at once.
- `src/lib/layout/*` — the tree and route geometry.
- `src/lib/exercise-files.ts` — the upload allowlist and object-key slug. This
  is a security boundary, not formatting.
- `src/lib/view-modes.ts` — view parsing. The input comes from a URL and a
  non-HttpOnly cookie, so both are attacker-controlled.
- `src/lib/utils.ts` — formatting helpers.
- `src/lib/marking-scheme/parse.ts` — reading a CIS marking scheme workbook.
  Everything the assessor sees comes from it, so a silent misread produces a
  marking sheet that looks right and marks the wrong thing.
- `src/lib/assessment-view-model.ts` — the marks and totals. A slip here
  misreports a competitor's score with nothing looking wrong on screen.
- `src/lib/marking-scheme/build.ts` — writing a workbook the parser can read
  back. Test it by round-tripping through `parseMarkingScheme` rather than by
  asserting cell contents: the contract is that nothing is lost, not that row 9
  looks a particular way. The parser tests keep using the hand-written fixture
  grid so the two are never checked only against each other.

**Never commit a real marking scheme.** They are unreleased competition
material and this repository is on GitHub. `tests/marking-scheme-fixture.ts`
builds a synthetic workbook in the same shape; use that. To check a real file,
`pnpm verify:scheme <path>` parses it in place without copying it anywhere.
`*.xlsx` is gitignored so a `git add -A` after a build cannot leak one.

**The authoring skill that drives `pnpm scheme:build` is user-level**, at
`~/.claude/skills/marking-scheme/`, not in this repo — schemes get written
wherever the competition files live, which is never inside a checkout. Its
wrapper scripts shell back in here, so `build.ts` and `parse.ts` remain the only
definition of the format. Changing either means checking that skill still
describes what the code does.

**`verify:orphans` must know every table that owns an S3 object.** It compares
the bucket against the storage keys it queries, so a table missing from that
query makes its live files look orphaned — and `--prune` would delete them.

Use the builders in `tests/factories.ts` rather than hand-rolling a plan, so a
test describes a plan the way `plan-data.ts` actually returns one.

Anything that needs a database, a browser or the bucket goes in
`scripts/verify/` instead, and runs under `pnpm verify`:

- `verify:flows` — drives the real app in a browser: create, edit, upload,
  download, gate, clone, delete.
- `verify:s3` — presigned upload/download round-trip against MinIO.
- `verify:responsive` — asserts no horizontal overflow across routes × widths.
- `verify:orphans` — objects in the bucket with no exercise row.
- `smoke` — database CRUD and cascade behaviour.

## What makes a test worth having

- **Assert the rule, not the implementation.** `gate.label === "Gate 7"` is a
  rule. The number of times a helper was called is not.
- **Cover the edges the design never showed**: nought blocks, one block, thirty
  blocks; a block with no gate row; a plan with no phases.
- **Name the behaviour, not the function.** "counts only passed blocks in the
  current phase's fraction" tells you what broke; "buildPlanVM works" does not.
- **If a bug is found, add the test that would have caught it** before fixing.
- **A test that cannot fail is decoration.** When adding a significant rule,
  break it on purpose once and confirm the suite goes red.

## Use `pnpm build:check`, not `pnpm build`, while dev is running

`pnpm build` writes to `.next`, the same directory `pnpm dev` serves from.
Running it under a live dev server leaves dev returning 404s for every chunk,
and the browser suites then fail in ways that look convincingly like real layout
and selector bugs.

`pnpm build:check` builds into `.next-check` instead, so it is safe at any time.
Reach for it whenever you just want to know the build compiles. If dev ever does
get clobbered, `rm -rf .next && pnpm dev` restores it.

## Pure logic stays out of database modules

`compareByOrder` lives in `plan-view-model.ts` rather than `plan-data.ts`
specifically so it can be tested without a database. Follow that: if a rule is
worth testing, do not bury it in a module that imports `@/lib/db`, `@/auth` or
`@/lib/s3`.
