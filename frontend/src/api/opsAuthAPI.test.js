import { server } from "../tests/mocks";
import { waitFor, screen } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import { useGetRolesQuery } from "./opsAuthAPI.js";

server.listen();

describe("opsAuthApi", () => {
    test("should GET /roles using mocks", async () => {
        const { container } = renderWithProviders(<TestComponent />);

        await waitFor(() => {
            expect(container).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText("SYSTEM_OWNER")).toBeInTheDocument();
        });
    });
});

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
