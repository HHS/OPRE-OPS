import "./AgreementsList.scss";
import icons from "../../../uswds/img/sprite.svg";
import { useEffect, useState } from "react";
import { convertCodeForDisplay } from "../../../helpers/utils";

/**
 * Header section above the Agreements List table.
 * @returns {ReactNode} The rendered component.
 */
export const AgreementsFilterTags = ({ filters, setFilters }) => {
    const [tagsList, setTagsList] = useState([]);

    console.log("tagsList", tagsList);
    console.log("filters", filters);

    const removeFilter = (tag) => {
        console.log("tag", tag);
        switch (tag.filter) {
            case "upcomingNeedByDate":
                setTagsList((prevState) => prevState.filter((tag) => tag.filter !== "upcomingNeedByDate"));
                setTagsList((prevState) => {
                    return [
                        ...prevState,
                        {
                            tagText: "Upcoming Need By Date: Next 30 Days",
                            filter: "upcomingNeedByDate",
                        },
                    ];
                });
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        upcomingNeedByDate: "next-30-days",
                    };
                });
                break;
            case "projects":
                setTagsList((prevState) => prevState.filter((tag) => tag.filter !== "projects"));
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        projects: [],
                    };
                });
                break;
            case "projectOfficers":
                setTagsList((prevState) => prevState.filter((tag) => tag.filter !== "projectOfficers"));
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        projectOfficers: [],
                    };
                });
                break;
            case "types":
                setTagsList((prevState) => prevState.filter((tag) => tag.filter !== "types"));
                setFilters((prevState) => {
                    return {
                        ...prevState,
                        types: [],
                    };
                });
                break;
        }
    };

    const FilterTag = ({ tag }) => (
        <div
            className="font-12px height-205 radius-md bg-brand-primary-light display-flex flex-align-center"
            style={{ width: "fit-content", padding: "5px" }}
        >
            {tag.tagText}
            <svg
                className="height-2 width-2 text-primary-dark margin-left-05 hover: cursor-pointer usa-tooltip"
                onClick={() => removeFilter(tag)}
                id={`filter-tag-${tag.id}`}
            >
                <use xlinkHref={`${icons}#cancel`}></use>
            </svg>
        </div>
    );

    useEffect(() => {
        setTagsList((prevState) => prevState.filter((tag) => tag.filter !== "upcomingNeedByDate"));
        switch (filters.upcomingNeedByDate) {
            case "next-30-days":
                setTagsList((prevState) => {
                    return [
                        ...prevState,
                        {
                            tagText: "Upcoming Need By Date: Next 30 Days",
                            filter: "upcomingNeedByDate",
                        },
                    ];
                });
                break;
            case "current-fy":
                setTagsList((prevState) => {
                    return [
                        ...prevState,
                        {
                            tagText: "Upcoming Need By Date: Current FY",
                            filter: "upcomingNeedByDate",
                        },
                    ];
                });
                break;
            case "next-6-months":
                setTagsList((prevState) => {
                    return [
                        ...prevState,
                        {
                            tagText: "Upcoming Need By Date: Next 6 Months",
                            filter: "upcomingNeedByDate",
                        },
                    ];
                });
                break;
            case "all-time":
                setTagsList((prevState) => {
                    return [
                        ...prevState,
                        {
                            tagText: "Upcoming Need By Date: All Time",
                            filter: "upcomingNeedByDate",
                        },
                    ];
                });
                break;
        }
    }, [filters.upcomingNeedByDate]);

    const createTagString = (selectedList, filterType, filterText) => {
        if (selectedList.length > 0) {
            setTagsList((prevState) => prevState.filter((tag) => tag.filter !== filterType));
            setTagsList((prevState) => {
                return [
                    ...prevState,
                    {
                        tagText: `${filterText} ${selectedList.join(", ")}`,
                        filter: filterType,
                    },
                ];
            });
        }
    };

    useEffect(() => {
        const selectedProjects = [];
        filters.projects.forEach((project) => {
            selectedProjects.push(project.title);
        });
        createTagString(selectedProjects, "projects", "Project:");
    }, [filters.projects]);

    useEffect(() => {
        const selectedProjectOfficers = [];
        filters.projectOfficers.forEach((po) => {
            selectedProjectOfficers.push(po.full_name);
        });
        createTagString(selectedProjectOfficers, "projectOfficers", "Project Officer:");
    }, [filters.projectOfficers]);

    useEffect(() => {
        const selectedAgreementTypes = [];
        filters.types.forEach((agreementType) => {
            selectedAgreementTypes.push(convertCodeForDisplay("agreementType", agreementType));
        });
        createTagString(selectedAgreementTypes, "types", "Type:");
    }, [filters.types]);

    return (
        <div>
            {tagsList.map((tag, index) => {
                return (
                    <span key={index} className="padding-right-205 padding-bottom-1">
                        <FilterTag tag={tag} />
                    </span>
                );
            })}
        </div>
    );
};
export default AgreementsFilterTags;
