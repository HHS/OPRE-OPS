import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AgreementSpendingLegend from "./AgreementSpendingLegend";

describe("AgreementSpendingLegend", () => {
    const mockAgreementTypes = [
        { type: "CONTRACT", label: "Contracts", total: 20000000, percent: "43", new: 10000000, continuing: 10000000 },
        { type: "PARTNER", label: "Partner", total: 15000000, percent: "33", new: 8000000, continuing: 7000000 },
        { type: "GRANT", label: "Grants", total: 8000000, percent: "17", new: 5000000, continuing: 3000000 },
        {
            type: "DIRECT_OBLIGATION",
            label: "Direct Oblig.",
            total: 3000000,
            percent: "7",
            new: 2000000,
            continuing: 1000000
        }
    ];

    it("renders all agreement type labels", () => {
        render(<AgreementSpendingLegend agreementTypes={mockAgreementTypes} />);

        expect(screen.getByText("Contracts")).toBeInTheDocument();
        expect(screen.getByText("Partner")).toBeInTheDocument();
        expect(screen.getByText("Grants")).toBeInTheDocument();
        expect(screen.getByText("Direct Oblig.")).toBeInTheDocument();
    });

    it("renders New and Cont. sub-rows", () => {
        render(<AgreementSpendingLegend agreementTypes={mockAgreementTypes} />);

        const newLabels = screen.getAllByText("New");
        const contLabels = screen.getAllByText("Cont.");
        expect(newLabels).toHaveLength(4);
        expect(contLabels).toHaveLength(4);
    });

    it("renders currency formatted total amounts with decimals", () => {
        render(<AgreementSpendingLegend agreementTypes={mockAgreementTypes} />);

        expect(screen.getByText("$20,000,000.00")).toBeInTheDocument();
        expect(screen.getByText("$15,000,000.00")).toBeInTheDocument();
        expect(screen.getAllByText("$8,000,000.00").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("$3,000,000.00").length).toBeGreaterThanOrEqual(1);
    });

    it("renders test ids for each type", () => {
        render(<AgreementSpendingLegend agreementTypes={mockAgreementTypes} />);

        expect(screen.getByTestId("agreement-spending-legend-CONTRACT")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-spending-legend-PARTNER")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-spending-legend-GRANT")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-spending-legend-DIRECT_OBLIGATION")).toBeInTheDocument();
    });

    it("returns null for empty agreement types", () => {
        render(<AgreementSpendingLegend agreementTypes={[]} />);
        expect(screen.queryByTestId("agreement-spending-legend")).not.toBeInTheDocument();
    });

    it("returns null for null agreement types", () => {
        render(<AgreementSpendingLegend agreementTypes={null} />);
        expect(screen.queryByTestId("agreement-spending-legend")).not.toBeInTheDocument();
    });
});
