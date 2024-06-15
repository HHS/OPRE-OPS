import { render } from "@testing-library/react";
import { test } from "vitest";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import CreateBLIsAndSCs from "./CreateBLIsAndSCs"; // replace with your component
import store from "../../../store";
import { agreement } from "../../../tests/data";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

const wizardSteps = ["Project", "Agreement", "Budget Lines"];

const mockFn = TestApplicationContext.helpers().mockFn;
const setIncludeDrafts = mockFn;
const setIsEditMode = mockFn;

test("renders without crashing", () => {
    render(
        <Provider store={store}>
            <BrowserRouter>
                <CreateBLIsAndSCs
                    budgetLines={agreement.budget_line_items}
                    selectedResearchProject={agreement}
                    selectedAgreement={agreement}
                    selectedProcurementShop={agreement.procurement_shop}
                    isEditMode={true}
                    continueBtnText="Save Changes"
                    wizardSteps={wizardSteps}
                    workflow="none"
                    currentStep={1}
                    isReviewMode={false}
                    canUserEditBudgetLines={false}
                    setIsEditMode={setIsEditMode}
                    includeDrafts={true}
                    setIncludeDrafts={setIncludeDrafts}
                />
            </BrowserRouter>
        </Provider>
    );
});
