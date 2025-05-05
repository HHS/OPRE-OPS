import Table from "../../UI/Table";
import { TABLE_HEADINGS } from "./AgreementsTable.constants";
import AgreementTableRow from "./AgreementTableRow";

/**
 * Agreement table.
 * @param {Object} props - The component props.
 * @param {import("../AgreementTypes").Agreement[]} props.agreements - Array of Agreement to display in the table.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementsTable = ({ agreements = [] }) => {
    return (
        <>
            <Table tableHeadings={TABLE_HEADINGS}>
                {agreements.length > 0 &&
                    agreements?.map((agreement) => (
                        <AgreementTableRow
                            key={agreement?.id}
                            agreementId={agreement.id}
                        />
                    ))}
            </Table>
            {agreements.length === 0 && (
                <div
                    id="agreements-table-zero-results"
                    className="padding-top-5 display-flex flex-justify-center"
                >
                    There are 0 results based on your filter selections.
                </div>
            )}
        </>
    );
};

export default AgreementsTable;
