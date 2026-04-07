import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectAgreementBLICard from "./ProjectAgreementBLICard";

describe("ProjectAgreementBLICard", () => {
    it("groups AA and IAA into a single Partner tag", () => {
        render(
            <ProjectAgreementBLICard
                fiscalYear={2026}
                projects={[]}
                budgetLines={[]}
                agreements={[
                    { type: "AA", count: 1 },
                    { type: "IAA", count: 2 },
                    { type: "CONTRACT", count: 3 }
                ]}
            />
        );

        expect(screen.getByText("3 Partner")).toBeInTheDocument();
        expect(screen.queryByText("1 Partner - AA")).not.toBeInTheDocument();
        expect(screen.queryByText("2 Partner - IAA")).not.toBeInTheDocument();
    });

    it("renders agreement types in the expected order", () => {
        render(
            <ProjectAgreementBLICard
                fiscalYear={2026}
                projects={[]}
                budgetLines={[]}
                agreements={[
                    { type: "DIRECT_OBLIGATION", count: 1 },
                    { type: "IAA", count: 1 },
                    { type: "GRANT", count: 1 },
                    { type: "CONTRACT", count: 1 }
                ]}
            />
        );

        const contractTag = screen.getByText("1 Contract");
        const grantTag = screen.getByText("1 Grant");
        const partnerTag = screen.getByText("1 Partner");
        const directObligationTag = screen.getByText("1 Direct Obligation");

        expect(contractTag.compareDocumentPosition(grantTag)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(grantTag.compareDocumentPosition(partnerTag)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(partnerTag.compareDocumentPosition(directObligationTag)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
});
