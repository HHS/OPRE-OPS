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

vi.mock("../../components/Agreements/AgreementSpendingCards", () => ({
    default: () => <div data-testid="agreement-spending-cards">Spending Cards</div>
}));

vi.mock("../../components/Reporting/ReportingCountCard", () => ({
    default: () => <div data-testid="reporting-summary-card">Reporting Summary</div>
}));

vi.mock("../../components/Agreements/AgreementSpendingSummaryCard", () => ({
    default: () => <div data-testid="agreement-spending-summary-card">Spending Summary</div>
}));

vi.mock("../../components/BudgetLineItems/BLIStatusSummaryCard", () => ({
    default: () => <div data-testid="bli-status-summary-card">BLI Status Summary</div>
}));

const mockDefaultHookReturn = {
    fiscalYear: 2026,
    selectedFiscalYear: "2026",
    setSelectedFiscalYear: vi.fn(),
    totalFunding: 15000000,
    totalSpending: 8000000,
    portfoliosWithFunding: [{ id: 1, name: "Test Portfolio" }],
    agreementSpendingData: { total_spending: 5000000, agreement_types: [] },
    reportingSummaryData: { projects: { total: 10, types: [] }, agreements: { total: 20, types: [] } },
    bliStatusSpending: { draft: 1500000, planned: 2500000, inExecution: 1500000, obligated: 4000000, total: 9500000 },
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

    it("should render the AgreementSpendingCards", () => {
        renderWithProviders(<ReportingPage />);
        expect(screen.getByTestId("agreement-spending-cards")).toBeInTheDocument();
    });

    it("should render the ReportingCountCard", () => {
        renderWithProviders(<ReportingPage />);
        expect(screen.getByTestId("reporting-summary-card")).toBeInTheDocument();
    });

    it("should render the AgreementSpendingSummaryCard", () => {
        renderWithProviders(<ReportingPage />);
        expect(screen.getByTestId("agreement-spending-summary-card")).toBeInTheDocument();
    });

    it("should render the BLIStatusSummaryCard", () => {
        renderWithProviders(<ReportingPage />);
        expect(screen.getByTestId("bli-status-summary-card")).toBeInTheDocument();
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
