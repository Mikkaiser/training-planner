---
name: marking-scheme
description: Author, extend or repair a WorldSkills CIS marking scheme as an .xlsx the Training Planner assessment guide can import. Use when asked to create or edit a marking scheme, a test project's criteria / sub-criteria / aspects, judgement ladders or aspect max marks.
---

# Marking schemes

A marking scheme is authored as **JSON**, then built into the CIS `.xlsx` the
assessment guide imports. Never hand-write the spreadsheet: the format has
landmarks the parser searches for, and a workbook that looks right in Excel can
still import as half a scheme.

The build re-opens what it wrote using the same reader the upload uses
(`readWorkbookGrid` → `parseMarkingScheme`), compares it field by field against
the spec, and **deletes the file if anything changed**. So a build that succeeds
is a file that will import — that is the whole point of going through it.

## Workflow

1. Write a spec. Start from [examples/example-scheme.json](examples/example-scheme.json).
2. Build it, from the repo root:

```bash
pnpm scheme:build path/to/scheme.json
```

3. Upload the `.xlsx` at **/assessments**.

Keep the `.json` beside the `.xlsx`: it is the editable source, the workbook is a
build output. To change a scheme, edit the JSON and rebuild with `--force`.
Re-importing always creates a *new* scheme, so runs already marked against the
old version keep their meaning.

Options: `-o <path>` to choose the output, `--force` to overwrite an existing
file (refused by default — `-o` could as easily be pointed at a real scheme).

## The spec

```jsonc
{
  "skill": "Web Technologies",           // required
  "testProject": "TP01 — Bookshop",      // required
  "expectedTotal": 100,                  // optional; build fails if the marks disagree
  "criteria": [{
    "letter": "A",                       // one or two capitals, unique
    "name": "Markup and Standards",
    "subCriteria": [{
      "code": "A1",                      // its criterion's letter + digits, unique
      "name": "Valid, semantic markup",
      "aspects": [
        { "type": "measurement",
          "description": "What the assessor checks",
          "extraDescription": "Deduct 0.5 per missing page",   // optional
          "maxMark": 2 },
        { "type": "judgement",
          "description": "What the assessor judges",
          "maxMark": 3,
          "descriptors": ["score 0 …", "score 1 …", "score 2 …", "score 3 …"] }
      ]
    }]
  }]
}
```

Set `expectedTotal` whenever the total is known — a WorldSkills scheme totals
**100**. It is the one check that catches a scheme which is internally
consistent but adds up to 97.5.

## What the build rejects

Each error names the criterion, sub-criterion and aspect, and every problem is
reported at once rather than one per run.

- A judgement aspect without **exactly four** descriptors, or with a blank rung.
- Descriptors on a measurement aspect.
- A missing, zero or negative `maxMark`.
- A sub-criterion code filed under the wrong criterion (`B1` inside criterion A).
- A duplicated criterion letter or sub-criterion code.
- An empty criterion, sub-criterion or aspect list.
- Marks that do not add up to `expectedTotal`.

## Writing a scheme that marks well

**Choose the aspect type by whether two assessors would agree.** A measurement
aspect must be checkable — present or absent, passes or fails, a count. If
marking it requires an opinion, it is a judgement aspect and needs the ladder.
The most common fault in a draft scheme is a "measurement" aspect described as
*"the layout is good"*.

**`extraDescription` on a measurement aspect is the deduction rule**, and it is
what makes a partial mark defensible: *"Deduct 0.25 per image missing an alt
attribute"*. Without it, an aspect worth 1.5 has no stated way to score 0.75.
On a judgement aspect the same column says what to look at while judging.

**Write the ladder as four observable states, not four grades.** The assessor
picks a rung and the mark follows — `(score / 3) × maxMark`, so a 3-mark aspect
scored 2 awards 2. Rungs that read "poor / fair / good / excellent" push the
decision back onto the assessor; rungs that describe what is on the screen do
not. Score 0 should describe the work not being done at all.

**Mind what the marks divide into.** A judgement aspect's awarded mark is
`maxMark / 3` per rung, so 3 and 1.5 divide cleanly while 1 gives 0.33. Prefer
maxima that are multiples of 3 for judgement aspects, and quarter-points for
measurement.

**Sub-criteria are the unit a competitor is coached against**, so name them for
the capability being assessed, not for the part of the brief.

## Repairing or inspecting an existing workbook

```bash
pnpm verify:scheme "/path/to/TP-Something-MarkingScheme.xlsx"
```

Prints skill, test project, criteria, aspect counts, totals and any warnings —
reading the file in place, writing and uploading nothing. Use it to check a file
you did not build, or to see why an import was refused. Errors carry the
offending **row number**; open the sheet at that row and check it against
[reference/format.md](reference/format.md).

To turn an existing workbook into an editable spec, run `verify:scheme` to read
its structure, then write the JSON to match and rebuild — a clean round trip
confirms nothing was lost.

## Never commit a real marking scheme

Real schemes are unreleased competition material and this repository is on
GitHub. `verify:scheme` exists precisely so a real file can be checked without
being copied anywhere. Build outputs belong outside the repo, or in a gitignored
path — only synthetic examples are committed.

## The sheet itself

[reference/format.md](reference/format.md) — the column-by-column layout, the
landmarks the parser keys on, and how a row is classified. Read it when
debugging a workbook you did not build, or when changing `build.ts` or
`parse.ts`.
