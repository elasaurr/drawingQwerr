import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { Button } from "./ui/button";
import { Lock, Loader2 } from "lucide-react";
import { apiVerifyPremiumOTP } from "../api/users";
import { useAuth } from "../contexts/AuthContext";

interface PremiumOtpModalProps {
	isOpen: boolean;
	onClose: () => void;
	plan: "monthly" | "yearly" | null;
	onSuccess: (expiry: string) => void;
}

export default function PremiumOtpModal({ isOpen, onClose, plan, onSuccess }: PremiumOtpModalProps) {
	const { user, fetchProfile } = useAuth();
	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleVerify = async () => {
		if (!user || !plan) return;
		setLoading(true);
		setError("");

		try {
			const res = await apiVerifyPremiumOTP(user.id, otp, plan);

			await fetchProfile();
			console.log("premium otp modal res: ", res);

			onSuccess(res.premium_expiry);
			onClose();
		} catch (err: any) {
			setError(err.response?.data?.error || "Verification failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-sm sm:max-w-md">
				<DialogHeader>
					<div className="mx-auto bg-purple-100 p-3 rounded-full mb-4 w-fit">
						<Lock className="w-6 h-6 text-purple-600" />
					</div>
					<DialogTitle className="text-center">Security Verification</DialogTitle>
					<DialogDescription className="text-center">
						To secure your purchase of the <strong>{plan}</strong> plan, please enter the 6-digit code sent to
						<span className="font-medium text-foreground"> {user?.email}</span>
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center space-y-4 py-4">
					<InputOTP maxLength={6} value={otp} onChange={setOtp}>
						<InputOTPGroup>
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
							<InputOTPSlot index={3} />
							<InputOTPSlot index={4} />
							<InputOTPSlot index={5} />
						</InputOTPGroup>
					</InputOTP>

					{error && <p className="text-sm text-red-500 font-medium">{error}</p>}
				</div>

				<DialogFooter className="flex-row gap-2 sm:justify-center">
					{/* Cancel Button */}
					<Button variant="outline" onClick={onClose} disabled={loading} className="w-1/2">
						Cancel
					</Button>

					{/* Confirm Button */}
					<Button onClick={handleVerify} disabled={otp.length < 6 || loading} className="w-1/2" variant="default">
						{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
						{loading ? "Verifying..." : "Confirm Purchase"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
