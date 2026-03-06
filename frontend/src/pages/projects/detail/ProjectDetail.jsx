import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import App from "../../../App";
import { useGetProjectByIdQuery } from "../../../api/opsAPI";
import DebugCode from "../../../components/DebugCode";
import ProjectDetailTabs from "./ProjectDetailTabs";
import ProjectDetailsView from "./ProjectDetailsView";

/**
 * Minimalistic project detail page.
 * Displays project metadata and raw API response while the full UI is being built out.
 * @returns {React.ReactElement | null}
 */
const ProjectDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const projectId = id ? +id : -1;

    /** @type {{data?: import("../../../types/ProjectTypes").Project | undefined, error?: Object, isLoading: boolean}} */
    const {
        data: project,
        error,
        isLoading
    } = useGetProjectByIdQuery(projectId, {
        refetchOnMountOrArgChange: true,
        skip: !projectId || projectId === -1
    });

    const is404 = error?.status === 404;

    useEffect(() => {
        if (error && !is404) {
            navigate("/error");
        }
    }, [error, is404, navigate]);

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

    if (error) {
        return null;
    }

    return (
        <App breadCrumbName={project?.title}>
            <h1 className="font-sans-2xl margin-0 text-brand-primary">{project?.title}</h1>
            <h2 className="font-sans-3xs text-normal margin-top-1 margin-bottom-2">{project?.short_title}</h2>
            <div className="display-flex flex-justify margin-top-3">
                <ProjectDetailTabs projectId={projectId} />
            </div>
            <ProjectDetailsView project={project} />
            <DebugCode data={project} />
        </App>
    );
};

export default ProjectDetail;
