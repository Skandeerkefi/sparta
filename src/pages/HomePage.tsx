import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowDown } from "lucide-react";
import { FaKickstarterK, FaXTwitter } from "react-icons/fa6";
import GraphicalBackground from "@/components/GraphicalBackground";
import { useRef } from "react";

function HomePage() {
	const liveRef = useRef<HTMLDivElement>(null);

	const handleScrollClick = () => {
		liveRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<div className='relative flex flex-col min-h-screen text-white'>
			<GraphicalBackground />

			<Navbar />

			<main className='relative z-10 flex-grow'>
				<section className='max-w-5xl min-h-[calc(100vh-84px)] px-6 py-14 mx-auto text-center flex flex-col items-center justify-center'>
					<h1 className='sparta-hero-title'>
						<span className='sparta-hero-kicker'>Welcome To</span>
						<span className='sparta-hero-wordmark' aria-label='Spartaaan'>
							<span className='sparta-hero-word'>Spartaaan</span>
							<img
								src='https://i.ibb.co/gF6h6DBW/Screenshot-2026-04-20-185817-removebg-preview.png'
								alt='Spear logo'
								className='sparta-hero-spear'
							/>
						</span>
						<span className='sparta-hero-sub'>Official Website</span>
					</h1>

					<div className='w-40 h-px mx-auto mt-8 bg-gradient-to-r from-transparent via-[#C98958]/60 to-transparent' />

					<p className='max-w-3xl mx-auto mt-8 text-base tracking-wide uppercase text-white/70 sm:text-xl'>
						Sign up under code <span className='font-bold text-white'>SpartaaanOnKICK</span> and
						enjoy the rewards
					</p>

					<div className='flex flex-col items-center justify-center gap-4 mt-10 sm:flex-row'>
						<Button
							variant='outline'
							className='min-w-[210px] h-14 border-2 border-[#C98958]/60 bg-black/45 text-white hover:bg-[#930203]/50'
							asChild
						>
							<Link to='/leaderboards'>Leaderboard</Link>
						</Button>
						<Button
							className='min-w-[210px] h-14 bg-[#C98958] hover:bg-[#930203] text-white'
							asChild
						>
							<Link to='/signup' className='flex items-center gap-2'>
								Sign Up <ArrowRight className='w-4 h-4' />
							</Link>
						</Button>
					</div>

					<div className='cursor-pointer mt-14' onClick={handleScrollClick}>
						<p className='text-xs tracking-[0.25em] uppercase text-white/50'>
							Scroll To Explore
						</p>
						<ArrowDown className='w-6 h-6 mx-auto mt-3 text-[#C98958]/90 animate-bounce' />
					</div>
				</section>

				<section ref={liveRef} className='max-w-6xl px-6 mx-auto py-14'>
					<h2 className='text-4xl font-bold text-center text-white uppercase sm:text-5xl'>
						Watch Spartaaan Live
					</h2>
					<p className='mt-4 text-lg text-center text-white/65'>
						Watch Spartaaan live and catch exclusive giveaways during streams
					</p>

					<div className='mt-10 overflow-hidden border shadow-2xl rounded-3xl bg-black/55 border-[#C98958]/35 p-3'>
						<div className='overflow-hidden border rounded-2xl border-[#C98958]/40 aspect-video'>
							<iframe
								src='https://player.kick.com/spartaaan'
								frameBorder='0'
								allowFullScreen
								title='Spartaaan Live Stream'
								className='w-full h-full'
							/>
						</div>
					</div>
				</section>

				<section className='max-w-6xl px-6 py-16 mx-auto'>
					<h2 className='text-4xl font-bold text-center text-white uppercase sm:text-5xl'>
						Bethog Promo
					</h2>
					<p className='mt-4 text-lg text-center text-white/65'>
						Use Spartaaan&apos;s official referral and promo code on Bethog
					</p>

					<div className='max-w-2xl mx-auto mt-10'>
						<a
							href='https://www.bethog.com/fr/casino?referral=SpartaaanOnKICK'
							target='_blank'
							rel='noreferrer'
							className='block p-8 transition-all border rounded-3xl bg-black/55 border-[#C98958]/35 hover:border-[#C98958] hover:-translate-y-1'
						>
							<div className='flex items-center justify-center w-16 h-16 mx-auto border rounded-2xl border-[#C98958]/50 bg-[#930203]/30 p-2'>
								<img
									src='https://i.ibb.co/x8LZRrDq/3dgifmaker72872.gif'
									alt='Spartaaan logo'
									className='object-contain w-full h-full'
								/>
							</div>
							<h3 className='mt-5 text-2xl font-bold text-center text-white'>Promo Code: SpartaaanOnKICK</h3>
							<p className='mt-2 text-center text-white/65'>Join Bethog through Spartaaan&apos;s referral page</p>
							<div className='mt-5 text-center'>
								<Button className='bg-[#C98958] hover:bg-[#930203] text-white'>Open Bethog</Button>
							</div>
						</a>
					</div>
				</section>

			<section className='max-w-6xl px-6 py-16 mx-auto'>
				<h2 className='text-4xl font-bold text-center text-white uppercase sm:text-5xl'>						Socials
					</h2>
					<div className='w-24 h-px mx-auto mt-6 bg-gradient-to-r from-transparent via-[#C98958]/60 to-transparent' />

					<div className='grid grid-cols-1 gap-6 mt-10 sm:grid-cols-2 lg:grid-cols-4'>
						<a
							href='https://kick.com/spartaaan'
							target='_blank'
							rel='noreferrer'
							className='p-6 transition-all border rounded-3xl bg-black/55 border-[#C98958]/35 hover:border-[#C98958] hover:-translate-y-1'
						>
							<div className='flex items-center justify-center w-14 h-14 border rounded-2xl border-[#C98958]/50 bg-[#930203]/30'>
								<FaKickstarterK className='text-white w-7 h-7' />
							</div>
							<h3 className='mt-5 text-2xl font-bold text-white'>Kick</h3>
							<p className='mt-2 text-white/65'>Watch live streams and exclusive content</p>
						</a>

						<a
							href='https://x.com/vfxspartan'
							target='_blank'
							rel='noreferrer'
							className='p-6 transition-all border rounded-3xl bg-black/55 border-[#C98958]/35 hover:border-[#C98958] hover:-translate-y-1'
						>
							<div className='flex items-center justify-center w-14 h-14 border rounded-2xl border-[#C98958]/50 bg-[#930203]/30'>
								<FaXTwitter className='text-white w-7 h-7' />
							</div>
							<h3 className='mt-5 text-2xl font-bold text-white'>X (Twitter)</h3>
							<p className='mt-2 text-white/65'>Follow for latest updates</p>
						</a>

						<a
							href='https://www.bethog.com/fr/casino?referral=SpartaaanOnKICK'
							target='_blank'
							rel='noreferrer'
							className='p-6 transition-all border rounded-3xl bg-black/55 border-[#C98958]/35 hover:border-[#C98958] hover:-translate-y-1'
						>
							<div className='flex items-center justify-center w-14 h-14 border rounded-2xl border-[#C98958]/50 bg-[#930203]/30 p-2'>
								<img
									src='https://i.ibb.co/x8LZRrDq/3dgifmaker72872.gif'
									alt='Bethog logo'
									className='object-contain w-full h-full'
								/>
							</div>
							<h3 className='mt-5 text-2xl font-bold text-white'>Bethog</h3>
							<p className='mt-2 text-white/65'>Official referral link</p>
						</a>

						<a
							href='https://www.bethog.com/fr/casino?referral=SpartaaanOnKICK'
							target='_blank'
							rel='noreferrer'
							className='p-6 transition-all border rounded-3xl bg-black/55 border-[#C98958]/35 hover:border-[#C98958] hover:-translate-y-1'
						>
							<div className='flex items-center justify-center w-14 h-14 border rounded-2xl border-[#C98958]/50 bg-[#930203]/30 p-2'>
								<img
									src='https://i.ibb.co/x8LZRrDq/3dgifmaker72872.gif'
									alt='Spartaaan logo'
									className='object-contain w-full h-full'
								/>
							</div>
							<h3 className='mt-5 text-2xl font-bold text-white'>Promo Code</h3>
							<p className='mt-2 text-white/65'>SpartaaanOnKICK</p>
						</a>
					</div>
				</section>
			</main>

			<Footer />
		</div>
	);
}

export default HomePage;
