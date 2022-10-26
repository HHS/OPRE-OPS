import { ResponsivePie } from "@nivo/pie";

export const ResponsiveDonutWithInnerPercent = ({ data, width, height, margin, CustomLayerComponent, setPercent }) => (
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
