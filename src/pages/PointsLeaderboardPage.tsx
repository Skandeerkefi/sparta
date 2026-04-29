import { useEffect, useState } from 'react';
import GraphicalBackground from '@/components/GraphicalBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import pointsApi from '@/lib/pointsApi';

type LeaderboardRow = {
  rank: number;
  userId: string;
  kickUsername: string;
  rainbetUsername?: string;
  pointsBalance: number;
};

export default function PointsLeaderboardPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadLeaderboard = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await pointsApi.getPointsLeaderboard(token, 200);
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to load points leaderboard' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadLeaderboard();
  }, [isAdmin, token]);

  if (!isAdmin) {
    return (
      <div className='flex items-center justify-center min-h-screen text-white'>
        <div className='p-6 bg-black/60 border border-[#C98958] rounded'>Admin access required</div>
      </div>
    );
  }

  return (
    <div className='relative flex flex-col min-h-screen text-white'>
      <GraphicalBackground />
      <Navbar />
      <main className='relative z-10 flex-grow w-full max-w-5xl px-4 py-8 mx-auto sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-2xl font-bold'>Points Leaderboard (Admin)</h1>
          <button
            className='rounded border border-[#C98958] bg-black/40 px-3 py-1.5 text-sm text-[#E7AC78] hover:bg-black/60'
            onClick={loadLeaderboard}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : rows.length === 0 ? (
          <div className='text-sm text-[#C98958]'>No users found.</div>
        ) : (
          <div className='overflow-x-auto rounded border border-[#C98958] bg-black/45'>
            <table className='w-full min-w-[640px] text-sm'>
              <thead className='border-b border-[#C98958] text-left text-[#E7AC78]'>
                <tr>
                  <th className='px-3 py-2'>Rank</th>
                  <th className='px-3 py-2'>Kick Username</th>
                  <th className='px-3 py-2'>Bethog Username</th>
                  <th className='px-3 py-2'>Points</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.userId} className='border-b border-[#C98958]/30'>
                    <td className='px-3 py-2 font-semibold'>{row.rank}</td>
                    <td className='px-3 py-2'>{row.kickUsername}</td>
                    <td className='px-3 py-2'>{row.rainbetUsername || '-'}</td>
                    <td className='px-3 py-2 font-semibold text-[#E7AC78]'>{row.pointsBalance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
