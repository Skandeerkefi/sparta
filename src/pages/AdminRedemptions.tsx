import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import GraphicalBackground from '@/components/GraphicalBackground';
import pointsApi from '@/lib/pointsApi';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminRedemptions() {
  const { user, token } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await pointsApi.listRedemptions(token);
      setItems(data || []);
    } catch (err: any) {
      console.error('Failed to load redemptions', err);
      toast({ title: 'Error', description: 'Failed to load redemptions' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user?.role, token]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'complete') => {
    if (!token) return toast({ title: 'Error', description: 'Not authenticated' });
    try {
      await pointsApi.updateRedemption(id, action, token);
      toast({ title: 'Updated', description: `Redemption ${action}` });
      await load();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.response?.data?.error || err.message });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className='min-h-screen flex items-center justify-center text-white'>
        <div className='p-6 bg-black/60 border border-[#C98958] rounded'>Admin access required</div>
      </div>
    );
  }

  return (
    <div className='relative flex flex-col min-h-screen text-white'>
      <GraphicalBackground />
      <Navbar />
      <main className='relative z-10 mx-auto flex-grow w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8'>
        <h1 className='text-2xl font-bold mb-4'>Redemptions (Admin)</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className='space-y-3'>
            {items.map((it) => (
              <div key={it._id} className='p-3 bg-black/50 rounded border border-[#C98958] flex items-start justify-between'>
                <div>
                  <div className='font-semibold'>{it.product?.title || 'Product'}</div>
                  <div className='text-sm text-[#C98958]'>User: {it.user?.kickUsername || it.user}</div>
                  <div className='text-xs text-[#C98958]'>{new Date(it.createdAt).toLocaleString()}</div>
                </div>
                <div className='flex flex-col gap-2'>
                  {it.status === 'pending' && (
                    <>
                      <Button onClick={() => handleAction(it._id, 'approve')} variant='secondary'>Approve</Button>
                      <Button onClick={() => handleAction(it._id, 'reject')} variant='destructive'>Reject</Button>
                    </>
                  )}
                  {it.status === 'approved' && <Button onClick={() => handleAction(it._id, 'complete')}>Mark Complete</Button>}
                  <div className='text-sm text-[#E7AC78]'>Status: {it.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
