import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProjectAgreementSummaryCard } from "./ProjectAgreementSummaryCard";

describe("ProjectAgreementSummaryCard", () => {
    const defaultProps = {
        selectedResearchProject: { title: "Test Project" },
        selectedAgreement: { name: "Test Agreement" },
        selectedProcurementShop: { name: "Test Shop", fee: 0.02 },
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
        const shopName = screen.getByText(defaultProps.selectedProcurementShop.name);
        const feeRate = screen.getByText(`${defaultProps.selectedProcurementShop.fee * 100}%`);
        expect(shopName).toBeInTheDocument();
        expect(feeRate).toBeInTheDocument();
    });
});
