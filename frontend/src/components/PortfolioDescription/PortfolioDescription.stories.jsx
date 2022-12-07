import { PortfolioDescription } from "./PortfolioDescription";
import { BrowserRouter as Router } from "react-router-dom";

const output = {
    title: "Portfolio/PortfolioDescription",
    component: PortfolioDescription,
    args: {},
};
export default output;

const Template = (args) => (
    <Router>
        <PortfolioDescription {...args} />
    </Router>
);

export const Story = Template.bind({});
Story.args = {};
