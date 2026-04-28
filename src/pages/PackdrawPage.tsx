import { useEffect, useState } from "react";
import { usePackdrawStore } from "@/store/packdrawStore";
import GraphicalBackground from "@/components/GraphicalBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";

dayjs.extend(duration);
dayjs.extend(utc);

const prizeMap: Record<number, string> = {
	1: "$250 🥇",
	2: "$125 🥈",
	3: "$75 🥉",
	4: "$30",
	5: "$20",
};

// ✅ Monthly cycle: 28 → 28 (e.g. Dec 28 → Jan 28)
function getMonthlyCycleRangeUTC() {
	const now = dayjs.utc();
	const day = now.date();

	let start, end;

	if (day >= 28) {
		start = now.date(28).startOf("day");
		end = now.add(1, "month").date(28).endOf("day");
	} else {
		start = now.subtract(1, "month").date(28).startOf("day");
		end = now.date(28).endOf("day");
	}

	return { start, end };
}


function getDisplayRange() {
	const { start, end } = getMonthlyCycleRangeUTC();
	return `${start.format("D MMM")} → ${end.format("D MMM")}`;
}

const PackdrawPage = () => {
	const { monthlyData, loading, error, fetchMonthly } = usePackdrawStore();
	const [timeLeft, setTimeLeft] = useState("");

	// Fetch leaderboard for month of cycle start
	useEffect(() => {
		const { start } = getMonthlyCycleRangeUTC();
		fetchMonthly(start.toISOString());
	}, [fetchMonthly]);

	// Countdown
	useEffect(() => {
		const updateCountdown = () => {
			const { end } = getMonthlyCycleRangeUTC();
			const now = dayjs.utc();
			const diff = end.diff(now);

			if (diff <= 0) {
				setTimeLeft("Leaderboard resetting...");
				return;
			}

			const d = dayjs.duration(diff);
			setTimeLeft(
				`${Math.floor(d.asDays())}d ${d.hours()}h ${d.minutes()}m ${d.seconds()}s`
			);
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="relative flex flex-col min-h-screen text-white bg-black">
			<GraphicalBackground />
			<Navbar />

			<main className="container flex-grow p-4 mx-auto">
				<h1 className="mb-4 text-5xl font-extrabold text-center text-[#C98958] drop-shadow-lg">
					🔥 Packdraw Monthly Leaderboard 🔥
				</h1>

				<p className="mb-2 text-center text-gray-400">
					Range: <span className="text-[#C98958]">{getDisplayRange()}</span>
				</p>

				<p className="mb-6 font-semibold text-center text-gray-300 text-md">
					⏳ Next Reset In:{" "}
					<span className="font-bold text-yellow-400">{timeLeft}</span>
				</p>

				<div className="mt-2 text-center text-gray-400">
					<p className="text-lg font-semibold text-[#C98958]">
						Total Prize Pool: 500 $ 💰
					</p>
					<p>
						Use code <span className="font-bold text-white">"MisterTee"</span>{" "}
						to participate!
					</p>
				</div>

				{loading && <p className="mt-10 text-center text-gray-400">Loading...</p>}
				{error && <p className="mt-10 text-center text-[#C98958]">{error}</p>}

				{/* ✅ FIXED LEADERBOARD */}
				{!loading && !error && monthlyData.length > 0 && (
					<div className="mt-8 overflow-x-auto">
						<table className="min-w-full text-sm bg-gray-900 border border-[#C98958] shadow-xl rounded-2xl">
							<thead className="text-white bg-gradient-to-r from-[#930203] to-black">
								<tr>
									<th className="p-3 text-left uppercase">#</th>
									<th className="p-3 text-left uppercase">Name</th>
									<th className="p-3 text-left uppercase">Wagered</th>
									<th className="p-3 text-left uppercase">Prize</th>
								</tr>
							</thead>

							<tbody>
								{monthlyData.map((entry, index) => {
									const rank = index + 1;

									return (
										<tr
											key={index}
											className={`transition-all ${
												rank <= 3
													? "bg-[#930203]/60 hover:bg-[#C98958]"
													: rank % 2 === 0
													? "bg-gray-800"
													: "bg-gray-900"
											} hover:text-white`}
										>
											<td className="p-3 font-bold text-[#C98958]">#{rank}</td>
											<td className="p-3 font-medium">{entry.username}</td>

											{/* ✔ Correct field from API: wagerAmount */}
											<td className="p-3 font-semibold text-[#C98958]">
												{entry.wagerAmount.toLocaleString(undefined, {
													maximumFractionDigits: 2,
												})}
											</td>

											<td className="p-3 font-semibold text-yellow-400">
												{prizeMap[rank] || "—"}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}

				{!loading && !error && monthlyData.length === 0 && (
					<p className="mt-10 text-center text-gray-500">
						No leaderboard data available for this period.
					</p>
				)}
			</main>

			<Footer />
		</div>
	);
};

export default PackdrawPage;
