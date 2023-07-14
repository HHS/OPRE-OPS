import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PortfolioTabsSection from "./PortfolioTabsSection";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <BrowserRouter>
                <PortfolioTabsSection />
            </BrowserRouter>
        </Provider>
    );
});
