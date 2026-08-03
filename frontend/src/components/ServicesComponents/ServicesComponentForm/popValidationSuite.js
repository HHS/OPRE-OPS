import { create, enforce, test } from "vest";

export const BLI_POP_MESSAGE =
    "Services Components may not be updated in a way that causes non-draft Budget Lines to fall outside the Period of Performance.";

// Parses a YYYY-MM-DD string (API response format) into a Date, or null if invalid.
function parseISO(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Vest validation suite checking whether a Services Component's Period of
 * Performance still covers every non-draft Budget Line on the agreement.
 *
 * Unlike a normal form-validation suite, a failure here is not a hard block —
 * callers use `hasErrors()` to decide whether to show a confirmation modal
 * before saving, rather than preventing the save outright.
 *
 * Expected data fields:
 *   - mode: "add" | "edit"
 *   - allServicesComponents: Array<{number, period_start, period_end}> — all SCs on the agreement.
 *       The caller pre-merges live form dates for the SC being edited before passing this in, so this
 *       array is always current. The suite uses it directly to compute the overall SC window.
 *   - nonDraftBudgetLines: Array<{date_needed: string|null}> — non-draft BLIs on the agreement
 */
const suite = create((data = {}) => {
    if (data.mode !== "edit" && data.mode !== "add") return;
    const allSCs = data.allServicesComponents ?? [];
    const nonDraftBLIs = data.nonDraftBudgetLines ?? [];
    if (allSCs.length === 0 || nonDraftBLIs.length === 0) return;

    const bliDates = nonDraftBLIs.map((bli) => parseISO(bli.date_needed)).filter(Boolean);
    if (bliDates.length === 0) return;

    const scStarts = allSCs.map((sc) => parseISO(sc.period_start)).filter(Boolean);
    const scEnds = allSCs.map((sc) => parseISO(sc.period_end)).filter(Boolean);

    const windowStart = scStarts.length > 0 ? scStarts.reduce((min, d) => (d < min ? d : min)) : null;
    const windowEnd = scEnds.length > 0 ? scEnds.reduce((max, d) => (d > max ? d : max)) : null;

    const earliestBliDate = bliDates.reduce((min, d) => (d < min ? d : min));
    const latestBliDate = bliDates.reduce((max, d) => (d > max ? d : max));

    test("popStartDate", BLI_POP_MESSAGE, () => {
        if (!windowStart) return;
        enforce(windowStart.getTime()).lessThanOrEquals(earliestBliDate.getTime());
    });

    test("popEndDate", BLI_POP_MESSAGE, () => {
        if (!windowEnd) return;
        enforce(windowEnd.getTime()).greaterThanOrEquals(latestBliDate.getTime());
    });
});

export default suite;
