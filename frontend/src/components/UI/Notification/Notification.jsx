export const Notification = ({ data }) => {
    return (
        <li className="font-heading-3xs">
            {data.title} - {data.message}
        </li>
    );
};
export default Notification;
