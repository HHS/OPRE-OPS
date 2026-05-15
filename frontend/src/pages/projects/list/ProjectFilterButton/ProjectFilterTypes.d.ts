export type FilterOption = {
    id: number | string;
    title: string;
    name?: string;
};

export type Filters = {
    fiscalYear?: FilterOption[];
    portfolio?: FilterOption[];
    projectSearch?: FilterOption[];
    agreementSearch?: FilterOption[];
    projectType?: FilterOption[];
};
