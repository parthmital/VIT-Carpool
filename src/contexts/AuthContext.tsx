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
			if (event === "SIGNED_IN" && session?.user) {
				await loadUserProfile(session.user);
			} else if (event === "SIGNED_OUT") {
				setUser(null);
				setIsLoading(false);
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	const loadUserProfile = async (supabaseUser: SupabaseUser) => {
		try {
			// Validate email domain
			const emailDomain = supabaseUser.email?.split("@")[1]?.toLowerCase();
			if (
				!emailDomain ||
				!ALLOWED_DOMAINS.some((domain) =>
					emailDomain.endsWith(domain.toLowerCase()),
				)
			) {
				await supabase.auth.signOut();
				alert("Please sign in with a college email address");
				setIsLoading(false);
				return;
			}

			// Get or create user profile
			const { data: profile, error: profileError } = await supabase
				.from("user_profiles")
				.select("*")
				.eq("id", supabaseUser.id)
				.single();

			if (profileError && profileError.code === "PGRST116") {
				// Profile doesn't exist, create it
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
					setIsLoading(false);
					return;
				}

				setUser({
					id: newProfile.id,
					name: newProfile.name,
					email: newProfile.email,
					photoUrl: newProfile.photo_url || undefined,
					whatsApp: newProfile.whatsapp || undefined,
				});
			} else if (profile) {
				setUser({
					id: profile.id,
					name: profile.name,
					email: profile.email,
					photoUrl: profile.photo_url || undefined,
					whatsApp: profile.whatsapp || undefined,
				});
			}
		} catch (error) {
			console.error("Error loading user profile:", error);
		} finally {
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
