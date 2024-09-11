import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import App from "../../../App";
import { getResearchProject } from "./getResearchProject";
import { setResearchProject } from "./researchProjectSlice";
import Hero from "../../../components/UI/Hero";
import HeroFooter from "../../../components/Projects/HeroFooter/HeroFooter";

const ResearchProjectDetail = () => {
    const dispatch = useDispatch();
    const urlPathParams = useParams();
    const researchProjectId = parseInt(urlPathParams.id);

    const researchProject = useSelector((state) => state.researchProject.researchProject);

    // Get initial Research Project data
    useEffect(() => {
        const getResearchProjectAndSetState = async () => {
            const researchProjectResult = await getResearchProject(researchProjectId);
            dispatch(setResearchProject(researchProjectResult));
        };

        getResearchProjectAndSetState().catch(console.error);

        return () => {
            dispatch(setResearchProject({}));
        };
    }, [dispatch, researchProjectId]);

    return (
        <App breadCrumbName={researchProject.title}>
            <Hero
                entityName={researchProject.title}
                // TODO: Set this to "Division" for now because ResearchProject can belong to multiple Portfolio/Divisions,
                // TODO: i.e. the page design needs to be updated
                divisionName="Division"
                teamLeaders={researchProject.team_leaders}
                label="Project Description"
                description={researchProject.description}
                urls={Array.of({ id: 1, url: researchProject.url })}
            >
                <HeroFooter />
            </Hero>
        </App>
    );
};

export default ResearchProjectDetail;
