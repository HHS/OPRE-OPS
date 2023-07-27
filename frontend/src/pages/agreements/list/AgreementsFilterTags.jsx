import "./AgreementsList.scss";
import icons from "../../../uswds/img/sprite.svg";

/**
 * Header section above the Agreements List table.
 * @returns {ReactNode} The rendered component.
 */
export const AgreementsFilterTags = ({ filters, setFilters }) => {
    const tagsList = [];

    const removeFilter = () => {
        console.log(setFilters());
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

    switch (filters.upcomingNeedByDate) {
        case "next-30-days":
            tagsList.push({
                tagText: "Upcoming Need By Date: Next 30 Days",
                filter: "upcomingNeedByDate",
            });
            break;
        case "current-fy":
            tagsList.push({
                tagText: "Upcoming Need By Date: Current FY",
                filter: "upcomingNeedByDate",
            });
            break;
        case "next-6-months":
            tagsList.push({
                tagText: "Upcoming Need By Date: Next 6 Months",
                filter: "upcomingNeedByDate",
            });
            break;
        case "all-time":
            tagsList.push({
                tagText: "Upcoming Need By Date: All Time",
                filter: "upcomingNeedByDate",
            });
            break;
    }

    const selectedProjects = [];
    filters.projects.forEach((project) => {
        selectedProjects.push(project.title);
    });
    if (selectedProjects.length > 0) {
        tagsList.push({
            tagText: `Project: ${selectedProjects.join(", ")}`,
            filter: "projects",
        });
    }

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
