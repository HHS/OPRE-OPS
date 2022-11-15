import { useSelector } from "react-redux";

import "./styles.module.css";
import { useState } from "react";

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
        console.log("you just clicked");

        setTextStyle(styles.visible);
        setButtonStyle(styles.hidden);
    };

    return (
        <div>
            <div>
                <p>
                    <button onClick={expandCollapse} style={buttonStyle}>
                        <span>{portfolio.description?.[0].text}...</span>
                        <span>read more</span>
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
                                </a>
                            </p>
                        ))}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default PortfolioDescription;
