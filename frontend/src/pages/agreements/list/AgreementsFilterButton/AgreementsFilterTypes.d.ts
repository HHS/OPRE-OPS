import type { Division } from "../../../../types/PortfolioTypes";

export type FilterOption = {
    id: number | string;
    title: string;
};

/** A primary COR offered by the filter options (`cors`); `division_id` is null when the COR has no division. */
export type CorFilterOption = {
    id: number;
    name: string;
    division_id: number | null;
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
    division?: Pick<Division, "id" | "name" | "abbreviation">[];
    /** The agreement's primary COR, from `cors` in the filter options. OR'd with `division` by the backend. */
    cor?: CorFilterOption[];
};
