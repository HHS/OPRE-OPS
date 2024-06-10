import PropTypes from "prop-types";
import Tag from "../../UI/Tag";
/**
 * TermTag component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} props.label - The label of the term
 * @param {string | number} props.value - The value of the term
 * @param {string} [props.tagStyle] - The style of the tag
 */
function TermTag({ label, value, tagStyle = "lightTextDarkBackground" }) {
    return (
        <dl className="font-12px">
            <dt className="text-base-dark">{label}</dt>
            <dd className="margin-left-0 margin-top-1">
                <Tag
                    className="margin-top-5"
                    tagStyle={tagStyle}
                >
                    {value}
                </Tag>
            </dd>
        </dl>
    );
}
TermTag.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    tagStyle: PropTypes.string
};

export default TermTag;
