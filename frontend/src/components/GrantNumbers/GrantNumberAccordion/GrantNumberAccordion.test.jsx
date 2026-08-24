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
        expect(screen.getByText("Description")).toBeInTheDocument();
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
