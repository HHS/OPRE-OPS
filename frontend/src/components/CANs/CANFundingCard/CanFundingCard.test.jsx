import { render, screen } from "@testing-library/react";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import CANFundingCard from "./CANFundingCard";

vi.mock("../../../api/opsAPI");
describe("CanFundingCard", () => {
    const initialProps = {
        can: canData,
        pendingAmount: 703_500,
        afterApproval: true
    };
    useGetCanFundingSummaryQuery.mockReturnValue({ data: canFundingCardData });
    it("should render the CanFundingCard component", () => {
        render(<CANFundingCard {...initialProps} />);

        const heading = screen.getByText(/G99PHS9/i);
        const totalBudget = screen.getByText(/24,000,000/i);
        const totalSpending = screen.getByText(/10,403,500/i);
        const remainingBudget = screen.getByText(/13,596,500/i);

        expect(heading).toBeInTheDocument();
        expect(totalBudget).toBeInTheDocument();
        expect(totalSpending).toBeInTheDocument;
        expect(remainingBudget).toBeInTheDocument;
    });

    it("should render the component after approval", () => {
        render(
            <CANFundingCard
                {...initialProps}
                afterApproval={false}
            />
        );

        const totalSpending = screen.getByText(/9,700,000/i);
        const remainingBudget = screen.getByText(/14,300,000/i);

        expect(totalSpending).toBeInTheDocument();
        expect(remainingBudget).toBeInTheDocument();
    });
});

const canData = {
    appropriation_date: "2023-10-01T00:00:00.000000Z",
    appropriation_term: 1,
    authorizer_id: 26,
    description: "Social Science Research and Development",
    display_name: "G99PHS9",
    expiration_date: "2024-09-01T00:00:00.000000Z",
    id: 502,
    managing_portfolio_id: 8,
    nickname: "SSRD",
    number: "G99PHS9"
};

const canFundingCardData = {
    available_funding: "14300000.00",
    can: {
        appropriation_date: "2023-10-01T00:00:00.000000Z",
        appropriation_term: 1,
        arrangement_type: "OPRE_APPROPRIATION",
        authorizer: 26,
        authorizer_id: 26,
        budget_line_items: [15011, 15017, 15020],
        can_type: null,
        created_by: null,
        created_by_user: null,
        created_on: "2024-07-29T14:44:58.757452Z",
        description: "Social Science Research and Development",
        display_name: "G99PHS9",
        division_id: 6,
        expiration_date: "2024-09-01T00:00:00.000000Z",
        external_authorizer_id: null,
        funding_sources: [26],
        id: 502,
        managing_portfolio: 8,
        managing_portfolio_id: 8,
        nickname: "SSRD",
        number: "G99PHS9",
        projects: [],
        shared_portfolios: [],
        updated_by: null,
        updated_by_user: null,
        updated_on: "2024-07-29T14:44:58.757452Z",
        versions: [
            {
                id: 502,
                transaction_id: 208
            }
        ]
    },
    carry_forward_funding: 0,
    carry_forward_label: "Carry-Forward",
    expected_funding: "5000000.00",
    expiration_date: "09/01/2024",
    in_execution_funding: "2000000.00",
    obligated_funding: 0,
    planned_funding: "7700000.00",
    received_funding: "19000000.00",
    total_funding: "24000000.00"
};
