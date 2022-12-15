import { GovBanner } from "./GovBanner";
const output = {
    title: "Header/GovBanner",
    component: GovBanner,
    args: {},
};
export default output;

const Template = (args) => <GovBanner {...args} />;

export const Story = Template.bind({});
Story.args = {};
