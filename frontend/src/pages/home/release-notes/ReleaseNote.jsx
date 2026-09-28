import Tag from "../../../components/UI/Tag";
import { RELEASE_NOTES_TAG_CLASSES } from "./constants";

/**
 * @component - Component for displaying a release note with a subject, type tag, and description.
 * @param {Object} props - Component props.
 * @param {string} props.subject - The subject or title of the release note.
 * @param {'New Feature'|'Improvements'|'Fixes'} props.type - The type or category of the release note, displayed as a tag.
 * @param {string} props.description - The detailed description of the release note.
 * @returns {React.ReactElement} - The rendered component.
 */
const ReleaseNote = ({ subject, type, description }) => {
    return (
        <article className="margin-bottom-4">
            <div className="display-flex flex-align-center margin-bottom-105">
                <h3 className="margin-0 font-sans-xs text-bold text-ink">{subject}</h3>
                <Tag
                    text={type}
                    className={`margin-left-1 ${RELEASE_NOTES_TAG_CLASSES[type]}`}
                />
            </div>
            <p className="margin-0 font-12px text-ink">{description}</p>
        </article>
    );
};

export default ReleaseNote;
