import { useEffect, useState } from "react";
import FilterTags from "../../../components/UI/FilterTags/FilterTags";
import createTagString from "../../../components/UI/FilterTags/utils";

/**
 * A filter tags.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const BLIFilterTags = ({ filters, setFilters }) => {
    const [tagsList, setTagsList] = useState([]);

    const removeFilter = (tag) => {
        switch (tag.filter) {
            case "fiscalYears":
                setTagsList((prevState) => prevState.filter((tag) => tag.filter !== "fiscalYears"));
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        fiscalYears: [],
                    };
                });
                break;
            case "portfolios":
                setTagsList((prevState) => prevState.filter((tag) => tag.filter !== "portfolios"));
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        portfolios: [],
                    };
                });
                break;
            case "bliStatus":
                setTagsList((prevState) => prevState.filter((tag) => tag.filter !== "bliStatus"));
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        bliStatus: [],
                    };
                });
                break;
        }
    };

    useEffect(() => {
        const selectedFiscalYears = [];
        Array.isArray(filters.fiscalYears) &&
            filters.fiscalYears.forEach((fiscalYear) => {
                selectedFiscalYears.push(fiscalYear.title);
            });
        createTagString(selectedFiscalYears, "fiscalYears", "FY", setTagsList);
    }, [filters.fiscalYears]);

    useEffect(() => {
        const selectedPortfolios = [];
        Array.isArray(filters.portfolios) &&
            filters.portfolios.forEach((portfolio) => {
                selectedPortfolios.push(portfolio.name);
            });
        createTagString(selectedPortfolios, "portfolios", "", setTagsList);
    }, [filters.portfolios]);

    // useEffect(() => {
    //     const selectedBudgetLineStatus = [];
    //
    //     filters.budgetLineStatus.draft && selectedBudgetLineStatus.push("Draft");
    //     filters.budgetLineStatus.planned && selectedBudgetLineStatus.push("Planned");
    //     filters.budgetLineStatus.executing && selectedBudgetLineStatus.push("Executing");
    //     filters.budgetLineStatus.obligated && selectedBudgetLineStatus.push("Obligated");
    //
    //     createTagString(selectedBudgetLineStatus, "budgetLineStatus", "Budget Line Status:", setTagsList);
    // }, [filters.budgetLineStatus]);

    // const ignoredTags = (tag) => {
    //     const tagsToIgnore = [
    //         {
    //             tagText: "Upcoming Need By Date: All Time",
    //             filter: "upcomingNeedByDate",
    //         },
    //         {
    //             tagText: "Budget Line Status: Draft, Planned, Executing, Obligated",
    //             filter: "budgetLineStatus",
    //         },
    //     ];
    //
    //     return !tagsToIgnore.some((ignoredTag) => {
    //         return _.isEqual(tag, ignoredTag);
    //     });
    // };

    return (
        <div className="display-flex flex-wrap">
            <FilterTags removeFilter={removeFilter} tagsList={tagsList} />
        </div>
    );
};
export default BLIFilterTags;
