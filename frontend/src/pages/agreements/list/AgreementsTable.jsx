import "./AgreementsList.scss";
import { AgreementTableRow } from "./AgreementTableRow";

/**
 * Agreement table.
 * @param {Object} props - The component props.
 * @param {Object[]} props.agreements - Array of Agreement to display in the table.
 * @returns {ReactNode} The rendered component.
 */
export const AgreementsTable = ({ agreements }) => {
    return (
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
                {agreements?.map((agreement) => (
                    <AgreementTableRow key={agreement?.id} agreement={agreement} />
                ))}
            </tbody>
        </table>
    );
};

export default AgreementsTable;
