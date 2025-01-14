import Tag from "../Tag";
/**

* @typedef {Object} TermTagProps
* @property {string} term
* @property {string} [description]
* @property {string} [className]
* @property {Object} [rest]
*/

/**
 * This component needs to wrapped in a <dl> element.
 * @component - Renders a term with a tag.
 * @param {TermTagProps} props - The properties passed to the component.
 * @returns {JSX.Element} - The rendered component.
 */
const TermTag = ({ term, description = "TBD", ...rest }) => {
    return (
        <div
            className={`font-12px ${rest.className}`}
            data-testid="term-container"
        >
            <dt className="margin-0 text-base-dark margin-top-3">{term}</dt>
            <dd className="margin-0 margin-top-1">
                <Tag
                    tagStyle="primaryDarkTextLightBackground"
                    text={description}
                />
            </dd>
        </div>
    );
};

export default TermTag;
