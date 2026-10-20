import Tabs from "../../UI/Tabs";

/**
 * @typedef {Object} CanDetailTabsProps
 * @property {number} canId - The ID of the CAN.
 */

/**
 * @component - Can Detail Tabs
 * @param {CanDetailTabsProps} props - The properties passed to the component.
 * @returns {JSX.Element} The rendered JSX element.
 */
const CanDetailTabs = ({ canId }) => {
    const paths = [
        {
            label: "CAN Details",
            pathName: `/cans/${canId}`
        },
        {
            label: "CAN Spending",
            pathName: `/cans/${canId}/spending`
        },
        {
            label: "CAN Funding",
            pathName: `/cans/${canId}/funding`
        }
    ];

    return <Tabs paths={paths} />;
};

export default CanDetailTabs;
