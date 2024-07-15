import PropTypes from "prop-types";
import Tag from "../../UI/Tag";
import TableTag from "../../UI/TableTag";
/**
 * TermTag component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} props.label - The label of the term
 * @param {string | number } [props.value] - The value of the term
 * @param {string} [props.bliStatus] - The status of the budget line item
 * @param {string} [props.tagStyle] - The style of the tag
 * @param {string} [props.className] - styles classes to add to the component
 */
function TermTag({ label, value = "", tagStyle = "primaryDarkTextLightBackground", bliStatus = "", className = "" }) {
    return (
        <dl className={`font-12px ${className}`}>
            <dt className="text-base-dark">{label}</dt>
            {bliStatus && (
                <dd className="margin-left-0 margin-top-1">
                    <TableTag status={bliStatus} />
                </dd>
            )}
            {value && (
                <dd className="margin-left-0 margin-top-1">
                    <Tag
                        className="margin-top-5"
                        tagStyle={tagStyle}
                    >
                        {value}
                    </Tag>
                </dd>
            )}
        </dl>
    );
}
TermTag.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tagStyle: PropTypes.string,
    bliStatus: PropTypes.string,
    className: PropTypes.string
};

export default TermTag;
