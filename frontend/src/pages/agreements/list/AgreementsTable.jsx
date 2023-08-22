import PropTypes from "prop-types";
import { AgreementTableRow } from "./AgreementTableRow";

/**
 * Agreement table.
 * @param {Object} props - The component props.
 * @param {Object[]} props.agreements - Array of Agreement to display in the table.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementsTable = ({ agreements = [] }) => {
    return (
        <>
            <table className="usa-table usa-table--borderless width-full ">
                <thead>
                    <tr>
                        <th scope="col">Agreement</th>
                        <th scope="col">Project</th>
                        <th scope="col">Type</th>
                        <th scope="col">Total</th>
                        <th scope="col">Need By</th>
                        <th scope="col" className="padding-0" style={{ width: "6.25rem" }}>
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {agreements.length > 0 &&
                        agreements?.map((agreement) => <AgreementTableRow key={agreement?.id} agreement={agreement} />)}
                </tbody>
            </table>
            {agreements.length === 0 && (
                <div id="agreements-table-zero-results" className="padding-top-5 display-flex flex-justify-center">
                    There are 0 results based on your filter selections.
                </div>
            )}
        </>
    );
};

AgreementsTable.propTypes = {
    agreements: PropTypes.arrayOf(PropTypes.object),
};
export default AgreementsTable;
