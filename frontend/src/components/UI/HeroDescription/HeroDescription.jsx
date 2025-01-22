import cssStyles from "./HeroDescription.module.css";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";
/**
 * @component
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.description
 * @param {string []} props.urls
 * @returns {JSX.Element}
 */
const HeroDescription = ({ label, description, urls }) => {
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
                <ReactMarkdown>{description?.trimStart().substring(0, 255) + "..."}</ReactMarkdown>
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
                <ReactMarkdown>{description?.trimStart()}</ReactMarkdown>
                <button
                    className="usa-button usa-button--unstyled"
                    onClick={collapseExpand}
                    type="button"
                >
                    show less
                </button>
                {urls?.map((url) => (
                    <a
                        key={url.id}
                        href={url.url}
                        className="display-block margin-top-2 width-fit-content text-primary"
                    >
                        See more on the website
                        <FontAwesomeIcon
                            icon={faUpRightFromSquare}
                            className={`h-9  ${cssStyles.upRightIcon}`}
                        />
                    </a>
                ))}
            </div>
        </div>
    );
};

export default HeroDescription;
