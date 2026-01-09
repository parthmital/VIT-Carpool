import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type { User } from "@/types/ride";

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

const ALLOWED_DOMAINS = ["vitstudent.ac.in"];

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const profileLoadInFlight = useRef<Promise<void> | null>(null);

	const mapProfileToUser = useCallback((profile: any): User => {
		return {
			id: profile.id,
			name: profile.name,
			email: profile.email,
			photoUrl: profile.photo_url || undefined,
			whatsApp: profile.whatsapp || undefined,
		};
	}, []);

	const validateCollegeEmailOrSignOut = useCallback(
		async (sbUser: SupabaseUser) => {
			const email = sbUser.email ?? "";
			const emailDomain = email.split("@")[1]?.toLowerCase();

			if (
				!emailDomain ||
				!ALLOWED_DOMAINS.some((d) => emailDomain.endsWith(d))
			) {
				await supabase.auth.signOut();
				alert("Please sign in with a college email address");
				return false;
			}

			return true;
		},
		[]
	);

	const loadUserProfile = useCallback(
		async (sbUser: SupabaseUser) => {
			if (profileLoadInFlight.current) return profileLoadInFlight.current;

			const run = (async () => {
				try {
					const ok = await validateCollegeEmailOrSignOut(sbUser);
					if (!ok) {
						setUser(null);
						return;
					}

					const { data: profile, error } = await supabase
						.from("user_profiles")
						.select("*")
						.eq("id", sbUser.id)
						.maybeSingle();

					if (!error && profile) {
						setUser(mapProfileToUser(profile));
						return;
					}

					if (!profile) {
						const { data: newProfile, error: createError } = await supabase
							.from("user_profiles")
							.insert({
								id: sbUser.id,
								email: sbUser.email!,
								name:
									sbUser.user_metadata?.full_name ||
									sbUser.email!.split("@")[0],
								photo_url:
									sbUser.user_metadata?.avatar_url ||
									sbUser.user_metadata?.picture,
							})
							.select("*")
							.single();

						if (createError) {
							console.error("Error creating profile:", createError);
							alert("Failed to create user profile. Please try again.");
							setUser(null);
							return;
						}

						setUser(mapProfileToUser(newProfile));
						return;
					}

					console.error("Error fetching profile:", error);
					alert("Failed to load user profile. Please try again.");
					setUser(null);
				} catch (e) {
					console.error("Error loading user profile:", e);
					alert("An unexpected error occurred. Please try again.");
					setUser(null);
				} finally {
					setIsLoading(false);
					profileLoadInFlight.current = null;
				}
			})();

			profileLoadInFlight.current = run;
			return run;
		},
		[mapProfileToUser, validateCollegeEmailOrSignOut]
	);

	useEffect(() => {
		let mounted = true;

		supabase.auth
			.getSession()
			.then(({ data: { session } }) => {
				if (!mounted) return;

				if (session?.user) {
					setIsLoading(true);
					void loadUserProfile(session.user);
				} else {
					setUser(null);
					setIsLoading(false);
				}
			})
			.catch((e) => {
				console.error("getSession error:", e);
				if (!mounted) return;
				setUser(null);
				setIsLoading(false);
			});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_OUT") {
				setUser(null);
				setIsLoading(false);
				return;
			}

			if (
				(event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
				session?.user
			) {
				setIsLoading(true);
				setTimeout(() => {
					void loadUserProfile(session.user);
				}, 0);
			}
		});

		return () => {
			mounted = false;
			subscription.unsubscribe();
		};
	}, [loadUserProfile]);

	const login = useCallback(async () => {
		setIsLoading(true);

		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/`,
					queryParams: { access_type: "offline", prompt: "consent" },
				},
			});

			if (error) {
				console.error("Error signing in:", error);
				alert("Failed to sign in. Please try again.");
				setIsLoading(false);
			}
		} catch (e) {
			console.error("Unexpected error during login:", e);
			setIsLoading(false);
		}
	}, []);

	const logout = useCallback(async () => {
		setIsLoading(true);
		try {
			await supabase.auth.signOut();
		} finally {
			setUser(null);
			setIsLoading(false);
		}
	}, []);

	const setWhatsApp = useCallback(
		async (whatsApp: string) => {
			if (!user) return;

			const { error } = await supabase
				.from("user_profiles")
				.update({ whatsapp: whatsApp, updated_at: new Date().toISOString() })
				.eq("id", user.id);

			if (error) {
				console.error("Error updating WhatsApp:", error);
				throw error;
			}

			setUser((prev) => (prev ? { ...prev, whatsApp } : null));
		},
		[user]
	);

	const needsWhatsApp = !!user && !user.whatsApp;

	const value = useMemo<AuthContextType>(
		() => ({
			user,
			isAuthenticated: !!user,
			isLoading,
			needsWhatsApp,
			login,
			logout,
			setWhatsApp,
		}),
		[user, isLoading, needsWhatsApp, login, logout, setWhatsApp]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
