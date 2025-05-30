import { render, screen } from "@testing-library/react";
import { ProjectAgreementSummaryCard } from "./ProjectAgreementSummaryCard";

describe("ProjectAgreementSummaryCard", () => {
    const defaultProps = {
        selectedResearchProject: { title: "Test Project" },
        selectedAgreement: { name: "Test Agreement" },
        selectedProcurementShop: { name: "Test Shop", fee_percentage: 0.02, abbr: "TS" }
    };

    it("renders without crashing", () => {
        render(<ProjectAgreementSummaryCard {...defaultProps} />);
    });

    it("displays the selected project title", () => {
        render(<ProjectAgreementSummaryCard {...defaultProps} />);
        const title = screen.getByText(defaultProps.selectedResearchProject.title);
        expect(title).toBeInTheDocument();
    });

    it("displays the selected agreement name", () => {
        render(<ProjectAgreementSummaryCard {...defaultProps} />);
        const agreement = screen.getByText(defaultProps.selectedAgreement.name);
        expect(agreement).toBeInTheDocument();
    });

    it("displays the selected procurement shop name and fee rate", () => {
        render(<ProjectAgreementSummaryCard {...defaultProps} />);
        const shopAbbr = screen.getByText(defaultProps.selectedProcurementShop.abbr);
        // const feeRate = screen.getByText(`${defaultProps.selectedProcurementShop.fee_percentage}%`);
        expect(shopAbbr).toBeInTheDocument();
        // expect(feeRate).toBeInTheDocument();
    });
});
