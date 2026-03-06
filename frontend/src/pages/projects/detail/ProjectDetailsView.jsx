import Tag from "../../../components/UI/Tag/Tag";
import { NO_DATA } from "../../../constants";
import { convertCodeForDisplay } from "../../../helpers/utils";

/**
 * Renders one Tag per item in a list, or a single TBD tag when the list is empty.
 * @param {Object} props
 * @param {string[]} props.items
 * @param {string} props.dataCy
 * @returns {React.ReactElement}
 */
const TagList = ({ items, dataCy }) => {
    if (!items?.length) {
        return (
            <Tag
                tagStyle="primaryDarkTextLightBackground"
                text={NO_DATA}
                dataCy={dataCy}
            />
        );
    }
    return (
        <div className="display-flex flex-wrap gap-1">
            {items.map((item) => (
                <Tag
                    key={item}
                    tagStyle="primaryDarkTextLightBackground"
                    text={item}
                    dataCy={dataCy}
                />
            ))}
        </div>
    );
};

/**
 * Read-only details view for a project, mirroring the two-column layout of AgreementDetailsView.
 * @param {Object} props
 * @param {import("../../../types/ProjectTypes").Project} props.project
 * @returns {React.ReactElement}
 */
const ProjectDetailsView = ({ project }) => {
    if (!project) {
        return <p>No project data.</p>;
    }

    const projectTypeLabel =
        project.project_type === "RESEARCH"
            ? "Research Project"
            : convertCodeForDisplay("project", project.project_type);

    const teamLeaderNames = project.team_leaders?.map((tl) => tl.full_name) ?? [];

    return (
        <section>
            <h2 className="font-sans-lg margin-top-4 margin-bottom-0">Project Details</h2>
            <div
                className="grid-row margin-top-2"
                style={{ columnGap: "82px" }}
            >
                {/* LEFT COLUMN */}
                <div
                    className="grid-col"
                    data-cy="project-details-left-col"
                >
                    <dl className="margin-0 font-12px">
                        <dt className="margin-0 text-base-dark margin-top-3">Description</dt>
                        <dd className="margin-0 margin-top-05 wrap-text">{project.description ?? NO_DATA}</dd>
                    </dl>

                    <h3 className="text-base-dark margin-top-5 margin-bottom-0 text-normal font-12px">History</h3>
                    <p className="font-12px text-base margin-top-1">History coming soon.</p>
                </div>

                {/* RIGHT COLUMN */}
                <div
                    className="grid-col"
                    data-cy="project-details-right-col"
                >
                    <dl className="margin-0 font-12px">
                        <dt className="margin-0 text-base-dark margin-top-3">Project Nickname</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={project.short_title ?? NO_DATA}
                                dataCy="project-nickname-tag"
                            />
                        </dd>

                        <dt className="margin-0 text-base-dark margin-top-3">Project Type</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={projectTypeLabel}
                                dataCy="project-type-tag"
                            />
                        </dd>

                        <dt className="margin-0 text-base-dark margin-top-3">Methodologies</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={NO_DATA}
                                dataCy="project-methodologies-tag"
                            />
                        </dd>

                        <dt className="margin-0 text-base-dark margin-top-3">Special Topic/Population Studied</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={NO_DATA}
                                dataCy="project-populations-tag"
                            />
                        </dd>

                        <dt className="margin-0 text-base-dark margin-top-3">Project Officer</dt>
                        <dd className="margin-0 margin-top-1">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={NO_DATA}
                                dataCy="project-officer-tag"
                            />
                        </dd>

                        <dt className="margin-0 text-base-dark margin-top-3">Team Members</dt>
                        <dd className="margin-0 margin-top-1">
                            <TagList
                                items={teamLeaderNames}
                                dataCy="project-team-members-tag"
                            />
                        </dd>
                    </dl>
                </div>
            </div>
        </section>
    );
};

export default ProjectDetailsView;
