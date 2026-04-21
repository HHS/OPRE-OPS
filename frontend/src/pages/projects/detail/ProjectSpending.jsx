import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import App from "../../../App";
import { useGetProjectByIdQuery, useGetProjectSpendingByIdQuery } from "../../../api/opsAPI";
import DebugCode from "../../../components/DebugCode";
import ProjectDetailTabs from "./ProjectDetailTabs";

/**
 * Project Spending tab — Phase 1.
 *
 * Fetches spending metadata from GET /projects/:id/spending/ and displays it
 * via DebugCode while the full UI is being built out in subsequent sub-tasks.
 *
 * Phase 2 will add the Agreements table (expandable rows).
 * Phase 3 will add the Summary cards + Donut chart.
 *
 * @returns {React.ReactElement | null}
 */
const ProjectSpending = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const projectId = id ? +id : -1;

    /** @type {{data?: import("../../../types/ProjectTypes").Project | undefined, error?: Object, isLoading: boolean}} */
    const {
        data: project,
        error: projectError,
        isLoading: isProjectLoading
    } = useGetProjectByIdQuery(projectId, {
        refetchOnMountOrArgChange: true,
        skip: !projectId || projectId === -1
    });

    const {
        data: spendingData,
        error: spendingError,
        isLoading: isSpendingLoading
    } = useGetProjectSpendingByIdQuery(projectId, {
        refetchOnMountOrArgChange: true,
        skip: !projectId || projectId === -1
    });

    const is404 = projectError?.status === 404 || spendingError?.status === 404;
    const isLoading = isProjectLoading || isSpendingLoading;

    useEffect(() => {
        if ((projectError || spendingError) && !is404) {
            navigate("/error");
        }
    }, [projectError, spendingError, is404, navigate]);

    if (isLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }

    if (is404) {
        return (
            <App breadCrumbName="Not Found">
                <h1 className="font-sans-2xl margin-0 text-brand-primary">Project Not Found</h1>
                <p className="margin-top-2">No project exists with ID {projectId}.</p>
            </App>
        );
    }

    if (projectError || spendingError) {
        return null;
    }

    return (
        <App breadCrumbName={project?.title}>
            <h1 className="font-sans-2xl margin-0 text-brand-primary">{project?.title}</h1>
            <h2 className="font-sans-3xs text-normal margin-top-1 margin-bottom-2">{project?.short_title}</h2>
            <div className="display-flex flex-justify margin-top-3">
                <ProjectDetailTabs projectId={projectId} />
            </div>

            {/* ── Project Spending Summary ── */}
            <section>
                <h2 className="font-sans-lg">Project Spending Summary</h2>
                <p className="font-sans-sm text-base margin-top-1 margin-bottom-4">
                    The summary below shows a breakdown of the project total for the selected FY. Draft budget lines are
                    not included in the Totals.
                </p>
                {/* Phase 3: Summary cards + Donut chart go here */}
            </section>

            {/* ── Agreements ── */}
            <section className="margin-top-4">
                <h2 className="font-sans-lg">Agreements</h2>
                <p className="font-sans-sm text-base margin-top-1 margin-bottom-4">
                    This is a list of all agreements within this project for the selected FY.
                </p>
                {/* Phase 2: Agreements table goes here */}
            </section>

            <DebugCode
                title="Project Spending API Response"
                data={spendingData}
            />
        </App>
    );
};

export default ProjectSpending;
