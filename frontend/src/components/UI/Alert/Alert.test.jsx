import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import configureStore from "redux-mock-store";
import Alert from "./Alert";

const mockStore = configureStore([]);

describe("Alert component", () => {
    let store;

    beforeEach(() => {
        store = mockStore({
            alert: {
                heading: "Test Heading",
                message: "Test Message",
                type: "success",
                redirectUrl: null
            }
        });
    });

    it("renders the alert component", () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Alert />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders the correct heading and message", () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Alert />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText("Test Heading")).toBeInTheDocument();
        expect(screen.getByText("Test Message")).toBeInTheDocument();
    });

    it("renders the correct class based on the type prop", () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Alert />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByRole("status")).toHaveClass("usa-alert--success");
    });
});
