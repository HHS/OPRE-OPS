import { render, screen } from "@testing-library/react";
import OpsAtAGlanceContent from "./OpsAtAGlanceContent";

describe("OpsAtAGlanceContent", () => {
    it("renders the heading and subtitle", () => {
        render(<OpsAtAGlanceContent />);

        expect(screen.getByRole("heading", { level: 2, name: "OPS at a Glance" })).toBeInTheDocument();
        expect(
            screen.getByText(
                "This is an overview of OPS development and current state including what you can use today, what we're working on, and what's coming up next."
            )
        ).toBeInTheDocument();
    });

    it("renders the roadmap status board", () => {
        render(<OpsAtAGlanceContent />);

        expect(screen.getByRole("heading", { level: 3, name: "Ready to Use" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "In Progress" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "Up Next / Later*" })).toBeInTheDocument();
    });
});
