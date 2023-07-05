import TabsSection from "./TabsSection";
import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <BrowserRouter>
                <TabsSection />
            </BrowserRouter>
        </Provider>
    );
});
