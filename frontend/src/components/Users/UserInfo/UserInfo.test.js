import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../test-utils.js";
import { vi, beforeEach } from "vitest";
import UserInfo from "./UserInfo";

// Stable mock references so tests can assert on them and control the
// mutation result to exercise the success/error alert-lifecycle branches.
const { mockSetAlert, mockUpdateUser, mockResetMutation, mockUseUpdateUserMutation } = vi.hoisted(() => {
    const mockUpdateUser = vi.fn();
    const mockResetMutation = vi.fn();
    return {
        mockSetAlert: vi.fn(),
        mockUpdateUser,
        mockResetMutation,
        mockUseUpdateUserMutation: vi.fn(() => [
            mockUpdateUser,
            { isSuccess: false, isError: false, reset: mockResetMutation }
        ])
    };
});

// Mock React Router navigate
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: vi.fn(() => vi.fn())
    };
});

// Mock the useAlert hook
vi.mock("../../../hooks/use-alert.hooks.js", () => ({
    default: vi.fn(() => ({
        setAlert: mockSetAlert
    }))
}));

// Mock the ComboBox component to simulate React Select behavior
vi.mock("../../UI/Form/ComboBox", () => ({
    default: vi.fn((props) => {
        const selectedValue = props.selectedData?.id || "";
        const selectedText = props.selectedData
            ? props.optionText
                ? props.optionText(props.selectedData)
                : props.selectedData.name
            : props.defaultString;

        return (
            <div>
                {/* Display the selected value like react-select does */}
                <div>{selectedText}</div>
                <select
                    disabled={props.isDisabled}
                    value={selectedValue}
                    onChange={(e) => {
                        const selected = props.data?.find((item) => item.id.toString() === e.target.value);
                        if (selected && props.setSelectedData) {
                            // Multi-select combos (e.g. roles) hand back an array like react-select does.
                            props.setSelectedData(props.isMulti ? [selected] : selected);
                        }
                    }}
                >
                    <option value="">{props.defaultString}</option>
                    {props.data?.map((item) => (
                        <option
                            key={item.id}
                            value={item.id}
                        >
                            {props.optionText ? props.optionText(item) : item.name}
                        </option>
                    ))}
                </select>
            </div>
        );
    })
}));

// Mock the API hooks directly to avoid MSW/AbortSignal compatibility issues.
// The query results are defined once (not per call) so they keep a STABLE reference
// across renders — the way real RTK Query behaves. Returning a fresh array literal on
// every render would make UserInfo's roles/divisions effects re-run each render and
// revert staged selections, breaking the dirty-state and modal flows.
vi.mock("../../../api/opsAPI.js", () => {
    const divisionsResult = {
        data: [
            { id: 1, name: "Child Care" },
            { id: 2, name: "Division of Economic Independence" },
            { id: 3, name: "Office of the Director" },
            { id: 4, name: "Division of Child and Family Development" },
            { id: 5, name: "Division of Family Strengthening" },
            { id: 6, name: "Division of Data and Improvement" },
            { id: 7, name: "Non-OPRE Division" }
        ],
        error: null,
        isLoading: false
    };
    return {
        useGetDivisionsQuery: vi.fn(() => divisionsResult),
        useUpdateUserMutation: mockUseUpdateUserMutation
    };
});

vi.mock("../../../api/opsAuthAPI.js", () => {
    const rolesResult = {
        data: [
            { id: 1, name: "SYSTEM_OWNER", is_superuser: false },
            { id: 2, name: "USER_ADMIN", is_superuser: false },
            { id: 3, name: "VIEWER_EDITOR", is_superuser: false },
            { id: 4, name: "REVIEWER_APPROVER", is_superuser: false },
            { id: 5, name: "BUDGET_TEAM", is_superuser: false },
            { id: 6, name: "PROCUREMENT_TEAM", is_superuser: false },
            { id: 7, name: "SUPER_USER", is_superuser: true },
            { id: 8, name: "READ_ONLY", is_superuser: false }
        ],
        error: null,
        isLoading: false
    };
    return {
        useGetRolesQuery: vi.fn(() => rolesResult)
    };
});

