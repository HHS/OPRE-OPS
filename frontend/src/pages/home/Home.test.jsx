import { renderWithProviders } from "../../test-utils";
import { screen } from "@testing-library/react";
import Home from "./Home";

describe("Home", () => {
    it("should render the hero heading", () => {
        renderWithProviders(<Home />);
        expect(screen.getByText("Plan, track & collaborate")).toBeInTheDocument();
    });

    it("should render the hero subheading", () => {
        renderWithProviders(<Home />);
        expect(screen.getByText("all in one place")).toBeInTheDocument();
    });

    it("should render the hero description", () => {
        renderWithProviders(<Home />);
        expect(
            screen.getByText(/OPS brings everyone together for transparent and collaborative budget planning/i)
        ).toBeInTheDocument();
    });

    it("should render the About OPS tab", () => {
        renderWithProviders(<Home />);
        expect(screen.getByText("About OPS")).toBeInTheDocument();
    });

    it("should render the Release Notes tab", () => {
        renderWithProviders(<Home />);
        expect(screen.getByText("Release Notes")).toBeInTheDocument();
    });

    it("should render the What's Next tab", () => {
        renderWithProviders(<Home />);
        expect(screen.getByText("What's Next")).toBeInTheDocument();
    });

    it("should render the hero section", () => {
        renderWithProviders(<Home />);
        // The hero section contains the main heading
        expect(screen.getByText("Plan, track & collaborate")).toBeInTheDocument();
        expect(screen.getByText("all in one place")).toBeInTheDocument();
    });
});
