// root/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiSignup, apiLogin, apiLogout, apiFetchProfile, apiUpdateProfile, apiPremium } from "../api/users";

interface User {
	id: string;
	username: string;
	email: string;
	avatar?: string;
	bio?: string;
	premium_expiry: string | null;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	signup: (username: string, email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	updateProfile: (updates: Partial<User>) => Promise<void>;
	getPremium: (plan: "monthly" | "yearly") => Promise<void>;
	fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchProfile();
	}, []);

	const fetchProfile = async () => {
		setLoading(true);
		try {
			const storedUserId = localStorage.getItem("userId");
			const accessToken = localStorage.getItem("accessToken");

			if (!storedUserId || !accessToken) {
				setUser(null);
				return;
			}
			const profile = await apiFetchProfile(storedUserId);
			setUser(profile);
		} catch (err: any) {
			localStorage.removeItem("userId");
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	const signup = async (username: string, email: string, password: string) => {
		try {
			const res = await apiSignup({ username, email, password });
			localStorage.setItem("userId", res.userId);
			localStorage.setItem("accessToken", res.access_token);
			localStorage.setItem("refreshToken", res.refresh_token);
			await fetchProfile();
		} catch (err: any) {
			throw new Error(err.response?.data?.error || err.message);
		}
	};

	const login = async (email: string, password: string) => {
		try {
			const res = await apiLogin({ email, password });
			localStorage.setItem("userId", res.user.id);
			localStorage.setItem("accessToken", res.access_token);
			localStorage.setItem("refreshToken", res.refresh_token);
			await fetchProfile();
		} catch (err: any) {
			throw new Error(err.response?.data?.error || err.message);
		}
	};

	const logout = async () => {
		setLoading(true);
		try {
			await apiLogout();
		} catch (err: any) {
			console.error(err);
		} finally {
			localStorage.removeItem("userId");
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
			setUser(null);
			setLoading(false);
		}
	};

	const updateProfile = async (updates: Partial<User>) => {
		if (!user) return;
		// setLoading(true);
		try {
			await apiUpdateProfile(user.id, updates);
			await fetchProfile();
		} catch (err: any) {
			throw new Error(err.response?.data?.error || err.message);
		} finally {
			// setLoading(false);
		}
	};

	const getPremium = async (plan: "monthly" | "yearly") => {
		if (!user) return;
		setLoading(true);
		try {
			await apiPremium(user.id, plan);
			await fetchProfile();
		} catch (err: any) {
			throw new Error(err.response?.data?.error || err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, getPremium, fetchProfile }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within an AuthProvider");
	return context;
}
