import store from "../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import CANFundingBar from "./CANFundingBar";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <CANFundingBar />
        </Provider>
    );
});
