import { render, screen } from "@testing-library/react";
import OpsAtAGlanceContent from "./OpsAtAGlanceContent";

describe("OpsAtAGlanceContent", () => {
    it("renders a placeholder heading", () => {
        render(<OpsAtAGlanceContent />);

        expect(screen.getByRole("heading", { level: 2, name: "OPS at a Glance" })).toBeInTheDocument();
    });
});
