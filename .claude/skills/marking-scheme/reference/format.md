# The CIS Marking Scheme Import sheet

The layout `src/lib/marking-scheme/build.ts` writes and
`src/lib/marking-scheme/parse.ts` reads. Read this when debugging a workbook you
did not build, or before changing either module.

**Nothing is addressed by absolute row number except the two title rows.**
Sections are found by locating a repeating header row, and every other row is
classified by *which columns carry values*. That is what makes a longer scheme
work with no code change: it is simply more rows between the same landmarks.

## Columns

Eleven columns, A–K. `G` is a label only and `H` is unused; both are written
blank and read never.

| Col | Index | Carries |
| --- | --- | --- |
| A | 0 | Titles, criterion letter, sub-criteria code, the section-header marker |
| B | 1 | Criterion / sub-criterion name |
| C | 2 | Aspect type — `M` or `J` |
| D | 3 | Aspect description |
| E | 4 | Summary totals; judgement score `0`–`3` on a descriptor row |
| F | 5 | Extra aspect description (deduction rule), or the descriptor text |
| I | 8 | Max mark |
| J | 9 | Criterion letter on an aspect row; `Criterion X` on a header row |
| K | 10 | Criterion max, on a header row |

## Order of the sheet

```
A1  Skill: <skill>                      ← searched for in the first ten rows
A2  Test Project: <test project>        ← same

    Criterion | Description | Meas (M) | Judg (J) | Total      ← summary header
    A         | First part  | 2.5      | 0        | 2.5
    B         | Second part | 0.5      | 3        | 3.5
              | Total       | 3        | 3        | 6          ← ends the summary scan

    ┌ per criterion ────────────────────────────────────────────
    │ Sub Criteria ID | … | … | … |  …  | Criterion A |  2.5    ← section header
    │ A               | First part                              ← criterion
    │ A1              | Setup                                   ← sub-criterion
    │                 |   | M | Environment restored | | | | 1 | A     ← aspect
    │                 |   | J | Overall visual quality| | | | 3 | A    ← aspect
    │                 |   |   |   | 0 | Cluttered and unreadable       ← ladder
    │                 |   |   |   | 1 | Readable but plain
    │                 |   |   |   | 2 | Clear and well aligned
    │                 |   |   |   | 3 | Polished and consistent
    └───────────────────────────────────────────────────────────

    Judgement aspects: mark awarded = (judgement score 0-3 / 3) x Max Mark.
    Measurement aspects: full mark, or the deduction rule given in the extra description.
```

## The landmarks

**`Sub Criteria ID` in column A** opens a section. It is matched
case-insensitively (`HEADER_MARKER`), and one section is written per criterion.
Everything between one header and the next belongs to that section. Column J
carries `Criterion X` and column K that criterion's max — the parser falls back
to K when there is no summary table.

**The summary table** is scanned from row 0 and stops at the first row with
`Total` in column B and column A blank. It is only ever a cross-check: the
aspects are the source of truth, and a disagreement surfaces as an import
*warning*, not an error. `build.ts` computes the summary from the aspects, so a
built sheet cannot contradict itself.

## How a row is classified

Checked in this order, inside a section:

1. **Descriptor** — column C blank *and* column E holds `0`–`3`. Attaches to the
   most recent judgement aspect, so a descriptor must sit **immediately** under
   its aspect; any aspect, sub-criterion or criterion row in between breaks the
   association and the workbook is rejected for an incomplete ladder.
2. **Aspect** — column C is `M` or `J`. Needs a description in D and a max mark
   in I, or the row is an error naming its row number.
3. **Sub-criterion** — column A matches `^[A-Z]{1,2}\d{1,3}$` and B is non-blank.
4. **Criterion** — column A matches `^[A-Z]{1,2}$` and B is non-blank.

A row matching none of these is ignored, which is why blank spacer rows and the
footer are harmless.

## Values

- Numbers may be written as text or as numbers; both `1.5` and `1,5` parse.
- A formula cell is read as its **last computed result**, since a max mark may
  well be a `SUM`.
- Every cell is trimmed on read, so leading and trailing whitespace never
  survives a round trip. `build.ts` trims on write for the same reason.
- `build.ts` writes a cell as a number only when the string is exactly what
  `String(n)` produces — no leading zeros. An aspect described as `007` stays
  text rather than coming back as `7`.

## Rules enforced on import

Errors (the workbook is refused outright, and nothing is half-imported):

- No `Skill:` or `Test Project:` row in the first ten rows.
- No `Sub Criteria ID` header anywhere.
- An aspect with no max mark, or a max mark with no description.
- A judgement aspect without descriptors for all of 0, 1, 2 and 3.
- An aspect or sub-criterion appearing before any criterion.

Warnings (imported, but flagged):

- A criterion with no aspects.
- Aspect marks that disagree with the summary table or the `Total` row.
