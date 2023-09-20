import { useEffect, useState } from "react";
import FilterTags from "../../../components/UI/FilterTags/FilterTags";
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
        const filteredTagsList = tagsList.filter((t) => t.tagText !== tag.tagText);
        setTagsList(filteredTagsList);
        switch (tag.filter) {
            case "fiscalYears":
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        fiscalYears: prevState.fiscalYears.filter(
                            (fy) => fy.title.toString() !== tag.tagText.replace("FY ", ""),
                        ),
                    };
                });
                break;
            case "portfolios":
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        portfolios: prevState.portfolios.filter((portfolio) => portfolio.name !== tag.tagText),
                    };
                });
                break;
            case "bliStatus":
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        bliStatus: prevState.bliStatus.filter((status) => status.title !== tag.tagText),
                    };
                });
                break;
        }
    };

    useEffect(() => {
        const selectedFiscalYears = [];
        Array.isArray(filters.fiscalYears) &&
            filters.fiscalYears.forEach((fiscalYear) => {
                const tag = `FY ${fiscalYear.title}`;
                selectedFiscalYears.push({ tagText: tag, filter: "fiscalYears" });
            });
        setTagsList((prevState) => prevState.filter((t) => t.filter !== "fiscalYears"));
        setTagsList((prevState) => {
            return [...prevState, ...selectedFiscalYears];
        });
    }, [filters.fiscalYears]);

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

    useEffect(() => {
        const selectedBLIStatus = [];
        Array.isArray(filters.bliStatus) &&
            filters.bliStatus.forEach((status) => {
                selectedBLIStatus.push({ tagText: status.title, filter: "bliStatus" });
            });
        setTagsList((prevState) => prevState.filter((t) => t.filter !== "bliStatus"));
        setTagsList((prevState) => {
            return [...prevState, ...selectedBLIStatus];
        });
    }, [filters.bliStatus]);

    const tagsListByFilter = _.groupBy(tagsList, "filter");
    const tagsListByFilterMerged = [];
    Array.isArray(tagsListByFilter.fiscalYears) && tagsListByFilterMerged.push(...tagsListByFilter.fiscalYears.sort());
    Array.isArray(tagsListByFilter.portfolios) && tagsListByFilterMerged.push(...tagsListByFilter.portfolios.sort());
    Array.isArray(tagsListByFilter.bliStatus) && tagsListByFilterMerged.push(...tagsListByFilter.bliStatus.sort());

    return (
        !_.isEmpty(tagsList) && (
            <div className="display-flex flex-align-center flex-wrap padding-bottom-05">
                <span className="padding-right-205 text-base-dark font-serif-3xs line-height-sans-5 padding-top-05">
                    Filters Applied:
                </span>
                <FilterTags removeFilter={removeFilter} tagsList={tagsListByFilterMerged} />
            </div>
        )
    );
};
export default BLIFilterTags;
