import { useEffect, useState } from "react";
import { useGetCansQuery } from "../../../../api/opsAPI";

export const CanSelect = ({ selectedCan, setSelectedCan }) => {
    const [inputValue, setInputValue] = useState(selectedCan?.number ?? "");

    useEffect(() => {
        setInputValue(selectedCan?.number ?? "");
    }, [selectedCan]);

    const onChangeCanSelection = (canId = 0) => {
        if (canId === 0) {
            setSelectedCan({});
            return;
        }
        const selected = canList[canId - 1];
        setSelectedCan({ ...selected });
    };

    const { data: canList, error: errorCanList, isLoading: isLoadingCanList } = useGetCansQuery();

    if (isLoadingCanList) {
        return <div>Loading...</div>;
    }
    if (errorCanList) {
        return <div>Oops, an error occurred</div>;
    }

    return (
        <>
            <label className="usa-label" htmlFor="can-select" id="can-select-label">
                CAN
            </label>
            <div className="usa-combo-box" data-enhanced="true">
                <select
                    className="usa-select usa-sr-only usa-combo-box__select"
                    name="can-select"
                    aria-hidden="true"
                    tabIndex="-1"
                    value={selectedCan?.id}
                    onChange={(e) => onChangeCanSelection(Number(e.target.value))}
                    required
                >
                    {canList.map((can) => (
                        <option key={can.id} value={can.id}>
                            {can.number}
                        </option>
                    ))}
                </select>
                <input
                    id="can-select"
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
                <span className="usa-combo-box__clear-input__wrapper" tabIndex="-1">
                    <button
                        type="button"
                        className="usa-combo-box__clear-input"
                        aria-label="Clear the select contents"
                        onClick={() => {
                            setSelectedCan({});
                        }}
                    >
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
                    aria-labelledby="can-select-label"
                    hidden
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
                                tabIndex={index === 0 ? "0" : "-1"}
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
        </>
    );
};

export default CanSelect;
