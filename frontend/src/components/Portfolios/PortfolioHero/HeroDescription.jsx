import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";

// The description sits inside Hero's `ops-card` section, which opts its copy out of the
// global 24px paragraph leading (see frontend/CLAUDE.md "Paragraph Leading"). Setting the
// line-height on the <p> itself still wins per that rule's `:where()` design.
const markdownComponents = {
    p: ({ node, ...props }) => {
        void node;
        return (
            <p
                className="line-height-body-4"
                {...props}
            />
        );
    }
};
/**
 * @component
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.description
 * @param {string} props.url
 * @returns {React.ReactElement}
 */
const HeroDescription = ({ label, description, url }) => {
    const styles = {
        hidden: {
            display: "none"
        },
        visible: {
            display: "inherit"
        }
    };

    const [textStyle, setTextStyle] = useState(styles.hidden);
    const [buttonStyle, setButtonStyle] = useState(styles.visible);

    const expandCollapse = () => {
        setTextStyle(styles.visible);
        setButtonStyle(styles.hidden);
    };

    const collapseExpand = () => {
        setTextStyle(styles.hidden);
        setButtonStyle(styles.visible);
    };

    return (
        <div className="margin-top-1">
            <div className="text-base-dark margin-top-3 font-12px">{label}</div>
            <div
                style={buttonStyle}
                className="margin-top-neg-105"
            >
                <ReactMarkdown components={markdownComponents}>
                    {description?.trimStart().substring(0, 255) + "..."}
                </ReactMarkdown>
                <button
                    className="usa-button usa-button--unstyled"
                    onClick={expandCollapse}
                    type="button"
                >
                    read more
                </button>
            </div>
            <div
                style={textStyle}
                className="margin-top-neg-105"
            >
                <ReactMarkdown components={markdownComponents}>{description?.trimStart() + "..."}</ReactMarkdown>
                {url && (
                    <a
                        href={url}
                        className="display-block margin-top-2 width-fit-content text-primary"
                        target="_blank"
                        rel="noreferrer"
                    >
                        See more on the website
                        <FontAwesomeIcon
                            icon={faUpRightFromSquare}
                            className="width-105 margin-left-1"
                            aria-hidden="true"
                        />
                    </a>
                )}
                <button
                    className="usa-button usa-button--unstyled margin-top-4"
                    onClick={collapseExpand}
                    type="button"
                >
                    show less
                </button>
            </div>
        </div>
    );
};

export default HeroDescription;
