import { render, screen } from "@testing-library/react";
import DocumentView from "./DocumentView";

import store from "../../store";
import { Provider } from "react-redux";

describe("Document View", () => {
    test("renders correctly", () => {
        render(
            <Provider store={store}>
                <DocumentView
                    isEditMode={false}
                    setIsEditMode={() => {}}
                />
            </Provider>
        );

        expect(screen.getByText("Documents")).toBeInTheDocument();
    });
});
