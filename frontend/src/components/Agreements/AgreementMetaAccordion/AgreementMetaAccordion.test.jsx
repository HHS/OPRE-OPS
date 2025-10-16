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
        expect(screen.getByText("Test Nickname")).toBeInTheDocument();
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
});
