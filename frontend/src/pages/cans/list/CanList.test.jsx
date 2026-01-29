import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../test-utils";
import { server } from "../../../tests/mocks";
import CanList from "./CanList";

server.listen();
// TODO: Fix this test
describe.todo("opsApi", () => {
    test("should GET /cans using mocks", async () => {
        const { container } = renderWithProviders(<TestComponent />);

        await waitFor(() => {
            expect(container).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText("G99HRF2")).toBeInTheDocument();
        });
    });
});

function TestComponent() {
    return <CanList />;
}
