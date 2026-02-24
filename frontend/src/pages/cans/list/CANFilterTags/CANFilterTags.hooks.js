import { useState, useEffect, useCallback } from "react";
/**
 * @typedef {Object} FilterItem
 * @property {string} title
 */

/**
 * @typedef {Object} Filters
 * @property {FilterItem[]} activePeriod
 * @property {FilterItem[]} portfolio
 * @property {FilterItem[]} transfer
 * @property {[number, number]} budget
 * @property {FilterItem[]} can
 */

/**
 * @typedef {Object} Tag
 * @property {string} tagText
 * @property {string} filter
 */

/**
 * Custom hook for managing tags list
 * @param {Filters} filters
 * @returns {Tag[]}
 */
export const useTagsList = (filters) => {
    const [tagsList, setTagsList] = useState([]);

    /**
     * @param {keyof Filters} filterKey
     * @param {string} filterName
     */
    const updateTags = useCallback(
        (filterKey, filterName) => {
            if (filterKey === "budget") {
                if (Array.isArray(filters.budget) && filters.budget.length === 2) {
                    const [min, max] = filters.budget;
                    const formattedMin = new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        trailingZeroDisplay: "stripIfInteger"
                    }).format(min);
                    const formattedMax = new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        trailingZeroDisplay: "stripIfInteger"
                    }).format(max);
                    setTagsList((prevState) => [
                        ...prevState.filter((t) => t.filter !== filterName),
                        { tagText: `${formattedMin} to ${formattedMax}`, filter: filterName }
                    ]);
                } else {
                    setTagsList((prevState) => prevState.filter((t) => t.filter !== filterName));
                }
            } else {
                if (Array.isArray(filters[filterKey])) {
                    const selectedTags = filters[filterKey].map((item) => ({
                        tagText: filterKey === "activePeriod" ? `${item.title} CAN` : item.title,
                        filter: filterName
                    }));
                    setTagsList((prevState) => [...prevState.filter((t) => t.filter !== filterName), ...selectedTags]);
                } else {
                    setTagsList((prevState) => [...prevState.filter((t) => t.filter !== filterName)]);
                }
            }
        },
        [filters]
    );

    useEffect(() => {
        updateTags("activePeriod", "activePeriod");
    }, [filters.activePeriod, updateTags]);

    useEffect(() => {
        updateTags("portfolio", "portfolio");
    }, [filters.portfolio, updateTags]);

    useEffect(() => {
        updateTags("transfer", "transfer");
    }, [filters.transfer, updateTags]);

    useEffect(() => {
        updateTags("can", "can");
    }, [filters.can, updateTags]);

    useEffect(() => {
        updateTags("budget", "budget");
    }, [filters.budget, updateTags]);

    return tagsList;
};

/**
 * Removes a filter tag
 * @param {Tag} tag - The tag to remove
 * @param {function(function(Filters): Filters): void} setFilters - Function to update filters
 */
export const removeFilter = (tag, setFilters) => {
    switch (tag.filter) {
        case "activePeriod":
            setFilters((prevState) => ({
                ...prevState,
                activePeriod: prevState.activePeriod.filter((period) => `${period.title} CAN` !== tag.tagText)
            }));
            break;
        case "portfolio":
            setFilters((prevState) => ({
                ...prevState,
                portfolio: prevState.portfolio.filter((portfolio) => portfolio.title !== tag.tagText)
            }));
            break;
        case "transfer":
            setFilters((prevState) => ({
                ...prevState,
                transfer: prevState.transfer.filter((transfer) => transfer.title !== tag.tagText)
            }));
            break;
        case "can":
            setFilters((prevState) => ({
                ...prevState,
                can: prevState.can.filter((c) => c.title !== tag.tagText)
            }));
            break;
        case "budget":
            setFilters((prevState) => ({
                ...prevState,
                budget: []
            }));
            break;
        default:
            console.warn(`Unknown filter type: ${tag.filter}`);
    }
};
