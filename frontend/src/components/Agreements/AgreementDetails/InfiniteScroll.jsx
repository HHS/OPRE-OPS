import { useCallback, useEffect, useRef, useState } from "react";

const InfiniteScroll = ({ fetchMoreData, isLoading }) => {
    const [isFetching, setIsFetching] = useState(false);
    const observerRef = useRef();

    const handleIntersection = useCallback((entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoading && !isFetching) {
            setIsFetching(true);
            fetchMoreData().then(() => {
                setIsFetching(false);
            });
        }
    }, [isLoading, isFetching, fetchMoreData]);

    useEffect(() => {
        const observer = new IntersectionObserver(handleIntersection, {
            threshold: 0.1
        });

        const currentElement = observerRef.current;

        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
        };
    }, [observerRef, isLoading, fetchMoreData, isFetching, handleIntersection]);

    return (
        <div
            ref={observerRef}
            style={{ minHeight: "2em" }}
        />
    );
};

export default InfiniteScroll;
