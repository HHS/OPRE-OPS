import PropTypes from "prop-types";
import RoundedBox from "../../RoundedBox";

/**
 * SummaryCard component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} [props.title] - The title of the card
 * @param {string} [props.dataCy] - The data-cy attribute to add to the card
 * @param {React.ReactNode} props.children - The children to render
 * @returns {JSX.Element} - The rendered component
 */
const Card = ({ title, children, dataCy = "", ...rest }) => {
    return (
        <RoundedBox
            className={"display-inline-block"}
            dataCy={dataCy ?? dataCy}
            style={{ padding: "20px 30px 30px 30px" }}
            {...rest} // this is real trust 🧡
        >
            {title && <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{title}</h3>}
            {children}
        </RoundedBox>
    );
};
Card.propTypes = {
    title: PropTypes.string,
    dataCy: PropTypes.string,
    children: PropTypes.node.isRequired
};

export default Card;
