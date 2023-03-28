import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedCan } from "./createBudgetLineSlice";
import { getCanList } from "../cans/list/getCanList";

export const CanSelect = () => {
    const dispatch = useDispatch();
    const canList = useSelector((state) => state.canList.cans);
    const selectedCan = useSelector((state) => state.createBudgetLine.selected_can);
    const onChangeCanSelection = (canId = 0) => {
        if (canId === 0) {
            return;
        }
        dispatch(
            setSelectedCan({
                id: canId,
                number: canList[canId - 1].number,
            })
        );
    };

    React.useEffect(() => {
        dispatch(getCanList());
    }, [dispatch]);

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
                    defaultValue={selectedCan?.number}
                    onChange={(e) => onChangeCanSelection(e.target.value || 0)}
                >
                    <option value="">Select a CAN</option>
                    {canList.map((can) => (
                        <option key={can.id} value={can.id}>
                            {can.number}
                        </option>
                    ))}
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
                    defaultValue={selectedCan?.number}
                />
                <span className="usa-combo-box__clear-input__wrapper" tabIndex="-1">
                    <button
                        type="button"
                        className="usa-combo-box__clear-input"
                        aria-label="Clear the select contents"
                        onClick={() => dispatch(setSelectedCan({}))}
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
                    aria-labelledby="agreement-label"
                    hidden
                >
                    {canList?.map((can, index) => {
                        return (
                            <li
                                key={can?.id}
                                aria-setsize={can?.length}
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
