import Tag from "../../../components/UI/Tag";

/**
 * @component - Component for displaying a release note with a subject, type tag, and description.
 * @param {Object} props - Component props.
 * @param {string} props.subject - The subject or title of the release note.
 * @param {'New Feature'|'Improvements'|'Fixes'} props.type - The type or category of the release note, displayed as a tag.
 * @param {string} props.description - The detailed description of the release note.
 * @returns {React.ReactElement} - The rendered component.
 */
const ReleaseNote = ({ subject, type, description }) => {
    const typeClasses = {
        "New Feature": "bg-brand-primary text-white",
        Improvements: "bg-brand-can-budget-by-fy-graph-4 text-ink",
        Fixes: "bg-brand-release-changes-fixes text-ink"
    };

    return (
        <article className="margin-bottom-3">
            <div className="display-flex flex-align-center margin-bottom-1">
                <h3 className="margin-0 font-sans-xs">{subject}</h3>
                <Tag
                    text={type}
                    className={`margin-left-1 ${typeClasses[type]}`}
                />
            </div>
            <p className="margin-0">{description}</p>
        </article>
    );
};

export default ReleaseNote;
