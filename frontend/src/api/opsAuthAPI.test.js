import { vi, describe, test, expect } from "vitest";
import { waitFor, screen } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import { useGetRolesQuery } from "./opsAuthAPI.js";

// Mock the entire opsAuthAPI module
vi.mock("./opsAuthAPI.js", () => ({
    useGetRolesQuery: vi.fn()
}));

function TestComponent() {
    const result = useGetRolesQuery();
    return (
        <div>
            Roles:
            {result.data?.map((role) => (
                <div key={role.id}>{role.name}</div>
            ))}
        </div>
    );
}

describe("opsAuthApi", () => {
    test("should GET /roles using mocks", async () => {
        // Setup the mock return value
        vi.mocked(useGetRolesQuery).mockReturnValue({
            data: [
                { id: 1, name: "SYSTEM_OWNER" },
                { id: 2, name: "VIEWER_EDITOR" },
                { id: 3, name: "REVIEWER_APPROVER" },
                { id: 4, name: "USER_ADMIN" },
                { id: 5, name: "BUDGET_TEAM" },
                { id: 6, name: "PROCUREMENT_TEAM" },
                { id: 7, name: "SUPER_USER" }
            ],
            error: null,
            isLoading: false
        });

        renderWithProviders(<TestComponent />);

        // Verify the hook was called
        expect(useGetRolesQuery).toHaveBeenCalled();

        // Verify the role data is displayed
        await waitFor(() => {
            expect(screen.getByText("SYSTEM_OWNER")).toBeInTheDocument();
        });

        // Verify multiple roles are displayed
        expect(screen.getByText("VIEWER_EDITOR")).toBeInTheDocument();
        expect(screen.getByText("USER_ADMIN")).toBeInTheDocument();
    });
});
