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
});
