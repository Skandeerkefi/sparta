import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Dices, Crown, Gift, Users, LogIn, User, LogOut, CalendarRange } from "lucide-react";
import useMediaQuery from "@/hooks/use-media-query";
import { useAuthStore } from "@/store/useAuthStore";

export function Navbar() {
	const location = useLocation();
	const isMobile = useMediaQuery("(max-width: 768px)");
	const [isOpen, setIsOpen] = useState(false);
	const [isLive, setIsLive] = useState(false);
	const [viewerCount, setViewerCount] = useState<number | null>(null);

	const { user, logout } = useAuthStore();

	useEffect(() => {
		setIsOpen(false);
	}, [location, isMobile]);

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

	const menuItems = [
		{ path: "/", name: "Home", icon: <Dices className='w-5 h-5' /> },
		{ path: "/leaderboards", name: "Leaderboard", icon: <Crown className='w-5 h-5' /> },
		{
			path: "/bethog-monthly",
			name: "Bethog Monthly",
			icon: <CalendarRange className='w-5 h-5' />,
		},
		{
			path: "/slot-calls",
			name: "Slot Calls",
			icon: <Users className='w-5 h-5' />,
		},
		{
			path: "/giveaways",
			name: "Giveaways",
			icon: <Gift className='w-5 h-5' />,
		},
	];

	const adminMenuItems =
		user?.role === "admin"
			? [
				{
					path: "/bethog-monthly/admin",
					name: "Bethog Admin",
					icon: <CalendarRange className='w-5 h-5' />,
				},
			]
			: [];

	const allMenuItems = [...menuItems, ...adminMenuItems];

	return (
		<nav className='sticky top-0 z-50 bg-gradient-to-r from-[#0F0604] to-[#1a191f] border-b border-[#C98958]/20 shadow-2xl backdrop-blur-md'>
			<div className='flex items-center justify-between w-full gap-3 px-4 py-3 mx-auto sm:px-6 sm:py-4 max-w-7xl'>
				{/* Logo */}
			<Link to='/' className='flex items-center flex-shrink-0 gap-2 transition-opacity select-none sm:gap-3 hover:opacity-80'>
				<img
					src='https://i.ibb.co/x8LZRrDq/3dgifmaker72872.gif'
					alt='Spartaaan Logo'
					className='w-9 sm:w-12 h-9 sm:h-12 rounded-full border-2 border-[#C98958] shadow-lg object-cover hover:border-[#E7AC78] transition-colors'
				/>
				<div className='hidden sm:block'>
					<span className='text-lg sm:text-2xl font-black tracking-tight text-[#C98958]'>Spart</span>
					<span className='text-lg sm:text-2xl font-black tracking-tight text-[#E7AC78]'>aaan</span>
				</div>
			</Link>

				{/* Desktop Menu */}
				{!isMobile && (
				<div className='flex items-center min-w-0 gap-4 ml-auto lg:gap-6'>
					<ul className='flex max-w-[52vw] items-center gap-1 overflow-x-auto whitespace-nowrap pr-2 lg:gap-2'>
						{allMenuItems.map((item) => (
							<li key={item.name}>
								<Link
									to={item.path}
									className={`flex shrink-0 items-center gap-2 px-2.5 py-2 text-xs lg:text-sm font-semibold rounded-lg transition-all duration-300 ${
										location.pathname === item.path
											? "bg-[#C98958] text-white shadow-lg shadow-[#C98958]/50"
											: "text-[#E7AC78] hover:bg-[#C98958]/20 hover:text-[#C98958]"
									}`}
								>
									{item.icon}
									<span className='hidden xl:inline'>{item.name}</span>
								</Link>
							</li>
						))}
					</ul>

					{/* User controls */}
					<div className='flex items-center shrink-0 gap-2 lg:gap-3 pl-4 lg:pl-6 border-l border-[#C98958]/20'>
						{user ? (
							<>
								<Link
									to='/profile'
									className='hidden sm:flex items-center gap-2 text-[#E7AC78] hover:text-[#C98958] font-semibold transition text-xs lg:text-sm'
								>
									<User className='w-4 h-4' />
									<span className='hidden lg:inline'>{user.username}</span>
								</Link>
								<button
									onClick={logout}
									className='flex items-center gap-1 lg:gap-2 bg-[#C98958] hover:bg-[#930203] text-white px-2 lg:px-3 py-1.5 rounded-lg font-semibold transition text-xs lg:text-sm'
								>
									<LogOut className='w-3 h-3 lg:w-4 lg:h-4' />
									<span className='hidden lg:inline'>Logout</span>
								</button>
							</>
						) : (
							<>
								<Link
									to='/login'
									className='flex items-center gap-1 lg:gap-2 border border-[#C98958] text-[#C98958] hover:bg-[#C98958] hover:text-white px-2 lg:px-3 py-1.5 rounded-lg font-semibold transition text-xs lg:text-sm'
								>
									<LogIn className='w-3 h-3 lg:w-4 lg:h-4' />
									<span className='hidden lg:inline'>Login</span>
								</Link>
								<Link
									to='/signup'
									className='hidden sm:block text-[#E7AC78] font-semibold hover:text-[#C98958] transition text-xs lg:text-sm px-2'
								>
									Sign Up
								</Link>
							</>
						)}
					</div>

					{/* Live Status */}
					<div
						className={`shrink-0 px-2.5 lg:px-4 py-1 lg:py-2 rounded-full text-xs font-bold select-none ${
							isLive
								? "bg-[#C98958] text-white shadow-lg shadow-[#C98958]/50 animate-pulse"
								: "bg-gray-700/40 text-gray-400"
						}`}
						title={isLive ? "Currently Live" : "Offline"}
					>
						{isLive ? (
							<>
								<span role='img' aria-label='Live'>
									🔴
								</span>{" "}
								<span className='hidden sm:inline'>LIVE {viewerCount !== null ? `(${viewerCount})` : ""}</span>
							</>
						) : (
							<span className='hidden sm:inline'>Offline</span>
						)}
					</div>
				</div>
			)}

			{/* Mobile Hamburger */}
			{isMobile && (
				<div className='flex items-center gap-2 ml-auto'>
					{/* Mobile Live Status Indicator */}
					<div
						className={`px-2 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${
							isLive
								? "bg-[#C98958] text-white animate-pulse"
								: "bg-gray-700/40 text-gray-400"
						}`}
						title={isLive ? "Currently Live" : "Offline"}
					>
						🔴
					</div>
					<button
						onClick={() => setIsOpen(!isOpen)}
						aria-label='Toggle menu'
						aria-expanded={isOpen}
						className='relative z-50 w-8 h-8 flex flex-col justify-center items-center gap-1.5 focus:outline-none'
					>
						<span
							className={`block w-8 h-1 bg-white rounded transition-transform duration-300 ${
								isOpen ? "rotate-45 translate-y-2" : ""
							}`}
						/>
						<span
							className={`block w-8 h-1 bg-white rounded transition-opacity duration-300 ${
								isOpen ? "opacity-0" : "opacity-100"
							}`}
						/>
						<span
							className={`block w-8 h-1 bg-white rounded transition-transform duration-300 ${
								isOpen ? "-rotate-45 -translate-y-2" : ""
							}`}
						/>
					</button>
				</div>
			)}

			{/* Mobile Dropdown Menu */}
			{isMobile && (
				<div
					className={`fixed inset-0 z-[80] transition-opacity duration-300 ${
						isOpen
							? "opacity-100 pointer-events-auto"
							: "opacity-0 pointer-events-none"
					}`}
					onClick={() => setIsOpen(false)}
				>
					<div className='absolute inset-0 bg-[#0F0604]' />
					<div
						className={`absolute top-0 right-0 w-full max-w-sm bg-gradient-to-b from-[#0F0604] to-[#1a191f] h-dvh shadow-2xl border-l border-[#C98958]/30 py-6 px-6 flex flex-col space-y-4 transform transition-transform duration-300 ${
							isOpen ? "translate-x-0" : "translate-x-full"
						}`}
						onClick={(e) => e.stopPropagation()}
					>
						<ul className='flex flex-col space-y-2 font-semibold text-[#E7AC78]'>
							{allMenuItems.map((item) => (
								<li key={item.name}>
									<Link
										to={item.path}
										onClick={() => setIsOpen(false)}
										className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
											location.pathname === item.path
												? "bg-[#C98958] text-white shadow-lg"
												: "bg-[#1a1222] text-[#E7AC78] hover:bg-[#930203] hover:text-[#C98958]"
										}`}
									>
										{item.icon}
										<span>{item.name}</span>
									</Link>
								</li>
							))}
						</ul>

						<div className='mt-8 pt-6 border-t border-[#C98958]/20 space-y-3'>
							{user ? (
								<>
									<Link
										to='/profile'
										onClick={() => setIsOpen(false)}
										className='flex items-center gap-3 text-[#E7AC78] text-base font-semibold hover:text-[#C98958] transition px-4 py-2'
									>
										<User className='w-5 h-5' />
										<span>{user.username}</span>
									</Link>
									<button
										onClick={() => {
											logout();
											setIsOpen(false);
										}}
										className='w-full bg-[#C98958] hover:bg-[#930203] text-white py-2 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2'
									>
										<LogOut className='w-4 h-4' />
										Logout
									</button>
								</>
							) : (
								<>
									<Link
										to='/login'
										onClick={() => setIsOpen(false)}
										className='flex items-center justify-center gap-2 bg-[#C98958] hover:bg-[#930203] text-white py-2 px-4 rounded-lg font-semibold transition w-full'
									>
										<LogIn className='w-4 h-4' />
										<span>Login</span>
									</Link>
									<Link
										to='/signup'
										onClick={() => setIsOpen(false)}
										className='block text-center text-[#E7AC78] font-semibold hover:text-[#C98958] transition py-2'
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
		</nav>
	);
}
