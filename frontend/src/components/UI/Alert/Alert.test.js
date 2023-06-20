import { render } from "@testing-library/react";
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
                redirectUrl: null,
            },
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

        const alert = document.querySelector(".usa-alert");
        expect(alert).toBeInTheDocument();
    });

    it("renders the correct heading and message", () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Alert heading="Test Heading" message="Test Message" />
                </MemoryRouter>
            </Provider>
        );

        const heading = document.querySelector(".usa-alert__heading");
        const message = document.querySelector(".usa-alert__text");

        expect(heading).toHaveTextContent("Test Heading");
        expect(message).toHaveTextContent("Test Message");
    });

    it("renders the correct class based on the type prop", () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Alert type="success" />
                </MemoryRouter>
            </Provider>
        );

        const alert = document.querySelector(".usa-alert");
        expect(alert).toHaveClass("usa-alert--success");
    });
});
