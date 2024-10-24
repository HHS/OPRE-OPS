import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import store from "../../../store";
import LineGraph from "./LineGraph";

const mockFn = TestApplicationContext.helpers().mockFn;

it("renders without crashing", () => {
    const setActiveId = mockFn;

    const data = [
        {
            id: 1,
            value: 10_000,
            color: "#C07B96"
        },
        {
            id: 2,
            value: 12_000,
            color: "#336A90"
        },
        {
            id: 3,
            value: 8_000,
            color: "#E5A000"
        },
        {
            id: 4,
            value: 6_000,
            color: "#3A835B"
        }
    ];
    render(
        <Provider store={store}>
            <LineGraph
                setActiveId={setActiveId}
                data={data}
            />
        </Provider>
    );
});
