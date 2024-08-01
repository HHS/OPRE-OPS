import { fireEvent, screen, waitFor } from "@testing-library/react";
import UserInfo from "./UserInfo";
import { renderWithProviders } from "../../../test-utils.js";
import { server } from "../../../tests/mocks.js";

// TODO: use: https://reactjs.org/docs/test-utils.html#act to work properly
describe("UserInfo", () => {
    beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    test("renders correctly (read only)", async () => {
        const user = {
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["admin"]
        };
        const { container } = renderWithProviders(
            <App
                user={user}
                isEditable={false}
            />
        );

        await waitFor(() => {
            expect(container).toBeInTheDocument();
        });

        expect(await screen.findByText("User Details")).toBeInTheDocument(); // Card Header
        expect(await screen.findByText("Test User")).toBeInTheDocument(); // User Name
        expect(await screen.findByText("test.user@exampl.com")).toBeInTheDocument(); // User Email
        expect(await screen.findByText("Child Care")).toBeInTheDocument(); // Division
        expect(await screen.findByText("ACTIVE")).toBeInTheDocument(); // Status
        expect(await screen.findByText("admin")).toBeInTheDocument(); // Roles
        // screen.debug();
    });

    test("renders correctly (editable)", async () => {
        const user = {
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["admin"]
        };
        const { container } = renderWithProviders(
            <App
                user={user}
                isEditable={true}
            />
        );

        await waitFor(() => {
            expect(container).toBeInTheDocument();
        });

        expect(await screen.findByText("User Details")).toBeInTheDocument(); // Card Header
        expect(await screen.findByText("Test User")).toBeInTheDocument(); // User Name
        expect(await screen.findByText("test.user@exampl.com")).toBeInTheDocument(); // User Email
        expect(await screen.findByText("Child Care")).toBeInTheDocument(); // Division
        expect(await screen.findByText("ACTIVE")).toBeInTheDocument(); // Status
        expect(await screen.findByText("admin")).toBeInTheDocument(); // Roles

        expect(screen.getByTestId("division-combobox")).toBeInTheDocument();

        // find the input element within the div with testid division-combobox
        const divisionComboBox = screen.getByTestId("division-combobox");
        // eslint-disable-next-line testing-library/no-node-access
        const divisionInput = divisionComboBox.querySelector("input");
        fireEvent.keyDown(divisionInput, { key: "ArrowDown", code: 40 });
        expect(await screen.findByText("Division of Economic Independence")).toBeInTheDocument();
        expect(await screen.findByText("Office of the Director")).toBeInTheDocument();

        screen.debug();
    });
});

const App = ({ user, isEditable }) => {
    return (
        <UserInfo
            user={user}
            isEditable={isEditable}
        ></UserInfo>
    );
};
