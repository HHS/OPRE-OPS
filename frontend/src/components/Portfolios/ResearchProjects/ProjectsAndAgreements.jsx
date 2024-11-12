import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import RoundedBox from "../../UI/RoundedBox";
import Tag from "../../UI/Tag/Tag";

const ProjectsAndAgreements = ({ numOfResearchProjects = 3, numOfAdminAndSupportProjects = 2 }) => {
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const projectHeading = `FY ${fiscalYear.value} Projects`;
    const agreementHeading = `FY ${fiscalYear.value} Agreements`;
    const plannedAgreements = 3;
    const executingAgreements = 2;
    const obligatedAgreements = 2;
    const numberOfProjects = numOfResearchProjects + numOfAdminAndSupportProjects;
    const numberOfAgreements = plannedAgreements + executingAgreements + obligatedAgreements;

    return (
        <RoundedBox className=" padding-y-205 padding-x-4 display-inline-block">
            <div className="display-flex flex-justify">
                {/* NOTE: left side */}
                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{projectHeading}</h3>
                    <div className="display-flex flex-justify">
                        <span className="font-sans-xl text-bold line-height-sans-1">{numberOfProjects}</span>
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
                {/* NOTE: right side */}
                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        {agreementHeading}
                    </h3>
                    <div className="display-flex flex-justify">
                        <span className="font-sans-xl text-bold line-height-sans-1">{numberOfAgreements}</span>
                        <div className="display-flex flex-column margin-left-2 grid-gap">
                            <Tag
                                className="bg-brand-primary text-white"
                                text={`${plannedAgreements} Planned`}
                            />
                            <Tag
                                className="bg-brand-feedback-warning margin-top-1"
                                text={`${executingAgreements} Executing`}
                            />
                            <Tag
                                className="bg-brand-data-viz-primary-6 text-white margin-top-1"
                                text={`${obligatedAgreements} Obligated`}
                            />
                        </div>
                    </div>
                </article>
            </div>
        </RoundedBox>
    );
};

export default ProjectsAndAgreements;

ProjectsAndAgreements.propTypes = {
    numberOfProjects: PropTypes.number,
    numOfResearchProjects: PropTypes.number,
    numOfAdminAndSupportProjects: PropTypes.number
};
