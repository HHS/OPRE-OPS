import ProjectSpendingAgreementRow from "./ProjectSpendingAgreementRow";

/**
 * Column headings for the Project Spending Agreements table.
 * The FY Total column label is dynamic based on the selected fiscal year.
 *
 * @param {number} fiscalYear
 * @returns {string[]}
 */
const getTableHeadings = (fiscalYear) => [
    "Agreement",
    "Type",
    "Start",
    "End",
    `FY ${fiscalYear} Total`,
    "Agreement Total",
    "" // chevron column
];

/**
 * Table of agreements for the Project Spending tab.
 * Renders one expandable row per agreement with FY-scoped totals.
 *
 * @param {Object} props
 * @param {import("../../../types/AgreementTypes").Agreement[]} props.agreements
 * @param {number} props.fiscalYear - The currently selected fiscal year.
 * @returns {React.ReactElement}
 */
const ProjectSpendingAgreementsTable = ({ agreements, fiscalYear }) => {
    const headings = getTableHeadings(fiscalYear);

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
            className="usa-table usa-table--borderless width-full"
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
                    />
                ))}
            </tbody>
        </table>
    );
};

export default ProjectSpendingAgreementsTable;
