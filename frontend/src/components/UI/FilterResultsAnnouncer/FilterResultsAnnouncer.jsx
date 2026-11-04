import { useEffect, useRef, useState } from "react";
import { countFilterValues, describeFilterChange } from "./FilterResultsAnnouncer.helpers";

/**
 * A visually hidden live region that tells screen reader users a list's filters changed,
 * and how many results the new filters return. It waits for the new results before speaking,
 * so the count is never the stale one. A new filters object with the same contents (e.g. from a
 * fiscal year change) is not a filter change, so it says nothing.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The list page's applied filters.
 * @param {number} props.resultCount - The total number of results for the applied filters.
 * @param {boolean} props.isFetching - Whether the results are still loading.
 * @param {string} props.itemName - The singular name of a result, e.g. "agreement".
 * @param {string} props.itemNamePlural - The plural name of a result, e.g. "agreements".
 * @returns {React.ReactElement} - The live region.
 */
const FilterResultsAnnouncer = ({ filters, resultCount, isFetching, itemName, itemNamePlural }) => {
    const [pendingChange, setPendingChange] = useState(null);
    // Each message gets a new id, so a message with the same text as the last one is still a new
    // node in the live region, and screen readers announce it.
    const [message, setMessage] = useState({ id: 0, text: "" });
    const previousFiltersRef = useRef(filters);

    useEffect(() => {
        const previousFilters = previousFiltersRef.current;
        previousFiltersRef.current = filters;
        if (JSON.stringify(previousFilters) === JSON.stringify(filters)) return;
        setPendingChange(describeFilterChange(countFilterValues(previousFilters), countFilterValues(filters)));
    }, [filters]);

    useEffect(() => {
        if (!pendingChange || isFetching) return;
        const noun = resultCount === 1 ? itemName : itemNamePlural;
        setMessage((previous) => ({ id: previous.id + 1, text: `${pendingChange} ${resultCount} ${noun}.` }));
        setPendingChange(null);
    }, [pendingChange, isFetching, resultCount, itemName, itemNamePlural]);

    return (
        <div
            className="usa-sr-only"
            role="status"
            aria-live="polite"
            data-cy="filter-results-announcement"
        >
            {message.text && <span key={message.id}>{message.text}</span>}
        </div>
    );
};

export default FilterResultsAnnouncer;
