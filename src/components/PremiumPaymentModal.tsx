import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ShieldCheck, Smartphone, Wallet } from "lucide-react";

interface PaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	plan: "monthly" | "yearly" | null;
	mobileNumber: string;
	setMobileNumber: (string: string) => void;
	price: string;
	onConfirm: () => void;
}

export default function PaymentModal({ isOpen, onClose, mobileNumber, setMobileNumber, plan, price, onConfirm }: PaymentModalProps) {
	const [loading, setLoading] = useState(false);

	const handlePayment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (mobileNumber.length !== 11) return;

		setLoading(true);

		// Simulate network request
		await new Promise((resolve) => setTimeout(resolve, 2000));

		setLoading(false);
		onConfirm();
	};

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// Only allow numbers and max 11 digits
		const value = e.target.value.replace(/\D/g, "");
		if (value.length <= 11) setMobileNumber(value);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Wallet className="w-5 h-5 text-blue-600" />
						Pay with E-Wallet
					</DialogTitle>
					<DialogDescription>
						Upgrade to <strong className="text-blue-700">{plan === "monthly" ? "Monthly" : "Yearly"} Premium</strong>
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handlePayment} className="grid gap-4 py-2">
					<div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
						<div className="flex items-center gap-3 mb-2">
							<ShieldCheck className="w-5 h-5 text-blue-600" />
							<p className="text-sm text-blue-800 font-medium">Secure Payment</p>
						</div>
						<p className="text-xs text-blue-600 leading-relaxed">
							Enter your mobile number linked to GCash or Maya. You will receive a verification code in the next step.
						</p>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="phone">Mobile Number</Label>
						<div className="relative">
							<span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 font-medium text-base">+63</span>{" "}
							<Input
								id="phone"
								type="number"
								// placeholder="912 345 6789"
								placeholder="0000 000 0000"
								value={mobileNumber}
								onChange={handlePhoneChange}
								className="px-12"
								maxLength={11}
								minLength={11}
								required
							/>
							<Smartphone className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
						</div>
					</div>

					<DialogFooter className="mt-2 flex-col sm:flex-row gap-2">
						{/* <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="sm:w-full w-1/2">
							Cancel
						</Button> */}
						<Button
							type="submit"
							className="w-full bg-blue-600 hover:bg-blue-700 text-white"
							disabled={loading || mobileNumber.length !== 11}>
							{loading ? "Processing..." : `Pay ₱${price}`}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
