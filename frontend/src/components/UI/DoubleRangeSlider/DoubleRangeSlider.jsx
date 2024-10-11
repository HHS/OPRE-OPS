import ReactSlider from "react-slider";
import styled from "styled-components";

const DoubleRangeSlider = ({ handleChange }) => (
    <StyledSlider
        onChange={handleChange}
        defaultValue={[25, 75]}
        renderTrack={Track}
        renderThumb={Thumb}
    />
);
const StyledSlider = styled(ReactSlider)`
    width: 100%;
    height: 25px;
`;

const Thumb = ({ key, ...props }) => (
    <StyledThumb
        key={key}
        {...props}
    />
);

const Track = ({ key, ...props }) => (
    <StyledTrack
        key={key}
        {...props}
    />
);

const StyledTrack = styled.div`
    top: 5px;
    bottom: 0;
    background: white;
    border-radius: 999px;
    border: 1px solid black;
`;

const StyledThumb = styled.div`
    height: 30px;
    line-height: 30px;
    width: 30px;
    background-color: whitesmoke;
    border: 2px solid gray;
    border-radius: 50%;
    cursor: grab;
`;
export default DoubleRangeSlider;
