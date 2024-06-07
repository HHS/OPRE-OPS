import { render, screen } from "@testing-library/react";
import ReviewCard from "./ReviewCard";
import { useGetAgreementByIdQuery } from "../../../api/opsAPI";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";

vi.mock("../../../api/opsAPI");
describe("ReviewCard", () => {
    const initialProps = {
        type: "budget_line_item_change_request",
        agreementId: 1,
        actionIcons: false,
        requesterName: "Jane Doe",
        requestDate: "2021-10-01"
    };
    it("should render the ReviewCard component", () => {
        useGetAgreementByIdQuery.mockReturnValue({ data: { display_name: "TBD" } });
        render(<ReviewCard {...initialProps} />);

        const type = screen.getByText("Budget Change");
        const agreementName = screen.getByText("TBD");
        const requesterName = screen.getByText("Jane Doe");
        const requestDate = screen.getByText("September 30, 2021");
        const actionIcons = screen.queryByText("icons");

        expect(type).toBeInTheDocument();
        expect(agreementName).toBeInTheDocument();
        expect(requesterName).toBeInTheDocument();
        expect(requestDate).toBeInTheDocument();
        expect(actionIcons).not.toBeInTheDocument();
    });
    it("should render the ReviewCard component with action icons", async () => {
        const user = userEvent.setup();
        useGetAgreementByIdQuery.mockReturnValue({ data: { display_name: "TBD" } });
        render(
            <ReviewCard
                {...initialProps}
                actionIcons={true}
            />
        );
        // mouse over the card
        await user.hover(screen.getByText("Budget Change"));
        const approveBtn = screen.getByRole("button", { name: /approve/i });
        const declineBtn = screen.getByRole("button", { name: /decline/i });

        expect(approveBtn).toBeInTheDocument();
        expect(declineBtn).toBeInTheDocument();
    });
    it.todo('should render the ReviewCard component with a type of "type"');
});
