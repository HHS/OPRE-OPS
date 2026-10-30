import type { Division } from "../../../../types/PortfolioTypes";

export type FilterOption = {
    id: number | string;
    title: string;
};

export type Filters = {
    fiscalYear?: FilterOption[];
    portfolio?: FilterOption[];
    projectTitle?: FilterOption[];
    agreementType?: FilterOption[];
    agreementName?: FilterOption[];
    contractNumber?: FilterOption[];
    awardType?: FilterOption[];
    /** Divisions of the agreement's primary COR, from `cor_divisions` in the filter options. */
    division?: Division[];
};
