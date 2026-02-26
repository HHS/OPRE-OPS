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
 * @param {string} fiscalYear - The selected fiscal year (e.g., "2025" or "All").
 * @param {string} currentFiscalYear - The current fiscal year (e.g., "2026").
 * @returns {Array<{heading: string, value: string}>} - The table headings list with dynamic FY label.
 */
export const getTableHeadingsWithFY = (fiscalYear, currentFiscalYear) => {
    const effectiveFY = fiscalYear === "All" ? currentFiscalYear : fiscalYear;
    const fyLabel = `FY${String(effectiveFY).slice(-2)} Obligated`;

    return TABLE_HEADINGS_LIST.map((item) => {
        if (item.value === tableSortCodes.agreementCodes.FY_OBLIGATED) {
            return { ...item, heading: fyLabel };
        }
        return item;
    });
};
