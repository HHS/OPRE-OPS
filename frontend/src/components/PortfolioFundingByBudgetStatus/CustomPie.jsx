import { ResponsivePie } from "@nivo/pie";

const margin = { top: 10, right: 10, bottom: 10, left: 10 };

export const CustomPie = ({ data, CustomLayerComponent, setPercent }) => (
    <ResponsivePie
        margin={margin}
        width={150}
        height={150}
        data={data}
        innerRadius={0.8}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        enableRadialLabels={false}
        enableSlicesLabels={false}
        activeInnerRadiusOffset={2}
        activeOuterRadiusOffset={2}
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
