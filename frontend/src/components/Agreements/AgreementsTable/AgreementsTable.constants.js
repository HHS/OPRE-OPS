import { tableSortCodes } from "../../../helpers/utils";
export const AGREEMENT_TABLE_HEADINGS = {
    AGREEMENT: "Agreement",
    PROJECT: "Project",
    TYPE: "Type",
    AGREEMENT_TOTAL: "Agreement Total",
    NEXT_BUDGET_LINE: "Next Budget Line",
    NEXT_OBLIGATE_BY: "Next Obligate By"
};
export const TABLE_HEADINGS_LIST = [
    { heading: AGREEMENT_TABLE_HEADINGS.AGREEMENT, value: tableSortCodes.agreementCodes.AGREEMENT },
    { heading: AGREEMENT_TABLE_HEADINGS.PROJECT, value: tableSortCodes.agreementCodes.PROJECT },
    { heading: AGREEMENT_TABLE_HEADINGS.TYPE, value: tableSortCodes.agreementCodes.TYPE },
    { heading: AGREEMENT_TABLE_HEADINGS.AGREEMENT_TOTAL, value: tableSortCodes.agreementCodes.AGREEMENT_TOTAL },
    { heading: AGREEMENT_TABLE_HEADINGS.NEXT_BUDGET_LINE, value: tableSortCodes.agreementCodes.NEXT_BUDGET_LINE },
    { heading: AGREEMENT_TABLE_HEADINGS.NEXT_OBLIGATE_BY, value: tableSortCodes.agreementCodes.NEXT_OBLIGATE_BY }
];
