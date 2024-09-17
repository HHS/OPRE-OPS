import { server } from "../../../tests/mocks";
import { waitFor, screen } from "@testing-library/react";
// import { useGetAgreementsQuery } from "./opsAPI";
import { renderWithProviders } from "../../../test-utils";
import CanList from "./CanList";
import { Router } from "react-router-dom";
import { Provider } from "react-redux";
import store from "../../../store";

server.listen();
// TODO: Fix this test
describe.skip("opsApi", () => {
    test("should GET /cans using mocks", async () => {
        const { container } = renderWithProviders(<TestComponent />);
        screen.debug();
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
