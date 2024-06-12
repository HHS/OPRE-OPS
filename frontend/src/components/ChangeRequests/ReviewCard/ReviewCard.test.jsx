import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import { useGetAgreementByIdQuery } from "../../../api/opsAPI";
import ReviewCard from "./ReviewCard";

vi.mock("../../../api/opsAPI");
describe("ReviewCard", () => {
    const initialProps = {
        type: "Budget Change",
        agreementId: 1,
        actionIcons: false,
        requesterName: "Jane Doe",
        requestDate: "2021-10-01"
    };
    it("should render the ReviewCard component", () => {
        useGetAgreementByIdQuery.mockReturnValue({ data: { display_name: "TBD" } });
        render(
            <BrowserRouter>
                <ReviewCard {...initialProps} />
            </BrowserRouter>
        );
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
            <BrowserRouter>
                <ReviewCard
                    {...initialProps}
                    actionIcons={true}
                />
            </BrowserRouter>
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