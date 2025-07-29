import WhatsNextTable from "./WhatsNextTable";

const WhatsNext = () => {
    return (
        <>
            <h1 className="font-24px">What&apos;s Next</h1>
            <p>
                This is a list of what upcoming features will be available in OPS soon including their status.
                Priorities are subject to change based on decisions by leadership.
            </p>
            <WhatsNextTable />
        </>
    );
};

export default WhatsNext;
