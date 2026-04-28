import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
	Dices,
	Flame,
	Trophy,
	Gift,
	Users,
	LogIn,
	User,
	LogOut,
	CalendarRange,
	Menu,
	X,
	Radio,
} from "lucide-react";
import useMediaQuery from "@/hooks/use-media-query";
import { useAuthStore } from "@/store/useAuthStore";

export function Navbar() {
	const location = useLocation();
	const isMobile = useMediaQuery("(max-width: 1023px)");
	const [isOpen, setIsOpen] = useState(false);
	const [isLive, setIsLive] = useState(false);
	const [viewerCount, setViewerCount] = useState<number | null>(null);

	const { user, logout } = useAuthStore();
	const sidebarWidth = "18rem";

	const mainMenuItems = useMemo(
		() => [
			{ path: "/", name: "Home", icon: <Dices className='h-5 w-5' /> },
			{ path: "/tournament", name: "Tournament", icon: <Trophy className='h-5 w-5' /> },
			{ path: "/bonus-hunt", name: "Bonus Hunt", icon: <Flame className='h-5 w-5' /> },
			{ path: "/bethog-monthly", name: "Bethog Monthly", icon: <CalendarRange className='h-5 w-5' /> },
			{ path: "/slot-calls", name: "Slot Calls", icon: <Users className='h-5 w-5' /> },
			{ path: "/giveaways", name: "Giveaways", icon: <Gift className='h-5 w-5' /> },
		],
		[]
	);

	const adminMenuItems = useMemo(
		() =>
			user?.role === "admin"
				? [
					{ path: "/bethog-monthly/admin", name: "Bethog Admin", icon: <CalendarRange className='h-5 w-5' /> },
					{ path: "/bonus-hunt/admin", name: "Bonus Hunt Admin", icon: <Flame className='h-5 w-5' /> },
				]
				: [],
		[ user?.role ]
	);

	const allMenuItems = [...mainMenuItems, ...adminMenuItems];

	useEffect(() => {
		setIsOpen(false);
	}, [location, isMobile]);

	useEffect(() => {
		const previousPaddingLeft = document.body.style.paddingLeft;
		const previousOverflowX = document.body.style.overflowX;
		const previousOverflowY = document.body.style.overflowY;

		document.body.style.paddingLeft = isMobile ? "0px" : sidebarWidth;
		document.body.style.overflowX = "hidden";
		document.body.style.overflowY = isMobile && isOpen ? "hidden" : previousOverflowY;

		return () => {
			document.body.style.paddingLeft = previousPaddingLeft;
			document.body.style.overflowX = previousOverflowX;
			document.body.style.overflowY = previousOverflowY;
		};
	}, [isMobile, isOpen]);

	useEffect(() => {
		const fetchLiveStatus = async () => {
			try {
				const res = await fetch("https://kick.com/api/v2/channels/spartaaan");
				const data = await res.json();

				if (data.livestream) {
					setIsLive(true);
					setViewerCount(data.livestream.viewer_count);
				} else {
					setIsLive(false);
					setViewerCount(null);
				}
			} catch (err) {
				console.error("Error fetching live status", err);
			}
		};

		fetchLiveStatus();
		const interval = setInterval(fetchLiveStatus, 60000);
		return () => clearInterval(interval);
	}, []);

	return (
		<>
			{/* Desktop Sidebar */}
			<aside className='hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-72 lg:flex-col border-r border-[#C98958]/20 bg-gradient-to-b from-[#0F0604] via-[#15111a] to-[#1a191f] shadow-2xl backdrop-blur-md'>
				<div className='flex h-full flex-col px-4 py-5'>
					<Link to='/' className='flex items-center gap-3 rounded-2xl border border-[#C98958]/15 bg-black/20 px-4 py-3 transition hover:border-[#C98958]/35 hover:bg-black/35'>
						<img
							src='https://i.ibb.co/x8LZRrDq/3dgifmaker72872.gif'
							alt='Spartaaan Logo'
							className='h-12 w-12 rounded-full border-2 border-[#C98958] object-cover'
						/>
						<div>
							<div className='text-xs uppercase tracking-[0.35em] text-white/40'>Spartaaan</div>
							<div className='text-xl font-black tracking-tight text-[#E7AC78]'>Dashboard</div>
						</div>
					</Link>

					<div className='mt-5 flex items-center justify-between rounded-2xl border border-[#C98958]/15 bg-black/20 px-4 py-3'>
						<div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/45'>
							<Radio className={`h-4 w-4 ${isLive ? "text-[#C98958]" : "text-gray-500"}`} />
							<span>{isLive ? "Live now" : "Offline"}</span>
						</div>
						{isLive && <span className='text-xs text-[#E7AC78]'>{viewerCount !== null ? viewerCount : 0}</span>}
					</div>

					<nav className='mt-5 flex-1 overflow-y-auto pr-1'>
						<div className='space-y-2'>
							{mainMenuItems.map((item) => (
								<SidebarLink key={item.name} item={item} active={location.pathname === item.path} />
							))}
						</div>

						{adminMenuItems.length > 0 && (
							<div className='mt-6 border-t border-[#C98958]/15 pt-4'>
								<div className='mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/35'>Admin</div>
								<div className='space-y-2'>
									{adminMenuItems.map((item) => (
										<SidebarLink key={item.name} item={item} active={location.pathname === item.path} />
									))}
								</div>
							</div>
						)}
					</nav>

					<div className='mt-auto space-y-3 border-t border-[#C98958]/15 pt-4'>
						{user ? (
							<>
								<Link
									to='/profile'
									className='flex items-center gap-3 rounded-2xl border border-[#C98958]/15 bg-black/20 px-4 py-3 text-sm font-semibold text-[#E7AC78] transition hover:border-[#C98958]/35 hover:bg-black/35 hover:text-[#C98958]'
								>
									<User className='h-4 w-4' />
									<span className='truncate'>{user.kickUsername}</span>
								</Link>
								<button
									onClick={logout}
									className='flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C98958] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#930203]'
								>
									<LogOut className='h-4 w-4' />
									Logout
								</button>
							</>
						) : (
							<>
								<Link
									to='/login'
									className='flex items-center justify-center gap-2 rounded-2xl border border-[#C98958] px-4 py-3 text-sm font-semibold text-[#C98958] transition hover:bg-[#C98958] hover:text-white'
								>
									<LogIn className='h-4 w-4' />
									Login
								</Link>
								<Link
									to='/signup'
									className='block text-center text-sm font-semibold text-[#E7AC78] transition hover:text-[#C98958]'
								>
									Sign Up
								</Link>
							</>
						)}
					</div>
				</div>
			</aside>

			{/* Mobile Topbar */}
			<div className='lg:hidden sticky top-0 z-50 border-b border-[#C98958]/20 bg-gradient-to-r from-[#0F0604] to-[#1a191f] shadow-2xl backdrop-blur-md'>
				<div className='flex items-center justify-between gap-3 px-4 py-3'>
					<Link to='/' className='flex items-center gap-2 transition-opacity hover:opacity-80'>
						<img
							src='https://i.ibb.co/x8LZRrDq/3dgifmaker72872.gif'
							alt='Spartaaan Logo'
							className='h-9 w-9 rounded-full border-2 border-[#C98958] object-cover sm:h-10 sm:w-10'
						/>
						<div className='min-w-0 text-base font-black tracking-tight text-[#E7AC78] sm:text-lg'>Spartaaan</div>
					</Link>

					<div className='flex items-center gap-2'>
						<div
							className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
								isLive ? "bg-[#C98958] text-white" : "bg-gray-700/40 text-gray-400"
							}`}
						>
							{isLive ? `Live ${viewerCount !== null ? `(${viewerCount})` : ""}` : "Offline"}
						</div>
						<button
							onClick={() => setIsOpen(!isOpen)}
							aria-label='Toggle menu'
							aria-expanded={isOpen}
							className='flex h-10 w-10 items-center justify-center rounded-xl border border-[#C98958]/20 bg-black/25 text-white'
						>
							{isOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
						</button>
					</div>
				</div>

				<div className='border-t border-[#C98958]/15 px-3 py-2 sm:px-4'>
					<div className='flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'>
						{mainMenuItems.map((item) => (
							<Link
								key={item.name}
								to={item.path}
								className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
									location.pathname === item.path
										? "bg-[#C98958] text-white"
										: "bg-black/20 text-[#E7AC78] hover:bg-[#C98958]/15 hover:text-[#C98958]"
								}`}
							>
								{item.icon}
								<span>{item.name}</span>
							</Link>
						))}
					</div>
				</div>

				{isOpen && (
					<div className='fixed inset-0 z-[80]' onClick={() => setIsOpen(false)}>
						<div className='absolute inset-0 bg-black/70' />
						<div
							className='absolute right-0 top-0 flex h-full w-[min(92vw,22rem)] flex-col border-l border-[#C98958]/20 bg-gradient-to-b from-[#0F0604] via-[#15111a] to-[#1a191f] p-4 shadow-2xl'
							onClick={(e) => e.stopPropagation()}
						>
							<div className='mb-4 flex items-center justify-between'>
								<div className='text-sm font-semibold uppercase tracking-[0.35em] text-white/35'>Menu</div>
								<button onClick={() => setIsOpen(false)} className='rounded-lg border border-[#C98958]/20 p-2 text-white'>
									<X className='h-4 w-4' />
								</button>
							</div>

							<div className='space-y-2 overflow-y-auto pr-1'>
								{allMenuItems.map((item) => (
									<Link
										key={item.name}
										to={item.path}
										onClick={() => setIsOpen(false)}
										className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition ${
											location.pathname === item.path
												? "bg-[#C98958] text-white shadow-lg"
												: "bg-black/20 text-[#E7AC78] hover:bg-[#930203] hover:text-[#C98958]"
										}`}
									>
										{item.icon}
										<span>{item.name}</span>
									</Link>
								))}
							</div>

							<div className='mt-auto space-y-3 border-t border-[#C98958]/15 pt-4'>
								{user ? (
									<>
										<Link
											to='/profile'
											onClick={() => setIsOpen(false)}
											className='flex items-center gap-3 rounded-2xl border border-[#C98958]/15 bg-black/20 px-4 py-3 text-sm font-semibold text-[#E7AC78]'
										>
											<User className='h-4 w-4' />
											<span className='truncate'>{user.kickUsername}</span>
										</Link>
										<button
											onClick={() => {
											logout();
											setIsOpen(false);
										}}
											className='flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C98958] px-4 py-3 text-sm font-semibold text-white'
										>
											<LogOut className='h-4 w-4' />
											Logout
										</button>
									</>
								) : (
									<>
										<Link
											to='/login'
											onClick={() => setIsOpen(false)}
											className='flex items-center justify-center gap-2 rounded-2xl bg-[#C98958] px-4 py-3 text-sm font-semibold text-white'
										>
											<LogIn className='h-4 w-4' />
											Login
										</Link>
										<Link
											to='/signup'
											onClick={() => setIsOpen(false)}
											className='block text-center text-sm font-semibold text-[#E7AC78]'
										>
											Sign Up
										</Link>
									</>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
}

function SidebarLink({ item, active }: { item: { path: string; name: string; icon: React.ReactNode }; active: boolean }) {
	return (
		<Link
			to={item.path}
			className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
				active
					? "bg-[#C98958] text-white shadow-lg shadow-[#C98958]/30"
					: "bg-black/20 text-[#E7AC78] hover:bg-[#C98958]/15 hover:text-[#C98958]"
			}`}
		>
			{item.icon}
			<span className='truncate'>{item.name}</span>
		</Link>
	);
}
