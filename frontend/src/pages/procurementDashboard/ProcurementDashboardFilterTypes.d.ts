import { Division } from "../../types/PortfolioTypes";

export type ProcShopOption = {
    id: number;
    abbr: string;
};

export type Filters = {
    procShop?: ProcShopOption[];
    division?: Division[];
};
