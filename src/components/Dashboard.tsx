import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Palette, Plus, User, LogOut, Trash2, Crown } from "lucide-react";
import NewCanvasDialog from "./NewCanvasDialog";
import { useLocation } from "react-router-dom";
import { drawingsService } from "../services/drawingsService";
import Spinner from "./ui/spinner";
import { Drawing } from "../services/drawingsService";
import { APP_NAME } from "../constants";

export default function Dashboard() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [drawings, setDrawings] = useState<Drawing[] | null>(null);
	const [showNewCanvas, setShowNewCanvas] = useState(false);
	const location = useLocation();
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		loadDrawings();
	}, [user, location.pathname]);

	const loadDrawings = async () => {
		try {
			if (!user) return;
			if (!user?.id) {
				console.log("User ID not available yet, skipping loadDrawings.");
				return;
			}

			const userDrawings = await drawingsService.getDrawings(user.id);

			setDrawings(userDrawings);
		} catch (error) {
			console.log(`Dashboard error: loadDrawings(): ${JSON.stringify(error)}`);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			if (!confirm("Are you sure you want to delete this drawing?")) return;
			setIsDeleting(true);
			if (!user) return;

			const deleted = await drawingsService.deleteDrawing(user.id, id);
			alert(deleted.message);
			loadDrawings();
			setIsDeleting(false);
		} catch (error) {
			console.error(`Dashboard error: handleDelete(): ${error}`);
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
			navigate("/");
		} catch (error) {
			console.error(`Dashboard error: handleLogout(): ${error}`);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50">
			{isDeleting && (
				<div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-gray-500/20 z-50">
					<Spinner />
				</div>
			)}
			<nav className="bg-white border-b">
				<div className="container mx-auto px-6 py-4 flex justify-between items-center">
					<div className="flex items-center gap-2">
						<Palette className="w-6 h-6 text-purple-600" />
						<span className="text-xl">{APP_NAME}</span>
						{user?.premium_expiry !== null && (
							<Badge className="bg-linear-to-r from-yellow-400 to-orange-400 text-white">
								<Crown className="w-3 h-3 mr-1" />
								Premium
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-4">
						{!user?.premium_expiry && (
							<Link to="/premium">
								<Button size="sm" className="bg-linear-to-r from-purple-600 to-blue-600">
									<Crown className="w-4 h-4 mr-2" />
									Upgrade
								</Button>
							</Link>
						)}
						<Link to="/profile">
							<Button variant="ghost" size="sm">
								<User className="w-4 h-4 mr-2" />
								Profile
							</Button>
						</Link>
						<Button variant="ghost" size="sm" onClick={handleLogout}>
							<LogOut className="w-4 h-4 mr-2" />
							Logout
						</Button>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-6 py-12">
				<div className="mb-12">
					<div className="flex items-center gap-4 mb-6">
						<Avatar className="w-20 h-20">
							<AvatarImage src={user?.avatar} alt={user?.username} />
							<AvatarFallback className="text-2xl">{user?.username.charAt(0).toUpperCase()}</AvatarFallback>
						</Avatar>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-3xl">{user?.username}</h1>
								{user?.premium_expiry && <Crown className="w-6 h-6 text-yellow-500" />}
							</div>
							<p className="text-gray-600">{user?.bio}</p>
						</div>
					</div>
				</div>

				<div className="flex justify-between items-center mb-8">
					<h2 className="text-2xl">My Gallery</h2>
					<Button onClick={() => setShowNewCanvas(true)}>
						<Plus className="w-4 h-4 mr-2" />
						New Drawing
					</Button>
				</div>

				{drawings === null && (
					<Card className="py-16">
						<CardContent className="text-center flex flex-col items-center">
							<Spinner />
						</CardContent>
					</Card>
				)}
				{drawings?.length === 0 ? (
					<Card className="py-16">
						<CardContent className="text-center">
							<div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Palette className="w-8 h-8 text-purple-600" />
							</div>
							<h3 className="text-xl mb-2">No drawings yet</h3>
							<p className="text-gray-600 mb-6">Start creating your first masterpiece!</p>
							<Link to="/draw" className={isDeleting ? "pointer-events-none" : ""}>
								<Button disabled={isDeleting}>
									<Plus className="w-4 h-4 mr-2" />
									Create Drawing
								</Button>
							</Link>
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{drawings?.map((drawing) => (
							<Card key={drawing.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
								<Link to={`/draw/${drawing.id}`} className={isDeleting ? "pointer-events-none" : ""}>
									<div className="aspect-square bg-gray-100 relative overflow-hidden">
										<img src={drawing.thumbnail_path} alt={drawing.title} className="w-full h-full object-cover" />
									</div>
								</Link>
								<CardContent className="p-4">
									<div className="flex justify-between items-start gap-2">
										<div className="flex-1 min-w-0">
											<h3 className="truncate mb-1">{drawing.title}</h3>
											<p className="text-sm text-gray-500">{new Date(drawing.updated_at).toLocaleDateString()}</p>
										</div>
										<Button
											disabled={isDeleting}
											variant="ghost"
											size="sm"
											onClick={(e: React.MouseEvent) => {
												e.preventDefault();
												handleDelete(drawing.id);
											}}
											className="text-red-600 hover:text-red-700 hover:bg-red-50">
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</main>

			<NewCanvasDialog open={showNewCanvas} onOpenChange={setShowNewCanvas} />
		</div>
	);
}
