import TabsSection from "../../UI/TabsSection";
import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import TextClip from "./TextClip";

it("renders without crashing", () => {
    render(
        <TextClip
            text="Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor"
            maxLines={3}
        />
    );
});
