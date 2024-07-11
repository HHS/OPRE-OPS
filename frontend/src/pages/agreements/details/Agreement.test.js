import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import store from "../../../store";
import Agreement from "./Agreement";

describe("Agreement", () => {
    it.todo("renders correctly", () => {
        render(
            <Provider store={store}>
                <Agreement />
            </Provider>
        );
        // TODO: Add more robust tests
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
});
