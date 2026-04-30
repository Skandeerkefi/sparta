import { useCallback, useEffect, useState } from 'react';
import GraphicalBackground from '@/components/GraphicalBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Minus } from 'lucide-react';
import pointsApi from '@/lib/pointsApi';

type User = {
  _id: string;
  kickUsername: string;
  rainbetUsername: string;
  pointsBalance: number;
  role: 'user' | 'admin';
};

export default function AdminPointsAdjustmentPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  const isAdmin = user?.role === 'admin';

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await pointsApi.getAllUsers(token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  const handleAdjustPoints = async (userId: string, points: number) => {
    if (!token || !points) return;
    setSaving(userId);
    try {
      const result = await pointsApi.adjustUserPoints(userId, points, `Admin adjustment`, token);
      toast({
        title: 'Success',
        description: `${points > 0 ? 'Added' : 'Removed'} ${Math.abs(points)} points`,
      });
      setAmounts(prev => ({ ...prev, [userId]: 0 }));
      await loadUsers();
    } catch (err: unknown) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to adjust points', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const handleAmountChange = (userId: string, value: string) => {
    const num = parseInt(value);
    setAmounts(prev => ({ ...prev, [userId]: isNaN(num) ? 0 : num }));
  };

  const filteredUsers = users.filter(u =>
    u.kickUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.rainbetUsername?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin, token, loadUsers]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0F0604]">
        <GraphicalBackground />
        <Navbar />
        <div className="container relative z-10 mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-300">You need admin privileges to access this page.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0604]">
      <GraphicalBackground />
      <Navbar />
      <main className="relative z-10 w-full max-w-5xl px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Points Adjustment</h1>
            <p className="text-sm text-gray-400 mt-1">Add or remove points from user accounts</p>
          </div>
          <Button onClick={loadUsers} disabled={loading} variant="outline" className="border-[#C98958] text-[#E7AC78] hover:bg-[#C98958]/20">
            Refresh
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-700/50">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700 bg-slate-800/50">
                <tr className="text-left text-[#E7AC78]">
                  <th className="px-4 py-3">Kick Username</th>
                  <th className="px-4 py-3">Rainbet Username</th>
                  <th className="px-4 py-3">Current Balance</th>
                  <th className="px-4 py-3 text-center">Adjust Points</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const amount = amounts[u._id] || 0;
                  return (
                    <tr key={u._id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium text-white">{u.kickUsername}</td>
                      <td className="px-4 py-3 text-gray-400">{u.rainbetUsername || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                          {u.pointsBalance || 0} pts
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdjustPoints(u._id, -(amounts[u._id] || 0))}
                            disabled={saving === u._id || !amount}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20 h-8 w-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            value={amount || ''}
                            onChange={(e) => handleAmountChange(u._id, e.target.value)}
                            placeholder="0"
                            className="w-24 h-8 text-center bg-slate-700/50 border-slate-600/50 text-white"
                            min="0"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdjustPoints(u._id, amounts[u._id] || 0)}
                            disabled={saving === u._id || !amount}
                            className="border-green-500/50 text-green-400 hover:bg-green-500/20 h-8 w-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-gray-500">
                          New: {(u.pointsBalance || 0) + (amount || 0)} pts
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
