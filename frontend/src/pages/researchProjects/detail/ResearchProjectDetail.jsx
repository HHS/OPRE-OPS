import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import App from "../../../App";
import { getResearchProject } from "./getResearchProject";
import { setPortfolio, setResearchProject } from "./researchProjectSlice";

import { getPortfolio } from "../../portfolios/detail/getPortfolio";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import Hero from "../../../components/UI/Hero/Hero";
import HeroFooter from "../../../components/ResearchProjects/HeroFooter/HeroFooter";

const ResearchProjectDetail = () => {
    const dispatch = useDispatch();
    const urlPathParams = useParams();
    const researchProjectId = parseInt(urlPathParams.id);

    const researchProject = useSelector((state) => state.researchProject.researchProject);
    const portfolio = useSelector((state) => state.researchProject.portfolio);

    // Get initial Research Project data
    useEffect(() => {
        const getResearchProjectAndSetState = async () => {
            const researchProjectResult = await getResearchProject(researchProjectId);
            const portfolioResult = await getPortfolio(researchProjectResult.portfolio_id);
            dispatch(setResearchProject(researchProjectResult));
            dispatch(setPortfolio(portfolioResult));
        };

        getResearchProjectAndSetState().catch(console.error);

        return () => {
            dispatch(setResearchProject({}));
            dispatch(setPortfolio({}));
        };
    }, [dispatch, researchProjectId]);

    return (
        <App>
            <Breadcrumb currentName={researchProject.title} />
            <Hero
                entityName={researchProject.title}
                divisionName={portfolio.division?.name}
                teamLeaders={researchProject.team_leaders}
                description={researchProject.description}
                urls={researchProject.urls}
            >
                <HeroFooter />
            </Hero>
        </App>
    );
};

export default ResearchProjectDetail;
