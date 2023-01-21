import Tag from "../../UI/Tag/Tag";

const HeroFooter = () => {
    return (
        <div className={`margin-top-2 padding-0 display-flex text-bold font-sans-xs`}>
            <span className={`flex-2`}>
                Origination Date
                <div className={"margin-top-1"}>
                    <Tag text={"Jan 9, 2018"} tagStyle="lightTextDarkBackground" />
                </div>
            </span>
            <span className={`flex-3`}>Methodologies</span>
            <span className={`flex-4`}>Populations</span>
        </div>
    );
};

export default HeroFooter;
