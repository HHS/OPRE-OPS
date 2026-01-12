import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PortfolioFiscalYearSelect from "./PortfolioFiscalYearSelect";

// Mock the FiscalYear component
vi.mock("../../../../components/UI/FiscalYear", () => ({
    default: ({ fiscalYear, handleChangeFiscalYear }) => (
        <div data-testid="fiscal-year-component">
            <select
                data-testid="fiscal-year-select"
                value={fiscalYear}
                onChange={(e) => handleChangeFiscalYear(e.target.value)}
            >
                <option value="2023">FY 2023</option>
                <option value="2024">FY 2024</option>
                <option value="2025">FY 2025</option>
                <option value="2026">FY 2026</option>
            </select>
            <span data-testid="fiscal-year-display">FY {fiscalYear}</span>
        </div>
    )
}));

describe("PortfolioFiscalYearSelect", () => {
    const defaultProps = {
        fiscalYear: 2025,
        setSelectedFiscalYear: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders FiscalYear component", () => {
        render(<PortfolioFiscalYearSelect {...defaultProps} />);

        expect(screen.getByTestId("fiscal-year-component")).toBeInTheDocument();
    });

    it("passes fiscalYear prop to FiscalYear component", () => {
        render(<PortfolioFiscalYearSelect {...defaultProps} />);

        expect(screen.getByTestId("fiscal-year-display")).toHaveTextContent("FY 2025");
    });

    it("passes setSelectedFiscalYear as handleChangeFiscalYear to FiscalYear component", () => {
        render(<PortfolioFiscalYearSelect {...defaultProps} />);

        const select = screen.getByTestId("fiscal-year-select");
        fireEvent.change(select, { target: { value: "2026" } });

        expect(defaultProps.setSelectedFiscalYear).toHaveBeenCalledWith("2026");
    });

    it("renders with different fiscal year", () => {
        render(<PortfolioFiscalYearSelect {...defaultProps} fiscalYear={2023} />);

        expect(screen.getByTestId("fiscal-year-display")).toHaveTextContent("FY 2023");
    });

    it("calls setSelectedFiscalYear when fiscal year changes", () => {
        render(<PortfolioFiscalYearSelect {...defaultProps} />);

        const select = screen.getByTestId("fiscal-year-select");
        fireEvent.change(select, { target: { value: "2024" } });

        expect(defaultProps.setSelectedFiscalYear).toHaveBeenCalledWith("2024");
        expect(defaultProps.setSelectedFiscalYear).toHaveBeenCalledTimes(1);
    });

    it("updates when fiscalYear prop changes", () => {
        const { rerender } = render(<PortfolioFiscalYearSelect {...defaultProps} fiscalYear={2025} />);

        expect(screen.getByTestId("fiscal-year-display")).toHaveTextContent("FY 2025");

        rerender(<PortfolioFiscalYearSelect {...defaultProps} fiscalYear={2026} />);

        expect(screen.getByTestId("fiscal-year-display")).toHaveTextContent("FY 2026");
    });

    it("correctly reflects selected fiscal year in select element", () => {
        render(<PortfolioFiscalYearSelect {...defaultProps} fiscalYear={2025} />);

        const select = screen.getByTestId("fiscal-year-select");
        expect(select).toHaveValue("2025");
    });

    it("handles number fiscal year prop", () => {
        render(<PortfolioFiscalYearSelect {...defaultProps} fiscalYear={2025} />);

        expect(screen.getByTestId("fiscal-year-component")).toBeInTheDocument();
        expect(screen.getByTestId("fiscal-year-display")).toHaveTextContent("FY 2025");
    });

    it("maintains correct prop mapping to FiscalYear component", () => {
        const customProps = {
            fiscalYear: 2024,
            setSelectedFiscalYear: vi.fn()
        };

        render(<PortfolioFiscalYearSelect {...customProps} />);

        // Verify the FiscalYear component receives correct props
        const select = screen.getByTestId("fiscal-year-select");
        expect(select.value).toBe("2024");

        // Change the value
        fireEvent.change(select, { target: { value: "2026" } });

        // Verify the handler was called
        expect(customProps.setSelectedFiscalYear).toHaveBeenCalledWith("2026");
    });
});
