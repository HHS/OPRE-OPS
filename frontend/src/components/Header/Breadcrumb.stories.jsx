import { Breadcrumb } from "./Breadcrumb";
import { BrowserRouter as Router } from "react-router-dom";

const output = {
    title: "Header/Breadcrumb",
    component: Breadcrumb,
    args: {},
};

export default output;

const Template = (args) => (
    <Router>
        <Breadcrumb {...args} />
    </Router>
);

export const Story = Template.bind({});
Story.args = {};
