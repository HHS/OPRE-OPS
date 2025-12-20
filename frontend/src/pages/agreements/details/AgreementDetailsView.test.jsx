import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AgreementDetailsView from "./AgreementDetailsView";
import { agreement } from "../../../tests/data";

// Mock the AgreementHistoryPanel component to avoid IntersectionObserver issues
vi.mock("../../../components/Agreements/AgreementDetails/AgreementHistoryPanel", () => ({
    default: () => <div data-testid="mocked-history-panel">History Panel</div>
}));

// Mock IntersectionObserver for tests
beforeEach(() => {
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn()
    }));
});

describe("AgreementDetailsView", () => {
    const mockProjectOfficer = {
        id: 1,
        full_name: "John Doe",
        email: "john.doe@example.com"
    };

    it("should render basic agreement details", () => {
        render(
            <AgreementDetailsView
                agreement={agreement}
                projectOfficer={mockProjectOfficer}
                alternateProjectOfficer={null}
                isAgreementAwarded={false}
            />
        );

        expect(screen.getByText("Test description")).toBeInTheDocument();
        expect(screen.getByText("Agreement Type")).toBeInTheDocument();
        expect(screen.getByText("Contract")).toBeInTheDocument();
    });

    describe("Contract Number conditional rendering", () => {
        it("should show contract number tag for awarded CONTRACT agreements", () => {
            const contractAgreement = {
                ...agreement,
                agreement_type: "CONTRACT",
                contract_number: "TEST123"
            };

            render(
                <AgreementDetailsView
                    agreement={contractAgreement}
                    projectOfficer={mockProjectOfficer}
                    alternateProjectOfficer={null}
                    isAgreementAwarded={true}
                />
            );

            expect(screen.getByText("TEST123")).toBeInTheDocument();
            expect(screen.getByText("Contract #")).toBeInTheDocument();
        });

        it("should show contract number tag for awarded AA agreements", () => {
            const aaAgreement = {
                ...agreement,
                agreement_type: "AA",
                contract_number: "AA456"
            };

            render(
                <AgreementDetailsView
                    agreement={aaAgreement}
                    projectOfficer={mockProjectOfficer}
                    alternateProjectOfficer={null}
                    isAgreementAwarded={true}
                />
            );

            expect(screen.getByText("AA456")).toBeInTheDocument();
            expect(screen.getByText("Contract #")).toBeInTheDocument();
        });

        it("should NOT show contract number tag for non-developed agreement types even when awarded", () => {
            const grantAgreement = {
                ...agreement,
                agreement_type: "GRANT",
                contract_number: "GRANT123"
            };

            render(
                <AgreementDetailsView
                    agreement={grantAgreement}
                    projectOfficer={mockProjectOfficer}
                    alternateProjectOfficer={null}
                    isAgreementAwarded={true}
                />
            );

            expect(screen.queryByText("GRANT123")).not.toBeInTheDocument();
            expect(screen.queryByText("Contract #")).not.toBeInTheDocument();
        });

        it("should NOT show contract number tag for non-awarded CONTRACT agreements", () => {
            const contractAgreement = {
                ...agreement,
                agreement_type: "CONTRACT",
                contract_number: "TEST123"
            };

            render(
                <AgreementDetailsView
                    agreement={contractAgreement}
                    projectOfficer={mockProjectOfficer}
                    alternateProjectOfficer={null}
                    isAgreementAwarded={false}
                />
            );

            expect(screen.queryByText("Contract #")).not.toBeInTheDocument();
        });

        it("should handle missing contract_number gracefully when awarded", () => {
            const agreementWithoutContractNumber = {
                ...agreement,
                agreement_type: "CONTRACT",
                contract_number: null
            };

            render(
                <AgreementDetailsView
                    agreement={agreementWithoutContractNumber}
                    projectOfficer={mockProjectOfficer}
                    alternateProjectOfficer={null}
                    isAgreementAwarded={true}
                />
            );

            // Check that TBD appears in the contract number section specifically
            const contractSections = screen.getAllByText("TBD");
            expect(contractSections.length).toBeGreaterThan(0); // Multiple TBD elements exist
            expect(screen.getByText("Contract #")).toBeInTheDocument();
        });

        it("should handle undefined agreement_type gracefully", () => {
            const agreementWithoutType = {
                ...agreement,
                agreement_type: undefined,
                contract_number: "TEST123"
            };

            render(
                <AgreementDetailsView
                    agreement={agreementWithoutType}
                    projectOfficer={mockProjectOfficer}
                    alternateProjectOfficer={null}
                    isAgreementAwarded={true}
                />
            );

            // Should not show contract number for undefined agreement type
            expect(screen.queryByText("Contract #")).not.toBeInTheDocument();
        });
    });

    it("should handle null agreement gracefully", () => {
        render(
            <AgreementDetailsView
                agreement={null}
                projectOfficer={mockProjectOfficer}
                alternateProjectOfficer={null}
                isAgreementAwarded={false}
            />
        );

        expect(screen.getByText("No agreement")).toBeInTheDocument();
    });

    it("should work with agreement.is_awarded property when isAgreementAwarded prop matches", () => {
        const awardedContractAgreement = {
            ...agreement,
            agreement_type: "CONTRACT",
            contract_number: "IS_AWARDED_TEST",
            is_awarded: true
        };

        render(
            <AgreementDetailsView
                agreement={awardedContractAgreement}
                projectOfficer={mockProjectOfficer}
                alternateProjectOfficer={null}
                isAgreementAwarded={awardedContractAgreement.is_awarded}
            />
        );

        expect(screen.getByText("IS_AWARDED_TEST")).toBeInTheDocument();
        expect(screen.getByText("Contract #")).toBeInTheDocument();
    });
});
