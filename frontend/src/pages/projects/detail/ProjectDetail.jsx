import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import App from "../../../App";
import { useGetProjectByIdQuery } from "../../../api/opsAPI";
import DebugCode from "../../../components/DebugCode";

/**
 * Minimalistic project detail page.
 * Displays the raw project data from the API while the full UI is being built out.
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

    useEffect(() => {
        if (error) {
            navigate("/error");
        }
    }, [error, navigate]);

    if (isLoading) {
        return (
            <App>
                <h1>Loading...</h1>
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
            <DebugCode data={project} />
        </App>
    );
};

export default ProjectDetail;
