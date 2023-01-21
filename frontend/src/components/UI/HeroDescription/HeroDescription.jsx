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
            <button onClick={expandCollapse} style={buttonStyle}>
                <ReactMarkdown>{description?.trimStart().substring(0, 255) + "..."}</ReactMarkdown>
                <span className={cssStyles.readMore} onClick={expandCollapse}>
                    read more
                </span>
            </button>
            <span style={textStyle}>
                <ReactMarkdown>{description?.trimStart()}</ReactMarkdown>
                <span className={cssStyles.readMore} onClick={collapseExpand}>
                    show less
                </span>
                {urls?.map((url) => (
                    <p key={url.id}>
                        <a key={url.id} href={url.url}>
                            See more on the website
                            <FontAwesomeIcon icon={solid("up-right-from-square")} className={cssStyles.upRightIcon} />
                        </a>
                    </p>
                ))}
            </span>
        </div>
    );
};

export default HeroDescription;
