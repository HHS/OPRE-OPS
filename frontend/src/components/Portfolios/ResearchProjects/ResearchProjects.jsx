import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// eslint-disable-next-line import/named
import { setResearchProjects } from "../../../pages/portfolios/detail/portfolioSlice";
import { Link, useParams } from "react-router-dom";
// eslint-disable-next-line import/named
import { getResearchProjects } from "../../../pages/portfolios/detail/getResearchProjects";

const ResearchProjects = () => {
    const dispatch = useDispatch();
    const urlPathParams = useParams();
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const portfolioId = parseInt(urlPathParams.id);
    const researchProjects = useSelector((state) => state.portfolio.researchProjects);

    const researchProjectData = researchProjects.length
        ? researchProjects.map((rp) => (
              <li key={rp.id}>
                  <Link to={`/research-projects/${rp.id}`}>{rp.title}</Link>
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
    }, [dispatch, fiscalYear, portfolioId]);

    return (
        <div className={`padding-y-1 $styles.container`}>
            {researchProjectData && <ul>{researchProjectData}</ul>}
            {!researchProjectData && <p>There are no Research Projects.</p>}
        </div>
    );
};

export default ResearchProjects;
