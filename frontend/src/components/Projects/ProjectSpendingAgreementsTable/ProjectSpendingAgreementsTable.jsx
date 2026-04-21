import styles from "../../UI/Table/table.module.css";
import ProjectSpendingAgreementRow from "../ProjectSpendingAgreementRow";
import { getTableHeadings } from "./ProjectSpendingAgreementsTable.constants";

/**
 * Table of agreements for the Project Spending tab.
 * Renders one expandable row per agreement with FY-scoped totals.
 *
 * @param {Object} props
 * @param {import("../../../types/AgreementTypes").Agreement[]} props.agreements
 * @param {number} props.fiscalYear - The currently selected fiscal year.
 * @param {Record<number, number>} props.fyTotals - Map of agreement id to FY total.
 *   Only populated when a single agreement exists in the FY; otherwise empty.
 * @returns {React.ReactElement}
 */
const ProjectSpendingAgreementsTable = ({ agreements, fiscalYear, fyTotals }) => {
    const headings = [...getTableHeadings(fiscalYear), ""]; // append empty col for chevron

    if (agreements.length === 0) {
        return (
            <p
                className="font-sans-sm text-base"
                data-cy="no-agreements-message"
            >
                No agreements found for FY {fiscalYear}.
            </p>
        );
    }

    return (
        <table
            className={`usa-table usa-table--borderless width-full ${styles.tableHover}`}
            data-cy="project-spending-agreements-table"
        >
            <thead>
                <tr>
                    {headings.map((heading) => (
                        <th
                            key={heading}
                            scope="col"
                            className="font-sans-xs"
                        >
                            {heading}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {agreements.map((agreement) => (
                    <ProjectSpendingAgreementRow
                        key={agreement.id}
                        agreement={agreement}
                        fiscalYear={fiscalYear}
                        fyTotal={fyTotals[agreement.id] ?? null}
                    />
                ))}
            </tbody>
        </table>
    );
};

export default ProjectSpendingAgreementsTable;
