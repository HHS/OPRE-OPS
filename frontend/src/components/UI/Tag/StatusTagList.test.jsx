import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatusTagList from "./StatusTagList";

describe("StatusTagList - PLANNED_MOD status", () => {
    it("renders PLANNED_MOD tag when counts include it", () => {
        render(
            <StatusTagList
                countsByStatus={{ PLANNED_MOD: 2 }}
                includeDrafts={false}
            />
        );
        expect(screen.getByText(/Planned Mod/i)).toBeInTheDocument();
    });

    it("renders PLANNED_MOD with count", () => {
        render(
            <StatusTagList
                countsByStatus={{ PLANNED_MOD: 3 }}
                includeDrafts={false}
            />
        );
        expect(screen.getByText(/3 Planned Mod/i)).toBeInTheDocument();
    });
});
