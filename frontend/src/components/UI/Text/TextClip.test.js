import { render } from "@testing-library/react";
import TextClip from "./TextClip";

it("renders without crashing", () => {
    render(
        <TextClip
            text="Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor"
            maxLines={3}
        />
    );
});
