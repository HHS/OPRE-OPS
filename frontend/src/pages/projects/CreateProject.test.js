import { render } from "@testing-library/react";
import { CreateProject } from "./CreateProject";

import store from "../../store";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

describe("Create Project component", () => {
    it("renders without errors", () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <CreateProject />
                </BrowserRouter>
            </Provider>
        );
    });
});
