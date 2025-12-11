import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AgreementMetaAccordion from "./AgreementMetaAccordion";

// Mock dependencies
vi.mock("../../UI/Term", () => ({
    default: ({ label, value, dataCy }) => (
        <div data-testid="term">
            <dt>{label}</dt>
            <dd data-cy={dataCy}>{value}</dd>
        </div>
    )
}));

describe("AgreementMetaAccordion", () => {
    const mockAgreement = {
        id: 1,
        name: "Test Agreement",
        description: "Test Description",
        agreement_type: "CONTRACT",
        contract_type: "FFP",
        contract_number: "XXXX000000001",
        service_requirement_type: "NON_SEVERABLE",
        procurement_shop: {
            id: 1,
            name: "Test Shop",
            abbr: "TS"
        },
        product_service_code: {
            id: 1,
            name: "Test PSC",
            naics: 12345,
            support_code: "R410"
        },
        agreement_reason: "RECOMPETE",
        vendor: "Test Vendor",
        project_officer_id: 1,
        team_members: [
            { id: 1, full_name: "John Doe" },
            { id: 2, full_name: "Jane Smith" }
        ],
        research_methodologies: [
            { id: 1, name: "Survey" },
            { id: 2, name: "Interview" }
        ],
        special_topics: [
            { id: 1, name: "Education" },
            { id: 2, name: "Healthcare" }
        ]
    };

    const defaultProps = {
        agreement: mockAgreement,
        res: null,
        cn: vi.fn(),
        convertCodeForDisplay: vi.fn((type, value) => value),
        instructions: "Test instructions",
        newAwardingEntity: null,
        isAgreementAwarded: false
    };

    it("renders basic agreement information", () => {
        render(<AgreementMetaAccordion {...defaultProps} />);

        expect(screen.getByText("Test Description")).toBeInTheDocument();
        expect(screen.getByText("Test Agreement")).toBeInTheDocument();
    });

    it("shows contract number when agreement is awarded", () => {
        const awardedProps = {
            ...defaultProps,
            isAgreementAwarded: true
        };

        render(<AgreementMetaAccordion {...awardedProps} />);

        expect(screen.getByText("Contract #")).toBeInTheDocument();
        expect(screen.getByText("XXXX000000001")).toBeInTheDocument();
    });

    it("does not show contract number when agreement is not awarded", () => {
        const nonAwardedProps = {
            ...defaultProps,
            isAgreementAwarded: false
        };

        render(<AgreementMetaAccordion {...nonAwardedProps} />);

        expect(screen.queryByText("Contract #")).not.toBeInTheDocument();
    });

    it("renders research methodologies with data-cy attributes", () => {
        render(<AgreementMetaAccordion {...defaultProps} />);

        expect(screen.getByText("Research Methodologies")).toBeInTheDocument();
        expect(screen.getByText("Survey")).toBeInTheDocument();
        expect(screen.getByText("Interview")).toBeInTheDocument();

        // Check for data-cy attributes
        const surveyElement = screen.getByText("Survey");
        expect(surveyElement).toHaveAttribute("data-cy", "agreement-meta-Survey");
    });

    it("renders special topics with data-cy attributes", () => {
        render(<AgreementMetaAccordion {...defaultProps} />);

        expect(screen.getByText("Special Topic/Populations")).toBeInTheDocument();
        expect(screen.getByText("Education")).toBeInTheDocument();
        expect(screen.getByText("Healthcare")).toBeInTheDocument();

        // Check for data-cy attributes
        const educationElement = screen.getByText("Education");
        expect(educationElement).toHaveAttribute("data-cy", "agreement-meta-Education");
    });

    it("applies correct CSS classes for more than three research methodologies", () => {
        const propsWithManyMethodologies = {
            ...defaultProps,
            agreement: {
                ...mockAgreement,
                research_methodologies: [
                    { id: 1, name: "Survey" },
                    { id: 2, name: "Interview" },
                    { id: 3, name: "Focus Group" },
                    { id: 4, name: "Observation" }
                ]
            }
        };

        render(<AgreementMetaAccordion {...propsWithManyMethodologies} />);

        const surveyElement = screen.getByText("Survey");
        expect(surveyElement).toHaveClass("grid-col-6");
    });

    it("applies correct CSS classes for three or fewer research methodologies", () => {
        const propsWithFewMethodologies = {
            ...defaultProps,
            agreement: {
                ...mockAgreement,
                research_methodologies: [
                    { id: 1, name: "Survey" },
                    { id: 2, name: "Interview" }
                ]
            }
        };

        render(<AgreementMetaAccordion {...propsWithFewMethodologies} />);

        const surveyElement = screen.getByText("Survey");
        expect(surveyElement).toHaveClass("grid-col-12");
    });
});
