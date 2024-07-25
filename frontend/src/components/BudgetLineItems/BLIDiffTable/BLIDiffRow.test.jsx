import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";
import { vi } from "vitest";
import { useGetAgreementByIdQuery, useGetCansQuery, useGetUserByIdQuery } from "../../../api/opsAPI";
import store from "../../../store";
import { agreement, budgetLineWithBudgetChangeRequest } from "../../../tests/data";
import BLIDiffRow from "./BLIDiffRow";

const renderComponent = () => {
    useGetUserByIdQuery.mockReturnValue({ data: "John Doe" });
    useGetAgreementByIdQuery.mockReturnValue({ data: agreement });
    useGetCansQuery.mockReturnValue({ data: [{ id: 1, code: "CAN 1", name: "CAN 1" }] });

    render(
        <Router location="/agreements/approve/1?type=budget-change">
            <Provider store={store}>
                <BLIDiffRow
                    budgetLine={budgetLineWithBudgetChangeRequest}
                    changeType="Budget Change"
                    statusChangeTo=""
                />
            </Provider>
        </Router>
    );
};

vi.mock("../../../api/opsAPI");
describe("BLIRow", () => {
    it("should render the BLIRow component", () => {
        renderComponent();

        const needByDate = screen.getByRole("cell", { name: "6/13/2044" });
        const FY = screen.getByRole("cell", { name: "2044" });
        const status = screen.getByRole("cell", { name: "Planned" });
        const currentDollarAmount = screen.queryByText("$300,000.00");
        const CAN = screen.getByRole("cell", { name: "G99XXX8" });

        expect(needByDate).toBeInTheDocument();
        expect(FY).toBeInTheDocument();
        expect(status).toBeInTheDocument();
        expect(currentDollarAmount).toBeInTheDocument();
        expect(CAN).toBeInTheDocument;
    });
    it("should be expandable", async () => {
        renderComponent();

        const user = userEvent.setup();
        const expandButton = screen.getByTestId("expand-row");
        await user.click(expandButton);
        const expandedRow = screen.getByTestId("expanded-data");
        const createdBy = screen.getByText("unknown");
        const createdDate = screen.getByText("July 25, 2024");
        const notes = screen.getByText(/no notes added/i);

        expect(expandedRow).toBeInTheDocument();
        expect(createdBy).toBeInTheDocument();
        expect(createdDate).toBeInTheDocument();
        expect(notes).toBeInTheDocument();
    });
});
