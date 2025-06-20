import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../test-utils.js";
import { server } from "../../../tests/mocks.js";
import UserInfo from "./UserInfo";

describe("UserInfo", () => {
    beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    test("renders correctly (read only)", async () => {
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["SYSTEM_OWNER"]
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

        expect(await screen.findByText("Test User")).toBeInTheDocument(); // User Name
        expect(await screen.findByText("test.user@exampl.com")).toBeInTheDocument(); // User Email
        expect(await screen.findByText("Child Care")).toBeInTheDocument(); // Division
        expect(await screen.findByText("ACTIVE")).toBeInTheDocument(); // Status
        expect(await screen.findByText("System Owner")).toBeInTheDocument(); // Roles
    });

    test("renders correctly (editable)", async () => {
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["SYSTEM_OWNER"]
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

        expect(await screen.findByText("Test User")).toBeInTheDocument(); // User Name
        expect(await screen.findByText("test.user@exampl.com")).toBeInTheDocument(); // User Email
        expect(await screen.findByText("Child Care")).toBeInTheDocument(); // Division
        expect(await screen.findByText("ACTIVE")).toBeInTheDocument(); // Status
        expect(await screen.findByText("System Owner")).toBeInTheDocument(); // Roles
    });

    test("renders correctly - division", async () => {
        const browserUser = userEvent.setup();
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["SYSTEM_OWNER"]
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

        expect(await screen.findByText("Test User")).toBeInTheDocument(); // Card Header

        expect(screen.getByTestId("division-combobox")).toBeInTheDocument();

        // For react-select, the displayed value is in a div with class containing 'single-value'
        const divisionValue = screen.getByText("Child Care");
        expect(divisionValue).toBeInTheDocument();

        // Get the input element within the combobox
        const divisionCombo = screen.getByTestId("division-combobox");
        const comboInput = within(divisionCombo).getByRole("combobox");

        await browserUser.type(comboInput, "{arrowdown}");
        expect(await screen.findAllByText("Child Care")).toHaveLength(2);
        expect(await screen.findByText("Division of Economic Independence")).toBeInTheDocument();
        expect(await screen.findByText("Office of the Director")).toBeInTheDocument();
        expect(await screen.findByText("Division of Child and Family Development")).toBeInTheDocument();
        expect(await screen.findByText("Division of Family Strengthening")).toBeInTheDocument();
        expect(await screen.findByText("Division of Data and Improvement")).toBeInTheDocument();
        expect(await screen.findByText("Non-OPRE Division")).toBeInTheDocument();
    });

    test("renders correctly - roles", async () => {
        const browserUser = userEvent.setup();
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["SYSTEM_OWNER"]
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

        expect(await screen.findByText("Test User")).toBeInTheDocument(); // Card Header

        expect(screen.getByTestId("roles-combobox")).toBeInTheDocument();

        // For react-select, the displayed value is in a div with class containing 'single-value'
        const rolesValue = screen.getByText("System Owner");
        expect(rolesValue).toBeInTheDocument();

        // Get the input element within the combobox
        const rolesCombo = screen.getByTestId("roles-combobox");
        const comboInput = within(rolesCombo).getByRole("combobox");

        await browserUser.type(comboInput, "{arrowdown}");
        expect(await screen.findByText("System Owner")).toBeInTheDocument();
        expect(await screen.findByText("Viewer/Editor")).toBeInTheDocument();
        expect(await screen.findByText("Reviewer/Approver")).toBeInTheDocument();
        expect(await screen.findByText("User Admin")).toBeInTheDocument();
        expect(await screen.findByText("Budget Team")).toBeInTheDocument();
        expect(await screen.findByText("Procurement Team")).toBeInTheDocument();
    });

    test("renders correctly - status", async () => {
        const browserUser = userEvent.setup();
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["SYSTEM_OWNER"]
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

        expect(await screen.findByText("Test User")).toBeInTheDocument(); // Card Header

        expect(screen.getByTestId("status-combobox")).toBeInTheDocument();

        // For react-select, the displayed value is in a div with class containing 'single-value'
        const statusValue = screen.getByText("ACTIVE");
        expect(statusValue).toBeInTheDocument();

        // Get the input element within the combobox
        const statusCombo = screen.getByTestId("status-combobox");
        const comboInput = within(statusCombo).getByRole("combobox");

        await browserUser.type(comboInput, "{arrowdown}");
        expect(await screen.findAllByText("ACTIVE")).toHaveLength(2);
        expect(await screen.findByText("INACTIVE")).toBeInTheDocument();
        expect(await screen.findByText("LOCKED")).toBeInTheDocument();
    });

    test("update the division", async () => {
        const browserUser = userEvent.setup();
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["SYSTEM_OWNER"]
        };
        renderWithProviders(
            <App
                user={user}
                isEditable={true}
            />
        );
        await waitFor(() => {
            expect(screen.getByText("Test User")).toBeInTheDocument();
        });
        const divisionCombo = screen.getByTestId("division-combobox");
        const comboInput = within(divisionCombo).getByRole("combobox");
        await browserUser.type(comboInput, "{arrowdown}");
        // eslint-disable-next-line testing-library/no-node-access
        await browserUser.click(screen.getByRole("option", { name: /Division of Economic Independence/i }));
        await waitFor(() => {
            expect(screen.getByText("Division of Economic Independence")).toBeInTheDocument();
        });
    });

    test("update roles", async () => {
        const browserUser = userEvent.setup();
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["SYSTEM_OWNER"]
        };
        renderWithProviders(
            <App
                user={user}
                isEditable={true}
            />
        );
        await waitFor(() => {
            expect(screen.getByText("Test User")).toBeInTheDocument();
        });
        const rolesCombo = screen.getByTestId("roles-combobox");
        const comboInput = within(rolesCombo).getByRole("combobox");
        await browserUser.type(comboInput, "{arrowdown}");
        // eslint-disable-next-line testing-library/no-node-access
        await browserUser.click(screen.getByRole("option", { name: /Viewer\/Editor/i }));
        await waitFor(() => {
            expect(screen.getByText("System Owner")).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(screen.getByText("Viewer/Editor")).toBeInTheDocument();
        });
    });

    test("update status", async () => {
        const browserUser = userEvent.setup();
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@exampl.com",
            division: 1,
            status: "ACTIVE",
            roles: ["SYSTEM_OWNER"]
        };
        renderWithProviders(
            <App
                user={user}
                isEditable={true}
            />
        );
        await waitFor(() => {
            expect(screen.getByText("Test User")).toBeInTheDocument();
        });
        const statusCombo = screen.getByTestId("status-combobox");
        const comboInput = within(statusCombo).getByRole("combobox");
        await browserUser.type(comboInput, "{arrowdown}");
        // eslint-disable-next-line testing-library/no-node-access
        await browserUser.click(screen.getByRole("option", { name: /LOCKED/i }));
        await waitFor(() => {
            expect(screen.getByText("LOCKED")).toBeInTheDocument();
        });
    });
});

/**
 * @typedef {Object} TestUser
 * @property {number} id - The user ID
 * @property {string} full_name - The user's full name
 * @property {string} email - The user's email
 * @property {number} division - The user's division ID
 * @property {string} status - The user's status
 * @property {string[]} roles - The user's roles
 * @param {Object} props - The component props.
 * @param {TestUser} props.user - The user object.
 * @param {boolean} props.isEditable - Whether the user information is editable.
 */
const App = ({ user, isEditable }) => {
    return (
        <UserInfo
            user={user}
            isEditable={isEditable}
        ></UserInfo>
    );
};
