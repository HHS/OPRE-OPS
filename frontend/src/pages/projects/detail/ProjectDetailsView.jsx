import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tag from "../../../components/UI/Tag/Tag";
import { TagList } from "../../../components/UI/Tag";
import Tooltip from "../../../components/UI/USWDS/Tooltip";
import { NO_DATA } from "../../../constants";
import { formatUserName } from "../../../helpers/users.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { formatProjectDate } from "../list/ProjectsList.helpers";

const DateValue = ({ value }) => (
    <Tag
        tagStyle="primaryDarkTextLightBackground"
        text={formatProjectDate(value)}
    />
);

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

    const projectTypeLabel = convertCodeForDisplay("project", project.project_type);

    const teamLeaderNames = project.team_leaders?.map((tl) => formatUserName(tl.display_name ?? tl.full_name)) ?? [];
    const methodologies =
        project.research_methodologies?.map((item) => (typeof item === "string" ? item : (item?.name ?? NO_DATA))) ??
        [];
    const specialTopics =
        project.special_topics?.map((item) => (typeof item === "string" ? item : (item?.name ?? NO_DATA))) ?? [];
    const divisionDirectors =
        project.division_directors?.map((director) =>
            formatUserName(
                typeof director === "string"
                    ? director
                    : (director?.name ?? director?.display_name ?? director?.full_name ?? NO_DATA)
            )
        ) ?? [];
    const projectOfficers =
        project.project_officers?.map((officer) =>
            formatUserName(officer.name ?? officer.display_name ?? officer.full_name)
        ) ?? [];
    const alternateProjectOfficers =
        project.alternate_project_officers?.map((officer) =>
            formatUserName(officer.name ?? officer.display_name ?? officer.full_name)
        ) ?? [];
    const teamMemberNames =
        project.team_members?.map((member) => formatUserName(member.display_name ?? member.full_name)) ?? [];

    return (
        <section>
            <div className="display-flex flex-justify flex-align-center margin-top-4">
                <h2 className="font-sans-lg margin-0">Project Details</h2>
                <Tooltip
                    label="Coming Soon"
                    position="top"
                >
                    <span className="display-inline-flex">
                        <button
                            type="button"
                            aria-disabled={true}
                            aria-label="Edit Project Details coming soon"
                            data-cy="project-details-edit-button"
                            className="usa-button usa-button--unstyled display-flex flex-align-center text-gray-50 cursor-not-allowed"
                            onClick={(event) => {
                                event.preventDefault();
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faPen}
                                size="lg"
                                className="height-2 width-2"
                            />
                            <span>Edit</span>
                        </button>
                    </span>
                </Tooltip>
            </div>
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

                        <dd className="margin-0 margin-top-3">
                            <div
                                className="grid-row grid-gap-4"
                                style={{ maxWidth: "420px" }}
                            >
                                <div className="grid-col">
                                    <div className="text-base-dark">Project Start</div>
                                    <div className="margin-top-1 wrap-text">
                                        <DateValue value={project.project_start} />
                                    </div>
                                </div>
                                <div className="grid-col">
                                    <div className="text-base-dark">Project End</div>
                                    <div className="margin-top-1 wrap-text">
                                        <DateValue value={project.project_end} />
                                    </div>
                                </div>
                            </div>
                        </dd>

                        <dt className="margin-0 text-base-dark margin-top-3">Research Methodologies</dt>
                        <dd className="margin-0 margin-top-1">
                            <TagList
                                items={methodologies}
                                dataCy="project-methodologies-tag"
                            />
                        </dd>

                        <dt className="margin-0 text-base-dark margin-top-3">Special Topics</dt>
                        <dd className="margin-0 margin-top-1">
                            <TagList
                                items={specialTopics}
                                dataCy="project-special-topics-tag"
                            />
                        </dd>

                        <dt className="margin-0 text-base-dark margin-top-3">Division Director(s)</dt>
                        <dd className="margin-0 margin-top-1">
                            <TagList
                                items={divisionDirectors}
                                dataCy="project-division-directors-tag"
                            />
                        </dd>

                        <dt className="margin-0 text-base-dark margin-top-3">Team Leader(s)</dt>
                        <dd className="margin-0 margin-top-1">
                            <TagList
                                items={teamLeaderNames}
                                dataCy="project-team-leaders-tag"
                            />
                        </dd>

                        <dt className="margin-0 text-base-dark margin-top-3">COR</dt>
                        <dd className="margin-0 margin-top-1">
                            <TagList
                                items={projectOfficers}
                                dataCy="project-officers-tag"
                            />
                        </dd>

                        <dt className="margin-0 text-base-dark margin-top-3">Alternate COR</dt>
                        <dd className="margin-0 margin-top-1">
                            <TagList
                                items={alternateProjectOfficers}
                                dataCy="alternate-project-officers-tag"
                            />
                        </dd>

                        <dt className="margin-0 text-base-dark margin-top-3">Team Members</dt>
                        <dd className="margin-0 margin-top-1">
                            <TagList
                                items={teamMemberNames}
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
