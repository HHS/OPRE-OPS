import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import App from "../../../App";
import { getResearchProject } from "./getResearchProject";
import { setResearchProject } from "./researchProjectSlice";

const ResearchProjectDetail = () => {
    const dispatch = useDispatch();
    const urlPathParams = useParams();
    const researchProjectId = parseInt(urlPathParams.id);

    // Get initial Research Project data
    useEffect(() => {
        const getResearchProjectAndSetState = async () => {
            const result = await getResearchProject(researchProjectId);
            dispatch(setResearchProject(result));
        };

        getResearchProjectAndSetState().catch(console.error);

        return () => {
            dispatch(setResearchProject({}));
        };
    }, [dispatch, researchProjectId]);

    return (
        <>
            <App></App>
        </>
    );
};

export default ResearchProjectDetail;
