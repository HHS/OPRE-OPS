import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import store from "../../../store";
import UserAdmin from "./UserAdmin.jsx";

describe("UserAdmin", () => {
    it("renders without crashing", () => {
        render(
            <Provider store={store}>
                <App />
            </Provider>
        );
    });
});

const App = () => {
    <UserAdmin></UserAdmin>;
};
