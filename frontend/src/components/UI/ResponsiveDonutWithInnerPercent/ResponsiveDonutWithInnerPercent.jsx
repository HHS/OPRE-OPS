import { ResponsivePie } from "@nivo/pie";
import { useEffect } from "react";

export const ResponsiveDonutWithInnerPercent = ({ data, width, height, margin, CustomLayerComponent, setPercent }) => {
    const setA11y = async () => {
        const container = document.querySelector(".usa-card__img");
        const elem = container.querySelector("svg");

        if (elem !== null) {
            elem.setAttribute(
                "aria-label",
                "This is a Donut Chart that displays the percent by budget line status in the center."
            );
        }
    };

    useEffect(() => {
        setA11y();
    });

    return (
        <ResponsivePie
            margin={margin}
            width={width}
            height={height}
            data={data}
            innerRadius={0.5}
            enableArcLabels={false}
            enableArcLinkLabels={false}
            enableRadialLabels={false}
            enableSlicesLabels={false}
            activeInnerRadiusOffset={3}
            activeOuterRadiusOffset={3}
            tooltip={() => <></>}
            colors={{ datum: "data.color" }}
            layers={["arcs", "slices", "sliceLabels", "radialLabels", "legends", CustomLayerComponent]}
            onMouseEnter={(node) => {
                setPercent(node.data.percent);
            }}
            onMouseLeave={() => {
                setPercent("");
            }}
        />
    );
};
