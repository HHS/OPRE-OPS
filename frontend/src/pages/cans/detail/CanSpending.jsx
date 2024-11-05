import DebugCode from "../../../components/DebugCode";
/**
    @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
*/

/**
 * @typedef {Object} CanSpendingProps
 * @property {CAN} can
 */

/**
 * @component - The CAN detail page.
 * @param {CanSpendingProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanSpending = ({ can }) => {
    return (
        <div>
            <h2>Can Spending</h2>
            <DebugCode data={can} />
        </div>
    );
};

export default CanSpending;
