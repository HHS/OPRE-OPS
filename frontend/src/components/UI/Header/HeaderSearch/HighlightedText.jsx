import { splitHighlight } from "./HeaderSearch.helpers";

/**
 * Renders text with the first case-insensitive occurrence of `query` wrapped in <mark>.
 * Plain text nodes only: no HTML injection.
 * @param {Object} props
 * @param {string|null} [props.text] - The text to render.
 * @param {string} props.query - The search text to highlight.
 * @returns {React.ReactElement} The rendered text.
 */
const HighlightedText = ({ text, query }) => {
    const [before, match, after] = splitHighlight(text, query);
    if (!match) {
        return <>{before}</>;
    }
    return (
        <>
            {before}
            <mark>{match}</mark>
            {after}
        </>
    );
};

export default HighlightedText;
