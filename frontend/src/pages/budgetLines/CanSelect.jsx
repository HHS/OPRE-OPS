export const CanSelect = () => {
    return (
        <>
            <label className="usa-label" htmlFor="can">
                CAN
            </label>
            <div className="usa-combo-box" data-enhanced="true">
                <select
                    className="usa-select usa-sr-only usa-combo-box__select"
                    name="can"
                    id="can"
                    aria-hidden="true"
                    tabIndex="-1"
                >
                    <option value="">Select a CAN</option>
                    <option value="G99HS22">G99HS22</option>
                    <option value="G99HS23">G99HS23</option>
                    <option value="G99HS24">G99HS24</option>
                </select>
                <input
                    id="can"
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
                />
                <span className="usa-combo-box__clear-input__wrapper" tabIndex="-1">
                    <button type="button" className="usa-combo-box__clear-input" aria-label="Clear the select contents">
                        &nbsp;
                    </button>
                </span>
                <span className="usa-combo-box__input-button-separator">&nbsp;</span>
                <span className="usa-combo-box__toggle-list__wrapper" tabIndex="-1">
                    <button
                        type="button"
                        tabIndex="-1"
                        className="usa-combo-box__toggle-list"
                        aria-label="Toggle the dropdown list"
                    >
                        &nbsp;
                    </button>
                </span>
                <ul
                    tabIndex="-1"
                    id="can--list"
                    className="usa-combo-box__list"
                    role="listbox"
                    aria-labelledby="agreement-label"
                    hidden="true"
                >
                    <li
                        aria-setsize="64"
                        aria-posinset="1"
                        aria-selected="false"
                        id="can--list--option-1"
                        className="usa-combo-box__list-option"
                        tabIndex="0"
                        role="option"
                        data-value="G99HS22"
                    >
                        G99HS22
                    </li>
                    <li
                        aria-setsize="64"
                        aria-posinset="2"
                        aria-selected="false"
                        id="can--list--option-2"
                        className="usa-combo-box__list-option"
                        tabIndex="-1"
                        role="option"
                        data-value="G99HS23"
                    >
                        G99HS23
                    </li>
                    <li
                        aria-setsize="64"
                        aria-posinset="3"
                        aria-selected="false"
                        id="can--list--option-3"
                        className="usa-combo-box__list-option"
                        tabIndex="-1"
                        role="option"
                        data-value="G99HS24"
                    >
                        G99HS24
                    </li>
                </ul>
                <div className="usa-combo-box__status usa-sr-only" role="status"></div>
                <span id="can--assistiveHint" className="usa-sr-only">
                    When autocomplete results are available use up and down arrows to review and enter to select. Touch
                    device users, explore by touch or with swipe gestures.
                </span>
            </div>
        </>
    );
};
