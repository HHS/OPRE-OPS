import { render } from "@testing-library/react";
import { TotalSummaryCard } from "./TotalSummaryCard";

describe("<TotalSummaryCard />", () => {
    const budgetLines = [
        {
            id: "1",
            name: "Budget Line 1",
            amount: 100,
            date_needed: "2021-01-01",
            psc_fee_amount: 0,
            amt: 100,
            status: "DRAFT",
        },
        {
            id: "2",
            name: "Budget Line 2",
            amount: 200,
            date_needed: "2021-01-01",
            psc_fee_amount: 0,
            amt: 200,
            status: "DRAFT",
        },
    ];

    it("renders without crashing", () => {
        render(<TotalSummaryCard budgetLines={budgetLines} />);
    });
});
