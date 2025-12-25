import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	ReactNode,
	useEffect,
} from "react";
import { Ride } from "@/types/ride";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface RidesContextType {
	rides: Ride[];
	joinedRides: Set<string>;
	isLoading: boolean;
	createRide: (ride: Omit<Ride, "id" | "createdAt">) => Promise<void>;
	joinRide: (rideId: string) => Promise<boolean>;
	getRideById: (id: string) => Ride | undefined;
	searchRides: (filters: SearchFilters) => Ride[];
	hasJoinedRide: (rideId: string) => boolean;
}

interface SearchFilters {
	source?: string;
	destination?: string;
	date?: string;
	startTime?: string;
	endTime?: string;
}

const RidesContext = createContext<RidesContextType | undefined>(undefined);

// Helper function to convert database ride to app Ride type
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

export function RidesProvider({ children }: { children: ReactNode }) {
	const [rides, setRides] = useState<Ride[]>([]);
	const [joinedRides, setJoinedRides] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(true);
	const { user } = useAuth();

	// Load rides from database
	useEffect(() => {
		loadRides();
		loadJoinedRides();
	}, [user]);

	// Set up real-time subscription for rides
	useEffect(() => {
		const channel = supabase
			.channel("rides-changes")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "rides",
				},
				() => {
					loadRides();
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	const loadRides = async () => {
		try {
			setIsLoading(true);
			const { data, error } = await supabase
				.from("rides")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Error loading rides:", error);
				return;
			}

			if (data) {
				setRides(data.map(dbRideToRide));
			}
		} catch (error) {
			console.error("Unexpected error loading rides:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const loadJoinedRides = async () => {
		if (!user) {
			setJoinedRides(new Set());
			return;
		}

		try {
			const { data, error } = await supabase
				.from("ride_participants")
				.select("ride_id")
				.eq("user_id", user.id);

			if (error) {
				console.error("Error loading joined rides:", error);
				return;
			}

			if (data) {
				setJoinedRides(new Set(data.map((p) => p.ride_id)));
			}
		} catch (error) {
			console.error("Unexpected error loading joined rides:", error);
		}
	};

	const createRide = useCallback(
		async (rideData: Omit<Ride, "id" | "createdAt">) => {
			if (!user) {
				throw new Error("User must be authenticated to create a ride");
			}

			const { data, error } = await supabase
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

			if (error) {
				console.error("Error creating ride:", error);
				throw error;
			}

			if (data) {
				// Ride will be added via real-time subscription, but we can add it immediately for better UX
				setRides((prev) => [dbRideToRide(data), ...prev]);
			}
		},
		[user],
	);

	const joinRide = useCallback(
		async (rideId: string): Promise<boolean> => {
			if (!user) {
				throw new Error("User must be authenticated to join a ride");
			}

			// Check if ride exists and has available seats
			const ride = rides.find((r) => r.id === rideId);
			if (!ride || ride.seatsAvailable <= 0) {
				return false;
			}

			// Check if user already joined
			if (joinedRides.has(rideId)) {
				return false;
			}

			try {
				// Insert into ride_participants
				const { error: participantError } = await supabase
					.from("ride_participants")
					.insert({
						ride_id: rideId,
						user_id: user.id,
					});

				if (participantError) {
					console.error("Error joining ride:", participantError);
					return false;
				}

				// Update seats available
				const { error: updateError } = await supabase
					.from("rides")
					.update({ seats_available: ride.seatsAvailable - 1 })
					.eq("id", rideId);

				if (updateError) {
					console.error("Error updating seats:", updateError);
					// Rollback participant insertion
					await supabase
						.from("ride_participants")
						.delete()
						.eq("ride_id", rideId)
						.eq("user_id", user.id);
					return false;
				}

				// Update local state
				setJoinedRides((prev) => new Set(prev).add(rideId));
				setRides((prev) =>
					prev.map((r) =>
						r.id === rideId
							? { ...r, seatsAvailable: r.seatsAvailable - 1 }
							: r,
					),
				);

				return true;
			} catch (error) {
				console.error("Unexpected error joining ride:", error);
				return false;
			}
		},
		[user, rides, joinedRides],
	);

	const getRideById = useCallback(
		(id: string) => rides.find((ride) => ride.id === id),
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
				) {
					return false;
				}
				if (
					filters.destination &&
					!ride.destination
						.toLowerCase()
						.includes(filters.destination.toLowerCase())
				) {
					return false;
				}
				if (filters.date && ride.date !== filters.date) {
					return false;
				}
				if (filters.startTime && ride.startTime < filters.startTime) {
					return false;
				}
				if (filters.endTime && ride.endTime > filters.endTime) {
					return false;
				}
				return true;
			});
		},
		[rides],
	);

	return (
		<RidesContext.Provider
			value={{
				rides,
				joinedRides,
				isLoading,
				createRide,
				joinRide,
				getRideById,
				searchRides,
				hasJoinedRide,
			}}
		>
			{children}
		</RidesContext.Provider>
	);
}

export function useRides() {
	const context = useContext(RidesContext);
	if (context === undefined) {
		throw new Error("useRides must be used within a RidesProvider");
	}
	return context;
}
