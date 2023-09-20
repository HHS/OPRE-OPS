import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import PortfolioNewFunding from "./PortfolioNewFunding";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <PortfolioNewFunding />
        </Provider>
    );
});
