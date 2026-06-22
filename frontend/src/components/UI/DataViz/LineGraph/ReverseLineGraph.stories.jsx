import { computeDisplayPercents } from "../../../../helpers/utils";
import ReverseLineGraph from "./ReverseLineGraph";

export default {
    title: "UI/DataViz/ReverseLineGraph",
    component: ReverseLineGraph,
    parameters: {
        docs: {
            description: {
                component:
                    "Two-segment horizontal bar for received vs remaining funding. Unlike `LineGraph`, " +
                    "the left bar (received) is conditionally rendered — it is hidden when `leftValue === 0`. " +
                    "The right bar always renders with a diagonal stripe background. Always expects exactly " +
                    "**two** data items. Used inside `ReceivedFundingCard`."
            }
        }
    },
    argTypes: {
        receivedValue: {
            control: { type: "number", min: 0, step: 50_000 },
            description: "Amount received (left bar)",
            table: { category: "Values" }
        },
        remainingValue: {
            control: { type: "number", min: 0, step: 50_000 },
            description: "Remaining amount (right bar, striped)",
            table: { category: "Values" }
        },
        receivedColor: { control: "color", description: "Received bar color", table: { category: "Colors" } },
        remainingColor: { control: "color", description: "Remaining bar color", table: { category: "Colors" } }
    }
};

const buildData = ({ receivedValue, remainingValue, receivedColor, remainingColor }) => {
    const raw = [
        { id: 1, value: receivedValue, color: receivedColor },
        { id: 2, value: remainingValue, color: remainingColor }
    ];
    return computeDisplayPercents(raw);
};

const defaultColors = { receivedColor: "#d4d9dc", remainingColor: "#336a90" };

/**
 * Partial funding received — left bar fills proportionally, right bar striped.
 * Use **Controls** to adjust amounts and colors live.
 */
export const Default = {
    args: { receivedValue: 800_000, remainingValue: 1_200_000, ...defaultColors },
    render: ({ receivedValue, remainingValue, receivedColor, remainingColor }) => (
        <ReverseLineGraph data={buildData({ receivedValue, remainingValue, receivedColor, remainingColor })} />
    )
};

/**
 * Nothing received yet — left bar is hidden, right striped bar fills 100%.
 * Verify: only the striped bar is visible, no left bar rendered.
 */
export const ZeroReceived = {
    args: { receivedValue: 0, remainingValue: 2_000_000, ...defaultColors },
    render: ({ receivedValue, remainingValue, receivedColor, remainingColor }) => (
        <ReverseLineGraph data={buildData({ receivedValue, remainingValue, receivedColor, remainingColor })} />
    )
};

/**
 * Received exceeds total funding — left bar overflows.
 * Verify: layout holds, no crash.
 */
export const OverReceived = {
    args: { receivedValue: 2_400_000, remainingValue: 0, ...defaultColors },
    render: ({ receivedValue, remainingValue, receivedColor, remainingColor }) => (
        <ReverseLineGraph data={buildData({ receivedValue, remainingValue, receivedColor, remainingColor })} />
    )
};
