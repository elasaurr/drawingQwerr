// LoadingPage.jsx
import React from "react";

const LoadingPage = () => {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-purple-100 to-blue-100">
			<h1 className="z-10 backdrop-blur bg-white/30 border-2 border-gray-200 p-4 text-3xl font-bold mb-10 text-gray-800">
				Loading Your Creativity...
			</h1>

			<div className="pencil mb-24"></div>
			{/* Loading dots */}
			<div className="flex space-x-2 mt-10">
				<span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
				<span className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
				<span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
			</div>
		</div>
	);
};

export default LoadingPage;
