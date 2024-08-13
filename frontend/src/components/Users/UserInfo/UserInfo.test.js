import { fireEvent, screen, waitFor } from "@testing-library/react";
import UserInfo from "./UserInfo";
import { renderWithProviders } from "../../../test-utils.js";
import { server } from "../../../tests/mocks.js";
import userEvent from "@testing-library/user-event";

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
    });

    test("renders correctly - division", async () => {
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
        expect(screen.getByTestId("division-combobox")).toBeInTheDocument();

        // find the input element within the div with testid division-combobox
        const divisionComboBox = screen.getByTestId("division-combobox");
        // eslint-disable-next-line testing-library/no-node-access
        const divisionInput = divisionComboBox.querySelector("input");
        fireEvent.keyDown(divisionInput, { key: "ArrowDown", code: 40 });
        expect(await screen.findAllByText("Child Care")).toHaveLength(2);
        expect(await screen.findByText("Division of Economic Independence")).toBeInTheDocument();
        expect(await screen.findByText("Office of the Director")).toBeInTheDocument();
        expect(await screen.findByText("Division of Child and Family Development")).toBeInTheDocument();
        expect(await screen.findByText("Division of Family Strengthening")).toBeInTheDocument();
        expect(await screen.findByText("Division of Data and Improvement")).toBeInTheDocument();
        expect(await screen.findByText("Non-OPRE Division")).toBeInTheDocument();
    });

    test("renders correctly - roles", async () => {
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
        expect(screen.getByTestId("roles-combobox")).toBeInTheDocument();

        const rolesComboBox = screen.getByTestId("roles-combobox");
        // eslint-disable-next-line testing-library/no-node-access
        const rolesInput = rolesComboBox.querySelector("input");
        fireEvent.keyDown(rolesInput, { key: "ArrowDown", code: 40 });
        expect(await screen.findByText("admin")).toBeInTheDocument();
        expect(await screen.findByText("user")).toBeInTheDocument();
        expect(await screen.findByText("unassigned")).toBeInTheDocument();
        expect(await screen.findByText("division-director")).toBeInTheDocument();
        expect(await screen.findByText("USER_ADMIN")).toBeInTheDocument();
        expect(await screen.findByText("BUDGET_TEAM")).toBeInTheDocument();
    });

    test("renders correctly - status", async () => {
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
        expect(screen.getByTestId("status-combobox")).toBeInTheDocument();

        const statusComboBox = screen.getByTestId("status-combobox");
        // eslint-disable-next-line testing-library/no-node-access
        const statusInput = statusComboBox.querySelector("input");
        fireEvent.keyDown(statusInput, { key: "ArrowDown", code: 40 });
        expect(await screen.findAllByText("ACTIVE")).toHaveLength(2);
        expect(await screen.findByText("INACTIVE")).toBeInTheDocument();
        expect(await screen.findByText("LOCKED")).toBeInTheDocument();
    });

    test("update the division", async () => {
        const browserUser = userEvent.setup();

        const user = {
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["admin"]
        };
        const { getByText, container } = renderWithProviders(
            <App
                user={user}
                isEditable={true}
            />
        );

        await waitFor(() => {
            expect(container).toBeInTheDocument();
        });

        expect(await screen.findByText("User Details")).toBeInTheDocument(); // Card Header

        // find the input element within the div with testid division-combobox
        const divisionComboBox = screen.getByTestId("division-combobox");
        // eslint-disable-next-line testing-library/no-node-access
        const divisionInput = divisionComboBox.querySelector("input");

        await browserUser.click(divisionInput);
        // eslint-disable-next-line testing-library/prefer-screen-queries
        await browserUser.click(getByText("Division of Economic Independence"));

        // check that the division has been selected
        expect(await screen.findByText("Division of Economic Independence")).toBeInTheDocument();
    });

    test("update roles", async () => {
        const browserUser = userEvent.setup();

        const user = {
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["admin"]
        };
        const { getByText, container } = renderWithProviders(
            <App
                user={user}
                isEditable={true}
            />
        );

        await waitFor(() => {
            expect(container).toBeInTheDocument();
        });

        expect(await screen.findByText("User Details")).toBeInTheDocument(); // Card Header

        // find the input element within the div with testid roles-combobox
        const rolesComboBox = screen.getByTestId("roles-combobox");
        // eslint-disable-next-line testing-library/no-node-access
        const rolesInput = rolesComboBox.querySelector("input");

        await browserUser.click(rolesInput);
        // eslint-disable-next-line testing-library/prefer-screen-queries
        await browserUser.click(getByText("user"));

        // check that the 2 roles are selected
        expect(await screen.findByText("admin")).toBeInTheDocument();
        expect(await screen.findByText("user")).toBeInTheDocument();
    });

    test("update status", async () => {
        const browserUser = userEvent.setup();

        const user = {
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["admin"]
        };
        const { getByText, container } = renderWithProviders(
            <App
                user={user}
                isEditable={true}
            />
        );

        await waitFor(() => {
            expect(container).toBeInTheDocument();
        });

        expect(await screen.findByText("User Details")).toBeInTheDocument(); // Card Header

        // find the input element within the div with testid status-combobox
        const statusComboBox = screen.getByTestId("status-combobox");

        // eslint-disable-next-line testing-library/no-node-access
        const statusInput = statusComboBox.querySelector("input");

        await browserUser.click(statusInput);
        // eslint-disable-next-line testing-library/prefer-screen-queries
        await browserUser.click(getByText("LOCKED"));

        expect(statusComboBox).toHaveTextContent("LOCKED");
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
