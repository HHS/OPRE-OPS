import { ResponsivePie } from "@nivo/pie";
import { useEffect } from "react";

const ResponsiveDonutWithInnerPercent = ({
    data = [{ id: -1, label: "", value: "", color: "", percent: "" }],
    width = 150,
    height = 150,
    margin,
    CustomLayerComponent,
    setPercent = () => {},
    setHoverId = () => {},
    container_id
}) => {
    const setA11y = async () => {
        const container = document.querySelector(`#${container_id}`);
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
                setPercent(`${node.data.percent}`);
                setHoverId(node.data.id);
            }}
            onMouseLeave={() => {
                setPercent("");
                setHoverId(-1);
            }}
        />
    );
};

export default ResponsiveDonutWithInnerPercent;
