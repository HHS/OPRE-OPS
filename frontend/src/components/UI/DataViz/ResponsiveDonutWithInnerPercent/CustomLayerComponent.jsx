/* eslint-disable react/display-name */
const CustomLayerComponent = (myProps) => (layerProps) => {
    const { centerX, centerY } = layerProps;

    return (
        <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
                fontSize: "20px",
                fontWeight: "600"
            }}
        >
            {myProps}
        </text>
    );
};

export default CustomLayerComponent;
