import { useEffect, useState } from "react";
import { useRainStore } from "../store/rainStore";
import GraphicalBackground from "@/components/GraphicalBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function RainPage() {
	const { leaderboard, loading, error, fetchLeaderboard } = useRainStore();
	const [weekOffset, setWeekOffset] = useState(0);

	useEffect(() => {
		const fetchBiweeklyLeaderboard = async () => {
			const now = new Date();
			// Calculate start of the biweekly period
			const startOfWeek = new Date(now);
			startOfWeek.setDate(now.getDate() + weekOffset * 14 - now.getDay()); // Start of first week in period
			const endOfWeek = new Date(startOfWeek);
			endOfWeek.setDate(startOfWeek.getDate() + 13); // End of 2-week period

			await fetchLeaderboard(
				startOfWeek.toISOString(),
				endOfWeek.toISOString(),
				"wagered"
			);
		};
		fetchBiweeklyLeaderboard();
	}, [weekOffset, fetchLeaderboard]);

	const handlePrevPeriod = () => setWeekOffset((prev) => prev - 1);
	const handleNextPeriod = () => setWeekOffset((prev) => prev + 1);

	// Display biweekly label
	const now = new Date();
	const startOfPeriod = new Date(now);
	startOfPeriod.setDate(now.getDate() + weekOffset * 14 - now.getDay());
	const endOfPeriod = new Date(startOfPeriod);
	endOfPeriod.setDate(startOfPeriod.getDate() + 13);

	const formatDate = (date: Date) =>
		`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

	const periodLabel =
		weekOffset === 0
			? "This Week & Next Week"
			: `Biweekly: ${formatDate(startOfPeriod)} - ${formatDate(endOfPeriod)}`;

	return (
		<div className='relative flex flex-col min-h-screen text-white '>
			<GraphicalBackground />
			<Navbar />

			<main className='relative z-10 flex-1 w-full max-w-6xl p-6 mx-auto'>
				<h1 className='mb-2 text-3xl font-bold text-center'>
					🌧 Rain.gg Leaderboard
				</h1>
				<h2 className='mb-6 text-xl text-center text-yellow-400'>
					{periodLabel}
				</h2>

				<div className='flex justify-center gap-4 mb-6'>
					<button
						onClick={handlePrevPeriod}
						className='px-5 py-2 transition bg-[#C98958] rounded hover:bg-[#C98958]'
					>
						Previous Period
					</button>
					<button
						onClick={handleNextPeriod}
						className='px-5 py-2 text-black transition bg-yellow-400 rounded hover:bg-yellow-500'
					>
						Next Period
					</button>
				</div>

				{loading && <p className='text-center'>Loading...</p>}
				{error && <p className='text-center text-[#C98958]'>Error: {error}</p>}

				{!loading && leaderboard.length > 0 && (
					<div className='overflow-x-auto border border-[#C98958] shadow-2xl rounded-xl bg-black'>
						<table className='w-full text-left border-collapse'>
							<thead className='bg-[#C98958] text-white'>
								<tr>
									<th className='p-4 border-b border-white'>Rank</th>
									<th className='p-4 border-b border-white'>User</th>
									<th className='p-4 border-b border-white'>Wagered</th>
								</tr>
							</thead>
							<tbody>
								{leaderboard.map((user, index) => (
									<tr
										key={user.id}
										className={`border-b border-white transition ${
											index % 2 === 0 ? "bg-black/70" : "bg-black/50"
										} hover:bg-[#C98958]/20`}
									>
										<td className='p-4 font-semibold text-white'>
											{index + 1}
										</td>
										<td className='flex items-center gap-3 p-4 text-white'>
											<img
												src={user.avatar || "https://via.placeholder.com/40"}
												alt={user.username}
												className='object-cover w-10 h-10 border border-white rounded-full'
											/>
											{user.username}
										</td>
										<td className='p-4 font-medium text-[#C98958]'>
											${Number(user.wagered || 0).toLocaleString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</main>

			<Footer className='relative z-10' />
		</div>
	);
}
