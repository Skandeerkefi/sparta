# This file is only for editing file nodes, do not break the structure

/src
├── assets/          # Static resources directory, storing static files like images and fonts
│
├── components/      # Components directory
│   ├── ui/         # Pre-installed shadcn/ui components, avoid modifying or rewriting unless necessary
│   ├── Navbar.tsx  # Main navigation component for the website
│   ├── Footer.tsx  # Footer component used across all pages
│   ├── LeaderboardTable.tsx # Component for displaying Rainbet leaderboard data
│   ├── SlotCallCard.tsx    # Component for individual slot call display
│   └── GiveawayCard.tsx    # Component for giveaway display
│
├── hooks/          # Custom Hooks directory
│   ├── use-mobile.ts # Pre-installed mobile detection Hook from shadcn (import { useIsMobile } from '@/hooks/use-mobile')
│   └── use-toast.ts  # Toast notification system hook for displaying toast messages (import { useToast } from '@/hooks/use-toast')
│
├── lib/            # Utility library directory
│   └── utils.ts    # Utility functions, including the cn function for merging Tailwind class names
│
├── pages/          # Page components directory, based on React Router structure
│   ├── HomePage.tsx # Home page component, serving as the main entry point of the application
│   ├── LeaderboardPage.tsx # Page for displaying Rainbet leaderboard data
│   ├── SlotCallsPage.tsx   # Page for slot call management system
│   ├── GiveawaysPage.tsx   # Page for viewing and entering giveaways
│   ├── LoginPage.tsx       # Login page for user authentication
│   ├── SignupPage.tsx      # Registration page for new users
│   └── NotFoundPage.tsx # 404 error page component, displays when users access non-existent routes
│
├── store/          # State management using Zustand
│   ├── useAuthStore.ts       # Store for user authentication state
│   ├── useLeaderboardStore.ts # Store for managing leaderboard data
│   ├── useSlotCallStore.ts   # Store for slot call system
│   ├── useGiveawayStore.ts   # Store for giveaway management
│   └── useStreamStore.ts     # Store for stream status information
│
├── App.tsx         # Root component, with React Router routing system configured
│                   # Add new route configurations in this file
│                   # Includes catch-all route (*) for 404 page handling
│
├── main.tsx        # Entry file, rendering the root component and mounting to the DOM
│
├── index.css       # Global styles file, containing Tailwind configuration and custom styles
│                   # Modify theme colors and design system variables in this file 
│
└── tailwind.config.js  # Tailwind CSS v3 configuration file
                      # Contains theme customization, plugins, and content paths
                      # Includes shadcn/ui theme configuration 