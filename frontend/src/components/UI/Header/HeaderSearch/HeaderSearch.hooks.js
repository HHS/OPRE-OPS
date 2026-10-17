import { useCallback, useEffect, useRef, useState } from "react";
import { createSearchParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useLazySearchAgreementsQuery } from "../../../../api/opsAPI";
import { MAX_SEARCH_LENGTH, MIN_SEARCH_LENGTH } from "./HeaderSearch.helpers";

export const SEARCH_STATUS = {
    IDLE: "idle",
    LOADING: "loading",
    SUCCESS: "success",
    EMPTY: "empty",
    ERROR: "error"
};

const DEBOUNCE_MS = 300;
const DROPDOWN_LIMIT = 5;
const SEARCH_PATH = "/search";

/**
 * Type-ahead state for the header agreement search.
 *
 * - Waits DEBOUNCE_MS after the last keystroke and only searches at MIN_SEARCH_LENGTH+ characters.
 * - Aborts the previous in-flight request when a new one starts; a latest-request guard is a
 *   second line of defense so a slow response can never overwrite a newer one.
 * - Clearing the input, Esc, a too-short query, submitting and unmounting all cancel the pending
 *   timer and in-flight request, so a late response can't reopen the dropdown.
 * - The header remounts on every page, so the query is only pre-filled from the URL on /search.
 */
