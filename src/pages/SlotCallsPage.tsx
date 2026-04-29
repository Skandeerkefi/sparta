import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SlotCallCard } from "@/components/SlotCallCard";
import { useSlotCallStore } from "@/store/useSlotCallStore";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useDebounce } from "@/hooks/use-debounce";
import GraphicalBackground from "@/components/GraphicalBackground";
import { searchSlots, SlotSearchResult } from "@/lib/bonushuntApi";

type FilterStatus = "all" | "pending" | "accepted" | "rejected" | "played";

function SlotCallsPage() {
	const {
		slotCalls,
		addSlotCall,
		updateSlotStatus,
		submitBonusCall,
		fetchSlotCalls,
		isSubmitting,
		deleteSlotCall,
	} = useSlotCallStore();

	const { user, token } = useAuthStore();
	const { toast } = useToast();

	const handleToggleX250 = async (id: string, newValue: boolean) => {
		const result = await updateSlotStatus(id, "played", newValue);
		if (result.success) {
			toast({ title: "Updated", description: "x250 hit toggled." });
			await fetchSlotCalls();
		} else {
			toast({
				title: "Error",
				description: result.error || "Failed to toggle x250",
				variant: "destructive",
			});
		}
	};

	const [searchQuery, setSearchQuery] = useState("");
	const [slotName, setSlotName] = useState("");
	const [slotImageUrl, setSlotImageUrl] = useState("");
	const [filter, setFilter] = useState<FilterStatus>("all");
	const [showOnly250Hit, setShowOnly250Hit] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [searchResults, setSearchResults] = useState<SlotSearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showSearchResults, setShowSearchResults] = useState(false);
	const [newSlotSearchQuery, setNewSlotSearchQuery] = useState("");
	const [selectedSlot, setSelectedSlot] = useState<SlotSearchResult | null>(null);

	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const debouncedNewSlotSearch = useDebounce(newSlotSearchQuery, 500);
	const isAdmin = user?.role === "admin";

	useEffect(() => {
		if (token) {
			fetchSlotCalls().finally(() => setIsLoading(false));
		} else {
			setIsLoading(false);
		}
	}, [token, fetchSlotCalls]);

	// Search for slots from bonushunt API
	useEffect(() => {
		if (debouncedNewSlotSearch.trim()) {
			const performSearch = async () => {
				setIsSearching(true);
				try {
					const results = await searchSlots(debouncedNewSlotSearch);
					setSearchResults(results);
					setShowSearchResults(true);
				} catch (error) {
					console.error("Search failed:", error);
					toast({
						title: "Search Failed",
						description: "Could not search slots. Please try again.",
						variant: "destructive",
					});
					setSearchResults([]);
				} finally {
					setIsSearching(false);
				}
			};
			performSearch();
		} else {
			setSearchResults([]);
			setShowSearchResults(false);
		}
	}, [debouncedNewSlotSearch, toast]);

	const filteredSlotCalls = useMemo(() => {
		return slotCalls.filter((call) => {
			const query = debouncedSearchQuery.toLowerCase();
			const matchesSearch =
				call.slotName.toLowerCase().includes(query) ||
				call.requester.toLowerCase().includes(query);

			const matchesStatus = filter === "all" || call.status === filter;
			const matches250 = !showOnly250Hit || call.x250Hit;

			return matchesSearch && matchesStatus && matches250;
		});
	}, [slotCalls, debouncedSearchQuery, filter, showOnly250Hit]);

	const handleSubmit = async () => {
		if (!slotName.trim()) {
			toast({
				title: "Error",
				description: "Slot name is required.",
				variant: "destructive",
			});
			return;
		}

		const result = await addSlotCall(slotName.trim(), slotImageUrl, "Stake");
		if (result.success) {
			toast({ title: "Submitted", description: "Slot call sent!" });
			setSlotName("");
			setSlotImageUrl("");
			setNewSlotSearchQuery("");
			setSelectedSlot(null);
			setShowSearchResults(false);
			setSearchResults([]);
			await fetchSlotCalls();
		} else {
			toast({
				title: "Error",
				description: result.error || "Something went wrong.",
				variant: "destructive",
			});
		}
	};

	const handleSelectSlot = (slot: SlotSearchResult) => {
		setSlotName(slot.name);
		setSlotImageUrl(slot.image);
		setSelectedSlot(slot);
		setNewSlotSearchQuery(slot.name);
		setShowSearchResults(false);
	};

	const handleAccept = async (id: string, newX250Value: boolean) => {
		const result = await updateSlotStatus(id, "accepted", newX250Value);
		if (result.success) {
			toast({ title: "Updated", description: "Slot status updated." });
			await fetchSlotCalls();
		} else {
			toast({
				title: "Error",
				description: result.error || "Failed to update slot",
				variant: "destructive",
			});
		}
	};

	const handleReject = async (id: string) => {
		const result = await updateSlotStatus(id, "rejected");
		if (result.success) {
			toast({ title: "Rejected", description: "Slot call rejected." });
			await fetchSlotCalls();
		} else {
			toast({
				title: "Error",
				description: result.error || "Failed to reject slot call",
				variant: "destructive",
			});
		}
	};

	const handleBonusSubmit = async (id: string, slotName: string) => {
		const result = await submitBonusCall(id, slotName);
		if (result.success) {
			toast({
				title: "Bonus Call Submitted",
				description: "Bonus call saved successfully.",
			});
			await fetchSlotCalls();
		} else {
			toast({
				title: "Error",
				description: result.error || "Failed to submit bonus call",
				variant: "destructive",
			});
		}
	};

	const handleDelete = async (id: string) => {
		const result = await deleteSlotCall(id);
		if (result.success) {
			toast({
				title: "Deleted",
				description: "Slot call deleted successfully.",
			});
		} else {
			toast({
				title: "Error",
				description: result.error || "Failed to delete slot call",
				variant: "destructive",
			});
		}
	};

	const handleMarkPlayed = async (id: string) => {
		const result = await updateSlotStatus(id, "played");
		if (result.success) {
			toast({ title: "Marked Played", description: "Slot marked as played." });
			await fetchSlotCalls();
		} else {
			toast({
				title: "Error",
				description: result.error || "Failed to mark played",
				variant: "destructive",
			});
		}
	};

	return (
		<div className='relative flex flex-col min-h-screen text-white '>
			{/* Background Canvas */}
			<GraphicalBackground />

			<Navbar />

			<main className='relative z-10 flex-grow w-full max-w-6xl px-4 py-8 mx-auto sm:px-6 lg:px-8'>
				<div className='flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between'>
					<h1 className='text-2xl font-bold sm:text-3xl'>Slot Calls</h1>
					<Dialog>
						<DialogTrigger asChild>
							<Button
								variant='outline'
								className='flex items-center gap-2 border-[#C98958] text-[#0F0604] hover:bg-[#C98958] bg-white'
							>
								<Plus className='w-4 h-4' /> New Slot Call
							</Button>
						</DialogTrigger>
						<DialogContent className='bg-[#0F0604] text-white border border-[#C98958] max-w-2xl'>
							<DialogHeader>
								<DialogTitle>New Slot Call</DialogTitle>
								<DialogDescription>
									Search and select a slot from bonushunt.gg
								</DialogDescription>
							</DialogHeader>
							<div className='flex flex-col gap-4'>
								{/* Search Input */}
								<Input
									placeholder='Search slot names...'
									value={newSlotSearchQuery}
									onChange={(e) => setNewSlotSearchQuery(e.target.value)}
									disabled={isSearching}
									className='bg-[#E7AC78] text-black border border-[#C98958]'
								/>

								{selectedSlot && (
									<div className='rounded-2xl border border-[#C98958]/30 bg-black/30 p-3'>
										<p className='mb-2 text-sm font-medium text-[#C98958]'>Selected slot call</p>
										<div className='grid gap-4 md:grid-cols-[280px_minmax(0,1fr)] md:items-center'>
											<div className='overflow-hidden rounded-xl border border-[#C98958]/20 bg-black/40'>
												<img
													src={selectedSlot.image}
													alt={selectedSlot.name}
													className='object-contain w-full h-64 p-3'
												/>
											</div>
											<div className='space-y-1'>
												<p className='text-2xl font-semibold text-white'>{selectedSlot.name}</p>
												<p className='text-xs text-white/45'>
													Click another result to replace it, or submit this selection.
												</p>
											</div>
										</div>
									</div>
								)}

								{/* Search Results */}
								{showSearchResults && (
									<div className='border-t border-[#C98958]/30 pt-3'>
										{isSearching ? (
											<div className='text-center text-[#C98958]/70 py-4'>
												Searching...
											</div>
										) : searchResults.length === 0 ? (
											<div className='text-center text-[#C98958]/70 py-4'>
												No slots found
											</div>
										) : (
											<div className='grid grid-cols-2 gap-2 overflow-y-auto max-h-96'>
												{searchResults.map((slot, idx) => (
													<button
														key={idx}
														type='button'
														onClick={() => handleSelectSlot(slot)}
														className={`p-2 rounded border transition text-left ${
															selectedSlot?.name === slot.name
																? "border-[#E7AC78] bg-[#C98958]/15"
																: "border-[#C98958]/30 hover:border-[#C98958] hover:bg-[#C98958]/10"
														}`}
													>
														{slot.image && (
															<img
																src={slot.image}
																alt={slot.name}
															className='object-contain w-full h-32 p-2 mb-1 rounded bg-black/30'
															/>
														)}
														<p className='text-sm font-medium truncate'>{slot.name}</p>
													</button>
												))}
											</div>
										)}
									</div>
								)}

								{/* Selected Slot Preview */}
								{slotName && (
									<div className='border-t border-[#C98958]/30 pt-3'>
										<p className='text-sm text-[#C98958] mb-2'>Selected Slot:</p>
										<div className='flex gap-3'>
											{slotImageUrl && (
												<img
													src={slotImageUrl}
													alt={slotName}
													className='object-cover w-16 h-16 rounded'
												/>
											)}
											<div className='flex-1'>
												<p className='font-semibold'>{slotName}</p>
											</div>
										</div>
									</div>
								)}

								<DialogFooter>
									<Button
										variant='outline'
										onClick={() => {
											setSlotName("");
											setSlotImageUrl("");
											setNewSlotSearchQuery("");
											setShowSearchResults(false);
										}}
										className='text-[#C98958] border-[#C98958]'
									>
										Clear
									</Button>
									<Button
										onClick={handleSubmit}
										disabled={isSubmitting || !slotName.trim()}
										className='text-black bg-[#C98958] hover:bg-[#E7AC78]'
									>
										Submit
									</Button>
								</DialogFooter>
							</div>
						</DialogContent>
					</Dialog>
				</div>

				<div className='flex flex-col gap-4 mb-6 lg:flex-row lg:items-center'>
					<Input
						placeholder='Search slot name or requester...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='w-full bg-[#E7AC78] text-white border border-[#C98958] lg:max-w-sm'
					/>

					<Tabs
						value={filter}
						onValueChange={(val) => setFilter(val as FilterStatus)}
						className='w-full lg:max-w-lg'
					>
						<TabsList className='flex w-full flex-wrap gap-2 border-b border-[#C98958] bg-black p-1'>
							<TabsTrigger
								value='all'
								className='min-w-[88px] flex-1 text-[#E7AC78] data-[state=active]:bg-[#E7AC78] data-[state=active]:text-black'
							>
								All
							</TabsTrigger>
							<TabsTrigger
								value='pending'
								className='text-[#E7AC78] data-[state=active]:bg-[#E7AC78] data-[state=active]:text-black'
							>
								Pending
							</TabsTrigger>
							<TabsTrigger
								value='accepted'
								className='text-[#E7AC78] data-[state=active]:bg-[#E7AC78] data-[state=active]:text-black'
							>
								Accepted
							</TabsTrigger>
							<TabsTrigger
								value='played'
								className='text-[#E7AC78] data-[state=active]:bg-[#E7AC78] data-[state=active]:text-black'
							>
								Played
							</TabsTrigger>
							<TabsTrigger
								value='rejected'
								className='text-[#E7AC78] data-[state=active]:bg-[#E7AC78] data-[state=active]:text-black'
							>
								Rejected
							</TabsTrigger>
						</TabsList>
					</Tabs>

					<label className='flex items-center gap-2 text-sm text-[#E7AC78]'>
						<input
							type='checkbox'
							checked={showOnly250Hit}
							onChange={(e) => setShowOnly250Hit(e.target.checked)}
							className='accent-[#C98958]'
						/>
						Show only 1.600x Hit
					</label>
				</div>

				{isLoading ? (
					<div className='text-center text-[#C98958]/70'>Loading...</div>
				) : filteredSlotCalls.length === 0 ? (
					<div className='text-center text-[#C98958]/70'>
						No slot calls found.
					</div>
				) : (
					<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
						{filteredSlotCalls.map((call) => (
							<SlotCallCard
								key={call.id}
								id={call.id}
								slotName={call.slotName}
								requester={call.requester}
								timestamp={call.timestamp}
								status={call.status}
								x250Hit={call.x250Hit}
								imageUrl={call.imageUrl}
								site={call.site}
								bonusCall={call.bonusCall}
								isAdminView={isAdmin}
								isUserView={!isAdmin}
								onAccept={handleAccept}
								onReject={handleReject}
								onBonusSubmit={handleBonusSubmit}
								onDelete={handleDelete}
								onMarkPlayed={handleMarkPlayed}
								onToggleX250={handleToggleX250}
							/>
						))}
					</div>
				)}
			</main>

			<Footer />
		</div>
	);
}

export default SlotCallsPage;
