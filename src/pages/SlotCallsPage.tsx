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
	const [filter, setFilter] = useState<FilterStatus>("all");
	const [showOnly250Hit, setShowOnly250Hit] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const isAdmin = user?.role === "admin";

	useEffect(() => {
		if (token) {
			fetchSlotCalls().finally(() => setIsLoading(false));
		} else {
			setIsLoading(false);
		}
	}, [token]);

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

		const result = await addSlotCall(slotName.trim());
		if (result.success) {
			toast({ title: "Submitted", description: "Slot call sent!" });
			setSlotName("");
			await fetchSlotCalls();
		} else {
			toast({
				title: "Error",
				description: result.error || "Something went wrong.",
				variant: "destructive",
			});
		}
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

			<main className='container relative z-10 flex-grow max-w-6xl px-4 py-8 mx-auto'>
				<div className='flex items-center justify-between mb-4'>
					<h1 className='text-2xl font-bold'>Slot Calls</h1>
					<Dialog>
						<DialogTrigger asChild>
							<Button
								variant='outline'
								className='flex items-center gap-2 border-[#C98958] text-[#0F0604] hover:bg-[#C98958] bg-white'
							>
								<Plus className='w-4 h-4' /> New Slot Call
							</Button>
						</DialogTrigger>
						<DialogContent className='bg-[#0F0604] text-white border border-[#C98958]'>
							<DialogHeader>
								<DialogTitle>New Slot Call</DialogTitle>
								<DialogDescription>
									Submit a new slot call to the system.
								</DialogDescription>
							</DialogHeader>
							<div className='flex flex-col gap-2'>
								<Input
									placeholder='Slot Name'
									value={slotName}
									onChange={(e) => setSlotName(e.target.value)}
									disabled={isSubmitting}
									className='bg-[#E7AC78] text-black border border-[#C98958]'
								/>
								<DialogFooter>
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

				<div className='flex flex-wrap items-center gap-4 mb-6'>
					<Input
						placeholder='Search slot name or requester...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='flex-grow max-w-sm bg-[#E7AC78] text-white border border-[#C98958]'
					/>

					<Tabs
						value={filter}
						onValueChange={(val) => setFilter(val as FilterStatus)}
						className='flex-grow max-w-lg'
					>
						<TabsList className='border-b border-[#C98958] bg-black'>
							<TabsTrigger
								value='all'
								className='text-[#E7AC78] data-[state=active]:bg-[#E7AC78] data-[state=active]:text-black'
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
						Show only 250x Hit
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
