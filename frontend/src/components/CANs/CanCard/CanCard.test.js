import CanCard from "./CanCard";
import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";

// TODO: Skipping for now - the CanCard updates state when rendered so needs to
// TODO: use: https://reactjs.org/docs/test-utils.html#act to work properly
it.skip("renders without crashing", () => {
    render(
        <Provider store={store}>
            <CanCard
                can={{
                    id: 1,
                    number: "1XXXX",
                    nickname: "Can #1",
                }}
                fiscalYear={2023}
            />
        </Provider>
    );
});
