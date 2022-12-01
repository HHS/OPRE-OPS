import store from "../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import PortfolioCarryForwardFunding from "./PortfolioCarryForwardFunding";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <PortfolioCarryForwardFunding />
        </Provider>
    );
});
