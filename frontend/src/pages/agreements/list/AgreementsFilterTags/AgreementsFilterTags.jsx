// import { useEffect, useState } from "react";
import _ from "lodash";
// import { convertCodeForDisplay } from "../../../../helpers/utils";
import FilterTags from "../../../../components/UI/FilterTags/FilterTags";
// import createTagString from "../../../../components/UI/FilterTags/utils";
import FilterTagsWrapper from "../../../../components/UI/FilterTags/FilterTagsWrapper";
import { removeFilter, useTagsList } from "./AgreementsFilterTags.hooks"
/**
 * A filter tags.
 * @param {Object} props - The component props.
 * @param {import("./AgreementsFilterTags.hooks").Filters} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const AgreementsFilterTags = ({ filters, setFilters }) => {
    const tagsList = useTagsList(filters);

    const tagsListByFilter = _.groupBy(tagsList, "filter");
    const tagsListByFilterMerged = Object.values(tagsListByFilter).flat();


    // useEffect(() => {
    //     setTagsList((prevState) => prevState.filter((tag) => tag.filter !== "upcomingNeedByDate"));
    //     switch (filters.upcomingNeedByDate) {
    //         case "next-30-days":
    //             setTagsList((prevState) => {
    //                 return [
    //                     ...prevState,
    //                     {
    //                         tagText: "Upcoming Need By Date: Next 30 Days",
    //                         filter: "upcomingNeedByDate"
    //                     }
    //                 ];
    //             });
    //             break;
    //         case "current-fy":
    //             setTagsList((prevState) => {
    //                 return [
    //                     ...prevState,
    //                     {
    //                         tagText: "Upcoming Need By Date: Current FY",
    //                         filter: "upcomingNeedByDate"
    //                     }
    //                 ];
    //             });
    //             break;
    //         case "next-6-months":
    //             setTagsList((prevState) => {
    //                 return [
    //                     ...prevState,
    //                     {
    //                         tagText: "Upcoming Need By Date: Next 6 Months",
    //                         filter: "upcomingNeedByDate"
    //                     }
    //                 ];
    //             });
    //             break;
    //         case "all-time":
    //             setTagsList((prevState) => {
    //                 return [
    //                     ...prevState,
    //                     {
    //                         tagText: "Upcoming Need By Date: All Time",
    //                         filter: "upcomingNeedByDate"
    //                     }
    //                 ];
    //             });
    //             break;
    //     }
    // }, [filters.upcomingNeedByDate]);

    // useEffect(() => {
    //     const selectedProjects = [];
    //     filters.projects.forEach((project) => {
    //         selectedProjects.push(project.title);
    //     });
    //     createTagString(selectedProjects, "projects", "Project:", setTagsList);
    // }, [filters.projects]);

    // useEffect(() => {
    //     const selectedProjectOfficers = [];
    //     filters.projectOfficers.forEach((po) => {
    //         selectedProjectOfficers.push(po.full_name);
    //     });
    //     createTagString(selectedProjectOfficers, "projectOfficers", "Project Officer:", setTagsList);
    // }, [filters.projectOfficers]);

    // useEffect(() => {
    //     const selectedAgreementTypes = [];
    //     filters.types.forEach((agreementType) => {
    //         selectedAgreementTypes.push(convertCodeForDisplay("agreementType", agreementType));
    //     });
    //     createTagString(selectedAgreementTypes, "types", "Type:", setTagsList);
    // }, [filters.types]);

    // useEffect(() => {
    //     const selectedProcurementShops = [];
    //     filters.procurementShops.forEach((shop) => {
    //         selectedProcurementShops.push(shop.name);
    //     });
    //     createTagString(selectedProcurementShops, "procurementShops", "Procurement Shop:", setTagsList);
    // }, [filters.procurementShops]);

    // useEffect(() => {
    //     const selectedBudgetLineStatus = [];

    //     filters.budgetLineStatus.draft && selectedBudgetLineStatus.push("Draft");
    //     filters.budgetLineStatus.planned && selectedBudgetLineStatus.push("Planned");
    //     filters.budgetLineStatus.executing && selectedBudgetLineStatus.push("Executing");
    //     filters.budgetLineStatus.obligated && selectedBudgetLineStatus.push("Obligated");

    //     createTagString(selectedBudgetLineStatus, "budgetLineStatus", "Budget Line Status:", setTagsList);
    // }, [filters.budgetLineStatus]);

    const ignoredTags = (tag) => {
        const tagsToIgnore = [
            {
                tagText: "Upcoming Need By Date: All Time",
                filter: "upcomingNeedByDate"
            },
            {
                tagText: "Budget Line Status: Draft, Planned, Executing, Obligated",
                filter: "budgetLineStatus"
            }
        ];

        return !tagsToIgnore.some((ignoredTag) => {
            return _.isEqual(tag, ignoredTag);
        });
    };

    return (
        !_.isEmpty(tagsList.filter(ignoredTags)) && (
            <FilterTagsWrapper>
                <FilterTags
                    removeFilter={(tag) => removeFilter(tag, setFilters)}
                    tagsList={tagsListByFilterMerged.filter(ignoredTags)}
                />
            </FilterTagsWrapper>
        )
    );
};
export default AgreementsFilterTags;
