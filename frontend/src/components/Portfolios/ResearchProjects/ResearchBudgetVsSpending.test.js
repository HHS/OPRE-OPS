import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import ResearchBudgetVsSpending from "./ResearchBudgetVsSpending";

const portfolioId = 1;

it.skip("renders without crashing", () => {
    render(
        <Provider store={store}>
            <ResearchBudgetVsSpending portfolioId={portfolioId} />
        </Provider>
    );
});
