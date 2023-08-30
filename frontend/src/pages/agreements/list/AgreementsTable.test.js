import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AgreementsTable from "./AgreementsTable";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <BrowserRouter>
                <AgreementsTable />
            </BrowserRouter>
        </Provider>
    );
});
