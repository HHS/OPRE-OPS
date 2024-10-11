import ReactSlider from "react-slider";
import styled from 'styled-components';

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

const StyledSlider = styled(ReactSlider)`
    width: 100%;
    height: 25px;
`;

// const DoubleRangeSlider = ({min, max, onValueChange}) => {
const DoubleRangeSlider = ({onValueChange}) => {
    const Thumb = ({ key, ...props }) => (
        <StyledThumb key={key} {...props}/>
    );

    const Track = ({ key, ...props }) => (
        <StyledTrack key={key} {...props}/>
    );

    return (
        <div>
            <StyledSlider
                onBeforeChange={(value, index) => {
                    console.log('Before change:', value)
                    console.log('Index:', index)
                }}
                onAfterChange={(value) =>{
                    if (onValueChange) {
                        onValueChange(value);
                    }
                    console.log('New range:', value);
                }}
                defaultValue={[25, 75]}
                renderTrack={Track}
                renderThumb={Thumb} />
        </div>
    );
}

export default DoubleRangeSlider;
