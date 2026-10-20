import RoundedBox from "../../components/UI/RoundedBox";
import Tag from "../../components/UI/Tag";
import { getRoadmapItemsByStatus } from "./roadmapData.helpers";
import { ROADMAP_STATUS, ROADMAP_STATUS_LABELS, ROADMAP_STATUS_TAG_CLASSES } from "./roadmapStatus.constants";

/*
    NOTE: "Up Next" is hardcoded here rather than read from `ROADMAP_STATUS_LABELS` (used
    by `RoadmapStatusCard`) because this card's Figma frame ("Current & Next Up") labels
    the NOT_STARTED column just "Up Next", not "Up Next / Later*" — the two cards are
    allowed to word that one status differently. CURRENTLY_DEVELOPING's label ("In
    Progress") IS identical in both frames, so it reads from the shared constant instead
    of duplicating the string. Don't hardcode "Up Next" to match `ROADMAP_STATUS_LABELS`
    without checking both Figma frames first.
*/

/*
    NOTE: This card is a space-constrained summary, so its "Up Next" column shows a capped,
    curated subset of NOT_STARTED — unlike `RoadmapStatusCard`, which shows every one. Two
    deliberate divergences from the shared data, both scoped to this card alone:

    - NEXT_UP_MAX_ITEMS caps the column so the card can't outgrow its Figma frame as the
      roadmap fills up. Items render in `roadmapData.json`'s authored order (NOT alphabetised
      the way `RoadmapStatusCard` sorts them), so that authored order IS the priority order —
      reorder the JSON to change which items surface here.
    - NEXT_UP_EXCLUDED_IDS hides specific rows from this card while leaving them visible on
      the "OPS at a Glance" board. Keyed on `id`, not `title`, so rewording a label doesn't
      silently un-hide the row.

    Capping and this explicit exclude list are the only sanctioned ways the two surfaces may
    disagree — OPS-6331 was about them disagreeing *by accident*, which is still the thing to
    avoid. For anything else, change `roadmapData.json` so both surfaces move together.
*/
const NEXT_UP_MAX_ITEMS = 6;
const NEXT_UP_EXCLUDED_IDS = [25]; // 25 = "Other Partner Agreements (IAA, IDDA, IPA)"

const CurrentlyDevelopingCard = () => {
    const currentlyDevelopingItems = getRoadmapItemsByStatus(ROADMAP_STATUS.CURRENTLY_DEVELOPING);
    const nextUpItems = getRoadmapItemsByStatus(ROADMAP_STATUS.NOT_STARTED)
        .filter((item) => !NEXT_UP_EXCLUDED_IDS.includes(item.id))
        .slice(0, NEXT_UP_MAX_ITEMS);

    return (
        <RoundedBox className="flex-fill">
            <div
                className="display-flex"
                style={{ gap: "2rem" }}
            >
                <div className="flex-fill">
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        {ROADMAP_STATUS_LABELS[ROADMAP_STATUS.CURRENTLY_DEVELOPING]}
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
                                className={ROADMAP_STATUS_TAG_CLASSES[ROADMAP_STATUS.CURRENTLY_DEVELOPING]}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex-fill">
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">Up Next</h3>
                    <div
                        className="display-flex flex-column flex-align-start"
                        style={{ gap: "0.5rem" }}
                    >
                        {nextUpItems.map((item) => (
                            <Tag
                                key={item.id}
                                text={item.title}
                                className={ROADMAP_STATUS_TAG_CLASSES[ROADMAP_STATUS.NOT_STARTED]}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </RoundedBox>
    );
};

export default CurrentlyDevelopingCard;
