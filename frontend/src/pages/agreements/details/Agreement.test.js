import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import store from "../../../store";
import Agreement from "./Agreement";

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
