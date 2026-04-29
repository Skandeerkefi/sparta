import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import SlotCallsPage from "@/pages/SlotCallsPage";
import GiveawaysPage from "@/pages/GiveawaysPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/useAuthStore";
import SlotOverlay from "@/pages/SlotOverlay";
import BonusHuntPage from "./pages/BonusHuntPage";
import TournamentWidgetPage from "@/pages/TournamentWidgetPage";
import BonusHuntWidgetPage from "@/pages/BonusHuntWidgetPage";
import RoobetPage from "@/pages/RoobetPage";
import RainPage from "@/pages/RainPage";
import CSGOLeadPage from "./pages/CSGOLead";
import PackdrawPage from "./pages/PackdrawPage";
import ClashLeaderboardPage from "./pages/ClashLeaderboardPage";
import BethogMonthly from "./pages/BethogMonthly";
import BethogMonthlyAdmin from "./pages/BethogMonthlyAdmin";
import TournamentPage from "./pages/TournamentPage";
import BonusHuntAdminPage from "./pages/BonusHuntAdminPage";
import PointsDashboard from './pages/PointsDashboard';
import PointsStore from './pages/PointsStore';
import AdminRedemptions from './pages/AdminRedemptions';
import AdminStorePage from './pages/AdminStorePage';
import PointsLeaderboardPage from './pages/PointsLeaderboardPage';
function App() {
	const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
	const user = useAuthStore((state) => state.user);

	useEffect(() => {
		loadFromStorage();
	}, [loadFromStorage]);

	useEffect(() => {
		if (user?.role === "admin") {
			// Do admin-specific logic here
			console.log("User is admin, do admin stuff");
		} else {
			// Non-admin logic or nothing
			console.log("User is not admin");
		}
	}, [user]);
	return (
		<TooltipProvider>
			<BrowserRouter>
				<Routes>
					<Route path='/' element={<HomePage />} />
					<Route path='/leaderboard' element={<CSGOLeadPage />} />
					<Route path='/slot-calls' element={<SlotCallsPage />} />
					<Route path='/giveaways' element={<GiveawaysPage />} />
					<Route path='/login' element={<LoginPage />} />
					<Route path='/signup' element={<SignupPage />} />
					<Route path='*' element={<NotFoundPage />} />
					<Route path='/slot-overlay' element={<SlotOverlay />} />
					<Route path='/bonus-hunt' element={<BonusHuntPage />} />
					<Route path='/tournament-widget' element={<TournamentWidgetPage />} />
					<Route path='/bonus-hunt-widget' element={<BonusHuntWidgetPage />} />
					<Route path='/bonus-hunt/admin' element={<BonusHuntAdminPage />} />
					<Route path='/leaderboards' element={<RoobetPage />} />
					<Route path='/Leaderboards' element={<RoobetPage />} />
					<Route path='/rain' element={<RainPage />} />
					<Route path='/clash' element={<ClashLeaderboardPage />} />
					<Route path='/packdraw' element={<PackdrawPage />} />
					<Route path='/bethog-monthly' element={<BethogMonthly />} />
					<Route path='/bethog-monthly/admin' element={<BethogMonthlyAdmin />} />
					<Route path='/tournament' element={<TournamentPage />} />
					<Route path='/tournaments' element={<TournamentPage />} />
					<Route path='/points' element={<PointsDashboard />} />
					<Route path='/store' element={<PointsStore />} />
					<Route path='/admin/store' element={<AdminStorePage />} />
					<Route path='/admin/redemptions' element={<AdminRedemptions />} />
					<Route path='/admin/points-leaderboard' element={<PointsLeaderboardPage />} />
				</Routes>
			</BrowserRouter>
			<Toaster />
		</TooltipProvider>
	);
}

export default App;
