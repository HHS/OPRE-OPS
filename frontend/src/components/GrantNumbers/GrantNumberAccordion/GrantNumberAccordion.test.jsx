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
});
