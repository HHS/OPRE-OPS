import { BLI_STATUS } from "../../../../helpers/budgetLines.helpers";
import { convertCodeForDisplay } from "../../../../helpers/utils";
import RoundedBox from "../../RoundedBox";
import Tag from "../../Tag";

/**
 * @typedef ItemCount
 * @property {string} type
 * @property {number} count
 */

/**
 * @typedef {Object} ProjectAgreementBLICardProps
 * @property {number} fiscalYear
 * @property {ItemCount[]} [projects]
 * @property {ItemCount[]} [agreements]
 * @property {ItemCount[]} [budgetLines]
 */

/**
 * @component - The Project Agreement BLI Card.
 * @param {ProjectAgreementBLICardProps} props
 * @returns {JSX.Element} - The Project Agreement BLI Card.
 */
const   ProjectAgreementBLICard = ({ fiscalYear, projects, agreements, budgetLines }) => {
    const projectHeading = `FY ${fiscalYear} Projects`;
    const budgetLinesHeading = `FY ${fiscalYear} Budget Lines`;
    const agreementsHeading = `FY ${fiscalYear} Agreements`;

    /**  @param {ItemCount[]} items */
    const calculateTotalCount = (items) => {
        return items && items.length > 0 ? items.reduce((acc, item) => acc + item.count, 0) : 0;
    };

    const totalProjectCount = calculateTotalCount(projects);
    const totalBudgetLinesCount = calculateTotalCount(budgetLines);
    const totalAgreementsCount = calculateTotalCount(agreements);

    /** @param {"DRAFT" | "PLANNED" | "IN_EXECUTING" | "OBLIGATED"} type */
    const tagStylesByType = (type) => {
        switch (type) {
            case BLI_STATUS.DRAFT:
                return "bg-brand-data-viz-bl-by-status-1";
            case BLI_STATUS.PLANNED:
                return "bg-brand-data-viz-bl-by-status-2 text-white margin-top-1";
            case BLI_STATUS.EXECUTING:
                return "bg-brand-data-viz-bl-by-status-3 margin-top-1";
            case BLI_STATUS.OBLIGATED:
                return "bg-brand-data-viz-bl-by-status-4 text-white margin-top-1";
            default:
                return "";
        }
    };

    return (
        <RoundedBox id="project-agreement-bli-card">
            <div className="display-flex flex-justify">
                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{projectHeading}</h3>
                    <div>
                        <span className="font-sans-xl text-bold line-height-sans-1">{totalProjectCount}</span>
                        <div className="display-flex flex-column grid-gap margin-top-1">
                            {projects &&
                                projects.length > 0 &&
                                projects.map(({ type, count }, index) => (
                                    <Tag
                                        key={type}
                                        className={`bg-brand-primary-light text-brand-primary-dark ${
                                            index > 0 ? "margin-top-1" : ""
                                        }`}
                                        text={`${count} ${convertCodeForDisplay("project", type)}`}
                                    />
                                ))}
                        </div>
                    </div>
                </article>

                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        {agreementsHeading}
                    </h3>
                    <div>
                        <span className="font-sans-xl text-bold line-height-sans-1">{totalAgreementsCount}</span>
                        <div className="display-flex flex-column grid-gap margin-top-1">
                            {agreements &&
                                agreements.length > 0 &&
                                agreements.map(({ type, count }, index) => (
                                    <Tag
                                        key={type}
                                        className={`bg-brand-primary-light text-brand-primary-dark ${
                                            index > 0 ? "margin-top-1" : ""
                                        }`}
                                        text={`${count} ${convertCodeForDisplay("agreement", type)}`}
                                    />
                                ))}
                        </div>
                    </div>
                </article>

                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        {budgetLinesHeading}
                    </h3>
                    <div>
                        <span className="font-sans-xl text-bold line-height-sans-1">{totalBudgetLinesCount}</span>
                        <div className="display-flex flex-column grid-gap margin-top-1">
                            {budgetLines &&
                                budgetLines.length > 0 &&
                                [...budgetLines]
                                    .sort((a, b) => {
                                        const order = [
                                            BLI_STATUS.DRAFT,
                                            BLI_STATUS.PLANNED,
                                            BLI_STATUS.EXECUTING,
                                            BLI_STATUS.OBLIGATED
                                        ];
                                        return order.indexOf(a.type) - order.indexOf(b.type);
                                    })
                                    .map(({ type, count }, index) => (
                                        <Tag
                                            key={type}
                                            className={`${tagStylesByType(type)} ${index > 0 ? "margin-top-1" : ""}`}
                                            text={`${count} ${convertCodeForDisplay("budgetLineStatus", type)}`}
                                        />
                                    ))}
                        </div>
                    </div>
                </article>
            </div>
        </RoundedBox>
    );
};

export default ProjectAgreementBLICard;
