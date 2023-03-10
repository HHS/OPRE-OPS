export const AgreementSelect = () => {
    return (
        <>
            <label className="usa-label" htmlFor="agreement">
                Agreement
            </label>
            <div className="usa-combo-box" data-enhanced="true">
                <select
                    className="usa-select usa-sr-only usa-combo-box__select"
                    name="agreement"
                    id=""
                    aria-hidden="true"
                    tabIndex="-1"
                >
                    <option value="">Select a agreement</option>
                    <option value="using-innovative-data">Using Innovative Data to Explore Racial...</option>
                    <option value="using-research">Using Research</option>
                    <option value="using-data-to-explore">Using Data to Explore</option>
                </select>
                <input
                    id="agreement"
                    aria-owns="agreement--list"
                    aria-controls="agreement--list"
                    aria-autocomplete="list"
                    aria-describedby="agreement--assistiveHint"
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
                    id="agreement--list"
                    className="usa-combo-box__list"
                    role="listbox"
                    aria-labelledby="agreement-label"
                    hidden="true"
                >
                    <li
                        aria-setsize="64"
                        aria-posinset="1"
                        aria-selected="false"
                        id="agreement--list--option-1"
                        className="usa-combo-box__list-option"
                        tabIndex="0"
                        role="option"
                        data-value="using-innovative-data"
                    >
                        Using Innovative Data to Explore Racial...
                    </li>
                    <li
                        aria-setsize="64"
                        aria-posinset="2"
                        aria-selected="false"
                        id="agreement--list--option-2"
                        className="usa-combo-box__list-option"
                        tabIndex="-1"
                        role="option"
                        data-value="using-research"
                    >
                        Using Research
                    </li>
                    <li
                        aria-setsize="64"
                        aria-posinset="3"
                        aria-selected="false"
                        id="agreement--list--option-3"
                        className="usa-combo-box__list-option"
                        tabIndex="-1"
                        role="option"
                        data-value="using-data-to-explore"
                    >
                        Using Data to Explore
                    </li>
                </ul>
                <div className="usa-combo-box__status usa-sr-only" role="status"></div>
                <span id="agreement--assistiveHint" className="usa-sr-only">
                    When autocomplete results are available use up and down arrows to review and enter to select. Touch
                    device users, explore by touch or with swipe gestures.
                </span>
            </div>
        </>
    );
};
