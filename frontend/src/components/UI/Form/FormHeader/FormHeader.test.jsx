import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FormHeader from "./FormHeader";

describe("FormHeader", () => {
    it("renders the heading and details", () => {
        render(
            <FormHeader
                heading="Edit Grant Numbers"
                details="Some details"
            />
        );

        expect(screen.getByRole("heading", { name: "Edit Grant Numbers" })).toBeInTheDocument();
        expect(screen.getByText("Some details")).toBeInTheDocument();
    });

    it("renders actions content alongside the heading when provided", () => {
        render(
            <FormHeader
                heading="Edit Grant Numbers"
                actions={<span>Editing...</span>}
            />
        );

        expect(screen.getByText("Editing...")).toBeInTheDocument();
    });

    it("does not leak a literal 'false' into the DOM when actions is falsy", () => {
        render(
            <FormHeader
                heading="Edit Grant Numbers"
                actions={false}
            />
        );

        expect(screen.getByRole("heading", { name: "Edit Grant Numbers" })).toBeInTheDocument();
        expect(screen.queryByText("false")).not.toBeInTheDocument();
    });
});
