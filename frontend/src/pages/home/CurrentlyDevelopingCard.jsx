import RoundedBox from "../../components/UI/RoundedBox";
import Tag from "../../components/UI/Tag";
import roadmapData from "./roadmapData.json";
import { ROADMAP_STATUS } from "./roadmapStatus.constants";

const CurrentlyDevelopingCard = () => {
    const currentlyDevelopingItems = roadmapData.filter((item) => item.status === ROADMAP_STATUS.CURRENTLY_DEVELOPING);
    const nextUpItems = roadmapData.filter((item) => item.status === ROADMAP_STATUS.NOT_STARTED);

    return (
        <RoundedBox className="flex-fill">
            <div
                className="display-flex"
                style={{ gap: "2rem" }}
            >
                <div className="flex-fill">
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        Currently Developing
                    </h3>
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
                <div className="flex-fill">
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">Next Up</h3>
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
