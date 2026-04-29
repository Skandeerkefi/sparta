import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import GraphicalBackground from '@/components/GraphicalBackground';
import { useAuthStore } from '@/store/useAuthStore';
import pointsApi from '@/lib/pointsApi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function PointsStore() {
  const { user, token } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await pointsApi.listProducts();
      setProducts(data || []);
    } catch (err: any) {
      console.error('Failed to load products', err);
      toast({ title: 'Error', description: 'Failed to load store' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBuy = async (productId: string) => {
    if (!token) return toast({ title: 'Login required', description: 'Please login to redeem products' });
    try {
      const res = await pointsApi.createRedemption(productId, token);
      toast({ title: 'Requested', description: 'Redemption request created' });
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
        <h1 className='text-2xl font-bold mb-4'>Points Store</h1>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {products.map((p) => (
              <div key={p._id} className='p-4 bg-black/50 rounded border border-[#C98958]'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <div className='font-semibold'>{p.title}</div>
                    <div className='text-sm text-[#C98958]'>{p.description}</div>
                    <div className='mt-2 text-sm'>Cost: <span className='font-medium'>{p.cost}</span></div>
                  </div>
                  <div>
                    <Button onClick={() => handleBuy(p._id)} variant='outline'>Redeem</Button>
                  </div>
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
