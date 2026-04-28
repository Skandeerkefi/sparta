import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import GraphicalBackground from "@/components/GraphicalBackground";

function SignupPage() {
	const [username, setUsername] = useState("");
	const [rainbetUsername, setRainbetUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [agreedToTerms, setAgreedToTerms] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const { signup, isLoading } = useAuthStore();
	const { toast } = useToast();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!username || !rainbetUsername || !password || !confirmPassword) return;

		if (password !== confirmPassword) {
			setPasswordError("Passwords do not match");
			return;
		}

		if (!agreedToTerms) return;

		try {
			const success = await signup(
				username,
				rainbetUsername,
				password,
				confirmPassword
			);
			if (success) {
				toast({
					title: "Account Created",
					description: "Your account has been created successfully!",
				});
				navigate("/login");
			}
		} catch (error: any) {
			toast({
				title: "Signup Failed",
				description: error.message || "Unexpected error occurred.",
				variant: "destructive",
			});
		}
	};

	return (
		<div className='relative flex flex-col min-h-screen'>
			{/* Background Layer */}
			<div className='absolute inset-0 -z-10'>
				<GraphicalBackground />
			</div>

			<Navbar />

			<main className='container flex items-center justify-center flex-grow py-12'>
				<Card className='w-full max-w-md bg-white/90 border border-[#E7AC78] text-[#0F0604] shadow-md rounded-xl backdrop-blur-md'>
					<CardHeader className='space-y-1'>
						<div className='flex items-center justify-center gap-2 mb-2'>
							<UserPlus className='w-6 h-6 text-[#0F0604]' />
							<CardTitle className='text-2xl text-[#0F0604]'>
								Create an Account
							</CardTitle>
						</div>
						<CardDescription className='text-center text-[#0F0604]'>
							Enter your Kick and Bethog usernames to register and join the
							community
						</CardDescription>
					</CardHeader>

					<form onSubmit={handleSubmit}>
						<CardContent className='space-y-4'>
							{/* Kick Username */}
							<div className='space-y-2'>
								<Label htmlFor='username' className='text-[#0F0604]'>
									Kick Username
								</Label>
								<Input
									id='username'
									placeholder='Enter your Kick username'
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
									className='bg-white border border-[#E7AC78] text-[#0F0604] placeholder:text-[#999999]'
								/>
							</div>

							{/* Rainbet Username */}
							<div className='space-y-2'>
								<Label htmlFor='rainbetUsername' className='text-[#0F0604]'>
									Bethog Username
								</Label>
								<Input
									id='rainbetUsername'
									placeholder='Enter your Bethog username'
									value={rainbetUsername}
									onChange={(e) => setRainbetUsername(e.target.value)}
									required
									className='bg-white border border-[#E7AC78] text-[#0F0604] placeholder:text-[#999999]'
								/>
							</div>

							{/* Password */}
							<div className='space-y-2'>
								<Label htmlFor='password' className='text-[#0F0604]'>
									Password
								</Label>
								<Input
									id='password'
									type='password'
									placeholder='Create a password'
									value={password}
									onChange={(e) => {
										setPassword(e.target.value);
										setPasswordError("");
									}}
									required
									className='bg-white border border-[#E7AC78] text-[#0F0604] placeholder:text-[#999999]'
								/>
							</div>

							{/* Confirm Password */}
							<div className='space-y-2'>
								<Label htmlFor='confirmPassword' className='text-[#0F0604]'>
									Confirm Password
								</Label>
								<Input
									id='confirmPassword'
									type='password'
									placeholder='Confirm your password'
									value={confirmPassword}
									onChange={(e) => {
										setConfirmPassword(e.target.value);
										setPasswordError("");
									}}
									required
									className='bg-white border border-[#E7AC78] text-[#0F0604] placeholder:text-[#999999]'
								/>
								{passwordError && (
									<p className='mt-1 text-xs text-[#C98958]'>{passwordError}</p>
								)}
							</div>

							{/* Terms Agreement */}
							<div className='flex items-center space-x-2'>
								<Checkbox
									id='terms'
									checked={agreedToTerms}
									onCheckedChange={(checked) =>
										setAgreedToTerms(checked as boolean)
									}
									className='border-[#E7AC78]'
								/>
								<label
									htmlFor='terms'
									className='text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
								>
									I agree to the{" "}
									<Link to='/terms' className='text-[#0F0604] hover:underline'>
										Terms of Service
									</Link>{" "}
									and{" "}
									<Link
										to='/privacy'
										className='text-[#0F0604] hover:underline'
									>
										Privacy Policy
									</Link>
								</label>
							</div>
						</CardContent>

						<CardFooter className='flex flex-col space-y-4'>
							<Button
								type='submit'
								className='w-full bg-[#0F0604] hover:bg-[#222222] text-white'
								disabled={isLoading || !agreedToTerms}
							>
								{isLoading ? "Creating Account..." : "Create Account"}
							</Button>

							<div className='text-sm text-center text-[#222222]'>
								Already have an account?{" "}
								<Link
									to='/login'
									className='text-[#0F0604] hover:underline font-semibold'
								>
									Sign In
								</Link>
							</div>
						</CardFooter>
					</form>
				</Card>
			</main>

			<Footer />
		</div>
	);
}

export default SignupPage;
