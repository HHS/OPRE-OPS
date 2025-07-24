import TableTag from "../../UI/TableTag";
import Tag from "../../UI/Tag";
/**
 * @component - TermTag component
 * @param {Object} props - Properties passed to component
 * @param {string} props.label - The label of the term
 * @param {string | number | string[]} [props.value] - The value of the term
 * @param {string} [props.bliStatus] - The status of the budget line item
 * @param {string} [props.tagStyle] - The style of the tag
 * @param {string} [props.className] - styles classes to add to the component
 */
function TermTag({ label, value = "", tagStyle = "primaryDarkTextLightBackground", bliStatus = "", className = "" }) {
    const valuesArray = Array.isArray(value) ? value : [value];
    return (
        <dl className={`font-12px ${className}`}>
            <dt className="text-base-dark">{label}</dt>
            {bliStatus && (
                <dd className="margin-left-0 margin-top-1">
                    <TableTag status={bliStatus} />
                </dd>
            )}
            {valuesArray &&
                valuesArray.map((value, index) => (
                    <dd
                        key={index}
                        className="margin-left-0 margin-top-1"
                    >
                        <Tag
                            className="margin-top-5"
                            tagStyle={tagStyle}
                        >
                            {value}
                        </Tag>
                    </dd>
                ))}
        </dl>
    );
}

export default TermTag;
