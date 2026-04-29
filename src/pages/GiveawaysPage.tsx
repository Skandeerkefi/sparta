import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GiveawayCard } from "@/components/GiveawayCard";
import { useGiveawayStore } from "@/store/useGiveawayStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Gift, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import GraphicalBackground from "@/components/GraphicalBackground";

function GiveawaysPage() {
	const {
		giveaways,
		fetchGiveaways,
		enterGiveaway,
		createGiveaway,
		drawWinner,
		deleteGiveaway,
	} = useGiveawayStore();
	const { user } = useAuthStore();
	const { toast } = useToast();

	const [searchQuery, setSearchQuery] = useState("");
	const [filter, setFilter] = useState<
		"all" | "active" | "completed" | "upcoming"
	>("all");
	const [newTitle, setNewTitle] = useState("");
	const [newEndTime, setNewEndTime] = useState("");

	useEffect(() => {
		fetchGiveaways();
	}, []);

	const filteredGiveaways = giveaways.filter((giveaway) => {
		const matchesSearch = giveaway.title
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesStatus = filter === "all" || giveaway.status === filter;
		return matchesSearch && matchesStatus;
	});

	const handleEnter = async (id: string) => {
		if (!user) {
			toast({
				title: "Not Logged In",
				description: "Please log in to enter the giveaway.",
				variant: "destructive",
			});
			return;
		}
		await enterGiveaway(id, toast);
	};

	const handleCreateGiveaway = async () => {
		if (!newTitle || !newEndTime) {
			toast({
				title: "Missing fields",
				description: "Please provide both title and end time.",
				variant: "destructive",
			});
			return;
		}
		await createGiveaway(newTitle, newEndTime, toast);
		setNewTitle("");
		setNewEndTime("");
	};

	const handleDrawWinner = async (id: string) => {
		await drawWinner(id, toast);
	};

	const handleDeleteGiveaway = async (id: string) => {
		if (!confirm("Delete this giveaway? This cannot be undone.")) return;
		await deleteGiveaway(id, toast);
	};

	return (
		<div className='relative flex min-h-screen flex-col overflow-x-hidden text-white'>
			{/* Background Canvas */}
			<GraphicalBackground />

			<Navbar />

			<main className='relative z-10 mx-auto flex-grow w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8'>
				<div className='mb-8 flex items-center gap-2'>
					<Gift className='w-6 h-6 text-[#E7AC78]' />
					<h1 className='text-2xl font-bold sm:text-3xl'>Giveaways</h1>
				</div>

				<div className='mb-8 rounded-lg border border-[#C98958] bg-[#0F0604] p-4 sm:p-6'>
					<p className='mb-6 text-[#E7AC78]'>
						Join Spartaaan&apos;s exciting giveaways for a chance to win real
						prizes! New opportunities every week.
					</p>

					{user?.role === "admin" && (
						<div className='mb-6'>
							<h2 className='mb-2 font-semibold text-[#E7AC78]'>
								Create New Giveaway
							</h2>
							<Input
								placeholder='Title'
								value={newTitle}
								onChange={(e) => setNewTitle(e.target.value)}
								className='mb-2 bg-[#E7AC78] border border-[#C98958] text-black placeholder:text-[#C98958]'
							/>
							<Input
								type='datetime-local'
								value={newEndTime}
								onChange={(e) => setNewEndTime(e.target.value)}
								className='mb-2 bg-[#E7AC78] border border-[#C98958] text-black placeholder:text-[#C98958]'
							/>
							<Button
								onClick={handleCreateGiveaway}
								className='bg-[#E7AC78] hover:bg-[#C98958] text-black'
							>
								Create Giveaway
							</Button>
						</div>
					)}

					<div className='flex flex-col gap-4 md:flex-row'>
						<div className='relative flex-1'>
							<Search className='absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-[#0F0604]' />
							<Input
								placeholder='Search giveaways...'
								className='pl-9 bg-[#E7AC78] border border-[#C98958] text-white placeholder:text-[#C98958]'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<div className='flex items-center gap-2'>
							<Filter className='w-4 h-4 text-[#E7AC78]' />
							<Tabs
								defaultValue='all'
								onValueChange={(val) => setFilter(val as any)}
								className='rounded-md border border-[#C98958]'
							>
								<TabsList className='flex w-full flex-wrap gap-2 bg-black p-1'>
									{["all", "active", "upcoming", "completed"].map((val) => (
										<TabsTrigger
											key={val}
											value={val}
											className='min-w-[92px] flex-1 text-[#E7AC78] data-[state=active]:bg-[#E7AC78] data-[state=active]:text-black'
										>
											{val.charAt(0).toUpperCase() + val.slice(1)}
										</TabsTrigger>
									))}
								</TabsList>
							</Tabs>
						</div>
					</div>
				</div>

				{filteredGiveaways.length > 0 ? (
					<div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
						{filteredGiveaways.map((giveaway) => (
							<div
								key={giveaway._id}
								className='p-4 rounded-lg  border border-[#C98958] shadow-sm'
							>
								<GiveawayCard
									id={giveaway._id}
									title={giveaway.title}
									prize='Surprise Prize'
									endTime={new Date(giveaway.endTime).toLocaleString()}
									participants={giveaway.totalParticipants}
									maxParticipants={100}
									status={giveaway.status}
									isEntered={giveaway.isEntered}
									onEnter={handleEnter}
								/>
								{giveaway.winner && (
									<p className='mt-2 text-sm text-[#C98958]'>
										🎉 Winner: <strong>{giveaway.winner.kickUsername}</strong>
									</p>
								)}
								{user?.role === "admin" &&
									giveaway.status === "active" &&
									giveaway.totalParticipants > 0 && (
										<Button
											onClick={() => handleDrawWinner(giveaway._id)}
											variant='destructive'
											className='w-full mt-2 bg-[#C98958] hover:bg-[#C98958] text-black'
										>
											Draw Winner
										</Button>
									)}
								{user?.role === "admin" && (
									<Button
										onClick={() => handleDeleteGiveaway(giveaway._id)}
										variant='destructive'
										className='w-full mt-2 bg-[#930203] hover:bg-[#C98958] text-white'
									>
										Delete Giveaway
									</Button>
								)}
							</div>
						))}
					</div>
				) : (
					<div className='py-12 text-center'>
						<Gift className='w-16 h-16 mx-auto mb-4 text-[#C98958]' />
						<h2 className='mb-2 text-2xl font-bold text-[#C98958]'>
							No Giveaways Found
						</h2>
						<p className='text-[#C98958]'>
							{searchQuery || filter !== "all"
								? "No giveaways match your filters."
								: "Check back soon for exciting giveaways!"}
						</p>
					</div>
				)}
			</main>

			<Footer />
		</div>
	);
}

export default GiveawaysPage;
