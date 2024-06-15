import PropTypes from "prop-types";
import RoundedBox from "../RoundedBox";

/**
 * SummaryCard component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} [props.title] - The title of the card
 * @param {string} [props.dataCy] - The data-cy attribute to add to the card
 * @param {React.ReactNode} props.children - The children to render
 * @returns {JSX.Element} - The rendered component
 */
const SummaryCard = ({ title, children, dataCy = "", ...rest }) => {
    return (
        <RoundedBox
            className={`padding-y-205 padding-x-4 padding-right-9 display-inline-block`}
            dataCy={dataCy ?? dataCy}
            {...rest} // this is real trust
        >
            {title && <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{title}</h3>}
            {children}
        </RoundedBox>
    );
};
SummaryCard.propTypes = {
    title: PropTypes.string,
    dataCy: PropTypes.string,
    children: PropTypes.node.isRequired
};

export default SummaryCard;
