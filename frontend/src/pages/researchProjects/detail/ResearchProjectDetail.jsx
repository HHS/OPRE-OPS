import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import App from "../../../App";
import { getResearchProject } from "./getResearchProject";
import { setResearchProject } from "./researchProjectSlice";
import PortfolioHero from "../../../components/Portfolios/PortfolioHero";
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
            <PortfolioHero
                entityName={researchProject.title}
                // TODO: Set this to "Division" for now because ResearchProject can belong to multiple Portfolio/Divisions,
                // TODO: i.e. the page design needs to be updated
                divisionName="Division"
                teamLeaders={researchProject.team_leaders}
                label="Project Description"
                description={researchProject.description}
                url={researchProject.url}
            >
                <HeroFooter />
            </PortfolioHero>
        </App>
    );
};

export default ResearchProjectDetail;
