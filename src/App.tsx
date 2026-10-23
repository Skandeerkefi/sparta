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
import BonusHuntPage from "./pages/BonusHuntPage";
import TournamentWidgetPage from "@/pages/TournamentWidgetPage";
import BonusHuntWidgetPage from "@/pages/BonusHuntWidgetPage";
import BonusHuntAdminPage from "./pages/BonusHuntAdminPage";
import TournamentPage from "./pages/TournamentPage";
import AdminUserManagementPage from './pages/AdminUserManagementPage';

function App() {
const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
const user = useAuthStore((state) => state.user);

useEffect(() => {
loadFromStorage();
}, [loadFromStorage]);

useEffect(() => {
if (user?.role === "admin") {
console.log("User is admin, do admin stuff");
} else {
console.log("User is not admin");
}
}, [user]);
return (
<TooltipProvider>
<BrowserRouter>
<Routes>
<Route path='/' element={<HomePage />} />
<Route path='/login' element={<LoginPage />} />
<Route path='/signup' element={<SignupPage />} />
<Route path='*' element={<NotFoundPage />} />
<Route path='/slot-calls' element={<SlotCallsPage />} />
<Route path='/giveaways' element={<GiveawaysPage />} />
<Route path='/bonus-hunt' element={<BonusHuntPage />} />
<Route path='/bonus-hunt/admin' element={<BonusHuntAdminPage />} />
<Route path='/bonus-hunt-widget' element={<BonusHuntWidgetPage />} />
<Route path='/tournament' element={<TournamentPage />} />
<Route path='/tournaments' element={<TournamentPage />} />
<Route path='/tournament-widget' element={<TournamentWidgetPage />} />
<Route path='/admin/users' element={<AdminUserManagementPage />} />
</Routes>
</BrowserRouter>
<Toaster />
</TooltipProvider>
);
}

export default App;
