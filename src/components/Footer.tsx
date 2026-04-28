import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { FaKickstarterK } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className='py-6 mt-16 border-t border-[#930203] bg-black text-white'>
			<div className='container mx-auto'>
				<div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
					{/* About */}
					<div>
						<h3 className='mb-3 text-lg font-bold text-white'>Spartaaan</h3>
						<p className='text-sm text-white/80'>
							Join Spartaaan&apos;s community for exciting gambling streams,
							giveaways, and more. Use affiliate code{" "}
							<span className='font-semibold text-[#C98958]'>SpartaaanOnKICK</span> on
							Bethog.
						</p>
					</div>

					{/* Links */}
					<div>
						<h3 className='mb-3 text-lg font-bold text-white'>Links</h3>
						<div className='grid grid-cols-2 gap-2'>
							<Link
								to='/'
								className='text-sm text-white/70 transition-colors hover:text-[#C98958]'
							>
								Home
							</Link>
							<Link
								to='/leaderboards'
								className='text-sm text-white/70 transition-colors hover:text-[#C98958]'
							>
								Leaderboard
							</Link>
							<Link
								to='/terms'
								className='text-sm text-white/70 transition-colors hover:text-[#C98958]'
							>
								Terms & Conditions
							</Link>
							<Link
								to='/privacy'
								className='text-sm text-white/70 transition-colors hover:text-[#C98958]'
							>
								Privacy Policy
							</Link>
						</div>
					</div>

					{/* Social & Affiliates */}
					<div>
						<h3 className='mb-3 text-lg font-bold text-white'>Connect</h3>
						<div className='flex flex-wrap gap-3'>
							<a
								href='https://kick.com/spartaaan'
								target='_blank'
								rel='noreferrer'
								className='flex items-center justify-center transition-colors bg-[#930203] rounded-full w-9 h-9 hover:bg-[#C98958] text-white'
							>
								<FaKickstarterK className='w-5 h-5' />
							</a>
							<a
								href='https://x.com/vfxspartan'
								target='_blank'
								rel='noreferrer'
								className='flex items-center justify-center transition-colors bg-[#930203] rounded-full w-9 h-9 hover:bg-[#C98958] text-white'
							>
								<FaXTwitter className='w-5 h-5' />
							</a>
							<a
								href='https://www.bethog.com/fr/casino?referral=SpartaaanOnKICK'
								target='_blank'
								rel='noreferrer'
								className='flex items-center justify-center transition-colors bg-[#930203] rounded-full w-9 h-9 hover:bg-[#C98958] p-1'
							>
								<img
									src='https://i.ibb.co/x8LZRrDq/3dgifmaker72872.gif'
									alt='Bethog'
									className='object-contain w-full h-full'
								/>
							</a>
						</div>
					</div>

					{/* Gambling Warning */}
					<div className='md:pl-6 border-l border-[#930203]'>
						<h4 className='text-lg font-bold text-[#C98958] mb-2'>
							BEWARE GAMBLING
						</h4>
						<p className='text-sm leading-relaxed text-white/80'>
							We are not responsible for illegal gambling activities.
							<br />
							Play responsibly — gambling involves financial risks.
							<br />
							Ensure compliance with your local laws.
							<br />
							Seek help if you experience gambling issues.
						</p>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className='pt-4 mt-8 text-sm text-center text-white/70 border-t border-[#930203]'>
					<p className='flex flex-wrap items-center justify-center gap-1 text-sm'>
						© {currentYear} Spartaaan. Made with
						<Heart className='w-3 h-3 mx-1 text-[#C98958]' />
						for the community by{" "}
						<a
							href='https://www.linkedin.com/in/skander-kefi/'
							target='_blank'
							rel='noreferrer'
							className='font-medium text-white hover:text-[#C98958]'
						>
							Skander
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
