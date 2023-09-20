import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import FiscalYear from "./FiscalYear";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <FiscalYear />
        </Provider>
    );
});
