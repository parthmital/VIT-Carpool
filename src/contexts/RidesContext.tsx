import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	ReactNode,
} from "react";
import { Ride } from "@/types/ride";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface SearchFilters {
	source?: string;
	destination?: string;
	date?: string;
	startTime?: string;
	endTime?: string;
}

interface RidesContextType {
	rides: Ride[];
	joinedRides: Set<string>;
	isLoading: boolean;
	error: string | null;
	realtimeStatus: string | null;
	createRide: (ride: Omit<Ride, "id" | "createdAt">) => Promise<void>;
	joinRide: (rideId: string) => Promise<boolean>;
	getRideById: (id: string) => Ride | undefined;
	searchRides: (filters: SearchFilters) => Ride[];
	hasJoinedRide: (rideId: string) => boolean;
	reload: () => Promise<void>;
}

const RidesContext = createContext<RidesContextType | undefined>(undefined);

const dbRideToRide = (dbRide: any): Ride => ({
	id: dbRide.id,
	source: dbRide.source,
	destination: dbRide.destination,
	date: dbRide.date,
	startTime: dbRide.start_time,
	endTime: dbRide.end_time,
	seatsAvailable: dbRide.seats_available,
	creatorId: dbRide.creator_id,
	creatorName: dbRide.creator_name,
	creatorEmail: dbRide.creator_email,
	creatorWhatsApp: dbRide.creator_whatsapp || "",
	createdAt: dbRide.created_at,
});

function abortableTimeout(ms: number) {
	const ac = new AbortController();
	const t = setTimeout(() => ac.abort(), ms);
	return { ac, cancel: () => clearTimeout(t) };
}

