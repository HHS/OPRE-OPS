/**
    @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
*/

/**
 * @typedef {Object} CanDetailProps
 * @property {CAN} can
 */

/**
 * @component - The CAN detail page.
 * @param {CanDetailProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CanDetail = ({ can }) => {
    return (
        <article>
            <h1>
                {can?.number} ({can?.nick_name})
            </h1>
            <div className="grid-row">
                <div className="grid-col">
                    <h2>CAN description</h2>
                    {can?.description}
                </div>
            </div>
        </article>
    );
};

export default CanDetail;
