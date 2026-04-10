import { useMemo } from "react";
import _ from "lodash";
import FilterTags from "../../../components/UI/FilterTags/FilterTags";
import FilterTagsWrapper from "../../../components/UI/FilterTags/FilterTagsWrapper";

/**
 * A filter tags.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @param {Object} props.fyHelpers - Fiscal year helper functions (approach-specific).
 * @returns {React.JSX.Element} - The procurement shop select element.
 */
export const BLIFilterTags = ({ filters, setFilters, fyHelpers }) => {
    // Tag removal is a quick action - immediately updates filters
    const removeFilter = (tag) => {
        switch (tag.filter) {
            case "fiscalYears":
                // ============================================
                // TEMPORARY: A/B Testing - Use approach-specific tag removal
                // ============================================
                setFilters((prevState) => {
                    const updated = fyHelpers.handleTagRemoval(prevState.fiscalYears, tag.tagText);
                    return {
                        ...prevState,
                        fiscalYears: updated
                    };
                });
                break;
            case "portfolios":
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        portfolios: (prevState.portfolios ?? []).filter((portfolio) => portfolio.name !== tag.tagText)
                    };
                });
                break;
            case "bliStatus":
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        bliStatus: (prevState.bliStatus ?? []).filter((status) => status.title !== tag.tagText)
                    };
                });
                break;
            case "budgetRange":
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        budgetRange: null
                    };
                });
                break;
            case "agreementTypes":
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        agreementTypes: (prevState.agreementTypes ?? []).filter((type) => type.title !== tag.tagText)
                    };
                });
                break;
            case "agreementTitles":
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        agreementTitles: (prevState.agreementTitles ?? []).filter((title) => title.name !== tag.tagText)
                    };
                });
                break;
            case "canActivePeriods":
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        canActivePeriods: (prevState.canActivePeriods ?? []).filter(
                            (period) => period.title !== tag.tagText
                        )
                    };
                });
                break;
        }
    };

    // ============================================
    // TEMPORARY: A/B Testing - Derive tags using approach-specific helper
    // ============================================
    const fiscalYearTags = useMemo(() => fyHelpers.deriveTags(filters.fiscalYears), [filters.fiscalYears, fyHelpers]);

    const portfolioTags = useMemo(() => {
        if (!Array.isArray(filters.portfolios)) return [];
        return filters.portfolios.map((portfolio) => ({
            tagText: portfolio.name,
            filter: "portfolios"
        }));
    }, [filters.portfolios]);

    const bliStatusTags = useMemo(() => {
        if (!Array.isArray(filters.bliStatus)) return [];
        return filters.bliStatus.map((status) => ({
            tagText: status.title,
            filter: "bliStatus"
        }));
    }, [filters.bliStatus]);

    const budgetRangeTags = useMemo(() => {
        if (!filters.budgetRange) return [];
        const [min, max] = filters.budgetRange;
        const formatter = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        const tag = `${formatter.format(min)} - ${formatter.format(max)}`;
        return [{ tagText: tag, filter: "budgetRange" }];
    }, [filters.budgetRange]);

    const agreementTypeTags = useMemo(() => {
        if (!Array.isArray(filters.agreementTypes)) return [];
        return filters.agreementTypes.map((type) => ({
            tagText: type.title,
            filter: "agreementTypes"
        }));
    }, [filters.agreementTypes]);

    const agreementTitleTags = useMemo(() => {
        if (!Array.isArray(filters.agreementTitles)) return [];
        return filters.agreementTitles.map((title) => ({
            tagText: title.name,
            filter: "agreementTitles"
        }));
    }, [filters.agreementTitles]);

    const canActivePeriodTags = useMemo(() => {
        if (!Array.isArray(filters.canActivePeriods)) return [];
        return filters.canActivePeriods.map((period) => ({
            tagText: period.title,
            filter: "canActivePeriods"
        }));
    }, [filters.canActivePeriods]);

    // Combine all tags
    const tagsList = useMemo(() => {
        return [
            ...fiscalYearTags,
            ...portfolioTags,
            ...bliStatusTags,
            ...budgetRangeTags,
            ...agreementTypeTags,
            ...agreementTitleTags,
            ...canActivePeriodTags
        ];
    }, [
        fiscalYearTags,
        portfolioTags,
        bliStatusTags,
        budgetRangeTags,
        agreementTypeTags,
        agreementTitleTags,
        canActivePeriodTags
    ]);

    // Group and sort tags by filter type for consistent display order
    const sortedTagsList = useMemo(() => {
        const sortTagsByText = (tags) => tags.sort((a, b) => (a.tagText || "").localeCompare(b.tagText || ""));

        const tagsListByFilter = _.groupBy(tagsList, "filter");
        const merged = [];
        Array.isArray(tagsListByFilter.fiscalYears) && merged.push(...sortTagsByText([...tagsListByFilter.fiscalYears]));
        Array.isArray(tagsListByFilter.portfolios) && merged.push(...sortTagsByText([...tagsListByFilter.portfolios]));
        Array.isArray(tagsListByFilter.bliStatus) && merged.push(...sortTagsByText([...tagsListByFilter.bliStatus]));
        Array.isArray(tagsListByFilter.budgetRange) && merged.push(...tagsListByFilter.budgetRange);
        Array.isArray(tagsListByFilter.agreementTypes) && merged.push(...sortTagsByText([...tagsListByFilter.agreementTypes]));
        Array.isArray(tagsListByFilter.agreementTitles) && merged.push(...sortTagsByText([...tagsListByFilter.agreementTitles]));
        Array.isArray(tagsListByFilter.canActivePeriods) && merged.push(...sortTagsByText([...tagsListByFilter.canActivePeriods]));
        return merged;
    }, [tagsList]);

    return (
        !_.isEmpty(sortedTagsList) && (
            <FilterTagsWrapper>
                <FilterTags
                    removeFilter={removeFilter}
                    tagsList={sortedTagsList}
                />
            </FilterTagsWrapper>
        )
    );
};
export default BLIFilterTags;