export function RidesProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();

	const [rides, setRides] = useState<Ride[]>([]);
	const [joinedRides, setJoinedRides] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);

	// Toggle this off if your network breaks REST when realtime is enabled (rare but useful for isolation)
	const realtimeEnabled = useMemo(() => true, []);

	const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

	const loadRides = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		// 15s to reduce false failures; aborts the fetch so it won’t hang forever.
		const { ac, cancel } = abortableTimeout(15000);

		try {
			const query = supabase
				.from("rides")
				.select("*")
				.order("created_at", { ascending: false })
				.abortSignal(ac.signal); // supported by supabase-js select API [web:150]

			const { data, error: qErr, status } = await query;

			if (qErr) {
				console.error("Error loading rides:", { status, qErr });
				setError(qErr.message ?? "Failed to load rides");
				return;
			}

			setRides((data ?? []).map(dbRideToRide));
		} catch (e: any) {
			// When aborted, supabase-js surfaces a fetch abort error message. [web:150]
			console.error("Unexpected error loading rides:", e);
			setError(e?.message ?? "Unexpected error loading rides");
		} finally {
			cancel();
			setIsLoading(false);
		}
	}, []);

	const loadJoinedRides = useCallback(async () => {
		if (!user) {
			setJoinedRides(new Set());
			return;
		}

		const { ac, cancel } = abortableTimeout(15000);

		try {
			const { data, error: qErr } = await supabase
				.from("ride_participants")
				.select("ride_id")
				.eq("user_id", user.id)
				.abortSignal(ac.signal); // same abort support [web:150]

			if (qErr) {
				console.error("Error loading joined rides:", qErr);
				return;
			}

			setJoinedRides(new Set((data ?? []).map((p: any) => p.ride_id)));
		} catch (e) {
			console.error("Unexpected error loading joined rides:", e);
		} finally {
			cancel();
		}
	}, [user]);

	const reload = useCallback(async () => {
		await Promise.all([loadRides(), loadJoinedRides()]);
	}, [loadRides, loadJoinedRides]);

	useEffect(() => {
		reload();
	}, [reload, user?.id]);

	useEffect(() => {
		if (!realtimeEnabled) return;

		const channel = supabase
			.channel("rides-changes")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "rides" },
				() => {
					loadRides();
				},
			)
			.subscribe((status, err) => {
				setRealtimeStatus(status);
				console.log("Realtime rides status:", status);
				if (status === "CHANNEL_ERROR" && err)
					console.error("Realtime error:", err);
				if (status === "TIMED_OUT") console.warn("Realtime timed out.");
			});

		channelRef.current = channel;

		return () => {
			try {
				if (channelRef.current) supabase.removeChannel(channelRef.current);
			} finally {
				channelRef.current = null;
			}
		};
	}, [loadRides, realtimeEnabled]);

	const createRide = useCallback(
		async (rideData: Omit<Ride, "id" | "createdAt">) => {
			if (!user) throw new Error("User must be authenticated to create a ride");

			const { data, error: qErr } = await supabase
				.from("rides")
				.insert({
					source: rideData.source,
					destination: rideData.destination,
					date: rideData.date,
					start_time: rideData.startTime,
					end_time: rideData.endTime,
					seats_available: rideData.seatsAvailable,
					creator_id: rideData.creatorId,
					creator_name: rideData.creatorName,
					creator_email: rideData.creatorEmail,
					creator_whatsapp: rideData.creatorWhatsApp || null,
				})
				.select()
				.single();

			if (qErr) {
				console.error("Error creating ride:", qErr);
				throw qErr;
			}

			if (data) setRides((prev) => [dbRideToRide(data), ...prev]);
		},
		[user],
	);

	const joinRide = useCallback(
		async (rideId: string): Promise<boolean> => {
			if (!user) throw new Error("User must be authenticated to join a ride");

			const ride = rides.find((r) => r.id === rideId);
			if (!ride || ride.seatsAvailable <= 0) return false;
			if (joinedRides.has(rideId)) return false;

			try {
				const { error: participantError } = await supabase
					.from("ride_participants")
					.insert({ ride_id: rideId, user_id: user.id });

				if (participantError) {
					console.error("Error joining ride:", participantError);
					return false;
				}

				const { error: updateError } = await supabase
					.from("rides")
					.update({ seats_available: ride.seatsAvailable - 1 })
					.eq("id", rideId);

				if (updateError) {
					console.error("Error updating seats:", updateError);
					await supabase
						.from("ride_participants")
						.delete()
						.eq("ride_id", rideId)
						.eq("user_id", user.id);
					return false;
				}

				setJoinedRides((prev) => new Set(prev).add(rideId));
				setRides((prev) =>
					prev.map((r) =>
						r.id === rideId
							? { ...r, seatsAvailable: r.seatsAvailable - 1 }
							: r,
					),
				);

				return true;
			} catch (e) {
				console.error("Unexpected error joining ride:", e);
				return false;
			}
		},
		[user, rides, joinedRides],
	);

	const getRideById = useCallback(
		(id: string) => rides.find((r) => r.id === id),
		[rides],
	);

	const hasJoinedRide = useCallback(
		(rideId: string) => joinedRides.has(rideId),
		[joinedRides],
	);

	const searchRides = useCallback(
		(filters: SearchFilters): Ride[] => {
			return rides.filter((ride) => {
				if (ride.seatsAvailable === 0) return false;
				if (
					filters.source &&
					!ride.source.toLowerCase().includes(filters.source.toLowerCase())
				)
					return false;
				if (
					filters.destination &&
					!ride.destination
						.toLowerCase()
						.includes(filters.destination.toLowerCase())
				)
					return false;
				if (filters.date && ride.date !== filters.date) return false;
				if (filters.startTime && ride.startTime < filters.startTime)
					return false;
				if (filters.endTime && ride.endTime > filters.endTime) return false;
				return true;
			});
		},
		[rides],
	);

	const value: RidesContextType = {
		rides,
		joinedRides,
		isLoading,
		error,
		realtimeStatus,
		createRide,
		joinRide,
		getRideById,
		searchRides,
		hasJoinedRide,
		reload,
	};

	return (
		<RidesContext.Provider value={value}>{children}</RidesContext.Provider>
	);
}

export function useRides() {
	const ctx = useContext(RidesContext);
	if (!ctx) throw new Error("useRides must be used within a RidesProvider");
	return ctx;
}
