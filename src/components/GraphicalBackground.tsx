import { useEffect, useRef } from "react";

export function GraphicalBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Resize canvas
		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		// Ember particles
		interface Particle {
			x: number;
			y: number;
			size: number;
			speedX: number;
			speedY: number;
			color: string;
			alpha: number;
			flicker: number;
		}

		interface FloatingIcon {
			x: number;
			y: number;
			size: number;
			speedX: number;
			speedY: number;
			swaySpeed: number;
			swayAmount: number;
			phase: number;
			rotation: number;
			rotationSpeed: number;
			imageIndex: number;
			alpha: number;
		}

		const particles: Particle[] = [];
		const particleCount = 46;
		const colors = [
			"rgba(255, 109, 0, ",
			"rgba(255, 138, 18, ",
			"rgba(201, 137, 88, ",
			"rgba(147, 2, 3, ",
		];

		for (let i = 0; i < particleCount; i++) {
			const color = colors[Math.floor(Math.random() * colors.length)];
			particles.push({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				size: Math.random() * 2.6 + 0.5,
				speedX: (Math.random() - 0.5) * 0.18,
				speedY: -(Math.random() * 0.45 + 0.16),
				color,
				alpha: Math.random() * 0.35 + 0.12,
				flicker: Math.random() * Math.PI * 2,
			});
		}

		const iconUrls = [
			"https://i.ibb.co/5WZLnF0M/Screenshot-2026-04-20-184836-removebg-preview.png",
			"https://i.ibb.co/39RpzLRD/Screenshot-2026-04-20-185215-removebg-preview.png",
		];

		const iconImages = iconUrls.map((url) => {
			const image = new Image();
			image.src = url;
			return image;
		});

		const iconCount = 12;

		const createFloatingIcon = (
			index: number,
			existing: FloatingIcon[]
		): FloatingIcon => {
			const size = Math.random() * 36 + 42;
			const margin = size * 0.7;
			let x = margin + Math.random() * Math.max(1, canvas.width - margin * 2);
			let y = Math.random() * (canvas.height + 220) - 140;

			for (let attempt = 0; attempt < 10; attempt++) {
				const overlaps = existing.some((icon) => {
					const dx = icon.x - x;
					const dy = icon.y - y;
					return Math.hypot(dx, dy) < (icon.size + size) * 0.68;
				});
				if (!overlaps) break;
				x = margin + Math.random() * Math.max(1, canvas.width - margin * 2);
				y = Math.random() * (canvas.height + 220) - 140;
			}

			return {
				x,
				y,
				size,
				speedX: (Math.random() - 0.5) * 0.1,
				speedY: -(Math.random() * 0.12 + 0.1),
				swaySpeed: Math.random() * 0.012 + 0.006,
				swayAmount: Math.random() * 7 + 4,
				phase: Math.random() * Math.PI * 2,
				rotation: (Math.random() - 0.5) * 0.12,
				rotationSpeed: (Math.random() - 0.5) * 0.0005,
				imageIndex: index % iconImages.length,
				alpha: Math.random() * 0.18 + 0.22,
			};
		};

		const floatingIcons: FloatingIcon[] = [];
		for (let i = 0; i < iconCount; i++) {
			floatingIcons.push(createFloatingIcon(i, floatingIcons));
		}

		let animationFrameId: number;

		const render = () => {
			const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
			bg.addColorStop(0, "rgba(15, 6, 4, 0.78)");
			bg.addColorStop(0.45, "rgba(31, 9, 6, 0.66)");
			bg.addColorStop(1, "rgba(64, 10, 7, 0.52)");
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Flame glow near the bottom
			const glow = ctx.createRadialGradient(
				canvas.width * 0.5,
				canvas.height * 1.02,
				0,
				canvas.width * 0.5,
				canvas.height * 1.02,
				canvas.width * 0.7
			);
			glow.addColorStop(0, "rgba(255, 120, 20, 0.25)");
			glow.addColorStop(0.5, "rgba(201, 137, 88, 0.12)");
			glow.addColorStop(1, "rgba(15, 6, 4, 0)");
			ctx.fillStyle = glow;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Floating branded icons
			floatingIcons.forEach((icon, i) => {
				const img = iconImages[icon.imageIndex];
				icon.x += icon.speedX;
				icon.y += icon.speedY;
				icon.phase += icon.swaySpeed;
				icon.rotation += icon.rotationSpeed;

				if (icon.x < -icon.size) icon.x = canvas.width + icon.size;
				if (icon.x > canvas.width + icon.size) icon.x = -icon.size;

				if (icon.y < -icon.size * 1.2) {
					const refreshed = createFloatingIcon(i, floatingIcons);
					icon.x = refreshed.x;
					icon.y = canvas.height + Math.random() * 50;
					icon.size = refreshed.size;
					icon.speedX = refreshed.speedX;
					icon.speedY = refreshed.speedY;
					icon.swaySpeed = refreshed.swaySpeed;
					icon.swayAmount = refreshed.swayAmount;
					icon.phase = refreshed.phase;
					icon.rotation = refreshed.rotation;
					icon.rotationSpeed = refreshed.rotationSpeed;
					icon.imageIndex = refreshed.imageIndex;
					icon.alpha = refreshed.alpha;
				}

				const drawX = icon.x + Math.sin(icon.phase) * icon.swayAmount;

				if (img && img.complete) {
					ctx.save();
					ctx.globalAlpha = icon.alpha;
					ctx.translate(drawX, icon.y);
					ctx.rotate(icon.rotation);
					ctx.drawImage(img, -icon.size / 2, -icon.size / 2, icon.size, icon.size);
					ctx.restore();
				}
			});

			// Embers
			particles.forEach((p) => {
				p.x += p.speedX;
				p.y += p.speedY;
				p.flicker += 0.04;

				if (p.y < -10) {
					p.y = canvas.height + Math.random() * 16;
					p.x = Math.random() * canvas.width;
					p.size = Math.random() * 2.6 + 0.5;
					p.alpha = Math.random() * 0.55 + 0.2;
				}

				if (p.x > canvas.width) p.x = 0;
				if (p.x < 0) p.x = canvas.width;

				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				ctx.shadowBlur = 7;
				ctx.shadowColor = "rgba(255, 109, 0, 0.38)";
				ctx.fillStyle = `${p.color}${Math.max(0.03, p.alpha + Math.sin(p.flicker) * 0.08)})`;
				ctx.fill();
				ctx.shadowBlur = 0;
			});

			animationFrameId = requestAnimationFrame(render);
		};

		render();

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			cancelAnimationFrame(animationFrameId);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className='fixed top-0 left-0 w-full h-full pointer-events-none -z-10'
		/>
	);
}

export default GraphicalBackground;
