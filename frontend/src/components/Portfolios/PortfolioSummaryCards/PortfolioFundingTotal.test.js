import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import PortfolioFundingTotal from "./PortfolioFundingTotal";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <PortfolioFundingTotal fiscalYear={2023} />
        </Provider>
    );
});
