import store from "../../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import CurrencyCard from "./CurrencyCard";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <CurrencyCard
                headerText="blah blah"
                amount={12345.78}
            />
        </Provider>
    );
});
