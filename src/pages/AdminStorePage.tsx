import { useEffect, useMemo, useState } from 'react';
import GraphicalBackground from '@/components/GraphicalBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import pointsApi from '@/lib/pointsApi';

type Product = {
  _id: string;
  title: string;
  description?: string;
  cost: number;
  stock: number;
  active: boolean;
  requiresApproval: boolean;
};

const initialForm = {
  title: '',
  description: '',
  cost: 0,
  stock: 0,
  requiresApproval: true,
};

export default function AdminStorePage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const isAdmin = user?.role === 'admin';

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => Number(b.active) - Number(a.active)),
    [products]
  );

  const loadProducts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await pointsApi.listProductsAdmin(token);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadProducts();
  }, [isAdmin, token]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!form.title.trim()) return toast({ title: 'Error', description: 'Title is required' });

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        cost: Number(form.cost),
        stock: Number(form.stock),
        requiresApproval: !!form.requiresApproval,
      };

      if (editingId) {
        await pointsApi.updateProduct(editingId, payload, token);
        toast({ title: 'Updated', description: 'Product updated successfully' });
      } else {
        await pointsApi.createProduct(payload, token);
        toast({ title: 'Created', description: 'Product created successfully' });
      }

      resetForm();
      await loadProducts();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to save product' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p._id);
    setForm({
      title: p.title || '',
      description: p.description || '',
      cost: p.cost || 0,
      stock: p.stock || 0,
      requiresApproval: !!p.requiresApproval,
    });
  };

  const toggleActive = async (p: Product) => {
    if (!token) return;
    try {
      await pointsApi.updateProduct(p._id, { active: !p.active }, token);
      toast({ title: 'Updated', description: `Product ${!p.active ? 'enabled' : 'disabled'}` });
      await loadProducts();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to update product' });
    }
  };

  const removeProduct = async (id: string) => {
    if (!token) return;
    try {
      await pointsApi.deleteProduct(id, token);
      toast({ title: 'Deleted', description: 'Product deleted' });
      if (editingId === id) resetForm();
      await loadProducts();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to delete product' });
    }
  };

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
      <main className='relative z-10 flex-grow w-full max-w-6xl px-4 py-8 mx-auto sm:px-6 lg:px-8'>
        <h1 className='mb-5 text-2xl font-bold'>Store Manager (Admin)</h1>

        <form onSubmit={onSubmit} className='mb-6 rounded border border-[#C98958] bg-black/50 p-4'>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <input
              className='rounded border border-[#C98958] bg-black/30 px-3 py-2'
              placeholder='Title'
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <input
              className='rounded border border-[#C98958] bg-black/30 px-3 py-2'
              placeholder='Description'
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <input
              className='rounded border border-[#C98958] bg-black/30 px-3 py-2'
              type='number'
              min={0}
              placeholder='Cost'
              value={form.cost}
              onChange={(e) => setForm((prev) => ({ ...prev, cost: Number(e.target.value || 0) }))}
            />
            <input
              className='rounded border border-[#C98958] bg-black/30 px-3 py-2'
              type='number'
              min={0}
              placeholder='Stock'
              value={form.stock}
              onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value || 0) }))}
            />
          </div>

          <label className='mt-3 flex items-center gap-2 text-sm text-[#E7AC78]'>
            <input
              type='checkbox'
              checked={form.requiresApproval}
              onChange={(e) => setForm((prev) => ({ ...prev, requiresApproval: e.target.checked }))}
            />
            Requires admin approval
          </label>

          <div className='flex gap-2 mt-4'>
            <Button type='submit' disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}</Button>
            {editingId && (
              <Button type='button' variant='outline' onClick={resetForm}>Cancel Edit</Button>
            )}
          </div>
        </form>

        <section>
          <h2 className='mb-3 text-lg font-semibold'>All Products</h2>
          {loading ? (
            <div>Loading...</div>
          ) : sortedProducts.length === 0 ? (
            <div className='text-sm text-[#C98958]'>No products yet.</div>
          ) : (
            <div className='space-y-3'>
              {sortedProducts.map((p) => (
                <div key={p._id} className='rounded border border-[#C98958] bg-black/50 p-3'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div>
                      <div className='font-semibold'>{p.title}</div>
                      <div className='text-sm text-[#C98958]'>{p.description || 'No description'}</div>
                      <div className='mt-1 text-sm'>
                        Cost: <span className='font-semibold'>{p.cost}</span> | Stock: <span className='font-semibold'>{p.stock}</span> | Status: <span className='font-semibold'>{p.active ? 'Active' : 'Disabled'}</span>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Button variant='outline' onClick={() => startEdit(p)}>Edit</Button>
                      <Button variant='secondary' onClick={() => toggleActive(p)}>{p.active ? 'Disable' : 'Enable'}</Button>
                      <Button variant='destructive' onClick={() => removeProduct(p._id)}>Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
