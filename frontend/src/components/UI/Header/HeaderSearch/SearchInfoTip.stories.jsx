import SearchInfoTip from "./SearchInfoTip";

export default {
    title: "UI/Header/HeaderSearch/SearchInfoTip",
    component: SearchInfoTip,
    decorators: [
        (Story) => (
            // The icon hangs off the right edge of its positioned parent (like the header's search box):
            // reserve that space and the tip's height outside a bounded positioned container.
            <div style={{ padding: "1rem 4rem 8rem 1rem" }}>
                <div style={{ position: "relative", width: "20rem", height: "2.25rem", border: "1px dashed #a9aeb1" }}>
                    <Story />
                </div>
            </div>
        )
    ]
};

export const Default = {};
