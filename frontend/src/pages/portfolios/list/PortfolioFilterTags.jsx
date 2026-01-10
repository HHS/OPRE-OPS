import { useEffect, useState } from "react";
import _ from "lodash";
import FilterTags from "../../../components/UI/FilterTags/FilterTags";
import FilterTagsWrapper from "../../../components/UI/FilterTags/FilterTagsWrapper";

// Default budget range: $0 - $100M
const DEFAULT_BUDGET_RANGE = [0, 100000000];

// Available percentage range labels
const PERCENTAGE_RANGE_LABELS = {
    over90: "Over 90% available",
    "75-90": "75% - 90% available",
    "50-75": "50% - 75% available",
    "25-50": "25% - 50% available",
    under25: "Less than 25% available"
};

/**
 * A filter tags component for portfolios.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {React.JSX.Element} - The portfolio filter tags element.
 */
export const PortfolioFilterTags = ({ filters, setFilters }) => {
    const [tagsList, setTagsList] = useState([]);

    const removeFilter = (tag) => {
        const filteredTagsList = tagsList.filter((t) => t.tagText !== tag.tagText);
        setTagsList(filteredTagsList);

        switch (tag.filter) {
            case "portfolios":
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        portfolios: prevState.portfolios.filter((portfolio) => portfolio.name !== tag.tagText)
                    };
                });
                break;
            case "budgetRange":
                // Reset to default range when budget tag is removed
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        budgetRange: DEFAULT_BUDGET_RANGE
                    };
                });
                break;
            case "availablePct": {
                // Find the range code from the label
                const rangeCode = Object.keys(PERCENTAGE_RANGE_LABELS).find(
                    (key) => PERCENTAGE_RANGE_LABELS[key] === tag.tagText
                );
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        availablePct: prevState.availablePct.filter((pct) => pct !== rangeCode)
                    };
                });
                break;
            }
        }
    };

    // Update tags when portfolios filter changes
    useEffect(() => {
        const selectedPortfolios = [];
        Array.isArray(filters.portfolios) &&
            filters.portfolios.forEach((portfolio) => {
                selectedPortfolios.push({ tagText: portfolio.name, filter: "portfolios" });
            });
        setTagsList((prevState) => prevState.filter((t) => t.filter !== "portfolios"));
        setTagsList((prevState) => {
            return [...prevState, ...selectedPortfolios];
        });
    }, [filters.portfolios]);

    // Update tags when budget range filter changes
    useEffect(() => {
        const budgetTags = [];
        // Only show tag if user has explicitly set a budget range (not DEFAULT)
        const isDefaultRange =
            filters.budgetRange &&
            filters.budgetRange.length === 2 &&
            filters.budgetRange[0] === DEFAULT_BUDGET_RANGE[0] &&
            filters.budgetRange[1] === DEFAULT_BUDGET_RANGE[1];

        if (filters.budgetRange && filters.budgetRange.length === 2 && !isDefaultRange) {
            const [min, max] = filters.budgetRange;
            const minFormatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(min);
            const maxFormatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(max);
            budgetTags.push({
                tagText: `${minFormatted} - ${maxFormatted}`,
                filter: "budgetRange"
            });
        }
        setTagsList((prevState) => prevState.filter((t) => t.filter !== "budgetRange"));
        setTagsList((prevState) => {
            return [...prevState, ...budgetTags];
        });
    }, [filters.budgetRange]);

    // Update tags when available percentage filter changes
    useEffect(() => {
        const availablePctTags = [];
        // Sort by the order defined in PERCENTAGE_RANGE_LABELS keys
        const orderedRangeCodes = ["over90", "75-90", "50-75", "25-50", "under25"];

        // Only include tags for ranges that are actually selected
        orderedRangeCodes.forEach((rangeCode) => {
            if (Array.isArray(filters.availablePct) && filters.availablePct.includes(rangeCode)) {
                const label = PERCENTAGE_RANGE_LABELS[rangeCode] || rangeCode;
                availablePctTags.push({ tagText: label, filter: "availablePct" });
            }
        });

        setTagsList((prevState) => prevState.filter((t) => t.filter !== "availablePct"));
        setTagsList((prevState) => {
            return [...prevState, ...availablePctTags];
        });
    }, [filters.availablePct]);

    const tagsListByFilter = _.groupBy(tagsList, "filter");
    const tagsListByFilterMerged = [];
    Array.isArray(tagsListByFilter.portfolios) && tagsListByFilterMerged.push(...tagsListByFilter.portfolios.sort());
    Array.isArray(tagsListByFilter.budgetRange) && tagsListByFilterMerged.push(...tagsListByFilter.budgetRange);
    // Don't sort availablePct tags - preserve the order from PERCENTAGE_RANGE_LABELS
    Array.isArray(tagsListByFilter.availablePct) && tagsListByFilterMerged.push(...tagsListByFilter.availablePct);

    return (
        !_.isEmpty(tagsList) && (
            <FilterTagsWrapper>
                <FilterTags
                    removeFilter={removeFilter}
                    tagsList={tagsListByFilterMerged}
                />
            </FilterTagsWrapper>
        )
    );
};

export default PortfolioFilterTags;
