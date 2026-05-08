import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Save, ShieldCheck, User } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import GraphicalBackground from "@/components/GraphicalBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "@/lib/authApi";
import { useAuthStore } from "@/store/useAuthStore";

function ProfilePage() {
	const { user, token, hasHydrated, setUser } = useAuthStore();
	const navigate = useNavigate();
	const { toast } = useToast();
	const [kickUsername, setKickUsername] = useState("");
	const [rainbetUsername, setRainbetUsername] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmNewPassword, setConfirmNewPassword] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (user) {
			setKickUsername(user.kickUsername ?? "");
			setRainbetUsername(user.rainbetUsername ?? "");
		}
	}, [user]);

	useEffect(() => {
		if (!hasHydrated) return;
		if (!token || !user) {
			navigate("/login");
		}
	}, [hasHydrated, navigate, token, user]);

	if (!hasHydrated) {
		return null;
	}

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (!token || !user) return;

		const trimmedKick = kickUsername.trim();
		const trimmedRainbet = rainbetUsername.trim();
		const passwordChangeRequested = newPassword.length > 0 || confirmNewPassword.length > 0;

		if (!trimmedKick || !trimmedRainbet) {
			toast({
				title: "Missing details",
				description: "Kick and Rainbet usernames are required.",
				variant: "destructive",
			});
			return;
		}

		if (passwordChangeRequested && !currentPassword) {
			toast({
				title: "Current password required",
				description: "Enter your current password before setting a new one.",
				variant: "destructive",
			});
			return;
		}

		if (passwordChangeRequested && newPassword.length < 6) {
			toast({
				title: "Password too short",
				description: "New password must be at least 6 characters.",
				variant: "destructive",
			});
			return;
		}

		if (passwordChangeRequested && newPassword !== confirmNewPassword) {
			toast({
				title: "Passwords do not match",
				description: "Please confirm the same new password.",
				variant: "destructive",
			});
			return;
		}

		setIsSaving(true);
		try {
			const response = await updateProfile(
				{
					kickUsername: trimmedKick,
					rainbetUsername: trimmedRainbet,
					currentPassword: passwordChangeRequested ? currentPassword : undefined,
					newPassword: passwordChangeRequested ? newPassword : undefined,
					confirmNewPassword: passwordChangeRequested ? confirmNewPassword : undefined,
				},
				token
			);

			setUser(response.user);
			localStorage.setItem("user", JSON.stringify(response.user));
			setCurrentPassword("");
			setNewPassword("");
			setConfirmNewPassword("");

			toast({
				title: "Profile updated",
				description: "Your changes were saved successfully.",
			});
		} catch (error: any) {
			toast({
				title: "Update failed",
				description: error?.response?.data?.message || error?.message || "Could not update profile.",
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className='relative flex min-h-screen flex-col text-[#0F0604]'>
			<div className='fixed inset-0 -z-10'>
				<GraphicalBackground />
			</div>

			<Navbar />

			<main className='container relative z-10 flex items-center justify-center flex-1 py-12'>
				<Card className='w-full max-w-2xl rounded-2xl border border-[#E7AC78] bg-[#E7AC78] shadow-2xl'>
					<CardHeader className='space-y-2'>
						<div className='flex items-center gap-3'>
							<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F0604] text-[#E7AC78]'>
								<User className='w-6 h-6' />
							</div>
							<div>
								<CardTitle className='text-3xl text-[#0F0604]'>Profile</CardTitle>
								<CardDescription className='text-[#0F0604]/80'>
									Update your usernames and password from one place.
								</CardDescription>
							</div>
						</div>
					</CardHeader>

					<form onSubmit={handleSubmit}>
						<CardContent className='grid gap-6'>
							<div className='grid gap-4 md:grid-cols-2'>
								<div className='space-y-2'>
									<Label htmlFor='kickUsername' className='text-[#0F0604]'>Kick Username</Label>
									<Input id='kickUsername' value={kickUsername} onChange={(e) => setKickUsername(e.target.value)} className='border-[#0F0604]/20 bg-[#F4D3B2] text-[#0F0604] placeholder:text-[#6b5a4f]' />
								</div>
								<div className='space-y-2'>
									<Label htmlFor='rainbetUsername' className='text-[#0F0604]'>Shuffle Username</Label>
									<Input id='rainbetUsername' value={rainbetUsername} onChange={(e) => setRainbetUsername(e.target.value)} className='border-[#0F0604]/20 bg-[#F4D3B2] text-[#0F0604] placeholder:text-[#6b5a4f]' />
								</div>
							</div>

							<div className='rounded-2xl border border-[#0F0604]/10 bg-[#F4D3B2]/60 p-4'>
								<div className='mb-3 flex items-center gap-2 text-sm font-semibold text-[#0F0604]'>
									<ShieldCheck className='w-4 h-4' />
									Password change
								</div>
								<div className='grid gap-4 md:grid-cols-3'>
									<div className='space-y-2'>
										<Label htmlFor='currentPassword' className='text-[#0F0604]'>Current Password</Label>
										<Input id='currentPassword' type='password' value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className='border-[#0F0604]/20 bg-[#F4D3B2] text-[#0F0604] placeholder:text-[#6b5a4f]' />
									</div>
									<div className='space-y-2'>
										<Label htmlFor='newPassword' className='text-[#0F0604]'>New Password</Label>
										<Input id='newPassword' type='password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className='border-[#0F0604]/20 bg-[#F4D3B2] text-[#0F0604] placeholder:text-[#6b5a4f]' />
									</div>
									<div className='space-y-2'>
										<Label htmlFor='confirmNewPassword' className='text-[#0F0604]'>Confirm Password</Label>
										<Input id='confirmNewPassword' type='password' value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className='border-[#0F0604]/20 bg-[#F4D3B2] text-[#0F0604] placeholder:text-[#6b5a4f]' />
									</div>
								</div>
								<p className='mt-3 text-xs text-[#0F0604]/75'>Leave the password fields empty if you only want to update usernames.</p>
							</div>
						</CardContent>

						<CardFooter className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
							<p className='text-sm text-[#0F0604]/80'>
								Need to go back? <Link to='/' className='font-semibold underline underline-offset-4'>Return home</Link>
							</p>
							<Button type='submit' disabled={isSaving} className='w-full bg-[#0F0604] text-[#E7AC78] hover:bg-[#222222] sm:w-auto'>
								<Save className='w-4 h-4 mr-2' />
								{isSaving ? "Saving..." : "Save Changes"}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</main>

			<Footer />
		</div>
	);
}

export default ProfilePage;