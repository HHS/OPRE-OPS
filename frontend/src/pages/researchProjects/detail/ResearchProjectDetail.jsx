import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import App from "../../../App";
import { getResearchProject } from "./getResearchProject";
import { setPortfolio, setResearchProject } from "./researchProjectSlice";

import styles from "./ResearchProjectDetail.module.css";
import { getPortfolio } from "../../portfolios/detail/getPortfolio";
import TeamLeaders from "../../../components/UI/TeamLeaders/TeamLeaders";
import HeroDescription from "../../../components/UI/HeroDescription/HeroDescription";
import HeroFooter from "../../../components/ResearchProjects/HeroFooter/HeroFooter";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";

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
            <div>
                <h1 className={`font-sans-2xl ${styles.titleContainer}`}>{researchProject.title}</h1>
                <h2 className="font-sans-3xs margin-top-0 margin-bottom-0 text-normal">{portfolio.division?.name}</h2>
                <TeamLeaders teamLeaders={researchProject.team_leaders} />
                <HeroDescription description={researchProject.description} urls={researchProject.urls} />
                <HeroFooter />
            </div>
        </App>
    );
};

export default ResearchProjectDetail;
