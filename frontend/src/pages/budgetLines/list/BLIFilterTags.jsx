import { useEffect, useState } from "react";
import FilterTags from "../../../components/UI/FilterTags/FilterTags";
import createTagString from "../../../components/UI/FilterTags/utils";
import _ from "lodash";

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

    useEffect(() => {
        const selectedBLIStatus = [];
        Array.isArray(filters.bliStatus) &&
            filters.bliStatus.forEach((status) => {
                selectedBLIStatus.push(status.title);
            });
        createTagString(selectedBLIStatus, "bliStatus", "", setTagsList);
    }, [filters.bliStatus]);

    return (
        !_.isEmpty(tagsList) && (
            <div className="display-flex flex-align-center flex-wrap padding-bottom-05">
                <span className="padding-right-205 text-base-dark font-serif-3xs line-height-sans-5 padding-top-05">
                    Filters Applied:
                </span>
                <FilterTags removeFilter={removeFilter} tagsList={tagsList} />
            </div>
        )
    );
};
export default BLIFilterTags;
