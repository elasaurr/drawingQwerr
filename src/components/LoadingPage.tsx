// LoadingPage.jsx
import React from "react";

// const LoadingPage = () => {
// 	return (
// 		<div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-purple-100 to-blue-100">
// 			<h1 className="z-10 backdrop-blur bg-white/30 border-2 border-gray-200 p-4 text-3xl font-bold mb-10 text-gray-800">
// 				Loading Your Creativity...
// 			</h1>

// 			<div className="pencil mb-24"></div>
// 			{/* Loading dots */}
// 			<div className="flex space-x-2 mt-10">
// 				<span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
// 				<span className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
// 				<span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
// 			</div>
// 		</div>
// 	);
// };
const LoadingPage = () => {
	return (
		<div className="text-center relative">
			<h1 className="text-5xl md:text-6xl font-black text-gray-800 tracking-wider mb-4">SketchArt</h1>
			<p className="text-lg text-gray-600 mb-10">Loading your Creations...</p>

			<svg viewBox="0 0 922 457" className="mx-auto w-full max-w-4xl">
				<rect width="922" height="457" fill="#fffbeb" />

				<path
					id="drawPath"
					className="writing-line"
					d="M24 248.44C26.2331 245.079 33.0001 237.568 38.4532 230.795C42.7215 225.494 48.7898 224.011 55.9121 221.756C74.5746 215.845 85.9859 227.733 93.7116 230.575C101.049 233.275 108.182 237.906 119.071 241.656C127.052 244.405 132.611 246.929 172.716 246.94C185.541 246.944 189.769 241.312 194.472 239.051C201.01 235.908 208.176 230.801 214.018 227.587C222.108 223.135 227.732 218.756 233.005 215.744C240.444 211.496 251.778 211.989 275.231 211.408C283.494 211.203 288.635 214.222 294.472 216.85C299.394 219.066 305.17 221.733 311.762 224.745C318.975 228.04 325.11 230.012 330.563 230.953C337.111 232.084 345.388 236.395 353.3 239.034C359.775 241.194 366.073 241.29 390.079 241.301C398.73 241.305 402.93 236.801 408.384 233.79C413.656 230.878 417.592 225.523 422.109 221.203C427.215 216.321 433.382 214.989 453.813 214.791C462.134 214.711 467.961 218.733 473.798 222.111C478.189 224.652 483.007 226.245 488.46 228.32C494.197 230.503 499.18 234.884 505.186 238.279C510.915 241.517 516.842 244.673 522.295 247.115C528.079 249.705 539.737 247.696 548.98 245.068C554.817 243.409 559.7 240.185 565.339 237.173C572.613 233.289 581.489 228.523 586.959 226.459C593.701 223.915 596.918 219.5 603.302 216.128C613.923 210.517 621.708 206.733 635.987 205.21C644.318 204.322 652.543 206.327 658.763 209.705C664.254 212.687 671.355 214.966 675.686 218.164C679.757 221.169 685.995 225.478 692.034 230.378C698.309 235.469 706.679 238.628 714.958 242.79C721.343 246 728.492 246.546 734.695 249.185C744.917 253.534 751.793 246.952 758.385 242.818C765.155 238.573 769.477 234.545 773.994 230.598C778.907 226.305 784.139 220.267 789.592 217.058C794.118 214.395 800.673 214.989 814.185 214.791C821.926 214.678 826.997 219.478 832.822 222.303C839.414 224.372 843.542 227 847.106 228.878C848.809 229.639 850.298 230.012 855.215 230.395"
				/>

				<g>
					<animateMotion dur="4s" repeatCount="indefinite" rotate="auto" begin="1s">
						<mpath href="#drawPath" />
					</animateMotion>

					<g transform="translate(-18,-98)">
						<svg width="36" height="108" viewBox="0 0 60 260">
							<rect x="10" y="0" width="40" height="40" rx="6" fill="#ff8fa3" />
							<rect x="10" y="40" width="40" height="20" fill="#d0d0d0" />
							<rect x="10" y="60" width="40" height="140" fill="#facc15" />
							<rect x="10" y="200" width="40" height="20" fill="#eab676" />
							<polygon points="10,220 30,240 50,220" fill="#1f1f1f" />
						</svg>
					</g>
				</g>
			</svg>

			<div className="flex gap-4 justify-center mt-10">
				<div className="w-3 h-3 bg-orange-500 rounded-full dot"></div>
				<div className="w-3 h-3 bg-orange-600 rounded-full dot"></div>
				<div className="w-3 h-3 bg-orange-700 rounded-full dot"></div>
			</div>
		</div>
	);
};
export default LoadingPage;
