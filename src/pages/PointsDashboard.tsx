import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import GraphicalBackground from '@/components/GraphicalBackground';
import { useAuthStore } from '@/store/useAuthStore';
import pointsApi from '@/lib/pointsApi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function PointsDashboard() {
  const { user, token } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [streamBaseline, setStreamBaseline] = useState<any | null>(null);
  const [streamTotals, setStreamTotals] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const data = await pointsApi.getUserPoints(user.id, token);
      setBalance(data.balance);
      setTransactions(data.transactions || []);
      setStreamBaseline(data.streamPointsBaseline || null);
      setStreamTotals(data.streamPointsTotals || null);
    } catch (err: any) {
      console.error('Failed to load points', err);
      toast({ title: 'Error', description: 'Failed to load points' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id, token]);

  const handleClaim = async () => {
    if (!token) return toast({ title: 'Login required', description: 'Please login to claim daily points' });
    try {
      const res = await pointsApi.claimDaily(token);
      toast({ title: 'Claimed', description: `You received ${res.awarded} points` });
      await load();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.response?.data?.error || err.message });
    }
  };

  return (
    <div className='relative flex flex-col min-h-screen text-white'>
      <GraphicalBackground />
      <Navbar />
      <main className='relative z-10 mx-auto flex-grow w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
        <h1 className='text-2xl font-bold mb-4'>Points Dashboard</h1>

        <div className='mb-6 flex items-center justify-between gap-4'>
          <div className='p-4 rounded-md bg-[#0F0604] border border-[#C98958] min-w-[180px]'>
            <div className='text-sm text-[#E7AC78]'>Balance</div>
            <div className='text-3xl font-bold'>{loading ? '...' : (balance ?? '—')}</div>
          </div>

          <div>
            <Button onClick={handleClaim} variant='secondary'>Claim Daily</Button>
          </div>
        </div>

        <section className='mb-6 rounded-md border border-[#C98958] bg-black/40 p-4'>
          <h2 className='text-lg font-semibold mb-2'>Stream Points Baseline</h2>
          {streamBaseline ? (
            <div className='space-y-1 text-sm text-[#E7AC78]'>
              <div>Name: {streamBaseline.name || '—'}</div>
              <div>Watchtime baseline: {streamBaseline.watchtime ?? 0}</div>
              <div>Level baseline: {streamBaseline.level ?? 0}</div>
              <div>Watchtime points earned: {streamTotals?.watchtime ?? 0}</div>
              <div>Level points earned: {streamTotals?.level ?? 0}</div>
            </div>
          ) : (
            <div className='text-sm text-[#C98958]'>No stream baseline synced yet.</div>
          )}
        </section>

        <section>
          <h2 className='text-lg font-semibold mb-2'>Recent Transactions</h2>
          {transactions.length === 0 ? (
            <div className='text-sm text-[#C98958]'>No transactions yet.</div>
          ) : (
            <ul className='space-y-2'>
              {transactions.map((t: any) => (
                <li key={t._id} className='p-3 bg-black/50 rounded border border-[#C98958]'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium'>{t.type}</div>
                      <div className='text-xs text-[#C98958]'>
                        {new Date(t.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className={`font-semibold ${t.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {t.amount > 0 ? `+${t.amount}` : t.amount}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
