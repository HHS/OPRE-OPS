import { ResponsivePie } from "@nivo/pie";
import { useEffect, useRef } from "react";

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
    const observerRef = useRef(null);

    useEffect(() => {
        const container = document.querySelector(`#${container_id}`);
        if (!container) return;

        const applyA11y = (svg) => {
            svg.setAttribute(
                "aria-label",
                "This is a Donut Chart that displays the percent by budget line status in the center."
            );
        };

        const existingSvg = container.querySelector("svg");
        if (existingSvg) {
            applyA11y(existingSvg);
            return;
        }

        // Nivo renders the SVG asynchronously; observe the container until it appears.
        observerRef.current = new MutationObserver(() => {
            const svg = container.querySelector("svg");
            if (svg) {
                applyA11y(svg);
                observerRef.current?.disconnect();
            }
        });
        observerRef.current.observe(container, { childList: true, subtree: true });

        return () => {
            observerRef.current?.disconnect();
        };
    }, [container_id]);

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
