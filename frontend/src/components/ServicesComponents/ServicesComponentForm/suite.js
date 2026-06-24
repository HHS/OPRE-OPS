import { create, enforce, only, test } from "vest";

const BLI_POP_MESSAGE =
    "Services Components may not be updated in a way that causes non-draft Budget Lines to fall outside the Period of Performance.";

// Parses a MM/DD/YYYY string (form field format) into a Date, or null if invalid.
function parseMDY(dateStr) {
    if (!dateStr) return null;
    const [month, day, year] = dateStr.split("/");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
}

// Parses a YYYY-MM-DD string (API response format) into a Date, or null if invalid.
function parseISO(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Compute the overall SC window after applying the proposed edit to the SC identified
 * by `editedNumber`. Returns { windowStart: Date|null, windowEnd: Date|null }.
 *
 * @param {Array<{number: number, period_start: string|null, period_end: string|null}>} allSCs
 * @param {number} editedNumber - The SC number being edited
 * @param {Date|null} proposedStart - Proposed new period_start (or null = unchanged/blank)
 * @param {Date|null} proposedEnd - Proposed new period_end (or null = unchanged/blank)
 */
function computeWindowAfterEdit(allSCs, editedNumber, proposedStart, proposedEnd) {
    let windowStart = null;
    let windowEnd = null;

    for (const sc of allSCs) {
        const start = sc.number === editedNumber ? proposedStart : parseISO(sc.period_start);
        const end = sc.number === editedNumber ? proposedEnd : parseISO(sc.period_end);

        if (start && (windowStart === null || start < windowStart)) windowStart = start;
        if (end && (windowEnd === null || end > windowEnd)) windowEnd = end;
    }

    return { windowStart, windowEnd };
}

/**
 * Vest validation suite for ServicesComponentForm.
 *
 * Expected data fields:
 *   - servicesComponentSelect: number — the selected SC number
 *   - mode: "add" | "edit"
 *   - number: number — SC number being edited
 *   - popStartDate: string — MM/DD/YYYY (form field)
 *   - popEndDate: string — MM/DD/YYYY (form field)
 *   - allServicesComponents: Array<{number, period_start, period_end}> — all SCs on the agreement
 *   - nonDraftBudgetLines: Array<{date_needed: string|null}> — non-draft BLIs on the agreement
 */
const suite = create((data = {}, fieldName) => {
    if (fieldName) only(fieldName);

    test("servicesComponentSelect", "This is required information", () => {
        // servicesComponentSelect is a number (the SC number); treat 0 / falsy as blank
        enforce(data.servicesComponentSelect).isNumeric().greaterThan(0);
    });

    if (data.mode !== "edit") return;

    const allSCs = data.allServicesComponents ?? [];
    const nonDraftBLIs = data.nonDraftBudgetLines ?? [];
    if (allSCs.length === 0 || nonDraftBLIs.length === 0) return;

    const proposedStart = parseMDY(data.popStartDate);
    const proposedEnd = parseMDY(data.popEndDate);

    test("popStartDate", BLI_POP_MESSAGE, () => {
        const { windowStart } = computeWindowAfterEdit(allSCs, data.number, proposedStart, proposedEnd);
        if (!windowStart) return;

        const bliDates = nonDraftBLIs.map((bli) => parseISO(bli.date_needed)).filter(Boolean);
        const earliestBliDate = bliDates.length > 0 ? bliDates.reduce((min, d) => (d < min ? d : min)) : null;

        if (earliestBliDate) {
            enforce(windowStart.getTime()).lessThanOrEquals(earliestBliDate.getTime());
        }
    });

    test("popEndDate", BLI_POP_MESSAGE, () => {
        const { windowEnd } = computeWindowAfterEdit(allSCs, data.number, proposedStart, proposedEnd);
        if (!windowEnd) return;

        const bliDates = nonDraftBLIs.map((bli) => parseISO(bli.date_needed)).filter(Boolean);
        const latestBliDate = bliDates.length > 0 ? bliDates.reduce((max, d) => (d > max ? d : max)) : null;

        if (latestBliDate) {
            enforce(windowEnd.getTime()).greaterThanOrEquals(latestBliDate.getTime());
        }
    });
});

export default suite;
