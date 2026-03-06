import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "../../test-utils";
import ReportingPage from "./ReportingPage";
import { useReportingPageData } from "./ReportingPage.hooks";

vi.mock("../../App", () => ({
    default: ({ children }) => <div data-testid="app-wrapper">{children}</div>
}));

vi.mock("./ReportingPage.hooks", () => ({
    useReportingPageData: vi.fn()
}));

vi.mock("../../components/Portfolios/PortfolioSummaryCards", () => ({
    default: () => <div data-testid="portfolio-summary-cards">Summary Cards</div>
}));

const mockDefaultHookReturn = {
    fiscalYear: 2026,
    selectedFiscalYear: "2026",
    setSelectedFiscalYear: vi.fn(),
    totalFunding: 15000000,
    totalSpending: 8000000,
    portfoliosWithFunding: [{ id: 1, name: "Test Portfolio" }],
    isLoading: false,
    isError: false
};

describe("ReportingPage", () => {
    beforeEach(() => {
        vi.mocked(useReportingPageData).mockReturnValue(mockDefaultHookReturn);
    });

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

    it("should render the BigBudgetCard with correct title", () => {
        renderWithProviders(<ReportingPage />);
        expect(screen.getByText("FY 2026 Available OPRE Budget *")).toBeInTheDocument();
    });

    it("should render the FiscalYear selector", () => {
        renderWithProviders(<ReportingPage />);
        expect(screen.getByLabelText("Fiscal Year")).toBeInTheDocument();
    });

    it("should render the PortfolioSummaryCards", () => {
        renderWithProviders(<ReportingPage />);
        expect(screen.getByTestId("portfolio-summary-cards")).toBeInTheDocument();
    });

    it("should render loading state when data is loading", () => {
        vi.mocked(useReportingPageData).mockReturnValue({
            ...mockDefaultHookReturn,
            isLoading: true
        });

        renderWithProviders(<ReportingPage />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
});
