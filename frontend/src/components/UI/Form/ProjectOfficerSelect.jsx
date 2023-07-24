import cx from "clsx";
import { useEffect, useState } from "react";
import { useGetUsersQuery } from "../../../api/opsAPI";

/**
 *  A comboBox for choosing a project officer.
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label] - The label to display for the input field (optional).
 * @param {string} props.selectedProjectOfficer - The currently selected agreement type.
 * @param {Function} props.setSelectedProjectOfficer - A function to call when the selected agreement type changes.
 * @param {Function} props.onChange - A function to call when the input value changes.
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const ProjectOfficerSelect = ({
    name,
    label = name,
    selectedProjectOfficer,
    setSelectedProjectOfficer,
    onChange,
    pending = false,
    messages = [],
    className,
}) => {
    const { data: users, error: errorUsers, isLoading: isLoadingUsers } = useGetUsersQuery();
    const [inputValue, setInputValue] = useState(selectedProjectOfficer?.full_name ?? "");

    useEffect(() => {
        setInputValue(selectedProjectOfficer?.full_name ?? "");
    }, [selectedProjectOfficer]);

    if (isLoadingUsers) {
        return <div>Loading...</div>;
    }
    if (errorUsers) {
        return <div>Oops, an error occurred</div>;
    }

    const handleChange = (userId = 0) => {
        if (userId === 0) {
            setSelectedProjectOfficer(0);
            return;
        }
        const selected = users[userId - 1];
        setSelectedProjectOfficer({ ...selected });
        onChange(name, userId);
    };

    return (
        <fieldset className={cx("usa-fieldset", pending && "pending", className)}>
            <label className={`usa-label margin-top-0 ${messages.length ? "usa-label--error" : null} `} htmlFor={name}>
                {label}
            </label>
            {messages.length ? (
                <span className="usa-error-message" id="input-error-message" role="alert">
                    {messages[0]}
                </span>
            ) : null}
            <div className="usa-combo-box width-card-lg" data-enhanced="true">
                <select
                    className={`usa-select usa-sr-only usa-combo-box__select ${
                        messages.length ? "usa-input--error" : null
                    } `}
                    id={name}
                    name={name}
                    aria-hidden="true"
                    tabIndex={-1}
                    value={selectedProjectOfficer?.id}
                    onChange={(e) => handleChange(Number(e.target.value))}
                >
                    {users.map((user) => (
                        <option key={user?.id} value={user?.id}>
                            {user?.full_name || user?.email}
                        </option>
                    ))}
                </select>
                <input
                    id="project-officer-select-input"
                    aria-label="project-officer-select-input"
                    aria-owns="users--list"
                    aria-controls="users--list"
                    aria-autocomplete="list"
                    aria-describedby="users--assistiveHint"
                    aria-expanded="false"
                    autoCapitalize="off"
                    autoComplete="off"
                    className={`usa-combo-box__input ${messages.length ? "usa-input--error" : null} `}
                    type="text"
                    role="combobox"
                    aria-activedescendant=""
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <span className="usa-combo-box__clear-input__wrapper" tabIndex={-1}>
                    <button
                        name={name}
                        type="button"
                        className="usa-combo-box__clear-input"
                        aria-label="Clear the select contents"
                        onClick={() => {
                            handleChange(0);
                        }}
                    >
                        &nbsp;
                    </button>
                </span>
                <span className="usa-combo-box__input-button-separator">&nbsp;</span>
                <span className="usa-combo-box__toggle-list__wrapper" tabIndex={-1}>
                    <button
                        id="project-officer-select-toggle-list"
                        type="button"
                        tabIndex={-1}
                        className="usa-combo-box__toggle-list"
                        aria-label="Toggle the dropdown list"
                    >
                        &nbsp;
                    </button>
                </span>

                <ul
                    tabIndex={-1}
                    id="users--list"
                    className="usa-combo-box__list"
                    role="listbox"
                    aria-labelledby="project-officer-select-label"
                    hidden
                >
                    {users?.map((user, index) => {
                        return (
                            <li
                                key={user?.id}
                                aria-setsize={users?.length}
                                aria-posinset={index + 1}
                                aria-selected={false}
                                id={`project-officer-dynamic-select--list--option-${index}`}
                                className="usa-combo-box__list-option"
                                tabIndex={index === 0 ? 0 : -1}
                                role="option"
                                data-value={user?.full_name || user?.email}
                            >
                                {user?.full_name || user?.email}
                            </li>
                        );
                    })}
                </ul>

                <div className="usa-combo-box__status usa-sr-only" role="status"></div>
                <span id="users--assistiveHint" className="usa-sr-only">
                    When autocomplete results are available use up and down arrows to review and enter to select. Touch
                    device users, explore by touch or with swipe gestures.
                </span>
            </div>
        </fieldset>
    );
};

export default ProjectOfficerSelect;
