import App from "../App";
import RoundedBox from "../components/UI/RoundedBox";
// import { Tooltip } from "../components/UI/USWDS/Tooltip";
import * as Tooltip from "@radix-ui/react-tooltip";
import "./styles.css";
// import styles from "./styles.css";

const Home = () => {
    return (
        <App>
            <div className="display-flex flex-justify-center">
                <RoundedBox className="padding-x-2 margin-top-2 display-inline-block text-center">
                    <h1>This is the OPRE OPS system prototype</h1>
                    <p>⚠️Tread with caution</p>
                </RoundedBox>
            </div>
            <div style={{ marginTop: "20em", marginBottom: "20em" }}>
                <Tooltip.Provider>
                    <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                            <button>Button Text</button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                            <Tooltip.Content
                                // className={`${styles.TooltipContent}`}
                                className="TooltipContent"
                                sideOffset={5}
                            >
                                Add to library
                                <Tooltip.Arrow className="ZZZTooltipArrow" />
                            </Tooltip.Content>
                        </Tooltip.Portal>
                    </Tooltip.Root>
                </Tooltip.Provider>
            </div>
        </App>
    );
};

export default Home;
