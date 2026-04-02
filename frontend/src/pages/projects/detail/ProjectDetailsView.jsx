import Tag from "../../../components/UI/Tag/Tag";
import { TagList } from "../../../components/UI/Tag";
import { NO_DATA } from "../../../constants";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { formatProjectDate } from "../list/ProjectsList.helpers";

const getDisplayName = (item) => {
    if (typeof item === "string") {
        return item;
    }

    return item?.name ?? item?.display_name ?? item?.full_name ?? NO_DATA;
};

const DateValue = ({ value }) => (
    <Tag
        tagStyle="primaryDarkTextLightBackground"
        text={formatProjectDate(value)}
    />
);

const Field = ({ label, children, topMargin = "margin-top-3" }) => (
    <div className={topMargin}>
        <div className="margin-0 text-base-dark">{label}</div>
        <div className="margin-0 margin-top-1 wrap-text">{children}</div>
    </div>
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

    const teamLeaderNames = project.team_leaders?.map((tl) => tl.display_name ?? tl.full_name) ?? [];
    const methodologies = project.research_methodologies?.map(getDisplayName) ?? [];
    const specialTopics = project.special_topics?.map(getDisplayName) ?? [];
    const divisionDirectors = project.division_directors?.map(getDisplayName) ?? [];
    const projectOfficers = project.project_officers?.map(getDisplayName) ?? [];
    const alternateProjectOfficers = project.alternate_project_officers?.map(getDisplayName) ?? [];
    const teamMemberNames = project.team_members?.map((member) => member.display_name ?? member.full_name) ?? [];

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
                    <div className="margin-0 font-12px">
                        <Field
                            label="Description"
                            topMargin="margin-top-3"
                        >
                            {project.description ?? NO_DATA}
                        </Field>
                    </div>

                    <h3 className="text-base-dark margin-top-5 margin-bottom-0 text-normal font-12px">History</h3>
                    <p className="font-12px text-base margin-top-1">History coming soon.</p>
                </div>

                {/* RIGHT COLUMN */}
                <div
                    className="grid-col"
                    data-cy="project-details-right-col"
                >
                    <div className="margin-0 font-12px">
                        <Field
                            label="Project Nickname"
                            topMargin="margin-top-3"
                        >
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={project.short_title ?? NO_DATA}
                                dataCy="project-nickname-tag"
                            />
                        </Field>

                        <Field label="Project Type">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={projectTypeLabel}
                                dataCy="project-type-tag"
                            />
                        </Field>

                        <div
                            className="grid-row grid-gap-4 margin-top-3"
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

                        <Field label="Research Methodologies">
                            <TagList
                                items={methodologies}
                                dataCy="project-methodologies-tag"
                            />
                        </Field>

                        <Field label="Special Topic/Populations">
                            <TagList
                                items={specialTopics}
                                dataCy="project-special-topics-tag"
                            />
                        </Field>
                        <div
                            className="grid-row grid-gap-4 margin-top-3"
                            style={{ maxWidth: "420px" }}
                        >
                            <div className="grid-col">
                                <div className="margin-0 text-base-dark">Division Director(s)</div>
                                <div className="margin-0 margin-top-1 wrap-text">
                                    <TagList
                                        items={divisionDirectors}
                                        dataCy="project-division-directors-tag"
                                    />
                                </div>
                            </div>
                            <div className="grid-col">
                                <div className="margin-0 text-base-dark">Team Leader(s)</div>
                                <div className="margin-0 margin-top-1 wrap-text">
                                    <TagList
                                        items={teamLeaderNames}
                                        dataCy="project-team-leaders-tag"
                                    />
                                </div>
                            </div>
                        </div>
                        <div
                            className="grid-row grid-gap-4 margin-top-3"
                            style={{ maxWidth: "420px" }}
                        >
                            <div className="grid-col">
                                <div className="margin-0 text-base-dark">COR</div>
                                <div className="margin-0 margin-top-1 wrap-text">
                                    <TagList
                                        items={projectOfficers}
                                        dataCy="project-officers-tag"
                                    />
                                </div>
                            </div>
                            <div className="grid-col">
                                <div className="margin-0 text-base-dark">Alternate COR</div>
                                <div className="margin-0 margin-top-1 wrap-text">
                                    <TagList
                                        items={alternateProjectOfficers}
                                        dataCy="alternate-project-officers-tag"
                                    />
                                </div>
                            </div>
                        </div>

                        <Field label="Team Members">
                            <TagList
                                items={teamMemberNames}
                                dataCy="project-team-members-tag"
                            />
                        </Field>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProjectDetailsView;
