import { Button } from "@/components/ui/button";
import { Clock, Users, Gift } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export type GiveawayStatus = "active" | "completed" | "upcoming";

interface GiveawayCardProps {
	id: string;
	title: string;
	prize: string;
	endTime: string;
	participants: number;
	maxParticipants?: number;
	status: GiveawayStatus;
	isEntered?: boolean;
	onEnter?: (id: string) => void;
}

export function GiveawayCard({
	id,
	title,
	prize,
	endTime,
	participants,
	maxParticipants = 100,
	status,
	isEntered = false,
	onEnter,
}: GiveawayCardProps) {
	const participationPercentage = Math.min(
		100,
		Math.floor((participants / maxParticipants) * 100)
	);

	return (
		<div className='overflow-hidden rounded-lg border border-[#C98958] bg-[#0F0604]'>
			{/* Accent top bar */}
			<div className='h-3 bg-gradient-to-r from-[#C98958] via-[#C98958] to-[#930203]' />

			<div className='p-5 text-[#E7AC78]'>
				<div className='flex items-start justify-between'>
					<h3 className='text-lg font-bold text-[#C98958]'>{title}</h3>
					<StatusPill status={status} />
				</div>

				<div className='flex items-center gap-2 mt-4'>
					<Gift className='w-5 h-5 text-[#C98958]' />
					<span className='text-lg font-semibold'>{prize}</span>
				</div>

				{/* Points info: entry and winner rewards */}
				<div className='mt-2 text-sm text-[#E7AC78]'>
					Entry: +5 pts • Winner: +200 pts
				</div>

				<div className='mt-4 space-y-3'>
					<div className='flex justify-between text-sm text-[#E7AC78]'>
						<div className='flex items-center gap-1.5'>
							<Users className='w-4 h-4' />
							<span>{participants} participants</span>
						</div>
						<div className='flex items-center gap-1.5'>
							<Clock className='w-4 h-4' />
							<span>{endTime}</span>
						</div>
					</div>

					<Progress
						value={participationPercentage}
						className='h-2 bg-[#E7AC78]'
						color='#C98958'
					/>

					<div className='text-xs text-right text-[#E7AC78]'>
						{participants} / {maxParticipants} entries
					</div>
				</div>

				<div className='mt-4'>
					{status === "active" && !isEntered && (
						<Button
							className='w-full bg-[#C98958] hover:bg-[#C98958] text-[#E7AC78]'
							onClick={() => onEnter && onEnter(id)}
						>
							Enter Giveaway
						</Button>
					)}

					{status === "active" && isEntered && (
						<Button
							variant='outline'
							className='w-full text-[#C98958] border-[#C98958]'
							disabled
						>
							Entered
						</Button>
					)}

					{status === "completed" && (
						<Button
							variant='outline'
							className='w-full text-[#E7AC78] border-[#E7AC78]'
							disabled
						>
							Giveaway Ended
						</Button>
					)}

					{status === "upcoming" && (
						<Button
							variant='outline'
							className='w-full text-[#E7AC78] border-[#E7AC78]'
							disabled
						>
							Coming Soon
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

function StatusPill({ status }: { status: GiveawayStatus }) {
	if (status === "active") {
		return (
			<div className='px-2 py-0.5 rounded-full bg-[#C98958]/20 text-[#C98958] text-xs'>
				Active
			</div>
		);
	} else if (status === "completed") {
		return (
			<div className='px-2 py-0.5 rounded-full bg-[#E7AC78]/20 text-[#E7AC78] text-xs'>
				Completed
			</div>
		);
	} else {
		return (
			<div className='px-2 py-0.5 rounded-full bg-[#E7AC78]/20 text-[#E7AC78] text-xs'>
				Upcoming
			</div>
		);
	}
}
