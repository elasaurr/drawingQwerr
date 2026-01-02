import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Palette, Check, Crown, Home, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import Spinner from "./ui/spinner";
import PaymentModal from "./PremiumPaymentModal";
import PremiumOtpModal from "./PremiumOTPModal";
import { APP_NAME } from "../constants";
import { apiStartPremiumOtp } from "../api/users";

export default function PremiumPage() {
	const { user } = useAuth();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(false);
	const [expiry, setExpiry] = useState<string | null>(null);
	const [isLimited, setIsLimited] = useState(false);
	const [mobileNumber, setMobileNumber] = useState<string>("");

	// Modal States
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
	const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly" | null>(null);

	const prices = {
		monthly: 10,
		yearly: 100,
	};

	useEffect(() => {
		if (!user) navigate("/login");
		if (user && user.premium_expiry !== null) {
			setExpiry(
				new Date(user.premium_expiry).toLocaleString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				})
			);
		}
	}, [user, navigate]);

	const handleUpgrade = (plan: "monthly" | "yearly") => {
		if (!user) return;
		setSelectedPlan(plan);
		setIsPaymentModalOpen(true);
	};

	const handlePaymentConfirm = async () => {
		setIsPaymentModalOpen(false);
		setLoading(true);

		try {
			if (!user) return;
			if (!mobileNumber || mobileNumber.length !== 11) throw new Error("Invalid mobile number");
			await apiStartPremiumOtp(user.id, mobileNumber);
			setIsOtpModalOpen(true);
		} catch (err: any) {
			alert(err.response?.data?.error || "Failed to send verification code");
			setSelectedPlan(null);
		} finally {
			setLoading(false);
		}
	};

	const handleOtpSuccess = (newExpiry: string) => {
		alert(`Successfully upgraded to Premium (${selectedPlan})! 🎉\nExpires at: ${new Date(newExpiry).toLocaleDateString()}`);
		navigate("/dashboard");
	};

	const premiumFeatures = [
		"Unlimited canvas sizes up to 4K resolution",
		"Premium brush collection (50+ brushes)",
		"Advanced shapes and tools",
		"Export in multiple formats (PNG, JPG, SVG)",
		"Cloud storage for unlimited drawings",
		"Priority customer support",
		"No advertisements",
		"Early access to new features",
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
			{loading && (
				<div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black/20 z-50">
					<Spinner />
				</div>
			)}

			{/* MoDALS */}

			<PaymentModal
				isOpen={isPaymentModalOpen}
				onClose={() => {
					setIsPaymentModalOpen(false);
					setSelectedPlan(null);
					setLoading(false);
				}}
				plan={selectedPlan}
				mobileNumber={mobileNumber}
				setMobileNumber={setMobileNumber}
				price={selectedPlan ? String(prices[selectedPlan]) : ""}
				onConfirm={handlePaymentConfirm}
			/>

			<PremiumOtpModal
				isOpen={isOtpModalOpen}
				onClose={() => {
					setIsOtpModalOpen(false);
					setSelectedPlan(null);
				}}
				plan={selectedPlan}
				onSuccess={handleOtpSuccess}
			/>

			<nav className="bg-white border-b">
				<div className="container mx-auto px-6 py-4 flex justify-between items-center">
					<Link to="/dashboard" className="flex items-center gap-2">
						<Palette className="w-6 h-6 text-purple-600" />
						<span className="text-xl">{APP_NAME}</span>
					</Link>
					<Link to="/dashboard">
						<Button variant="ghost" size="sm">
							<Home className="w-4 h-4 mr-2" />
							Dashboard
						</Button>
					</Link>
				</div>
			</nav>

			<main className="container mx-auto px-6 py-12 max-w-6xl">
				{user?.premium_expiry ? (
					<Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
						<CardContent className="py-8 text-center">
							<Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
							<h2 className="text-2xl mb-2">You're a Premium Member!</h2>
							<p className="text-gray-600">Your subscription is active until {expiry}</p>
						</CardContent>
					</Card>
				) : (
					<>
						<div className="text-center mb-12">
							<Badge className="mb-4 bg-gradient-to-r from-purple-600 to-blue-600">
								<Sparkles className="w-3 h-3 mr-1" />
								Premium
							</Badge>
							<h1 className="text-5xl mb-4">Unlock Premium Features</h1>
							<p className="text-xl text-gray-600 max-w-2xl mx-auto">
								Take your creativity to the next level with advanced tools and unlimited possibilities
							</p>
						</div>

						<div className="grid md:grid-cols-2 gap-8 mb-12">
							{/* Monthly Card */}
							<Card className="relative overflow-hidden hover:shadow-xl transition-shadow">
								<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-400 rounded-bl-full opacity-10" />
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										<span>Monthly</span>
										<Badge variant="outline">Popular</Badge>
									</CardTitle>
									<CardDescription>Perfect for trying out premium features</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="mb-6">
										<span className="text-5xl">₱{prices.monthly}</span>
										<span className="text-gray-600">/month</span>
									</div>
									<Button onClick={() => handleUpgrade("monthly")} className="w-full mb-6" size="lg" disabled={isLimited}>
										Upgrade to Monthly
									</Button>
									<ul className="space-y-3">
										{premiumFeatures.map((feature, index) => (
											<li key={index} className="flex items-start gap-2">
												<Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
												<span className="text-sm">{feature}</span>
											</li>
										))}
									</ul>
								</CardContent>
							</Card>

							{/* Yearly Card */}
							<Card className="relative overflow-hidden hover:shadow-xl transition-shadow border-2 border-purple-300">
								<div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 text-sm">
									Save 40%
								</div>
								<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-bl-full opacity-10" />
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										<span>Yearly</span>
										<Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
											<Crown className="w-3 h-3 mr-1" />
											Best Value
										</Badge>
									</CardTitle>
									<CardDescription>Best value for serious creators</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="mb-2">
										<span className="text-5xl">₱{prices.yearly}</span>
										<span className="text-gray-600">/year</span>
									</div>
									<p className="text-sm text-green-600 mb-6">Save ₱23.89 compared to monthly</p>
									<Button
										onClick={() => handleUpgrade("yearly")}
										className="w-full mb-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
										size="lg"
										disabled={isLimited}>
										Upgrade to Yearly
									</Button>
									<ul className="space-y-3">
										{premiumFeatures.map((feature, index) => (
											<li key={index} className="flex items-start gap-2">
												<Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
												<span className="text-sm">{feature}</span>
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						</div>

						<div className="text-center text-sm text-gray-600">
							<p>All plans include a 7-day money-back guarantee</p>
							<p>Cancel anytime, no questions asked</p>
						</div>
					</>
				)}
			</main>
		</div>
	);
}
