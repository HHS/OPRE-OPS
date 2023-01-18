import styles from "./ResearchProjects.module.css";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// eslint-disable-next-line import/named
import { setResearchProjects } from "../../../pages/portfolios/detail/portfolioSlice";
import { Link, useParams } from "react-router-dom";
// eslint-disable-next-line import/named
import { getResearchProjects } from "../../../api/getResearchProjects";

const ResearchProjects = () => {
    const dispatch = useDispatch();
    const urlPathParams = useParams();
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const portfolioId = parseInt(urlPathParams.id);
    const researchProjects = useSelector((state) => state.portfolio.researchProjects);

    const researchProjectData = researchProjects.length
        ? researchProjects.map((rp) => (
              <li key={rp.id}>
                  <Link to={"/research-projects/" + rp.id}>{rp.title}</Link>
              </li>
          ))
        : null;

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

    return (
        <div className={styles.container}>
            {researchProjectData && <ul>{researchProjectData}</ul>}
            {!researchProjectData && <div>There are no Research Projects.</div>}
        </div>
    );
};

export default ResearchProjects;
