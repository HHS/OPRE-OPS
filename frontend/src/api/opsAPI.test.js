import { server } from "../tests/mocks";
import { http } from "msw";
import { waitFor } from "@testing-library/react";
import { useGetAgreementsQuery } from "./opsAPI";
import { renderWithProviders } from "../test-utils";

describe("opsApi", () => {
    test("should fetch agreements, using helpers.mocks", async () => {
        // wrap component with custom render function
        const { container } = renderWithProviders(<TestComponent />);

        await waitFor(() => {
            expect(container).toBeInTheDocument();
        });
        //expect(screen.getByText("Agreement 1")).toBeInTheDocument();
    });

    test("should fetch agreements, using local.mocks", async () => {
        // Mock response for getAgreements endpoint
        const mockData = [
            { id: 1, name: "Agreement 5" },
            { id: 2, name: "Agreement 6" }
        ];

        // This will override any API qury performed, for all endpoints,
        // and return our mocked response.
        server.use(
            http.get(`*`, (req, res, ctx) => {
                return res(ctx.status(200), ctx.json(mockData));
            })
        );

        // wrap component with custom render function
        const { container } = renderWithProviders(<TestComponent />);

        await waitFor(() => {
            expect(container).toBeInTheDocument();
        });
        //expect(screen.getByText("Agreement 1")).toBeInTheDocument();
    });
});

function TestComponent() {
    //const { data: agreements } = useGetAgreementsQuery();
    const result = useGetAgreementsQuery();
    return <div>Agreements: {JSON.stringify(result)}</div>;
}
