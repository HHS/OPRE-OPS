import { useEffect, useState } from "react";
import _ from "lodash";
import FilterTags from "../../../components/UI/FilterTags/FilterTags";
import FilterTagsWrapper from "../../../components/UI/FilterTags/FilterTagsWrapper";

/**
 * A filter tags.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {React.JSX.Element} - The procurement shop select element.
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
                        fiscalYears: (prevState.fiscalYears ?? []).filter(
                            (fy) => fy.title.toString() !== tag.tagText.replace("FY ", "")
                        )
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

    useEffect(() => {
        const selectedFiscalYears = [];
        if (filters.fiscalYears === null) {
            selectedFiscalYears.push({ tagText: "All FYs", filter: "fiscalYears" });
        }

        Array.isArray(filters.fiscalYears) &&
            filters.fiscalYears.forEach((fiscalYear) => {
                if (fiscalYear?.id === "ALL") {
                    selectedFiscalYears.push({ tagText: "All FYs", filter: "fiscalYears" });
                    return;
                }
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

    useEffect(() => {
        if (filters.budgetRange) {
            const [min, max] = filters.budgetRange;
            const formatter = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            const tag = `${formatter.format(min)} - ${formatter.format(max)}`;
            setTagsList((prevState) => prevState.filter((t) => t.filter !== "budgetRange"));
            setTagsList((prevState) => {
                return [...prevState, { tagText: tag, filter: "budgetRange" }];
            });
        } else {
            setTagsList((prevState) => prevState.filter((t) => t.filter !== "budgetRange"));
        }
    }, [filters.budgetRange]);

    useEffect(() => {
        const selectedAgreementTypes = [];
        Array.isArray(filters.agreementTypes) &&
            filters.agreementTypes.forEach((type) => {
                selectedAgreementTypes.push({ tagText: type.title, filter: "agreementTypes" });
            });
        setTagsList((prevState) => prevState.filter((t) => t.filter !== "agreementTypes"));
        setTagsList((prevState) => {
            return [...prevState, ...selectedAgreementTypes];
        });
    }, [filters.agreementTypes]);

    useEffect(() => {
        const selectedAgreementTitles = [];
        Array.isArray(filters.agreementTitles) &&
            filters.agreementTitles.forEach((title) => {
                selectedAgreementTitles.push({ tagText: title.name, filter: "agreementTitles" });
            });
        setTagsList((prevState) => prevState.filter((t) => t.filter !== "agreementTitles"));
        setTagsList((prevState) => {
            return [...prevState, ...selectedAgreementTitles];
        });
    }, [filters.agreementTitles]);

    useEffect(() => {
        const selectedCanActivePeriods = [];
        Array.isArray(filters.canActivePeriods) &&
            filters.canActivePeriods.forEach((period) => {
                selectedCanActivePeriods.push({ tagText: period.title, filter: "canActivePeriods" });
            });
        setTagsList((prevState) => prevState.filter((t) => t.filter !== "canActivePeriods"));
        setTagsList((prevState) => {
            return [...prevState, ...selectedCanActivePeriods];
        });
    }, [filters.canActivePeriods]);

    const tagsListByFilter = _.groupBy(tagsList, "filter");
    const tagsListByFilterMerged = [];
    Array.isArray(tagsListByFilter.fiscalYears) && tagsListByFilterMerged.push(...tagsListByFilter.fiscalYears.sort());
    Array.isArray(tagsListByFilter.portfolios) && tagsListByFilterMerged.push(...tagsListByFilter.portfolios.sort());
    Array.isArray(tagsListByFilter.bliStatus) && tagsListByFilterMerged.push(...tagsListByFilter.bliStatus.sort());
    Array.isArray(tagsListByFilter.budgetRange) && tagsListByFilterMerged.push(...tagsListByFilter.budgetRange);
    Array.isArray(tagsListByFilter.agreementTypes) &&
        tagsListByFilterMerged.push(...tagsListByFilter.agreementTypes.sort());
    Array.isArray(tagsListByFilter.agreementTitles) &&
        tagsListByFilterMerged.push(...tagsListByFilter.agreementTitles.sort());
    Array.isArray(tagsListByFilter.canActivePeriods) &&
        tagsListByFilterMerged.push(...tagsListByFilter.canActivePeriods.sort());

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
export default BLIFilterTags;
