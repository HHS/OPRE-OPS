import { create, enforce, only, test } from "vest";

const BLI_POP_MESSAGE =
    "Services Components may not be updated in a way that causes non-draft Budget Lines to fall outside the Period of Performance.";

// Parses a YYYY-MM-DD string (API response format) into a Date, or null if invalid.
function parseISO(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Vest validation suite for ServicesComponentForm.
 *
 * Expected data fields:
 *   - servicesComponentSelect: number — the selected SC number
 *   - mode: "add" | "edit"
 *   - allServicesComponents: Array<{number, period_start, period_end}> — all SCs on the agreement.
 *       The hook pre-merges live form dates for the SC being edited before passing this in, so this
 *       array is always current. The suite uses it directly to compute the overall SC window.
 *   - nonDraftBudgetLines: Array<{date_needed: string|null}> — non-draft BLIs on the agreement
 */
const suite = create((data = {}, fieldName) => {
    if (fieldName) only(fieldName);

    test("servicesComponentSelect", "This is required information", () => {
        // servicesComponentSelect is a number (the SC number); treat 0 / falsy as blank
        enforce(data.servicesComponentSelect).isNumeric().greaterThan(0);
    });

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
