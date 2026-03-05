import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "../../test-utils";
import ReportingPage from "./ReportingPage";

vi.mock("../../App", () => ({
    default: ({ children }) => <div data-testid="app-wrapper">{children}</div>
}));

describe("ReportingPage", () => {
    it("should render the page heading", () => {
        renderWithProviders(<ReportingPage />);
        expect(screen.getByText("OPRE Budget Reporting")).toBeInTheDocument();
    });

    it("should render the subtitle", () => {
        renderWithProviders(<ReportingPage />);
        expect(screen.getByText("All Portfolios")).toBeInTheDocument();
    });

    it("should render the Budget Summary section heading", () => {
        renderWithProviders(<ReportingPage />);
        expect(screen.getByText("Budget Summary")).toBeInTheDocument();
    });

    it("should render the description text", () => {
        renderWithProviders(<ReportingPage />);
        expect(
            screen.getByText("This is a summary of OPRE's budget for the selected FY and applied filters.")
        ).toBeInTheDocument();
    });
});
