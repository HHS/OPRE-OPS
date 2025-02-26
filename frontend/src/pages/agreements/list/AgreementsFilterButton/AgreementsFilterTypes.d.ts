export type FilterOption = {
    id: number;
    title: string;
};

export type Filters = {
    fiscalYear?: FilterOption[];
    budgetLineStatus?: FilterOption[];
    portfolio?: FilterOption[];
};
