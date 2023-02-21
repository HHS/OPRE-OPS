import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import CurrencySummaryCard from "../../UI/CurrencySummaryCard/CurrencySummaryCard";
import Tag from "../../UI/Tag/Tag";

const ProjectsAndAgreements = ({
    portfolioId = 0,
    numberOfProjects = 0,
    numOfResearchProjects = 0,
    numOfAdminAndSupportProjects = 0,
}) => {
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const projectHeading = `FY ${fiscalYear.value} Projects`;
    const agreementHeading = `FY ${fiscalYear.value} Agreements`;

    return (
        <CurrencySummaryCard>
            <div className="display-flex flex-justify">
                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-darker text-normal">
                        {projectHeading}
                    </h3>
                    <div className="display-flex flex-justify">
                        <span className="font-sans-xl text-bold">{numberOfProjects}</span>
                        <div className="display-flex flex-column margin-left-2 grid-gap">
                            <Tag
                                className="bg-brand-primary-light text-brand-primary-dark"
                                text={`${numOfResearchProjects} Research`}
                            />
                            <Tag
                                className="bg-brand-primary-light text-brand-primary-dark margin-top-1"
                                text={`${numOfAdminAndSupportProjects} Admin & Support`}
                            />
                        </div>
                    </div>
                </article>
                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-darker text-normal">
                        {agreementHeading}
                    </h3>
                    <pre className="font-12px">tags go here</pre>
                </article>
            </div>
        </CurrencySummaryCard>
    );
};

export default ProjectsAndAgreements;

ProjectsAndAgreements.propTypes = {
    portfolioId: PropTypes.number,
    numberOfProjects: PropTypes.number,
    numOfResearchProjects: PropTypes.number,
    numOfAdminAndSupportProjects: PropTypes.number,
};
