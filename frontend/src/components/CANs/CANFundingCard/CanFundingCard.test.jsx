import { render, screen } from "@testing-library/react";
import { useGetCanFundingQuery } from "../../../api/opsAPI";
import CANFundingCard from "./CANFundingCard";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../api/opsAPI");
describe("CanFundingCard", () => {
    const initialProps = {
        can: canData,
        pendingAmount: 703_500,
        afterApproval: true
    };
    useGetCanFundingQuery.mockReturnValue({ data: canFundingCardData });
    it("should render the CanFundingCard component", () => {
        render(
            <MemoryRouter>
                <CANFundingCard {...initialProps} />
            </MemoryRouter>
        );

        const heading = screen.getByText(/G99PHS9/i);
        const totalBudget = screen.getByText(/24,000,000/i);
        const totalSpending = screen.getByText(/10,403,500/i);
        const remainingBudget = screen.getByText(/13,596,500/i);

        expect(heading).toBeInTheDocument();
        expect(totalBudget).toBeInTheDocument();
        expect(totalSpending).toBeInTheDocument();
        expect(remainingBudget).toBeInTheDocument();
    });

    it("should render the component after approval", () => {
        render(
            <MemoryRouter>
                <CANFundingCard
                    {...initialProps}
                    afterApproval={false}
                />
            </MemoryRouter>
        );

        const totalSpending = screen.getByText(/9,700,000/i);
        const remainingBudget = screen.getByText(/14,300,000/i);

        expect(totalSpending).toBeInTheDocument();
        expect(remainingBudget).toBeInTheDocument();
    });
});

const canData = {
    appropriation_date: "2023-10-01T00:00:00.000000Z",
    active_period: 1,
    description: "Social Science Research and Development",
    display_name: "G99PHS9",
    expiration_date: "2024-09-01T00:00:00.000000Z",
    id: 502,
    portfolio_id: 8,
    nick_name: "SSRD",
    number: "G99PHS9"
};

const canFundingCardData = {
    can: {
        appropriation_date: "2023-10-01T00:00:00.000000Z",
        active_period: 1,
        id: 502,
        portfolio_id: 8,
        nick_name: "SSRD",
        number: "G99PHS9",
        carry_forward_label: "Carry-Forward",
        expiration_date: "09/01/2024"
    },
    funding: {
        available_funding: 14300000.0,
        carry_forward_funding: 14300000.0,
        expected_funding: 5000000.0,
        in_draft_funding: 0,
        in_execution_funding: 2000000.0,
        new_funding: 0,
        obligated_funding: 0,
        planned_funding: 7700000.0,
        received_funding: 19000000.0,
        total_funding: 24000000.0
    }
};
