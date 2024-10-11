import ReactSlider from "react-slider";
import styled from 'styled-components';

const DoubleRangeSlider = ({min, max}) => {
    const StyledSlider = styled(ReactSlider)`
        width: 100%;
        height: 25px;
    `;

    const StyledThumb = styled.div`
        height: 30px;
        line-height: 30px;
        width: 30px;
        text-align: center;
        background-color: whitesmoke;
        color: black;
        border: 2px solid gray;
        border-radius: 50%;
        cursor: grab;
    `;

    const Thumb = (props, state) => <StyledThumb {...props}>{state.valueNow}</StyledThumb>;

    const StyledTrack = styled.div`
        top: 5px;
        bottom: 0;
        background: white;
        border-radius: 999px;
        border: 1px solid black;
    `;

    const Track = (props, state) => <StyledTrack {...props} index={state.index} />;

    return (
        <div>
            <StyledSlider defaultValue={[min, max]} renderTrack={Track} renderThumb={Thumb} />
        </div>
    );
}

export default DoubleRangeSlider;
