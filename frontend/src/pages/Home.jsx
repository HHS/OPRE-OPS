import App from "../App";
import RoundedBox from "../components/UI/RoundedBox";
import { Tooltip } from "../components/UI/USWDS/Tooltip";

const Home = () => {
    return (
        <App>
            <div className="display-flex flex-justify-center">
                <RoundedBox className="padding-x-2 margin-top-2 display-inline-block text-center">
                    <h1>This is the OPRE OPS system prototype</h1>
                    <p>⚠️Tread with caution</p>
                </RoundedBox>
            </div>
            <div>
                <Tooltip label="Test Tooltip Label">
                    <span>Tooltip Trigger</span>
                </Tooltip>
            </div>
        </App>
    );
};

export default Home;
