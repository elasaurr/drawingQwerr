// root/src/api/users.ts
import axios from "axios";
import { API_BASE_URL } from "../constants";

const API_URL = `${API_BASE_URL}/users`;

// Helper to get auth header
const getAuthHeader = () => {
	const token = localStorage.getItem("accessToken");
	return token ? { Authorization: `Bearer ${token}` } : {};
};

interface SignupData {
	username: string;
	email: string;
	password: string;
}

interface LoginData {
	email: string;
	password: string;
}

export const apiSignup = async ({ username, email, password }: SignupData) => {
	const res = await axios.post(`${API_URL}/signup`, { username, email, password }, { withCredentials: true });
	return res.data;
};

export const apiLogin = async ({ email, password }: LoginData) => {
	const res = await axios.post(`${API_URL}/login`, { email, password }, { withCredentials: true });
	return res.data;
};

export const apiLogout = async () => {
	const res = await axios.post(
		`${API_URL}/logout`,
		{},
		{
			withCredentials: true,
			headers: getAuthHeader(),
		}
	);
	return res.data;
};

export const apiFetchProfile = async (userId: string) => {
	const res = await axios.get(`${API_URL}/${userId}`, {
		withCredentials: true,
		headers: getAuthHeader(),
	});
	return res.data;
};

export const apiUpdateProfile = async (userId: string, updates: Partial<any>) => {
	const res = await axios.put(`${API_URL}/${userId}`, updates, {
		withCredentials: true,
		headers: getAuthHeader(),
	});
	return res.data;
};

export const apiPremium = async (userId: string, plan: "monthly" | "yearly") => {
	const res = await axios.put(
		`${API_URL}/${userId}/premium`,
		{ plan },
		{
			withCredentials: true,
			headers: getAuthHeader(),
		}
	);
	return res.data;
};
