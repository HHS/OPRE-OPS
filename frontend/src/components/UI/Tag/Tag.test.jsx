import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Tag from "./Tag";

describe("Tag", () => {
    it("applies wrapping-friendly layout styles for long content", () => {
        render(<Tag text="Chris Fortunatoasdljkasjd" />);

        expect(screen.getByText("Chris Fortunatoasdljkasjd")).toHaveStyle({
            width: "auto",
            maxWidth: "100%",
            height: "auto",
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            display: "inline-block"
        });
    });

    it("preserves flex display for filter-style tags", () => {
        render(
            <Tag
                className="bg-brand-primary-light text-brand-primary-dark display-flex flex-align-center"
                dataTestId="filter-tag"
            >
                <span>Long filter tag</span>
                <button type="button">Remove</button>
            </Tag>
        );

        expect(screen.getByTestId("filter-tag")).toHaveStyle({
            display: "flex"
        });
    });

    it("preserves inline-flex display when requested", () => {
        render(<Tag className="bg-brand-secondary display-inline-flex">Active</Tag>);

        expect(screen.getByText("Active")).toHaveStyle({
            display: "inline-flex"
        });
    });
});
