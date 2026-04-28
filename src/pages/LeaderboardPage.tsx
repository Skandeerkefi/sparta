import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import {
	useLeaderboardStore,
	LeaderboardPlayer,
} from "@/store/useLeaderboardStore";
import { Crown, Info, Loader2, Trophy, Award, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import GraphicalBackground from "@/components/GraphicalBackground";

function LeaderboardPage() {
	const { monthlyLeaderboard, fetchLeaderboard, isLoading, error, periodInfo } =
		useLeaderboardStore();

	useEffect(() => {
		fetchLeaderboard();
	}, [fetchLeaderboard]);

	const [timeLeft, setTimeLeft] = useState<string>("");

	useEffect(() => {
		if (!periodInfo) return;

		const interval = setInterval(() => {
			const endDate = new Date(periodInfo.endDate);
			const now = new Date();
			const diff = endDate.getTime() - now.getTime();

			if (diff <= 0) {
				setTimeLeft("Leaderboard period has ended. Resetting...");
				return;
			}

			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
			const minutes = Math.floor((diff / (1000 * 60)) % 60);
			const seconds = Math.floor((diff / 1000) % 60);

			setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s remaining`);
		}, 1000);

		return () => clearInterval(interval);
	}, [periodInfo]);

	return (
		<div className='relative flex min-h-screen flex-col overflow-x-hidden text-white'>
			{/* Background Canvas */}
			<GraphicalBackground />

			<Navbar />

			<main className='relative z-10 mx-auto flex-grow w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12'>
				{/* Header */}
				<div className='mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row'>
					<div className='flex items-center gap-3 text-[#C98958]'>
						<Crown className='h-7 w-7' />
						<h1 className='text-center text-2xl font-extrabold tracking-tight sm:text-left sm:text-3xl'>
							Rainbet Bi-Weekly Leaderboard
						</h1>
					</div>

					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									className='flex items-center gap-1 text-sm font-semibold text-[#C98958] hover:text-[#C98958] transition-colors'
									aria-label='How the leaderboard works'
								>
									<Info className='w-5 h-5' />
									How It Works
								</button>
							</TooltipTrigger>
							<TooltipContent className='max-w-xs bg-[#0F0604] text-white border border-[#C98958] shadow-lg rounded-md p-3 text-sm'>
								The leaderboard ranks players based on their total wager amount
								using the MisterTee affiliate code on Rainbet. Higher wagers
								result in a better ranking.
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>

				{/* Affiliate Info */}
				<div className='mb-10 rounded-lg border border-[#C98958] bg-gray-300/20 p-4 text-white shadow-md sm:p-6'>
					<p className='mb-4 leading-relaxed text-gray-100'>
						Use affiliate code{" "}
						<span className='font-semibold text-[#C98958]'>MisterTee</span> on{" "}
						<a
							href='https://rainbet.com'
							target='_blank'
							rel='noreferrer'
							className='text-[#C98958] hover:underline'
						>
							Rainbet
						</a>{" "}
						to appear on this leaderboard and compete for rewards!
					</p>

					<div className='inline-flex max-w-full items-center gap-3 rounded-md bg-[#C98958]/30 px-4 py-2 select-text'>
						<span className='font-semibold text-[#C98958]'>
							Affiliate Code:
						</span>
						<span className='font-bold text-white'>MisterTee</span>
					</div>
				</div>

				{/* Error Alert */}
				{error && (
					<Alert
						variant='destructive'
						className='mb-8 bg-[#C98958]/40 border-[#C98958] text-white shadow-md'
					>
						<AlertDescription>
							Failed to load leaderboard: {error}
						</AlertDescription>
					</Alert>
				)}

				{/* Reward Cards */}
				<section className='mb-12'>
					<h2 className='mb-8 text-3xl font-bold text-center text-[#C98958] tracking-wide'>
						Top Players
					</h2>
					<div className='grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3'>
						{monthlyLeaderboard.length > 0 ? (
							<>
								<RewardCard
									position='2nd Place'
									reward='$250 Cash + Special Role'
									backgroundColor='from-[#930203] to-[#C98958]'
									player={monthlyLeaderboard[1]}
									icon={<Award className='text-yellow-400 w-9 h-9' />}
									lightBg
								/>
								<RewardCard
									position='1st Place'
									reward='$500 Cash + Special Role'
									backgroundColor='from-[#C98958] to-[#930203]'
									player={monthlyLeaderboard[0]}
									icon={<Trophy className='w-10 h-10 text-yellow-300' />}
									lightBg
								/>
								<RewardCard
									position='3rd Place'
									reward='$100 Cash + Special Role'
									backgroundColor='from-[#930203] to-[#0F0604]'
									player={monthlyLeaderboard[2]}
									icon={<Medal className='w-8 h-8 text-yellow-500' />}
									lightBg
								/>
							</>
						) : (
							<>
								<RewardCard
									position='1st Place'
									reward='$500 Cash + Special Role'
									backgroundColor='from-[#C98958] to-[#930203]'
									icon={<Trophy className='w-10 h-10 text-yellow-300' />}
									lightBg
								/>
								<RewardCard
									position='2nd Place'
									reward='$250 Cash + Special Role'
									backgroundColor='from-[#930203] to-[#C98958]'
									icon={<Award className='text-yellow-400 w-9 h-9' />}
									lightBg
								/>
								<RewardCard
									position='3rd Place'
									reward='$100 Cash + Special Role'
									backgroundColor='from-[#930203] to-[#0F0604]'
									icon={<Medal className='w-8 h-8 text-yellow-500' />}
									lightBg
								/>
							</>
						)}
					</div>
				</section>

				{/* Leaderboard Table */}
				<section>
					<div className='flex flex-col items-center justify-center mb-6'>
						<h2 className='text-2xl font-semibold text-center text-[#C98958] border-2 border-[#C98958] rounded-md py-2 px-8 inline-block'>
						Bi-Weekly Leaderboard
					</h2>
					<p className='mt-2 text-sm text-gray-300 select-none'>
						Period: {periodInfo?.start_at} → {periodInfo?.end_at}
					</p>
					<p className='mt-1 text-sm text-gray-300 select-none'>{timeLeft}</p>
				</div>

				{isLoading ? (
					<div className='flex items-center justify-center h-52'>
						<Loader2 className='w-10 h-10 text-[#C98958] animate-spin' />
					</div>
				) : (
					<LeaderboardTable period='monthly' data={monthlyLeaderboard} />
				)}
			</section>
			</main>

			<Footer />
		</div>
	);
}

interface RewardCardProps {
	position: string;
	reward: string;
	backgroundColor: string;
	player?: LeaderboardPlayer;
	icon?: React.ReactNode;
	lightBg?: boolean;
}

function RewardCard({
	position,
	reward,
	backgroundColor,
	player,
	icon,
	lightBg = false,
}: RewardCardProps) {
	return (
		<div
			className={`flex flex-col h-full overflow-hidden rounded-xl shadow-lg border border-[#C98958] ${
				lightBg ? "bg-gray-300/20 text-[#E7AC78]" : "text-white"
			}`}
			style={{
				background: lightBg
					? undefined
					: `linear-gradient(to right, var(--tw-gradient-stops))`,
			}}
		>
			<div className={`h-2 bg-gradient-to-r ${backgroundColor}`} />
			<div className='flex flex-col items-center flex-grow p-6 text-center'>
				<div className='mb-5'>{icon}</div>
				<h3 className='mb-3 text-xl font-bold tracking-wide'>{position}</h3>

				{player ? (
					<>
						<p className='text-lg font-semibold'>{player.username}</p>
						<p className='text-lg font-medium'>
							$ {player.wager.toLocaleString()}
						</p>
						<a
							href='https://discord.gg/YmvDexVt'
							target='_blank'
							rel='noreferrer'
							className='w-full mt-6'
						>
							<Button
								className={`w-full ${
									lightBg
										? "bg-[#C98958] hover:bg-[#930203] text-black font-semibold"
										: "bg-[#C98958] hover:bg-[#930203] text-black font-semibold"
								}`}
							>
								Claim Prize
							</Button>
						</a>
					</>
				) : (
					<p className={`text-lg font-medium ${lightBg ? "" : "text-white"}`}>
						{reward}
					</p>
				)}
			</div>
		</div>
	);
}

export default LeaderboardPage;
