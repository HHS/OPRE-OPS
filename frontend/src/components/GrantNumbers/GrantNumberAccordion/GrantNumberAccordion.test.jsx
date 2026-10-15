import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import GrantNumberAccordion from "./GrantNumberAccordion";

describe("GrantNumberAccordion", () => {
    it("renders the grant number as the heading", () => {
        render(
            <GrantNumberAccordion grantNumberNumber={3}>
                <div>child content</div>
            </GrantNumberAccordion>
        );
        expect(screen.getByText("Grant 3")).toBeInTheDocument();
        expect(screen.getByText("child content")).toBeInTheDocument();
    });

    it("renders the unassociated heading for grant number 0", () => {
        render(
            <GrantNumberAccordion grantNumberNumber={0}>
                <div>child content</div>
            </GrantNumberAccordion>
        );
        expect(screen.getByText("BLs not associated with a Grant Number")).toBeInTheDocument();
    });

    it("renders the grant number with a total count when totalGrantNumbers is provided", () => {
        render(
            <GrantNumberAccordion
                grantNumberNumber={1}
                totalGrantNumbers={2}
            >
                <div>child content</div>
            </GrantNumberAccordion>
        );
        expect(screen.getByText("Grant 1 of 2")).toBeInTheDocument();
    });

    it("does not append a total count for the unassociated bucket even when totalGrantNumbers is provided", () => {
        render(
            <GrantNumberAccordion
                grantNumberNumber={0}
                totalGrantNumbers={2}
            >
                <div>child content</div>
            </GrantNumberAccordion>
        );
        expect(screen.getByText("BLs not associated with a Grant Number")).toBeInTheDocument();
    });

    it("renders the error border on the heading when isError is true", () => {
        render(
            <GrantNumberAccordion
                grantNumberNumber={0}
                isError={true}
            >
                <div>child content</div>
            </GrantNumberAccordion>
        );
        const heading = screen.getByRole("heading", { level: 3 });
        expect(heading).toHaveClass("border-2px");
        expect(heading).toHaveClass("border-secondary-dark");
    });

    it("does not render the error border by default", () => {
        render(
            <GrantNumberAccordion grantNumberNumber={0}>
                <div>child content</div>
            </GrantNumberAccordion>
        );
        const heading = screen.getByRole("heading", { level: 3 });
        expect(heading).not.toHaveClass("border-2px");
        expect(heading).not.toHaveClass("border-secondary-dark");
    });

    it("renders GrantNumberMetadata when withMetadata is true and grantNumberNumber is non-zero", () => {
        render(
            <GrantNumberAccordion
                grantNumberNumber={1}
                withMetadata={true}
                periodStart="2026-01-01"
                periodEnd="2026-12-31"
                description="Test description"
            >
                <div>child content</div>
            </GrantNumberAccordion>
        );
        expect(screen.getByText("Period of Performance - Start")).toBeInTheDocument();
        expect(screen.getByText("Period of Performance - End")).toBeInTheDocument();
        expect(screen.getByText("Grantee Recipient")).toBeInTheDocument();
        expect(screen.getByText("Organization Type")).toBeInTheDocument();
        expect(screen.getByText("State")).toBeInTheDocument();
        // Grantee Recipient, Organization Type, and State are award-time fields with no data here,
        // so all three fall back to "TBD".
        expect(screen.getAllByText("TBD")).toHaveLength(3);
        expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("renders award-time field values when provided instead of the TBD fallback", () => {
        render(
            <GrantNumberAccordion
                grantNumberNumber={1}
                withMetadata={true}
                periodStart="2026-01-01"
                periodEnd="2026-12-31"
                granteeRecipient="University of Example"
                organizationType="Educational Institution"
                state="NY"
                description="Test description"
            >
                <div>child content</div>
            </GrantNumberAccordion>
        );
        expect(screen.getByText("University of Example")).toBeInTheDocument();
        expect(screen.getByText("Educational Institution")).toBeInTheDocument();
        expect(screen.getByText("NY")).toBeInTheDocument();
        // No award-time field falls back, so "TBD" should not appear.
        expect(screen.queryByText("TBD")).not.toBeInTheDocument();
    });

    it("does not render GrantNumberMetadata for the unassociated bucket even when withMetadata is true", () => {
        render(
            <GrantNumberAccordion
                grantNumberNumber={0}
                withMetadata={true}
                periodStart="2026-01-01"
                periodEnd="2026-12-31"
                description="Test description"
            >
                <div>child content</div>
            </GrantNumberAccordion>
        );
        expect(screen.queryByText("Period of Performance - Start")).not.toBeInTheDocument();
        expect(screen.queryByText("Period of Performance - End")).not.toBeInTheDocument();
    });

    it("does not render GrantNumberMetadata when withMetadata is false", () => {
        render(
            <GrantNumberAccordion
                grantNumberNumber={1}
                withMetadata={false}
                periodStart="2026-01-01"
            >
                <div>child content</div>
            </GrantNumberAccordion>
        );
        expect(screen.queryByText("Period of Performance - Start")).not.toBeInTheDocument();
    });
});
