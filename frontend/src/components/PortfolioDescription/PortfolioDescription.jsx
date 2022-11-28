import { useSelector } from "react-redux";

import cssStyles from "./styles.module.css";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";

const PortfolioDescription = () => {
    const portfolio = useSelector((state) => state.portfolioDetail.portfolio);

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
        <div>
            <button onClick={expandCollapse} style={buttonStyle}>
                <p>
                    {portfolio.description?.[0].text}...
                    <span className={cssStyles.readMore} onClick={expandCollapse}>
                        read more
                    </span>
                </p>
            </button>
            <span style={textStyle}>
                {portfolio.description?.map(
                    (description_line) =>
                        description_line.paragraph_number !== 0 && (
                            <p key={description_line.id}>{description_line.text}</p>
                        )
                )}
                {portfolio.urls?.map((url) => (
                    <p key={url.id}>
                        <a key={url.id} href={url.url}>
                            See more on the website
                            <FontAwesomeIcon icon={solid("up-right-from-square")} className={cssStyles.upRightIcon} />
                        </a>
                    </p>
                ))}
                <p>
                    <span className={cssStyles.readMore} onClick={collapseExpand}>
                        show less
                    </span>
                </p>
            </span>
        </div>
    );
};

export default PortfolioDescription;
