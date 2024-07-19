import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import store from "../store";
import Login from "./Login";

describe("Login", () => {
    it("should render the login page", () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <Login />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByText("Portfolio Management System")).toBeInTheDocument();
        expect(screen.getByText("OPRE Portfolio Management System")).toBeInTheDocument();
        const signInOptions = screen.getAllByText(/sign in/i);
        expect(signInOptions).toHaveLength(3);
    });
});
