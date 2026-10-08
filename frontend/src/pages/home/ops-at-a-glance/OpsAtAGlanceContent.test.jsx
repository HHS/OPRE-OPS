import { render, screen } from "@testing-library/react";
import OpsAtAGlanceContent from "./OpsAtAGlanceContent";

describe("OpsAtAGlanceContent", () => {
    it("renders the heading and subtitle", () => {
        render(<OpsAtAGlanceContent />);

        expect(screen.getByRole("heading", { level: 2, name: "OPS at a Glance" })).toBeInTheDocument();
        expect(screen.getByText(/This is an overview of OPS development/)).toBeInTheDocument();
    });

    it("renders the roadmap status board", () => {
        render(<OpsAtAGlanceContent />);

        expect(screen.getByRole("heading", { level: 3, name: "Done" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "Currently Developing" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "Not Started Yet *" })).toBeInTheDocument();
    });
});
