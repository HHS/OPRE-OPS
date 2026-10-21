import { Fragment, useEffect, useId, useRef } from "react";
import { convertCodeForDisplay } from "../../../../helpers/utils";
import icons from "../../../../uswds/img/sprite.svg";
import Tag from "../../Tag";
import { getMatchedField, MAX_SEARCH_LENGTH } from "./HeaderSearch.helpers";
import useHeaderSearch, { SEARCH_STATUS } from "./HeaderSearch.hooks";
import styles from "./HeaderSearch.module.scss";
import HighlightedText from "./HighlightedText";
import SearchInfoTip from "./SearchInfoTip";

/**
 * Site-wide agreement search. Type to see up to five matching agreements (matched on ODN, title
 * or nickname); click one to open it, or press Enter / click the magnifier for the full results
 * page. Follows the WAI-ARIA editable combobox pattern with list autocomplete.
 * @component
 * @returns {React.ReactElement} The rendered component.
 */
export const HeaderSearch = () => {
    const {
        inputValue,
        results,
        count,
        status,
        activeIndex,
        isListVisible,
        trimmedQuery,
        searchedQuery,
        handleChange,
        handleKeyDown,
        handleSubmit,
        goToAgreement,
        clear,
        close,
        reopen
    } = useHeaderSearch();
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listboxId = useId();
    const optionId = (id) => `${listboxId}-option-${id}`;

    const hasOptions = isListVisible && results.length > 0;
    const activeOption = hasOptions && activeIndex >= 0 ? results[activeIndex] : null;

    // The dropdown can extend past a short or zoomed viewport: keep the highlighted row on screen.
    const activeOptionId = activeOption ? optionId(activeOption.id) : null;
    useEffect(() => {
        if (activeOptionId) {
            document.getElementById(activeOptionId)?.scrollIntoView?.({ block: "nearest" });
        }
    }, [activeOptionId]);

    // Second line of a row: the ODN and nickname when set, plus a contract's contract/task order number
    // when that is the field the search matched on (otherwise it would only add noise).
    const metaParts = (agreement) => {
        const matched = getMatchedField(agreement, searchedQuery);
        const parts = [];
        if (agreement.odn) {
            parts.push({ field: "odn", label: "ODN", value: agreement.odn });
        }
        if (matched.field === "contract_number" || matched.field === "task_order_number") {
            parts.push({ field: matched.field, label: matched.label, value: matched.value });
        }
        if (agreement.nick_name) {
            parts.push({ field: "nick_name", label: "Nickname", value: agreement.nick_name });
        }
        return parts;
    };

    const handleBlur = (event) => {
        if (!containerRef.current?.contains(event.relatedTarget)) {
            close();
        }
    };

    const handleClear = () => {
        clear();
        inputRef.current?.focus();
    };

    let liveMessage = "";
    if (status === SEARCH_STATUS.SUCCESS) {
        liveMessage = `${count} ${count === 1 ? "result" : "results"}`;
    } else if (status === SEARCH_STATUS.EMPTY) {
        liveMessage = "No results";
    } else if (status === SEARCH_STATUS.ERROR) {
        liveMessage = "Search is unavailable. Press Enter to try again.";
    }

    return (
        <div
            ref={containerRef}
            className={styles.container}
            onBlur={handleBlur}
            data-cy="header-search"
        >
            <form
                role="search"
                className={styles.form}
                onSubmit={handleSubmit}
            >
                <div className={styles.inputWrapper}>
                    <input
                        ref={inputRef}
                        id={`${listboxId}-input`}
                        name="header-search"
                        type="text"
                        role="combobox"
                        className={`usa-input ${styles.input}`}
                        placeholder="Search agreements"
                        aria-label="Search agreements"
                        aria-autocomplete="list"
                        aria-expanded={hasOptions}
                        aria-controls={listboxId}
                        aria-activedescendant={activeOption ? optionId(activeOption.id) : undefined}
                        autoComplete="off"
                        maxLength={MAX_SEARCH_LENGTH}
                        value={inputValue}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onFocus={reopen}
                        data-cy="header-search-input"
                    />
                    {inputValue && (
                        <button
                            type="button"
                            className={styles.clearButton}
                            aria-label="Clear search"
                            onClick={handleClear}
                            data-cy="header-search-clear"
                        >
                            &times;
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    className={`usa-button ${styles.submitButton}`}
                    aria-label="Search"
                    data-cy="header-search-submit"
                >
                    <svg
                        className="usa-icon"
                        aria-hidden="true"
                        focusable="false"
                        role="img"
                    >
                        <use href={`${icons}#search`}></use>
                    </svg>
                </button>
            </form>

            <div
                className={styles.dropdown}
                hidden={!isListVisible}
            >
                {/* Keep the mousedown on the dropdown from blurring the input, so the click lands. */}
                <ul
                    id={listboxId}
                    role="listbox"
                    aria-label="Matching agreements"
                    aria-busy={status === SEARCH_STATUS.LOADING}
                    className={styles.list}
                    hidden={!hasOptions}
                    onMouseDown={(event) => event.preventDefault()}
                >
                    {results.map((agreement, index) => {
                        const parts = metaParts(agreement);
                        return (
                            // Keyboard users act on options through the combobox input (aria-activedescendant + Enter).
                            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                            <li
                                key={agreement.id}
                                id={optionId(agreement.id)}
                                role="option"
                                aria-selected={index === activeIndex}
                                className={styles.option}
                                onClick={() => goToAgreement(agreement.id)}
                                data-cy="header-search-option"
                            >
                                <div className={styles.optionTitle}>
                                    <span>
                                        <HighlightedText
                                            text={agreement.name}
                                            query={searchedQuery}
                                        />
                                    </span>
                                    <span className={styles.optionTag}>
                                        <Tag
                                            tagStyle="primaryDarkTextLightBackground"
                                            text={convertCodeForDisplay("agreementType", agreement.agreement_type)}
                                            className="padding-x-1"
                                        />
                                    </span>
                                </div>
                                {parts.length > 0 && (
                                    <div className={styles.optionMeta}>
                                        {parts.map((part, partIndex) => (
                                            <Fragment key={part.field}>
                                                {partIndex > 0 && (
                                                    <>
                                                        {" "}
                                                        <span aria-hidden="true">·</span>{" "}
                                                    </>
                                                )}
                                                <span>
                                                    {part.label}:{" "}
                                                    <HighlightedText
                                                        text={part.value}
                                                        query={searchedQuery}
                                                    />
                                                </span>
                                            </Fragment>
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>

                {status === SEARCH_STATUS.SUCCESS && (
                    <div
                        className={styles.message}
                        data-cy="header-search-footer"
                    >
                        {count} {count === 1 ? "result" : "results"} · Press <strong>Enter</strong> to see all
                    </div>
                )}
                {status === SEARCH_STATUS.EMPTY && (
                    <div
                        className={styles.message}
                        data-cy="header-search-no-results"
                    >
                        No agreements match &quot;{trimmedQuery}&quot;.
                        <br />
                        Try a number, agreement title, or nickname.
                    </div>
                )}
                {status === SEARCH_STATUS.ERROR && (
                    <div
                        className={styles.message}
                        data-cy="header-search-error"
                    >
                        Search is unavailable. Press <strong>Enter</strong> to try again.
                    </div>
                )}
            </div>

            <SearchInfoTip />

            <div
                role="status"
                aria-live="polite"
                className="usa-sr-only"
            >
                {liveMessage}
            </div>
        </div>
    );
};

export default HeaderSearch;
