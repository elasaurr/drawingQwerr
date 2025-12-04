import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Palette, LogOut, Home, Image as ImageIcon } from "lucide-react";

import { APP_NAME } from "../constants";

export default function ProfilePage() {
	const { user, updateProfile, logout } = useAuth();
	const navigate = useNavigate();
	const [username, setUsername] = useState(user?.username || "");
	const [bio, setBio] = useState(user?.bio || "");
	const [avatar, setAvatar] = useState(user?.avatar || "");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setLoading(true);
			await updateProfile({ username, bio, avatar });
			alert("Profile updated successfully!");
		} catch (err: any) {
			alert(err.message || "Failed to update profile.");
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		await logout();
		navigate("/");
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50">
			<nav className="bg-white border-b">
				<div className="container mx-auto px-6 py-4 flex justify-between items-center">
					<Link to="/dashboard" className={`flex items-center gap-2 ${loading && "pointer-events-none"}`}>
						<Palette className="w-6 h-6 text-purple-600" />
						<span className="text-xl">{APP_NAME}</span>
					</Link>
					<div className="flex gap-2">
						<Link to="/dashboard">
							<Button variant="ghost" size="sm" disabled={loading}>
								<Home className="w-4 h-4 mr-2" />
								Dashboard
							</Button>
						</Link>
						<Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading}>
							<LogOut className="w-4 h-4 mr-2" />
							Logout
						</Button>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-6 py-12 max-w-2xl ">
				<Card>
					<CardHeader>
						<CardTitle>Profile Settings</CardTitle>
						<CardDescription>Manage your profile information</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="flex justify-center">
								<Avatar className="w-32 h-32">
									<AvatarImage src={avatar} alt={username} />
									<AvatarFallback className="text-3xl">{username.charAt(0).toUpperCase()}</AvatarFallback>
								</Avatar>
							</div>

							<div className="space-y-2">
								<Label htmlFor="username">Username</Label>
								<Input
									id="username"
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
									disabled={loading}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="bio">Bio</Label>
								<Textarea
									id="bio"
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									placeholder="Tell us about yourself..."
									rows={4}
									disabled={loading}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="avatar">Avatar URL</Label>
								<Input
									id="avatar"
									type="url"
									value={avatar}
									onChange={(e) => setAvatar(e.target.value)}
									placeholder="https://example.com/avatar.jpg"
									disabled={loading}
								/>
							</div>

							{loading && (
								<div className="flex justify-center items-center border border-gray-300 rounded-md p-4">
									<p>Loading...</p>
								</div>
							)}
							{!loading && (
								<div className="flex gap-3 ">
									<Button type="submit" className="flex-1">
										Save Changes
									</Button>
									<Link to="/dashboard" className="flex-1">
										<Button type="button" variant="outline" className="w-full">
											Cancel
										</Button>
									</Link>
								</div>
							)}
						</form>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
