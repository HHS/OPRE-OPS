import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import store from "../../../store";
import FiscalYear from "./FiscalYear";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <FiscalYear
                fiscalYear={2024}
                handleChangeFiscalYear={() => {}}
            />
        </Provider>
    );
});
