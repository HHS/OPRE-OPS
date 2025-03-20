import React from "react";
/**
 * @typedef {Object} HoverCardProps
 * @property {string} title - The title of the card.
 * @property {string} description - The description of the card.
 * @property {"light" | "dark"} variant - The variant of the card.
 * @property {string} icon - The icon of the card.
 * @property {1 | 2 | 3 | 4 | 5 | 6} [level] - The level of the heading.
 */

/**
 * @component - A card component that wraps children in a rounded box
 * @param {HoverCardProps} props - The props of the component
 * @returns {JSX.Element} - The rendered component
 */

const HoverCard = ({ title, description, variant, icon, level = 3 }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    if (typeof level !== "number" || level < 1 || level > 6) {
        throw new Error(`Unrecognized heading level: ${level}`);
    }
    const HeadingTag = `h${level}`;

    return (
        <>
            {!isHovered ? (
                <div
                    className="usa-card grid-col-4 display-flex flex-column flex-align-center border-1px border-red"
                    style={{ padding: "53px 23px" }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <img
                        src={icon}
                        alt={title}
                        width="125px"
                    />
                    {/* @ts-ignore */}
                    <HeadingTag className="margin-0 margin-top-2 font-sans-lg">{title}</HeadingTag>
                </div>
            ) : (
                <div
                    className={`usa-card grid-col-4 display-flex flex-column flex-align-center ${variant === "dark" ? "bg-brand-primary-dark text-white" : ""}`}
                    style={{ padding: "53px 23px" }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* @ts-ignore */}
                    <HeadingTag className="margin-0 margin-bottom-1 font-sans-lg">{title}</HeadingTag>
                    <p className="text-center margin-0">{description}</p>
                </div>
            )}
        </>
    );
};

export default HoverCard;
