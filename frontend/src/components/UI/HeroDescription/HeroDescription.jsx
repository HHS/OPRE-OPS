import cssStyles from "./HeroDescription.module.css";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import ReactMarkdown from "react-markdown";

const HeroDescription = ({ description, urls }) => {
    const styles = {
        hidden: {
            display: "none",
        },
        visible: {
            display: "inherit",
        },
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
            <div style={buttonStyle}>
                <ReactMarkdown>{description?.trimStart().substring(0, 255) + "..."}</ReactMarkdown>
                <button className="usa-button usa-button--unstyled" onClick={expandCollapse} type="button">
                    read more
                </button>
            </div>
            <div style={textStyle}>
                <ReactMarkdown>{description?.trimStart()}</ReactMarkdown>
                <button className="usa-button usa-button--unstyled" onClick={collapseExpand} type="button">
                    show less
                </button>
                {urls?.map((url) => (
                    <a key={url.id} href={url.url} className="display-block margin-top-2 width-fit-content">
                        See more on the website
                        <FontAwesomeIcon
                            icon={solid("up-right-from-square")}
                            className={`h-9  ${cssStyles.upRightIcon}`}
                        />
                    </a>
                ))}
            </div>
        </div>
    );
};

export default HeroDescription;
