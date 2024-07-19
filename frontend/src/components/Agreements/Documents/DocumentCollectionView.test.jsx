import { render, screen } from "@testing-library/react";
import DocumentCollectionView from "./DocumentCollectionView";

import store from "../../../store";
import { Provider } from "react-redux";

describe("Document Collection View", () => {
    test("renders correctly with no documents in view", () => {
        render(
            <Provider store={store}>
                <DocumentCollectionView documents={[]} />
            </Provider>
        );

        expect(screen.getByText("No Documents Uploaded")).toBeInTheDocument();
    });
});
