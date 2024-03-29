import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import CANFundingBar from "./CANFundingBar";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

it("renders without crashing", () => {
    const setActiveId = mockFn;

    const data = [
        {
            id: 1,
            label: "Available",
            value: "10000",
            color: "#C07B96",
            percent: "10%"
        },
        {
            id: 2,
            label: "Planned",
            value: "12000",
            color: "#336A90",
            percent: "12%"
        },
        {
            id: 3,
            label: "Executing",
            value: "8000",
            color: "#E5A000",
            percent: "8%"
        },
        {
            id: 4,
            label: "Obligated",
            value: "6000",
            color: "#3A835B",
            percent: "6%"
        }
    ];
    render(
        <Provider store={store}>
            <CANFundingBar
                setActiveId={setActiveId}
                data={data}
            />
        </Provider>
    );
});
