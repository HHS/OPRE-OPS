import { render } from "@testing-library/react";
import UserEmailComboBox from "./UserEmailComboBox.jsx";
import { Provider } from "react-redux";
import store from "../../../store";

describe("UserEmailComboBox", () => {
    it("renders without crashing", () => {
        render(
            <Provider store={store}>
                <App />
            </Provider>
        );
    });
});

const App = () => {
    <UserEmailComboBox></UserEmailComboBox>;
};
