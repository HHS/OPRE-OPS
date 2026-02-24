export type FilterOption = {
    id: number;
    title: string;
};

export type Filters = {
    activePeriod?: FilterOption[];
    transfer?: FilterOption[];
    portfolio?: FilterOption[];
    can?: FilterOption[];
    budget?: [number, number];
    // Add other filter types here
};
