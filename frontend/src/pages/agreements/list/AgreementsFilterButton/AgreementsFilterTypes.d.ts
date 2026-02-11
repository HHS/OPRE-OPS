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
};
