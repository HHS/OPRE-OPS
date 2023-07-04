import { useEffect, useState } from "react";
import cx from "clsx";
import { useGetCansQuery } from "../../../../api/opsAPI";

/**
 *  A comboBox for choosing a CAN
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label] - The label to display for the input field (optional).
 * @param {number} props.selectedCan - The currently selected agreement type.
 * @param {Function} props.setSelectedCan - A function to call when the selected agreement type changes.
 * @param {Function} props.onChange - A function to call when the input value changes.
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const CanSelect = ({
    name,
    label = name,
    selectedCan,
    setSelectedCan,
    onChange,
    pending = false,
    messages = [],
    className,
}) => {
    const [inputValue, setInputValue] = useState(selectedCan?.number ?? "");

    useEffect(() => {
        setInputValue(selectedCan?.number ?? "");
    }, [selectedCan]);

    /**
     * function to handle changes to the comboBox
     * @param {number} canId - The component props.
     */
    const handleChange = (canId) => {
        const selected = canList[canId - 1];
        setSelectedCan({ ...selected });
        onChange(name, canId);
    };

    const { data: canList, error: errorCanList, isLoading: isLoadingCanList } = useGetCansQuery();

    if (isLoadingCanList) {
        return <div>Loading...</div>;
    }
    if (errorCanList) {
        return <div>Oops, an error occurred</div>;
    }

    return (
        <fieldset className={cx("usa-fieldset", pending && "pending", className)}>
            <label
                id={`${name}-label`}
                className={`usa-label ${messages.length ? "usa-label--error" : null} `}
                htmlFor={name}
            >
                {label}
            </label>
            {messages.length ? (
                <span className="usa-error-message" id="input-error-message" role="alert">
                    {messages[0]}
                </span>
            ) : null}
            <div className="usa-combo-box" data-enhanced="true">
                <select
                    className="usa-select usa-sr-only usa-combo-box__select"
                    name={name}
                    aria-hidden="true"
                    tabIndex={-1}
                    value={selectedCan?.id}
                    onChange={(e) => handleChange(Number(e.target.value))}
                >
                    {canList.map((can) => (
                        <option key={can.id} value={can.id}>
                            {can.number}
                        </option>
                    ))}
                </select>
                <input
                    id={name}
                    aria-owns="can--list"
                    aria-controls="can--list"
                    aria-autocomplete="list"
                    aria-describedby="can--assistiveHint"
                    aria-expanded="false"
                    autoCapitalize="off"
                    autoComplete="off"
                    className="usa-combo-box__input"
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
                    id="can--list"
                    className="usa-combo-box__list"
                    role="listbox"
                    aria-labelledby={`${name}-label`}
                    hidden={true}
                >
                    {canList?.map((can, index) => {
                        return (
                            <li
                                key={can?.id}
                                aria-setsize={canList?.length}
                                aria-posinset={index + 1}
                                aria-selected="false"
                                id={`dynamic-select--list--option-${index}`}
                                className="usa-combo-box__list-option"
                                tabIndex={index === 0 ? 0 : -1}
                                role="option"
                                data-value={can?.number}
                            >
                                {can?.number}
                            </li>
                        );
                    })}
                </ul>

                <div className="usa-combo-box__status usa-sr-only" role="status"></div>
                <span id="can--assistiveHint" className="usa-sr-only">
                    When autocomplete results are available use up and down arrows to review and enter to select. Touch
                    device users, explore by touch or with swipe gestures.
                </span>
            </div>
        </fieldset>
    );
};

export default CanSelect;
