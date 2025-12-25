import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	ReactNode,
} from "react";
import { User } from "@/types/ride";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	needsWhatsApp: boolean;
	login: () => Promise<void>;
	logout: () => Promise<void>;
	setWhatsApp: (whatsApp: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Allowed email domains for college emails
const ALLOWED_DOMAINS = ["vitstudent.ac.in"];

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Check for existing session and load user profile
	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (session?.user) {
				loadUserProfile(session.user);
			} else {
				setIsLoading(false);
			}
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log("Auth state changed:", event, session?.user?.email);
			if (event === "SIGNED_IN" && session?.user) {
				setIsLoading(true);
				await loadUserProfile(session.user);
			} else if (event === "SIGNED_OUT") {
				setUser(null);
				setIsLoading(false);
			} else if (event === "TOKEN_REFRESHED" && session?.user) {
				// Refresh user profile if needed
				if (!user) {
					setIsLoading(true);
					await loadUserProfile(session.user);
				}
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	const loadUserProfile = async (supabaseUser: SupabaseUser) => {
		try {
			console.log("Loading user profile for:", supabaseUser.email);

			// Validate email domain
			const emailDomain = supabaseUser.email?.split("@")[1]?.toLowerCase();
			console.log("Email domain:", emailDomain);
			console.log("Allowed domains:", ALLOWED_DOMAINS);

			if (
				!emailDomain ||
				!ALLOWED_DOMAINS.some((domain) =>
					emailDomain.endsWith(domain.toLowerCase()),
				)
			) {
				console.error("Email domain not allowed:", emailDomain);
				await supabase.auth.signOut();
				alert("Please sign in with a college email address");
				setIsLoading(false);
				return;
			}

			// Get or create user profile
			console.log("Fetching user profile for ID:", supabaseUser.id);
			console.log(
				"Supabase URL configured:",
				!!import.meta.env.VITE_SUPABASE_URL,
			);

			let profile: any = null;
			let profileError: any = null;

			try {
				const { data, error } = await supabase
					.from("user_profiles")
					.select("*")
					.eq("id", supabaseUser.id)
					.single();

				profile = data;
				profileError = error;
			} catch (error: any) {
				console.error("Error during profile fetch:", error);
				profileError = error;
			}

			console.log("Profile fetch result:", { profile, profileError });

			if (profileError) {
				// Check if table doesn't exist (404 or PGRST205)
				if (
					profileError.code === "PGRST205" ||
					profileError.message?.includes("Could not find the table") ||
					profileError.message?.includes("404")
				) {
					console.error(
						"Database tables not found. Please run the SQL schema in Supabase SQL Editor.",
					);
					alert(
						"Database tables not found. Please run the SQL schema script (supabase-schema.sql) in your Supabase SQL Editor to create the required tables.",
					);
					setIsLoading(false);
					return;
				}

				if (profileError.code === "PGRST116") {
					// Profile doesn't exist, create it
					console.log("Profile doesn't exist, creating new profile");
					const { data: newProfile, error: createError } = await supabase
						.from("user_profiles")
						.insert({
							id: supabaseUser.id,
							email: supabaseUser.email!,
							name:
								supabaseUser.user_metadata?.full_name ||
								supabaseUser.email!.split("@")[0],
							photo_url:
								supabaseUser.user_metadata?.avatar_url ||
								supabaseUser.user_metadata?.picture,
						})
						.select()
						.single();

					if (createError) {
						console.error("Error creating profile:", createError);
						// Check if table doesn't exist
						if (
							createError.code === "PGRST205" ||
							createError.message?.includes("Could not find the table") ||
							createError.message?.includes("404")
						) {
							alert(
								"Database tables not found. Please run the SQL schema script (supabase-schema.sql) in your Supabase SQL Editor to create the required tables.",
							);
						} else {
							alert("Failed to create user profile. Please try again.");
						}
						setIsLoading(false);
						return;
					}

					console.log("Profile created successfully:", newProfile);
					setUser({
						id: newProfile.id,
						name: newProfile.name,
						email: newProfile.email,
						photoUrl: newProfile.photo_url || undefined,
						whatsApp: newProfile.whatsapp || undefined,
					});
				} else {
					// Other error fetching profile
					console.error("Error fetching profile:", profileError);
					alert("Failed to load user profile. Please try again.");
					return;
				}
			} else if (profile) {
				console.log("Profile loaded successfully:", profile);
				setUser({
					id: profile.id,
					name: profile.name,
					email: profile.email,
					photoUrl: profile.photo_url || undefined,
					whatsApp: profile.whatsapp || undefined,
				});
			} else {
				console.error("No profile data returned");
				alert("Failed to load user profile. Please try again.");
			}
		} catch (error) {
			console.error("Error loading user profile:", error);
			alert("An unexpected error occurred. Please try again.");
		} finally {
			console.log("Setting isLoading to false");
			setIsLoading(false);
		}
	};

	const login = useCallback(async () => {
		setIsLoading(true);
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/`,
					queryParams: {
						access_type: "offline",
						prompt: "consent",
					},
				},
			});

			if (error) {
				console.error("Error signing in:", error);
				alert("Failed to sign in. Please try again.");
				setIsLoading(false);
			}
			// Note: User will be set via onAuthStateChange listener
		} catch (error) {
			console.error("Unexpected error during login:", error);
			setIsLoading(false);
		}
	}, []);

	const logout = useCallback(async () => {
		setIsLoading(true);
		await supabase.auth.signOut();
		setUser(null);
		setIsLoading(false);
	}, []);

	const setWhatsApp = useCallback(
		async (whatsApp: string) => {
			if (!user) return;

			try {
				const { error } = await supabase
					.from("user_profiles")
					.update({ whatsapp: whatsApp, updated_at: new Date().toISOString() })
					.eq("id", user.id);

				if (error) {
					console.error("Error updating WhatsApp:", error);
					throw error;
				}

				setUser((prev) => (prev ? { ...prev, whatsApp } : null));
			} catch (error) {
				console.error("Failed to update WhatsApp:", error);
				throw error;
			}
		},
		[user],
	);

	const needsWhatsApp = !!user && !user.whatsApp;

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated: !!user,
				isLoading,
				needsWhatsApp,
				login,
				logout,
				setWhatsApp,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
