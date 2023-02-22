import store from "../../../store";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import UserInfo from "./UserInfo";

// TODO: Skipping for now - the CanCard updates state when rendered so needs to
// TODO: use: https://reactjs.org/docs/test-utils.html#act to work properly
it.skip("renders without crashing", () => {
    render(
        <Provider store={store}>
            <UserInfo></UserInfo>
        </Provider>
    );
});
