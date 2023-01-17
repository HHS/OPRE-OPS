import styles from "./ResearchProjects.module.css";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// eslint-disable-next-line import/named
import { setResearchProjects } from "../../../store/portfolioSlice";
import { useParams } from "react-router-dom";
// eslint-disable-next-line import/named
import { getResearchProjects } from "../../../api/getResearchProjects";

const ResearchProjects = () => {
    const dispatch = useDispatch();
    const urlPathParams = useParams();
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const portfolioId = parseInt(urlPathParams.id);

    // Get ResearchProject data
    useEffect(() => {
        const getResearchProjectsAndSetState = async () => {
            const result = await getResearchProjects(portfolioId, fiscalYear.value);
            dispatch(setResearchProjects(result));
        };

        getResearchProjectsAndSetState().catch(console.error);

        return () => {
            dispatch(setResearchProjects([]));
        };
    }, [dispatch, fiscalYear]);

    return <div className={styles.container}>Research Projects here.</div>;
};

export default ResearchProjects;
