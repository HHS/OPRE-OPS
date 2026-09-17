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
                    filters[filterKey]?.map((item) => ({
                        tagText: "FY " + item.title,
                        filter: filterName
                    })) ?? [];
                setTagsList((prevState) => [...prevState.filter((t) => t.filter !== filterName), ...selectedTags]);
            } else if (filterKey == "agreementName") {
                // Nickname-preferred display text (item.title) isn't unique — agreement A's
                // nick_name can equal agreement B's full name — so carry id for removeFilter to
                // key on instead of the (possibly duplicate) tagText.
                const selectedTags =
                    filters[filterKey]?.map((item) => ({
                        tagText: item.title,
                        filter: filterName,
                        id: item.id
                    })) ?? [];
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
                fiscalYear: prevState.fiscalYear.filter((fiscalYear) => "FY " + fiscalYear.title !== tag.tagText)
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
            // Key on id, not tagText — nickname-preferred display text isn't unique (agreement
            // A's nick_name can equal agreement B's full name), so two distinct selections can
            // render identical chips. Matching by tagText would remove both when only one "x" is
            // clicked.
            setFilters((prevState) => ({
                ...prevState,
                agreementName: prevState.agreementName.filter((name) => name.id !== tag.id)
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
