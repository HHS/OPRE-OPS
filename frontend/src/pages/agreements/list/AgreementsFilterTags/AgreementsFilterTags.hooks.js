import { useState, useEffect, useCallback } from "react";
/**
 * @typedef {Object} FYFilterItem
 * @property {string} title
 */

/**
 * @typedef {Object} PortfolioFilterItem
 * @property {string} name
 */

/**
 * @typedef {Object} BLIFilterItem
 * @property {string} title
 * @property {string} status
 */

/**
 * @typedef {Object} FilterItem
 * @property {string} title
 */

/**
 * @typedef {Object} Filters
 * @property {FYFilterItem[]} fiscalYear
 * @property {PortfolioFilterItem[]} portfolio
 * @property {FilterItem[]} projectTitle
 * @property {FilterItem[]} agreementType
 * @property {FilterItem[]} agreementName
 * @property {FilterItem[]} contractNumber
 * @property {FilterItem[]} awardType
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
            if (filterKey == "portfolio") {
                const selectedTags =
                    filters[filterKey]?.map((item) => ({
                        tagText: item.name,
                        filter: filterName
                    })) ?? [];
                setTagsList((prevState) => [...prevState.filter((t) => t.filter !== filterName), ...selectedTags]);
            } else if (filterKey == "fiscalYear") {
                const selectedTags =
                    filters[filterKey]?.map((item) => {
                        // Special handling for "All FYs" option
                        if (item.id === "all" || item.title === "All FYs") {
                            return {
                                tagText: "All FYs",
                                filter: filterName
                            };
                        }
                        // Check if title already starts with "FY " to avoid duplicating
                        const tag = item.title.toString().startsWith("FY ") ? item.title : `FY ${item.title}`;
                        return {
                            tagText: tag,
                            filter: filterName
                        };
                    }) ?? [];
                setTagsList((prevState) => [...prevState.filter((t) => t.filter !== filterName), ...selectedTags]);
            } else {
                const selectedTags =
                    filters[filterKey]?.map((item) => ({
                        tagText: item.title,
                        filter: filterName
                    })) ?? [];
                setTagsList((prevState) => [...prevState.filter((t) => t.filter !== filterName), ...selectedTags]);
            }
        },
        [filters]
    );

    useEffect(() => {
        updateTags("fiscalYear", "fiscalYear");
    }, [filters.fiscalYear, updateTags]);

    useEffect(() => {
        updateTags("portfolio", "portfolio");
    }, [filters.portfolio, updateTags]);

    useEffect(() => {
        updateTags("projectTitle", "projectTitle");
    }, [filters.projectTitle, updateTags]);

    useEffect(() => {
        updateTags("agreementType", "agreementType");
    }, [filters.agreementType, updateTags]);

    useEffect(() => {
        updateTags("agreementName", "agreementName");
    }, [filters.agreementName, updateTags]);

    useEffect(() => {
        updateTags("contractNumber", "contractNumber");
    }, [filters.contractNumber, updateTags]);

    useEffect(() => {
        updateTags("awardType", "awardType");
    }, [filters.awardType, updateTags]);

    return tagsList;
};

/**
 * Removes a filter tag
 * @param {Tag} tag - The tag to remove
 * @param {function(function(Filters): Filters): void} setFilters - Function to update filters
 */
export const removeFilter = (tag, setFilters) => {
    switch (tag.filter) {
        case "fiscalYear":
            setFilters((prevState) => ({
                ...prevState,
                fiscalYear: prevState.fiscalYear.filter((fiscalYear) => {
                    // Handle "All FYs" special case
                    if (tag.tagText === "All FYs") {
                        return fiscalYear.id !== "all" && fiscalYear.title !== "All FYs";
                    }
                    // Check if title already starts with "FY " to match the tag creation logic
                    const formattedTitle = fiscalYear.title.toString().startsWith("FY ")
                        ? fiscalYear.title
                        : `FY ${fiscalYear.title}`;
                    return formattedTitle !== tag.tagText;
                })
            }));
            break;
        case "portfolio":
            setFilters((prevState) => ({
                ...prevState,
                portfolio: prevState.portfolio.filter((portfolio) => portfolio.name !== tag.tagText)
            }));
            break;
        case "projectTitle":
            setFilters((prevState) => ({
                ...prevState,
                projectTitle: prevState.projectTitle.filter((project) => project.title !== tag.tagText)
            }));
            break;
        case "agreementType":
            setFilters((prevState) => ({
                ...prevState,
                agreementType: prevState.agreementType.filter((type) => type.title !== tag.tagText)
            }));
            break;
        case "agreementName":
            setFilters((prevState) => ({
                ...prevState,
                agreementName: prevState.agreementName.filter((name) => name.title !== tag.tagText)
            }));
            break;
        case "contractNumber":
            setFilters((prevState) => ({
                ...prevState,
                contractNumber: prevState.contractNumber.filter((contract) => contract.title !== tag.tagText)
            }));
            break;
        case "awardType":
            setFilters((prevState) => ({
                ...prevState,
                awardType: prevState.awardType.filter((award) => award.title !== tag.tagText)
            }));
            break;
        default:
            console.warn(`Unknown filter type: ${tag.filter}`);
    }
};
