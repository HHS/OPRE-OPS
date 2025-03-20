/**
 * @typedef {Object} HoverCardProps
 * @property {string} title - The title of the card.
 * @property {string} description - The description of the card.
 * @property {"light" | "dark"} variant - The variant of the card.
 * @property {1 | 2 | 3 | 4 | 5 | 6} [level] - The level of the heading.
 */

/**
 * @component - A card component that wraps children in a rounded box
 * @param {HoverCardProps} props - The props of the component
 * @returns {JSX.Element} - The rendered component
 */

const HoverCard = ({ title, description, variant, level = 3 }) => {
    if (typeof level !== "number" || level < 1 || level > 6) {
        throw new Error(`Unrecognized heading level: ${level}`);
    }
    const HeadingTag = `h${level}`;

    return (
        <div
            className={`usa-card grid-col-4 display-flex flex-column flex-align-center ${variant === "dark" ? "bg-brand-primary-dark text-white" : ""}`}
            style={{ padding: "53px 23px" }}
        >
            {/* @ts-ignore */}
            <HeadingTag className="margin-0 margin-bottom-1 font-sans-lg">{title}</HeadingTag>
            <p className="text-center margin-0">{description}</p>
        </div>
    );
};

export default HoverCard;
