import React, { useEffect } from "react";
import { useGetDivisionsQuery, useUpdateUserMutation } from "../../../api/opsAPI.js";
import { useGetRolesQuery } from "../../../api/opsAuthAPI.js";
import constants from "../../../constants.js";
import useAlert from "../../../hooks/use-alert.hooks.js";
import ComboBox from "../../UI/Form/ComboBox/index.js";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal.jsx";
import { USER_STATUS } from "./UserInfo.constants.js";
import { useNavigate } from "react-router-dom";

const READ_ONLY_ROLE = "READ_ONLY";

// Move statusData outside component to prevent re-creation
const STATUS_DATA = [
    { id: 1, name: USER_STATUS.ACTIVE },
    { id: 2, name: USER_STATUS.INACTIVE },
    { id: 3, name: USER_STATUS.LOCKED }
];

/**
 * Renders the user information.
 * @component
 * @typedef {import("../../../types/UserTypes.js").SafeUser} User
 * @param {Object} props - The component props.
 * @param {User} props.user - The user object.
 * @param {Boolean} props.isEditable - Whether the user information is editable.
 * @returns {React.ReactElement} - The rendered component.
 */
const UserInfo = ({ user, isEditable }) => {
    const navigate = useNavigate();
    const { setAlert } = useAlert();

    const [selectedDivision, setSelectedDivision] = React.useState({});
    const [selectedStatus, setSelectedStatus] = React.useState({});
    const [selectedRoles, setSelectedRoles] = React.useState([]);
    const [showModal, setShowModal] = React.useState(false);
    const [showCancelModal, setShowCancelModal] = React.useState(false);
    // Baseline of the last-saved values. The `user` prop is a stale snapshot from the
    // parent's selected-users state and is not re-synced after a save, so we track what
    // was persisted here to keep the dirty check (and Cancel reset) accurate.
    const [lastSaved, setLastSaved] = React.useState(null);
    /** @type {{data?: import("../../../types/PortfolioTypes.js").Division[] | undefined, error?: Object, isLoading: boolean}} */
    const { data: divisions, error: errorDivisions, isLoading: isLoadingDivisions } = useGetDivisionsQuery({});
    const { data: roles, error: errorRoles, isLoading: isLoadingRoles } = useGetRolesQuery({});
    const [updateUser, updateUserResult] = useUpdateUserMutation();

    // Separate useEffects to avoid infinite loops with deep equality checks
    useEffect(() => {
        if (divisions && user.division) {
            const division = divisions.find((division) => division.id === user.division);
            setSelectedDivision((prevDiv) => {
                if (prevDiv?.id !== division?.id) {
                    return division || {};
                }
                return prevDiv;
            });
        }
    }, [divisions, user.division]);

    useEffect(() => {
        if (user.status) {
            const status = STATUS_DATA.find((status) => status.name === user.status);
            setSelectedStatus((prevStatus) => {
                if (prevStatus?.name !== status?.name) {
                    return status || {};
                }
                return prevStatus;
            });
        }
    }, [user.status]);

    useEffect(() => {
        if (roles && user.roles && Array.isArray(user.roles)) {
            const userRoleNames = user.roles.map((r) => (typeof r === "string" ? r : r.name));
            const filteredRoles = roles.filter((role) => userRoleNames.includes(role.name));
            setSelectedRoles((prevRoles) => {
                // Check if the arrays are different using Set-based comparison for order independence
                if (prevRoles.length !== filteredRoles.length) {
                    return filteredRoles;
                }
                const prevRoleNames = new Set(prevRoles.map((role) => role.name));
                const filteredRoleNames = new Set(filteredRoles.map((role) => role.name));
                if (
                    prevRoleNames.size !== filteredRoleNames.size ||
                    ![...prevRoleNames].every((name) => filteredRoleNames.has(name))
                ) {
                    return filteredRoles;
                }
                return prevRoles;
            });
        }
    }, [roles, user.roles]);

    useEffect(() => {
        if (updateUserResult.isSuccess) {
            setAlert({
                type: "success",
                heading: "User Updated",
                message: "The user has been updated successfully."
            });
            updateUserResult.reset();
        }

        if (updateUserResult.isError) {
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while updating the user."
            });
            updateUserResult.reset();
        }
    }, [updateUserResult, setAlert]);
    // Detect unsaved edits by comparing the staged selections against the persisted values.
    // Prefer the local last-saved baseline (updated on save) over the stale `user` prop.
    const persistedDivision = lastSaved?.division ?? user.division ?? null;
    const persistedStatus = lastSaved?.status ?? user.status ?? null;
    const persistedRoleNames =
        lastSaved?.roleNames ?? (user.roles ?? []).map((r) => (typeof r === "string" ? r : r.name));
    const selectedRoleNames = selectedRoles.map((role) => role.name);
    const rolesChanged =
        persistedRoleNames.length !== selectedRoleNames.length ||
        !persistedRoleNames.every((name) => selectedRoleNames.includes(name));
    const divisionChanged = (selectedDivision?.id ?? null) !== persistedDivision;
    const statusChanged = (selectedStatus?.name ?? null) !== persistedStatus;
    const isDirty = divisionChanged || statusChanged || rolesChanged;

    const handleDivisionChange = (division) => {
        setSelectedDivision(division);
    };

    const handleRolesChange = (roles) => {
        setSelectedRoles(roles ?? []);
    };

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
    };

    const saveUser = (roleNames) => {
        const division = selectedDivision?.id ?? null;
        const status = selectedStatus?.name ?? "LOCKED";
        updateUser({
            id: user.id,
            data: {
                division,
                roles: roleNames,
                status
            }
        });
        // Record the persisted values so the dirty check resets the buttons to disabled
        // once the save completes (the `user` prop won't reflect this change).
        setLastSaved({ division, status, roleNames });
    };

    // Newly assigning Read Only requires confirmation because it strips all other roles.
    // Skip the modal when the user already had Read Only (no roles to remove), and for
    // any other change save directly.
    const handleSave = () => {
        if (selectedRoleNames.includes(READ_ONLY_ROLE) && !persistedRoleNames.includes(READ_ONLY_ROLE)) {
            setShowModal(true);
            return;
        }
        saveUser(selectedRoleNames);
    };

    const handleConfirmReadOnly = () => {
        setSelectedRoles(roles?.filter((role) => role.name === READ_ONLY_ROLE) ?? []);
        saveUser([READ_ONLY_ROLE]);
    };

    // Discard unsaved edits by resetting each field to the last-persisted value.
    const handleCancelEdits = () => {
        setSelectedDivision(divisions?.find((division) => division.id === persistedDivision) ?? {});
        setSelectedStatus(STATUS_DATA.find((status) => status.name === persistedStatus) ?? {});
        setSelectedRoles(roles?.filter((role) => persistedRoleNames.includes(role.name)) ?? []);
    };

    // Cancel prompts for confirmation so unsaved edits aren't discarded accidentally.
    const handleCancel = () => {
        setShowCancelModal(true);
    };

    if (isLoadingDivisions || isLoadingRoles) {
        return <div>Loading...</div>;
    }
    if (errorDivisions || errorRoles) {
        navigate("/error");
        return;
    }
    if (updateUserResult.isError) {
        navigate("/error");
        return;
    }

    return (
        <div className="usa-card">
            {showModal && (
                <ConfirmationModal
                    heading="Are you sure you want to change this role to Read Only? The existing role(s) associated with this user will be removed by making this change."
                    setShowModal={setShowModal}
                    actionButtonText="Change Role"
                    secondaryButtonText="Cancel"
                    handleConfirm={handleConfirmReadOnly}
                />
            )}
            {showCancelModal && (
                <ConfirmationModal
                    heading="Are you sure you want to cancel editing? Your changes will not be saved."
                    setShowModal={setShowCancelModal}
                    actionButtonText="Cancel edits"
                    secondaryButtonText="Continue editing"
                    handleConfirm={handleCancelEdits}
                />
            )}
            <div className="usa-card__container">
                <div className="usa-card__header">
                    <h1 className="usa-card__heading">{user.display_name ?? user.full_name}</h1>
                </div>
                <div className="usa-card__body">
                    <div className="font-sans-md line-height-sans-4 flex-align-center">
                        <div className="grid-row">
                            <div className="grid-col-4">User Email:</div>
                            <div className="grid-col-8">{user?.email}</div>
                        </div>
                        <div className="grid-row display-flex flex-align-center">
                            <div className="grid-col-4">Division:</div>
                            <div className="grid-col-8">
                                {!isEditable && <span>{selectedDivision?.name}</span>}
                                {isEditable && (
                                    <div data-testid="division-combobox">
                                        <ComboBox
                                            namespace="division-combobox"
                                            data={divisions}
                                            selectedData={selectedDivision}
                                            setSelectedData={handleDivisionChange}
                                            defaultString="-- Select Division --"
                                            optionText={(division) => division.name}
                                            isMulti={false}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid-row">
                            <div className="grid-col-4">Role(s):</div>
                            <div className="grid-col-8">
                                {!isEditable && (
                                    <span>
                                        {selectedRoles
                                            ?.map((role) => constants.roles.find((r) => r.name === role.name)?.label)
                                            .join(", ")}
                                    </span>
                                )}
                                {isEditable && (
                                    <div data-testid="roles-combobox">
                                        <ComboBox
                                            namespace="roles-combobox"
                                            data={roles}
                                            selectedData={selectedRoles}
                                            setSelectedData={handleRolesChange}
                                            defaultString="-- Select Roles --"
                                            optionText={(role) =>
                                                constants.roles.find((r) => r.name === role.name)?.label
                                            }
                                            isMulti={true}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid-row display-flex flex-align-center">
                            <div className="grid-col-4">Status:</div>
                            <div className="grid-col-8">
                                {!isEditable && <span>{selectedStatus?.name}</span>}
                                {isEditable && (
                                    <div data-testid="status-combobox">
                                        <ComboBox
                                            namespace="status-combobox"
                                            data={STATUS_DATA}
                                            selectedData={selectedStatus}
                                            setSelectedData={handleStatusChange}
                                            defaultString="-- Select Status --"
                                            optionText={(status) => status.name}
                                            isMulti={false}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {isEditable && (
                        <div className="grid-row flex-justify-end margin-top-8">
                            <button
                                type="button"
                                className="usa-button usa-button--unstyled margin-right-2"
                                data-cy="cancel-button"
                                disabled={!isDirty}
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                            <button
                                id="save-changes"
                                type="button"
                                className="usa-button"
                                disabled={!isDirty}
                                data-cy="save-btn"
                                onClick={handleSave}
                            >
                                Save changes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserInfo;
