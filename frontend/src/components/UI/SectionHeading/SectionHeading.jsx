/**
 * @typedef {Object} SectionHeadingProps
 * @property {string} title - The section title.
 * @property {string} [instructions] - Optional supporting copy rendered below the title.
 * @property {number} [level=2] - The heading level for the title. Defaults to 2.
 * @property {string} [className] - Additional CSS classes for the wrapper.
 * @property {string} [dataCy] - Data attribute for Cypress tests.
 */

/**
 * @component - Renders a section title with optional instructional copy.
 * @param {SectionHeadingProps} props - The properties passed to the component.
 * @returns {JSX.Element} - The rendered component.
 */
const SectionHeading = ({ title, instructions, level = 2, className = "", dataCy }) => {
    if (typeof level !== "number" || level < 1 || level > 6) {
        throw new Error(`Unrecognized heading level: ${level}`);
    }

    const Heading = `h${level}`;

    return (
        <div
            className={`margin-bottom-4 ${className}`.trim()}
            data-cy={dataCy}
        >
            <Heading className="margin-0 font-sans-lg text-bold text-ink">{title}</Heading>
            {instructions && (
                <p className="margin-0 margin-top-2 font-sans-sm line-height-sans-4 text-ink">{instructions}</p>
            )}
        </div>
    );
};

export default SectionHeading;
