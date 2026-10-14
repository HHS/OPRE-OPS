import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils";
import Home from "./Home";

describe("Home", () => {
    it("renders only the routed outlet (no hero or legacy tabs)", () => {
        renderWithProviders(<Home />);
        // Landing content (welcome message, OPS Updates cards, tab nav) comes from
        // HomeLanding via the routed Outlet, not the Home layout itself.
        expect(screen.queryByText("Plan, track & collaborate")).not.toBeInTheDocument();
        expect(screen.queryByText("About OPS")).not.toBeInTheDocument();
        expect(screen.queryByTestId("welcome-message")).not.toBeInTheDocument();
    });
});
