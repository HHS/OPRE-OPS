import { render } from "@testing-library/react";
import { test } from "vitest";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import CreateBLIsAndSCs from "./CreateBLIsAndSCs"; // replace with your component
import store from "../../../store";

const agreementMock = {
    id: 1,
    name: "Agreement 1",
    description: "Description 1",
    project_officer: "John Doe",
    period_of_performance_start: "2022-01-01",
    period_of_performance_end: "2022-12-31",
    budget_line_items: [
        {
            id: 1,
            description: "Budget Line 1",
            comments: "Comments 1",
            can: {
                id: 1,
                code: "CAN 1",
                name: "CAN 1"
            }
        },
        {
            id: 2,
            description: "Budget Line 2",
            comments: "Comments 2",
            can: {
                id: 2,
                code: "CAN 2",
                name: "CAN 2"
            }
        }
    ],
    procurement_shop: 1
};
const wizardSteps = ["Project", "Agreement", "Budget Lines"];

test("renders without crashing", () => {
    render(
        <Provider store={store}>
            <BrowserRouter>
                <CreateBLIsAndSCs
                    budgetLines={agreementMock.budget_line_items}
                    selectedResearchProject={agreementMock}
                    selectedAgreement={agreementMock}
                    selectedProcurementShop={agreementMock.procurement_shop}
                    isEditMode={true}
                    continueBtnText="Save Changes"
                    wizardSteps={wizardSteps}
                    workflow="none"
                    currentStep={1}
                    isReviewMode={false}
                    canUserEditBudgetLines={false}
                    setIsEditMode={() => {}}
                />
            </BrowserRouter>
        </Provider>
    );
});
