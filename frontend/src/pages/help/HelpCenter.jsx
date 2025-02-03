import App from "../../App";
import PageHeader from "../../components/UI/PageHeader";

const HelpCenter = () => {
    return (
        <App breadCrumbName="Help Center">
            <PageHeader
                title="Help Center"
                subTitle="OPS Guides & Information"
            />
            <p>howdy team</p>
        </App>
    );
};

export default HelpCenter;