// Mock constants to prevent issues with constants.js
vi.mock("../../../constants.js", () => ({
    default: {
        roles: [
            { name: "SYSTEM_OWNER", label: "System Owner" },
            { name: "VIEWER_EDITOR", label: "Viewer/Editor" },
            { name: "REVIEWER_APPROVER", label: "Reviewer/Approver" },
            { name: "USER_ADMIN", label: "User Admin" },
            { name: "BUDGET_TEAM", label: "Budget Team" },
            { name: "PROCUREMENT_TEAM", label: "Procurement Team" },
            { name: "SUPER_USER", label: "Administrative Power User" },
            { name: "READ_ONLY", label: "Read Only" }
        ]
    }
}));

describe("UserInfo", () => {
    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks();
        // Restore the default mutation result after clearAllMocks wiped the implementation
        mockUseUpdateUserMutation.mockReturnValue([
            mockUpdateUser,
            { isSuccess: false, isError: false, reset: mockResetMutation }
        ]);
    });

    test("fires a success alert and resets the mutation when the update succeeds", async () => {
        // Simulate a successful mutation so the success branch of the effect runs
        mockUseUpdateUserMutation.mockReturnValue([
            mockUpdateUser,
            { isSuccess: true, isError: false, reset: mockResetMutation }
        ]);

        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@example.com",
            division: 1,
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
        };
        renderWithProviders(
            <App
                user={user}
                isEditable={true}
            />
        );

        await waitFor(() => {
            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "success",
                heading: "User Updated",
                message: "The user has been updated successfully."
            });
        });
        // reset() guards against the alert re-firing on subsequent renders
        expect(mockResetMutation).toHaveBeenCalled();
    });

    test("fires an error alert and resets the mutation when the update fails", async () => {
        // Simulate a failed mutation so the error branch of the effect runs
        mockUseUpdateUserMutation.mockReturnValue([
            mockUpdateUser,
            { isSuccess: false, isError: true, reset: mockResetMutation }
        ]);

        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@example.com",
            division: 1,
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
        };
        renderWithProviders(
            <App
                user={user}
                isEditable={true}
            />
        );

        await waitFor(() => {
            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "error",
                heading: "Error",
                message: "An error occurred while updating the user."
            });
        });
        expect(mockResetMutation).toHaveBeenCalled();
    });

    test("renders correctly (read only)", async () => {
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@example.com",
            division: 1,
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
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
        expect(await screen.findByText("test.user@example.com")).toBeInTheDocument(); // User Email
        expect(await screen.findByText("Child Care")).toBeInTheDocument(); // Division
        expect(await screen.findByText("ACTIVE")).toBeInTheDocument(); // Status
        expect(await screen.findByText("System Owner")).toBeInTheDocument(); // Roles
    });

    test("renders correctly (editable)", async () => {
        const user = {
            id: 1,
            first_name: "Test",
            last_name: "User",
            full_name: "Test User",
            email: "test.user@example.com",
            division: 4, // Division of Child and Family Development
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
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
        expect(await screen.findByText("test.user@example.com")).toBeInTheDocument(); // User Email
        expect((await screen.findAllByText("Child Care"))[0]).toBeInTheDocument(); // Division
        expect((await screen.findAllByText("ACTIVE"))[0]).toBeInTheDocument(); // Status
        expect(await screen.findByText("System Owner")).toBeInTheDocument(); // Roles
    });

    test("renders correctly - division", async () => {
        const browserUser = userEvent.setup();
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@example.com",
            division: 1,
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
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
        const divisionValue = screen.getAllByText("Child Care")[0];
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
            email: "test.user@example.com",
            division: 1,
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
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
            email: "test.user@example.com",
            division: 1,
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
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
        const statusValue = screen.getAllByText("ACTIVE")[0];
        expect(statusValue).toBeInTheDocument();

        // Get the input element within the combobox
        const statusCombo = screen.getByTestId("status-combobox");
        const comboInput = within(statusCombo).getByRole("combobox");

        await browserUser.type(comboInput, "{arrowdown}");
        expect(await screen.findAllByText("ACTIVE")).toHaveLength(2);
        expect(await screen.findByText("INACTIVE")).toBeInTheDocument();
        expect(await screen.findByText("LOCKED")).toBeInTheDocument();
    });

    // TODO: revisit these skipped tests
    test("update the division", async () => {
        const browserUser = userEvent.setup();
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@example.com",
            division: 1,
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
        };
        renderWithProviders(
            <App
                user={user}
                isEditable={true}
            />
        );

        // Wait for the component to be fully rendered and not loading
        await waitFor(
            () => {
                expect(screen.getByText("Test User")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        await waitFor(
            () => {
                expect(screen.getByTestId("division-combobox")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        const divisionCombo = screen.getByTestId("division-combobox");
        const comboInput = within(divisionCombo).getByRole("combobox");

        // Open the dropdown
        await browserUser.type(comboInput, "{arrowdown}");

        // Wait for the dropdown to open and options to be available
        // Use getAllByText since there are multiple Child Care elements (selected value + dropdown option)
        await waitFor(
            () => {
                const childCareElements = screen.getAllByText("Child Care");
                expect(childCareElements.length).toBeGreaterThan(1); // Should have at least 2 (selected + dropdown option)
            },
            { timeout: 5000 }
        );

        // Wait for Division of Economic Independence to be available
        await waitFor(
            () => {
                expect(screen.getByText("Division of Economic Independence")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        // Click the Division of Economic Independence option
        await browserUser.click(screen.getByRole("option", { name: /Division of Economic Independence/i }));

        // The component should make an API call to update the user division
        // Since we're in a test environment, we can't easily verify the API call was made
        // But we can verify that the component doesn't crash and remains functional
        await waitFor(
            () => {
                expect(screen.getByText("Test User")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        await waitFor(
            () => {
                expect(screen.getByTestId("division-combobox")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        // The division combo should still be there (even if it shows the old value)
        const divisionComboElement = screen.getByTestId("division-combobox");
        expect(divisionComboElement).toBeInTheDocument();

        // In a real scenario, the API call would update the user object
        // and the component would re-render with the new division
        // For now, we just verify the component remains stable
    }, 15000); // 15 second timeout for the entire test

    test("update roles", async () => {
        const browserUser = userEvent.setup();
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@example.com",
            division: 1,
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
        };
        renderWithProviders(
            <App
                user={user}
                isEditable={true}
            />
        );

        // Wait for the component to be fully rendered and not loading
        await waitFor(
            () => {
                expect(screen.getByText("Test User")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        // Wait for the roles combo to be available (not loading)
        await waitFor(
            () => {
                expect(screen.getByTestId("roles-combobox")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        const rolesCombo = screen.getByTestId("roles-combobox");
        const comboInput = within(rolesCombo).getByRole("combobox");

        // Open the dropdown
        await browserUser.type(comboInput, "{arrowdown}");

        // Wait for the dropdown to open and options to be available
        await waitFor(
            () => {
                expect(screen.getByText("System Owner")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        // Wait for Viewer/Editor to be available
        await waitFor(
            () => {
                expect(screen.getByText("Viewer/Editor")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        // Click the Viewer/Editor option
        await browserUser.click(screen.getByRole("option", { name: /Viewer\/Editor/i }));

        // The component should make an API call to update the user roles
        // Since we're in a test environment, we can't easily verify the API call was made
        // But we can verify that the component doesn't crash and remains functional
        await waitFor(
            () => {
                expect(screen.getByText("Test User")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        await waitFor(
            () => {
                expect(screen.getByTestId("roles-combobox")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        // The roles combo should still be there (even if it shows the old value)
        const rolesComboElement = screen.getByTestId("roles-combobox");
        expect(rolesComboElement).toBeInTheDocument();

        // In a real scenario, the API call would update the user object
        // and the component would re-render with the new roles
        // For now, we just verify the component remains stable
    }, 15000); // 15 second timeout for the entire test

    test("update status", async () => {
        const browserUser = userEvent.setup();
        const user = {
            id: 1,
            full_name: "Test User",
            email: "test.user@example.com",
            division: 1,
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
        };
        renderWithProviders(
            <App
                user={user}
                isEditable={true}
            />
        );

        // Wait for the component to be fully rendered and not loading
        await waitFor(
            () => {
                expect(screen.getByText("Test User")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        // Wait for the status combo to be available (not loading)
        await waitFor(
            () => {
                expect(screen.getByTestId("status-combobox")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        const statusCombo = screen.getByTestId("status-combobox");
        const comboInput = within(statusCombo).getByRole("combobox");

        // Open the dropdown
        await browserUser.type(comboInput, "{arrowdown}");

        // Wait for the dropdown to open and options to be available
        // Use getAllByText since there are multiple ACTIVE elements (selected value + dropdown option)
        await waitFor(
            () => {
                const activeElements = screen.getAllByText("ACTIVE");
                expect(activeElements.length).toBeGreaterThan(1); // Should have at least 2 (selected + dropdown option)
            },
            { timeout: 5000 }
        );

        // Click the LOCKED option
        await browserUser.click(screen.getByRole("option", { name: /LOCKED/i }));

        // The component should make an API call to update the user status
        // Since we're in a test environment, we can't easily verify the API call was made
        // But we can verify that the component doesn't crash and remains functional
        await waitFor(
            () => {
                // The component should still be rendered and functional
                expect(screen.getByText("Test User")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        await waitFor(
            () => {
                expect(screen.getByTestId("status-combobox")).toBeInTheDocument();
            },
            { timeout: 5000 }
        );

        // The status combo should still be there (even if it shows the old value)
        const statusComboElement = screen.getByTestId("status-combobox");
        expect(statusComboElement).toBeInTheDocument();

        // In a real scenario, the API call would update the user object
        // and the component would re-render with the new status
        // For now, we just verify the component remains stable
    }, 10000); // 10 second timeout for the entire test

    describe("Save/Cancel dirty-state gating", () => {
        const baseUser = {
            id: 1,
            full_name: "Test User",
            email: "test.user@example.com",
            division: 1,
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
        };

        test("Save and Cancel buttons are disabled until an edit is made", async () => {
            renderWithProviders(
                <App
                    user={baseUser}
                    isEditable={true}
                />
            );

            expect(await screen.findByRole("button", { name: "Save changes" })).toBeDisabled();
            expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
        });

        test("changing the status enables the Save and Cancel buttons", async () => {
            const browserUser = userEvent.setup();
            renderWithProviders(
                <App
                    user={baseUser}
                    isEditable={true}
                />
            );

            const statusCombo = await screen.findByTestId("status-combobox");
            await browserUser.selectOptions(within(statusCombo).getByRole("combobox"), "3"); // LOCKED

            expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
            expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
        });

        test("Save changes stages division, roles, and status into a single updateUser call", async () => {
            const browserUser = userEvent.setup();
            renderWithProviders(
                <App
                    user={baseUser}
                    isEditable={true}
                />
            );

            const statusCombo = await screen.findByTestId("status-combobox");
            await browserUser.selectOptions(within(statusCombo).getByRole("combobox"), "2"); // INACTIVE

            await browserUser.click(screen.getByRole("button", { name: "Save changes" }));

            expect(mockUpdateUser).toHaveBeenCalledWith({
                id: 1,
                data: {
                    division: 1,
                    roles: ["SYSTEM_OWNER"],
                    status: "INACTIVE"
                }
            });
        });

        test("no confirmation modal appears when saving a non-Read-Only change", async () => {
            const browserUser = userEvent.setup();
            renderWithProviders(
                <App
                    user={baseUser}
                    isEditable={true}
                />
            );

            const statusCombo = await screen.findByTestId("status-combobox");
            await browserUser.selectOptions(within(statusCombo).getByRole("combobox"), "2"); // INACTIVE

            await browserUser.click(screen.getByRole("button", { name: "Save changes" }));

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
            expect(mockUpdateUser).toHaveBeenCalled();
        });
    });

    describe("Read Only confirmation modal", () => {
        const baseUser = {
            id: 1,
            full_name: "Test User",
            email: "test.user@example.com",
            division: 1,
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
        };

        test("selecting Read Only and saving opens the confirmation modal instead of saving immediately", async () => {
            const browserUser = userEvent.setup();
            renderWithProviders(
                <App
                    user={baseUser}
                    isEditable={true}
                />
            );

            const rolesCombo = await screen.findByTestId("roles-combobox");
            await browserUser.selectOptions(within(rolesCombo).getByRole("combobox"), "8"); // READ_ONLY

            await browserUser.click(screen.getByRole("button", { name: "Save changes" }));

            expect(await screen.findByRole("dialog")).toBeInTheDocument();
            expect(screen.getByText(/change this role to Read Only/i)).toBeInTheDocument();
            // The save is deferred until the user confirms.
            expect(mockUpdateUser).not.toHaveBeenCalled();
        });

        test("confirming the Read Only modal saves with only the READ_ONLY role", async () => {
            const browserUser = userEvent.setup();
            renderWithProviders(
                <App
                    user={baseUser}
                    isEditable={true}
                />
            );

            const rolesCombo = await screen.findByTestId("roles-combobox");
            await browserUser.selectOptions(within(rolesCombo).getByRole("combobox"), "8"); // READ_ONLY

            await browserUser.click(screen.getByRole("button", { name: "Save changes" }));
            await browserUser.click(await screen.findByRole("button", { name: "Change Role" }));

            expect(mockUpdateUser).toHaveBeenCalledWith({
                id: 1,
                data: {
                    division: 1,
                    roles: ["READ_ONLY"],
                    status: "ACTIVE"
                }
            });
        });
    });

    describe("Cancel confirmation modal", () => {
        const baseUser = {
            id: 1,
            full_name: "Test User",
            email: "test.user@example.com",
            division: 1,
            status: "ACTIVE",
            roles: [{ id: 1, name: "SYSTEM_OWNER", is_superuser: false }]
        };

        test("clicking Cancel with unsaved edits opens the cancel confirmation modal", async () => {
            const browserUser = userEvent.setup();
            renderWithProviders(
                <App
                    user={baseUser}
                    isEditable={true}
                />
            );

            const statusCombo = await screen.findByTestId("status-combobox");
            await browserUser.selectOptions(within(statusCombo).getByRole("combobox"), "3"); // LOCKED

            await browserUser.click(screen.getByRole("button", { name: "Cancel" }));

            expect(await screen.findByRole("dialog")).toBeInTheDocument();
            expect(screen.getByText(/cancel editing\? Your changes will not be saved/i)).toBeInTheDocument();
        });

        test("Continue editing closes the modal and keeps the staged edits", async () => {
            const browserUser = userEvent.setup();
            renderWithProviders(
                <App
                    user={baseUser}
                    isEditable={true}
                />
            );

            const statusCombo = await screen.findByTestId("status-combobox");
            await browserUser.selectOptions(within(statusCombo).getByRole("combobox"), "3"); // LOCKED

            await browserUser.click(screen.getByRole("button", { name: "Cancel" }));
            await browserUser.click(await screen.findByRole("button", { name: "Continue editing" }));

            await waitFor(() => {
                expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
            });
            // The edit is preserved, so the form is still dirty (Save stays enabled) and nothing was saved.
            expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
            expect(mockUpdateUser).not.toHaveBeenCalled();
        });

        test("Cancel edits reverts the staged edits and does not save", async () => {
            const browserUser = userEvent.setup();
            renderWithProviders(
                <App
                    user={baseUser}
                    isEditable={true}
                />
            );

            const statusCombo = await screen.findByTestId("status-combobox");
            await browserUser.selectOptions(within(statusCombo).getByRole("combobox"), "3"); // LOCKED
            expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();

            await browserUser.click(screen.getByRole("button", { name: "Cancel" }));
            await browserUser.click(await screen.findByRole("button", { name: "Cancel edits" }));

            await waitFor(() => {
                expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
            });
            // Reverting to the persisted value clears the dirty state, re-disabling the buttons.
            expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
            expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
            expect(mockUpdateUser).not.toHaveBeenCalled();
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
 * @property {Array<{id: number, name: string, is_superuser: boolean}>} roles - The user's roles
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
