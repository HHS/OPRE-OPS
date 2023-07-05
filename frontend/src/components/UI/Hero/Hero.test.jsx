import Hero from "./Hero";
import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <Hero />
        </Provider>
    );
});
