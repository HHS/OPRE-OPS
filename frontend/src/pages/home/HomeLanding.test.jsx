import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils";
import HomeLanding from "./HomeLanding";

describe("HomeLanding", () => {
    it("renders the tab nav with all three tab labels", () => {
        renderWithProviders(<HomeLanding />);

        expect(screen.getByText("What's New")).toBeInTheDocument();
        expect(screen.getByText("OPS at a Glance")).toBeInTheDocument();
        expect(screen.getByText("OPS Benefits")).toBeInTheDocument();
    });

    it("marks the What's New tab as selected by default", () => {
        renderWithProviders(<HomeLanding />);

        expect(screen.getByText("What's New").className).toContain("listItemSelected");
    });
});
