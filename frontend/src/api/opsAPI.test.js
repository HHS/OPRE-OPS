import { server } from "../tests/mocks";
import { waitFor, screen } from "@testing-library/react";
import { useGetAgreementsQuery } from "./opsAPI";
import { renderWithProviders } from "../test-utils";

server.listen();

describe("opsApi", () => {
    test("should GET /agreements using mocks", async () => {
        const { container } = renderWithProviders(<TestComponent />);

        await waitFor(() => {
            expect(container).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText("Agreement 1")).toBeInTheDocument();
        });
    });
});

function TestComponent() {
    const result = useGetAgreementsQuery();
    return (
        <div>
            Agreements:
            {result.data?.map((agreement) => (
                <div key={agreement.id}>{agreement.name}</div>
            ))}
        </div>
    );
}
