import "./AgreementsList.scss";
import icons from "../../../uswds/img/sprite.svg";
import { useEffect, useState } from "react";

/**
 * Header section above the Agreements List table.
 * @returns {ReactNode} The rendered component.
 */
export const AgreementsFilterTags = ({ filters }) => {
    const [tagsList, setTagsList] = useState([]);

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
                break;
            case "projects":
                setTagsList((prevState) => prevState.filter((tag) => tag.filter !== "projects"));
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

    const selectedProjects = [];
    filters.projects.forEach((project) => {
        selectedProjects.push(project.title);
    });

    useEffect(() => {
        createTagString(selectedProjects, "projects", "Project:");
    }, [filters.projects]);

    const selectedProjectOfficers = [];
    filters.projectOfficers.forEach((po) => {
        selectedProjectOfficers.push(po.full_name);
    });

    useEffect(() => {
        createTagString(selectedProjectOfficers, "projectOfficers", "Project Officer:");
    }, [filters.projectOfficers]);

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
