import { tableSortCodes } from "../../../helpers/utils";

export const AGREEMENT_TABLE_HEADINGS = {
    AGREEMENT: "Agreement",
    TYPE: "Type",
    START: "Start",
    END: "End",
    TOTAL: "Total",
    FY_OBLIGATED: "FY Obligated"
};

export const TABLE_HEADINGS_LIST = [
    { heading: AGREEMENT_TABLE_HEADINGS.AGREEMENT, value: tableSortCodes.agreementCodes.AGREEMENT },
    { heading: AGREEMENT_TABLE_HEADINGS.TYPE, value: tableSortCodes.agreementCodes.TYPE },
    { heading: AGREEMENT_TABLE_HEADINGS.START, value: tableSortCodes.agreementCodes.START },
    { heading: AGREEMENT_TABLE_HEADINGS.END, value: tableSortCodes.agreementCodes.END },
    { heading: AGREEMENT_TABLE_HEADINGS.TOTAL, value: tableSortCodes.agreementCodes.TOTAL },
    { heading: AGREEMENT_TABLE_HEADINGS.FY_OBLIGATED, value: tableSortCodes.agreementCodes.FY_OBLIGATED }
];

/**
 * Returns table headings with a dynamic FY column label based on the selected fiscal year.
 * @param {string} fiscalYear - The selected fiscal year (e.g., "2025") or "All".
 * @param {boolean} [fyDisabled] - When true, marks the FY Obligated column as non-sortable.
 * @returns {Array<{heading: string, value: string, disabled?: boolean}>} - The table headings list.
 */
export const getTableHeadingsWithFY = (fiscalYear, fyDisabled = false) => {
    const fyLabel = fiscalYear === "All" ? "Lifetime Obligated" : `FY${String(fiscalYear).slice(-2)} Obligated`;

    return TABLE_HEADINGS_LIST.map((item) => {
        if (item.value === tableSortCodes.agreementCodes.FY_OBLIGATED) {
            return { ...item, heading: fyLabel, disabled: fyDisabled || undefined };
        }
        return item;
    });
};
