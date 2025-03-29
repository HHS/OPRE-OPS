import { server } from "../tests/mocks";
import { waitFor, screen } from "@testing-library/react";
import { useGetAgreementsQuery } from "./opsAPI";
import { renderWithProviders } from "../test-utils";
import { vi } from "vitest";

// Mock data
const mockAgreements = [
    {
        id: 1,
        name: "Agreement 1"
        // ... add other required fields
    }
];

// Mock the API response
vi.mock("./opsAPI", async () => {
    const actual = await vi.importActual("./opsAPI");
    return {
        ...actual,
        useGetAgreementsQuery: () => ({
            data: mockAgreements,
            isLoading: false,
            isSuccess: true
        })
    };
});

describe("opsApi", () => {
    beforeAll(() => server.listen());
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

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
    const { data = [], isLoading } = useGetAgreementsQuery();

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            Agreements:
            {data.map((agreement) => (
                <div key={agreement.id}>{agreement.name}</div>
            ))}
        </div>
    );
}