const useHeaderSearch = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [searchParams] = useSearchParams();
    const isOnSearchPage = pathname === SEARCH_PATH;
    const urlQuery = isOnSearchPage ? (searchParams.get("q") ?? "") : "";

    const [trigger] = useLazySearchAgreementsQuery();
    const [inputValue, setInputValue] = useState(urlQuery);
    const [results, setResults] = useState([]);
    const [count, setCount] = useState(0);
    const [status, setStatus] = useState(SEARCH_STATUS.IDLE);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const timerRef = useRef(null);
    const requestRef = useRef(null);
    const latestSearchRef = useRef(0);

    const cancelPending = useCallback(() => {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        requestRef.current?.abort?.();
        requestRef.current = null;
        latestSearchRef.current += 1;
    }, []);

    const resetResults = useCallback(() => {
        cancelPending();
        setResults([]);
        setCount(0);
        setStatus(SEARCH_STATUS.IDLE);
        setActiveIndex(-1);
        setIsOpen(false);
    }, [cancelPending]);

    // Keep the box in sync with the URL on /search (Back/Forward, links to other searches). The text
    // changes under the user, so drop any dropdown/pending search that belonged to the old text.
    const syncedUrlQueryRef = useRef(urlQuery);
    useEffect(() => {
        if (syncedUrlQueryRef.current === urlQuery) {
            return;
        }
        syncedUrlQueryRef.current = urlQuery;
        setInputValue(urlQuery);
        resetResults();
    }, [urlQuery, resetResults]);

    // The header unmounts on every navigation: drop the timer and invalidate in-flight requests.
    useEffect(() => {
        return () => {
            clearTimeout(timerRef.current);
            requestRef.current?.abort?.();
            latestSearchRef.current = -1;
        };
    }, []);

    const runSearch = useCallback(
        async (q) => {
            requestRef.current?.abort?.();
            const searchId = ++latestSearchRef.current;
            const request = trigger({ q, limit: DROPDOWN_LIMIT, offset: 0 }, false);
            requestRef.current = request;

            try {
                const response = await request.unwrap();
                if (searchId !== latestSearchRef.current) {
                    return;
                }
                const data = response?.data ?? [];
                setResults(data);
                setCount(response?.count ?? data.length);
                setStatus(data.length > 0 ? SEARCH_STATUS.SUCCESS : SEARCH_STATUS.EMPTY);
                setActiveIndex(-1);
                setIsOpen(true);
            } catch (error) {
                if (searchId !== latestSearchRef.current || error?.name === "AbortError") {
                    return;
                }
                console.error("Agreement search failed", error);
                setResults([]);
                setCount(0);
                setStatus(SEARCH_STATUS.ERROR);
                setActiveIndex(-1);
                setIsOpen(true);
            }
        },
        [trigger]
    );

    const handleChange = (event) => {
        const value = event.target.value.slice(0, MAX_SEARCH_LENGTH);
        setInputValue(value);
        // Typing invalidates any highlighted row: Enter must not open a result for the old text.
        setActiveIndex(-1);
        const trimmed = value.trim();
        if (trimmed.length < MIN_SEARCH_LENGTH) {
            resetResults();
            return;
        }
        // Invalidate the request for the previous text too, not just its timer: it may settle while
        // this query is still debouncing and must not install rows for text that is no longer there.
        // Rows that already settled stay on screen (as the busy list) until this query answers.
        cancelPending();
        setStatus(SEARCH_STATUS.LOADING);
        timerRef.current = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS);
    };

    const clear = useCallback(() => {
        setInputValue("");
        resetResults();
    }, [resetResults]);

    // Focus left the box: also drop any pending/in-flight search, so a late response can't pop the
    // dropdown back open over whatever the user moved on to.
    const close = useCallback(() => {
        const wasLoading = status === SEARCH_STATUS.LOADING;
        cancelPending();
        if (wasLoading) {
            // The rows on screen belong to an older query than the text in the box: drop them so
            // refocusing can't offer (or Enter open) a stale result.
            setResults([]);
            setCount(0);
            setActiveIndex(-1);
            setStatus(SEARCH_STATUS.IDLE);
        }
        setIsOpen(false);
    }, [cancelPending, status]);

    const goToAgreement = (id) => {
        // Clear the box too: moving between agreements (/agreements/6 -> /agreements/7) keeps the
        // same page, so the header isn't remounted and would otherwise hold the old query.
        clear();
        navigate(`/agreements/${id}`);
    };

    const submit = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) {
            return;
        }
        resetResults();
        navigate(`${SEARCH_PATH}?${createSearchParams({ q: trimmed })}`, { replace: isOnSearchPage });
    };

    const isListVisible =
        isOpen && (results.length > 0 || status === SEARCH_STATUS.EMPTY || status === SEARCH_STATUS.ERROR);

    const reopen = () => {
        if (results.length > 0 || status === SEARCH_STATUS.EMPTY || status === SEARCH_STATUS.ERROR) {
            setIsOpen(true);
        }
    };

    const handleKeyDown = (event) => {
        // Esc/Enter/arrows during IME composition belong to the IME (e.g. Esc cancels the composition).
        if (event.nativeEvent?.isComposing) {
            return;
        }
        if (event.key === "Escape") {
            clear();
            return;
        }
        // While the next query is still debouncing / in flight, the rows on screen belong to the previous
        // text: they must not be highlightable, or Enter would open an agreement for text no longer typed.
        if (status === SEARCH_STATUS.LOADING && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            return;
        }
        if (event.key === "ArrowDown") {
            if (results.length === 0) {
                return;
            }
            event.preventDefault();
            if (!isListVisible) {
                setIsOpen(true);
                return;
            }
            setActiveIndex((index) => Math.min(index + 1, results.length - 1));
        } else if (event.key === "ArrowUp") {
            if (!isListVisible) {
                return;
            }
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, -1));
        } else if (event.key === "Enter" && isListVisible && activeIndex >= 0 && results[activeIndex]) {
            // A highlighted row wins over the form's implicit submit.
            event.preventDefault();
            goToAgreement(results[activeIndex].id);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        submit();
    };

    return {
        inputValue,
        results,
        count,
        status,
        activeIndex,
        isListVisible,
        trimmedQuery: inputValue.trim(),
        handleChange,
        handleKeyDown,
        handleSubmit,
        goToAgreement,
        clear,
        close,
        reopen
    };
};

export default useHeaderSearch;
