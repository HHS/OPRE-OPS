import { useEffect, useState, useCallback } from "react";
import _ from "lodash";
import FilterTags from "../../../../components/UI/FilterTags";
import FilterTagsWrapper from "../../../../components/UI/FilterTags/FilterTagsWrapper";

/**
 * @typedef {Object} Tag
 * @property {string} tagText
 * @property {string} filter
 */

/**
 * @typedef {Object} FilterItem
 * @property {string} title
 */

/**
 * @typedef {Object} Filters
 * @property {FilterItem[]} activePeriod
 * @property {FilterItem[]} portfolio
 * @property {FilterItem[]} transfer
 */

/**
 * Custom hook for managing tags list
 * @param {Filters} filters
 * @returns {Tag[]}
 */
const useTagsList = (filters) => {
    const [tagsList, setTagsList] = useState([]);

    const updateTags = useCallback(
        (filterKey, filterName) => {
            if (!Array.isArray(filters[filterKey])) return;

            const selectedTags = filters[filterKey].map((item) => ({
                tagText: item.title,
                filter: filterName
            }));

            setTagsList((prevState) => [...prevState.filter((t) => t.filter !== filterName), ...selectedTags]);
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

    return tagsList;
};

/**
 * A filter tags component.
 * @param {Object} props - The component props.
 * @param {Filters} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element|null} The filter tags component or null if no tags.
 */
export const CANFilterTags = ({ filters, setFilters }) => {
    const tagsList = useTagsList(filters);

    /**
     * Removes a filter tag
     * @param {Tag} tag - The tag to remove
     */
    const removeFilter = (tag) => {
        switch (tag.filter) {
            case "activePeriod":
                setFilters((prevState) => ({
                    ...prevState,
                    activePeriod: prevState.activePeriod.filter((period) => period.title !== tag.tagText)
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
            default:
                console.warn(`Unknown filter type: ${tag.filter}`);
        }
    };

    const tagsListByFilter = _.groupBy(tagsList, "filter");
    const tagsListByFilterMerged = Object.values(tagsListByFilter)
        .flat()
        .sort((a, b) => a.tagText.localeCompare(b.tagText));

    if (tagsList.length === 0) {
        return null;
    }

    return (
        <FilterTagsWrapper>
            <FilterTags
                removeFilter={removeFilter}
                tagsList={tagsListByFilterMerged}
            />
        </FilterTagsWrapper>
    );
};

export default CANFilterTags;
