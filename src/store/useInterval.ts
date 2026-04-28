import { useEffect, useRef } from "react";

/**
 * Custom hook to run a callback at a specified interval.
 * Automatically clears the interval on unmount or when dependencies change.
 *
 * @param callback Function to call at each interval
 * @param delay Interval in milliseconds (set null to stop)
 */
export function useInterval(callback: () => void, delay: number | null) {
	const savedCallback = useRef<() => void>();

	// Remember the latest callback.
	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	// Set up the interval.
	useEffect(() => {
		if (delay === null) return;

		const tick = () => {
			if (savedCallback.current) savedCallback.current();
		};

		const id = setInterval(tick, delay);
		return () => clearInterval(id);
	}, [delay]);
}
