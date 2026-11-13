import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NO_DATA } from "../../../constants";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { agreement } from "../../../tests/data";
import AgreementMetaAccordion from "./AgreementMetaAccordion";

describe("AgreementMetaAccordion", () => {
    it("should render the component", () => {
        render(
            <AgreementMetaAccordion
                agreement={agreement}
                instructions="test instructions"
                projectOfficerName="John Doe"
                convertCodeForDisplay={convertCodeForDisplay}
            />
        );

        expect(screen.getByText("Review Agreement Details")).toBeInTheDocument();
        expect(screen.getByText("test instructions")).toBeInTheDocument();
        expect(screen.getByText("Contract #1: African American Child and Family Research Center")).toBeInTheDocument();
        expect(screen.getByText("Contract")).toBeInTheDocument();
        expect(screen.getByText("541690")).toBeInTheDocument();
        expect(screen.getByText("Other Scientific and Technical Consulting Services")).toBeInTheDocument();
        expect(screen.getByText("Recompete")).toBeInTheDocument();
        expect(screen.getByText("PSC")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Chris Fortunato")).toBeInTheDocument();
        expect(screen.getByText("Firm Fixed Price (FFP)")).toBeInTheDocument();
        expect(screen.getByText("Non-Severable")).toBeInTheDocument();
        expect(screen.getByText("AACFRC")).toBeInTheDocument();
    });

    it("should show NO_DATA when nickname is null", () => {
        const agreementWithoutNickname = {
            ...agreement,
            nick_name: null
        };

        render(
            <AgreementMetaAccordion
                agreement={agreementWithoutNickname}
                instructions="test instructions"
                projectOfficerName="John Doe"
                convertCodeForDisplay={convertCodeForDisplay}
            />
        );

        // Check for the nickname label and that TBD appears somewhere in the document
        expect(screen.getByText("Agreement Nickname or Acronym")).toBeInTheDocument();
        // Since we know the nickname is null, TBD should be displayed
        const allTBDs = screen.getAllByText(NO_DATA);
        expect(allTBDs.length).toBeGreaterThan(0);
    });

    it("should show NO_DATA when nickname is undefined", () => {
        const agreementWithoutNickname = {
            ...agreement,
            nick_name: undefined
        };

        render(
            <AgreementMetaAccordion
                agreement={agreementWithoutNickname}
                instructions="test instructions"
                projectOfficerName="John Doe"
                convertCodeForDisplay={convertCodeForDisplay}
            />
        );

        // Check for the nickname label and that TBD appears somewhere in the document
        expect(screen.getByText("Agreement Nickname or Acronym")).toBeInTheDocument();
        // Since we know the nickname is undefined, TBD should be displayed
        const allTBDs = screen.getAllByText(NO_DATA);
        expect(allTBDs.length).toBeGreaterThan(0);
    });

    describe("Negative AC — side-by-side Name/Nickname fields unchanged (issue #6144)", () => {
        it("renders the Agreement term as the raw full name and the nickname term as the raw nick_name — never a nickname-preferred value in either slot", () => {
            const nicknamedAgreement = {
                ...agreement,
                name: "Full Legal Title For Testing",
                nick_name: "FLT",
                display_name: "FLT"
            };

            const { container } = render(
                <AgreementMetaAccordion
                    agreement={nicknamedAgreement}
                    instructions="test instructions"
                    projectOfficerName="John Doe"
                    convertCodeForDisplay={convertCodeForDisplay}
                />
            );

            // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
            const agreementTerm = container.querySelector('[data-cy="agreement-meta-name"]');
            // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
            const nicknameTerm = container.querySelector('[data-cy="agreement-meta-nickname"]');

            expect(agreementTerm).toHaveTextContent("Full Legal Title For Testing");
            expect(nicknameTerm).toHaveTextContent("FLT");
            // The full title must never be swapped out for the nickname-preferred display_name.
            expect(agreementTerm).not.toHaveTextContent("FLT");
        });
    });

    describe("Division Directors and Team Leaders", () => {
        it("should display division director names when present", () => {
            render(
                <AgreementMetaAccordion
                    agreement={agreement}
                    instructions="test instructions"
                    projectOfficerName="John Doe"
                    convertCodeForDisplay={convertCodeForDisplay}
                />
            );

            expect(screen.getByText("Division Director(s)")).toBeInTheDocument();
            expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        });

        it("should display team leader names when present", () => {
            render(
                <AgreementMetaAccordion
                    agreement={agreement}
                    instructions="test instructions"
                    projectOfficerName="John Doe"
                    convertCodeForDisplay={convertCodeForDisplay}
                />
            );

            expect(screen.getByText("Team Leader(s)")).toBeInTheDocument();
            expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
        });

        it("should show NO_DATA when division_directors is empty", () => {
            const agreementWithoutDDs = {
                ...agreement,
                division_directors: []
            };

            render(
                <AgreementMetaAccordion
                    agreement={agreementWithoutDDs}
                    instructions="test instructions"
                    projectOfficerName="John Doe"
                    convertCodeForDisplay={convertCodeForDisplay}
                />
            );

            expect(screen.getByText("Division Director(s)")).toBeInTheDocument();
            expect(screen.getAllByText(NO_DATA).length).toBeGreaterThan(0);
        });

        it("should show NO_DATA when team_leaders is empty", () => {
            const agreementWithoutTLs = {
                ...agreement,
                team_leaders: []
            };

            render(
                <AgreementMetaAccordion
                    agreement={agreementWithoutTLs}
                    instructions="test instructions"
                    projectOfficerName="John Doe"
                    convertCodeForDisplay={convertCodeForDisplay}
                />
            );

            expect(screen.getByText("Team Leader(s)")).toBeInTheDocument();
            expect(screen.getAllByText(NO_DATA).length).toBeGreaterThan(0);
        });
    });

    describe("Contract Number conditional rendering", () => {
        it("should show contract number for awarded CONTRACT agreements", () => {
            const contractAgreement = {
                ...agreement,
                agreement_type: "CONTRACT",
                contract_number: "TEST123",
                agreement_reason: "RECOMPETE" // makes it awarded
            };

            render(
                <AgreementMetaAccordion
                    agreement={contractAgreement}
                    instructions="test instructions"
                    projectOfficerName="John Doe"
                    convertCodeForDisplay={convertCodeForDisplay}
                    isAgreementAwarded={true}
                />
            );

            expect(screen.getByText("Contract #")).toBeInTheDocument();
            expect(screen.getByText("TEST123")).toBeInTheDocument();
        });

        it("should show contract number for awarded AA agreements", () => {
            const aaAgreement = {
                ...agreement,
                agreement_type: "AA",
                contract_number: "AA456",
                agreement_reason: "RECOMPETE"
            };

            render(
                <AgreementMetaAccordion
                    agreement={aaAgreement}
                    instructions="test instructions"
                    projectOfficerName="John Doe"
                    convertCodeForDisplay={convertCodeForDisplay}
                    isAgreementAwarded={true}
                />
            );

            expect(screen.getByText("Contract #")).toBeInTheDocument();
            expect(screen.getByText("AA456")).toBeInTheDocument();
        });

        it("should NOT show contract number for non-developed agreement types even when awarded", () => {
            const grantAgreement = {
                ...agreement,
                agreement_type: "GRANT",
                contract_number: "GRANT123",
                agreement_reason: "RECOMPETE"
            };

            render(
                <AgreementMetaAccordion
                    agreement={grantAgreement}
                    instructions="test instructions"
                    projectOfficerName="John Doe"
                    convertCodeForDisplay={convertCodeForDisplay}
                    isAgreementAwarded={true}
                />
            );

            expect(screen.queryByText("Contract #")).not.toBeInTheDocument();
            expect(screen.queryByText("GRANT123")).not.toBeInTheDocument();
        });

        it("should NOT show Procurement Shop for GRANT agreements", () => {
            const grantAgreement = {
                ...agreement,
                agreement_type: "GRANT",
                procurement_shop: { abbr: "PSC", fee: 0 }
            };

            render(
                <AgreementMetaAccordion
                    agreement={grantAgreement}
                    instructions="test instructions"
                    projectOfficerName="John Doe"
                    convertCodeForDisplay={convertCodeForDisplay}
                />
            );

            expect(screen.queryByText("Procurement Shop")).not.toBeInTheDocument();
        });

        it("should NOT show contract number for non-awarded CONTRACT agreements", () => {
            const nonAwardedAgreement = {
                ...agreement,
                agreement_type: "CONTRACT",
                contract_number: "TEST123",
                agreement_reason: "NEW_REQ" // not awarded
            };

            render(
                <AgreementMetaAccordion
                    agreement={nonAwardedAgreement}
                    instructions="test instructions"
                    projectOfficerName="John Doe"
                    convertCodeForDisplay={convertCodeForDisplay}
                    isAgreementAwarded={false}
                />
            );

            expect(screen.queryByText("Contract #")).not.toBeInTheDocument();
        });

        it("should work with agreement.is_awarded property", () => {
            const awardedContractAgreement = {
                ...agreement,
                agreement_type: "CONTRACT",
                contract_number: "IS_AWARDED_PROP_TEST",
                is_awarded: true,
                agreement_reason: "RECOMPETE"
            };

            render(
                <AgreementMetaAccordion
                    agreement={awardedContractAgreement}
                    instructions="test instructions"
                    projectOfficerName="John Doe"
                    convertCodeForDisplay={convertCodeForDisplay}
                    isAgreementAwarded={awardedContractAgreement.is_awarded}
                />
            );

            expect(screen.getByText("Contract #")).toBeInTheDocument();
            expect(screen.getByText("IS_AWARDED_PROP_TEST")).toBeInTheDocument();
        });
    });

    describe("award information (#3269)", () => {
        const awardRecord = {
            award_date: "2024-06-26",
            award_amount: "1500000.00",
            contract_number: "CT-1234567890",
            vendor_name: "Flexion Inc.",
            vendor_unique_entity_id: "123456789",
            vendor_type: "SMALL_BUSINESS"
        };
        const renderAwarded = (props = {}) =>
            render(
                <AgreementMetaAccordion
                    agreement={{ ...agreement, contract_number: "CT-1234567890", vendor: "Flexion Inc." }}
                    instructions="test instructions"
                    projectOfficerName="John Doe"
                    convertCodeForDisplay={convertCodeForDisplay}
                    isAgreementAwarded={true}
                    {...props}
                />
            );

        it("shows the award date and vendor details from the award record, and the given Award Total", () => {
            renderAwarded({ awardRecord, awardTotal: 1234567.5 });

            for (const label of ["Award Date", "Award Total", "Vendor ID", "Vendor Type"]) {
                expect(screen.getByText(label)).toBeInTheDocument();
            }
            expect(screen.getByText("6/26/2024")).toBeInTheDocument();
            // The Award Total is the page's agreement total, not the award record's Award Amount (UX).
            expect(screen.getByText("$1,234,567.50")).toBeInTheDocument();
            expect(screen.queryByText("$1,500,000.00")).not.toBeInTheDocument();
            expect(screen.getByText("123456789")).toBeInTheDocument();
            expect(screen.getByText("Small Business")).toBeInTheDocument();
            // Contract # and Vendor move to the left column with the award information, not shown twice.
            expect(screen.getAllByText("Contract #")).toHaveLength(1);
            expect(screen.getAllByText("CT-1234567890")).toHaveLength(1);
            expect(screen.getAllByText("Vendor")).toHaveLength(1);
            expect(screen.getAllByText("Flexion Inc.")).toHaveLength(1);
        });

        it("shows TBD for award fields the record doesn't have", () => {
            const { unmount } = renderAwarded();
            const withoutAward = screen.queryAllByText(NO_DATA).length;
            unmount();

            renderAwarded({ awardRecord: { award_date: null, award_amount: null, vendor_type: null } });

            // Award Date, Award Total, Vendor ID and Vendor Type; Contract # and Vendor fall back to the agreement.
            expect(screen.queryAllByText(NO_DATA)).toHaveLength(withoutAward + 4);
            expect(screen.getByText("CT-1234567890")).toBeInTheDocument();
            expect(screen.getByText("Flexion Inc.")).toBeInTheDocument();
        });

        it("leaves the details as they were without an award record", () => {
            renderAwarded();

            expect(screen.queryByText("Award Date")).not.toBeInTheDocument();
            expect(screen.queryByText("Award Total")).not.toBeInTheDocument();
            expect(screen.getByText("CT-1234567890")).toBeInTheDocument();
            expect(screen.getByText("Flexion Inc.")).toBeInTheDocument();
        });
    });
});
