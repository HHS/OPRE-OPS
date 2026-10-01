import RoundedBox from "../../components/UI/RoundedBox";
import Tag from "../../components/UI/Tag";
import { currentlyDevelopingItems, nextUpItems } from "./homepageData";

const CurrentlyDevelopingCard = () => {
    return (
        <RoundedBox style={{ flex: 1 }}>
            <div
                className="display-flex"
                style={{ gap: "2rem" }}
            >
                <div style={{ flex: 1 }}>
                    <h2 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        Currently Developing
                    </h2>
                    <span className="font-sans-xl text-bold line-height-sans-1 display-block margin-bottom-1">
                        {currentlyDevelopingItems.length}
                    </span>
                    <div
                        className="display-flex flex-column flex-align-start"
                        style={{ gap: "0.5rem" }}
                    >
                        {currentlyDevelopingItems.map((item) => (
                            <Tag
                                key={item.id}
                                text={item.title}
                                className="bg-brand-data-viz-bl-by-status-3 text-ink"
                            />
                        ))}
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <h2 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">Next Up</h2>
                    <div
                        className="display-flex flex-column flex-align-start"
                        style={{ gap: "0.5rem" }}
                    >
                        {nextUpItems.map((item) => (
                            <Tag
                                key={item.id}
                                text={item.title}
                                className="bg-brand-primary-light text-primary"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </RoundedBox>
    );
};

export default CurrentlyDevelopingCard;
