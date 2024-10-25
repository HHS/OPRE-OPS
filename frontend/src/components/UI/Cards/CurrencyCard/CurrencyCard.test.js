import store from "../../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import CurrencySummaryCard from "./CurrencyCard";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <CurrencySummaryCard
                headerText="blah blah"
                amount={12345.78}
            />
        </Provider>
    );
});
