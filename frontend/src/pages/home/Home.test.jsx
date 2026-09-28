import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils";
import { getGreeting } from "./home.helpers";
import Home from "./Home";

// NOTE: the greeting itself is covered in home.helpers.test.js. It can't be exercised here with a
// signed-in user because the header's auth section dispatches `logout()` on mount when there is no
// token in localStorage, which clears `auth.activeUser` before the assertion runs.
describe("Home", () => {
    it("should render the greeting as the page title", () => {
        renderWithProviders(<Home />);

        expect(screen.getByRole("heading", { level: 1, name: getGreeting() })).toBeInTheDocument();
    });

    it("should render the release summary section heading", () => {
        renderWithProviders(<Home />);

        expect(screen.getByRole("heading", { level: 2, name: "OPS Release Summary" })).toBeInTheDocument();
    });

    it("should render both summary cards", () => {
        renderWithProviders(<Home />);

        expect(screen.getByText("Last Release")).toBeInTheDocument();
        expect(screen.getByText("Release Changes")).toBeInTheDocument();
        expect(screen.getByText("Currently Developing")).toBeInTheDocument();
        expect(screen.getByText("Next Up")).toBeInTheDocument();
    });

    it("should render the What's New tab", () => {
        renderWithProviders(<Home />);

        expect(screen.getByRole("button", { name: "What's New" })).toBeInTheDocument();
    });
});
