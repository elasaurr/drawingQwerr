// LoadingPage.jsx
import React from "react";

const LoadingPage: React.FC = () => {
	return (
		<div className="min-h-screen flex items-center justify-center bg-[#fffbeb]">
			<div className="text-center">
				<h1 className="text-5xl md:text-6xl font-black text-gray-800 tracking-wider mb-4">SketchArt</h1>
				<p className="text-lg text-gray-600 mb-16">Loading your Creations...</p>

				{/* Simple bouncing dots */}
				<div className="flex gap-4 justify-center">
					<div className="w-4 h-4 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
					<div className="w-4 h-4 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
					<div className="w-4 h-4 bg-orange-700 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
				</div>
			</div>
		</div>
	);
};

export default LoadingPage;
