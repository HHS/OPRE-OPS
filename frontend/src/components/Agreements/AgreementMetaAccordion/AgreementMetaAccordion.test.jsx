import { render, screen } from "@testing-library/react";
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

        expect(screen.getByText("Agreement Details")).toBeInTheDocument();
        expect(screen.getByText("test instructions")).toBeInTheDocument();
        expect(screen.getByText("Contract #1: African American Child and Family Research Center")).toBeInTheDocument();
        expect(screen.getByText("Contract")).toBeInTheDocument();
        expect(screen.getByText("541690")).toBeInTheDocument();
        expect(screen.getByText("Other Scientific and Technical Consulting Services")).toBeInTheDocument();
        expect(screen.getByText("Recompete")).toBeInTheDocument();
        expect(screen.getByText("PSC - Fee Rate: 0%")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Chris Fortunato")).toBeInTheDocument();
    });
});
