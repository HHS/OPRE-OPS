import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import RoundedBox from "./RoundedBox";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <RoundedBox dataCy="test" className="">
                <div>Test</div>
            </RoundedBox>
        </Provider>
    );
});
