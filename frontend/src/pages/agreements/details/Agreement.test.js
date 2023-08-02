import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Agreement from "./Agreement";

import store from "../../../store";
import { Provider } from "react-redux";

describe("Agreement", () => {
    test("renders correctly", () => {
        render(
            <Provider store={store}>
                <Agreement />
            </Provider>
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
});
