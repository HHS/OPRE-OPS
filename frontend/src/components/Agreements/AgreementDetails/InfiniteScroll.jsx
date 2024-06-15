import { useEffect, useRef, useState } from "react";

const InfiniteScroll = ({ fetchMoreData, isLoading }) => {
    const [isFetching, setIsFetching] = useState(false);
    const observerRef = useRef();

    const handleIntersection = (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoading && !isFetching) {
            setIsFetching(true);
            fetchMoreData().then(() => {
                setIsFetching(false);
            });
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(handleIntersection, {
            threshold: 0.1
        });

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => {
            if (observerRef.current) {
                observer.unobserve(observerRef.current);
            }
        };
    }, [observerRef, isLoading, fetchMoreData, isFetching]);

    return (
        <div
            ref={observerRef}
            style={{ minHeight: "2em" }}
        />
    );
};

export default InfiniteScroll;
