import { useCallback, useEffect, useState } from 'react';
import GraphicalBackground from '@/components/GraphicalBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldOff, Search } from 'lucide-react';
import pointsApi from '@/lib/pointsApi';

type User = {
  _id: string;
  kickUsername: string;
  rainbetUsername: string;
  pointsBalance: number;
  role: 'user' | 'admin';
};

export default function AdminUserManagementPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');

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

  const handleChangeRole = async (userId: string, currentRole: string) => {
    if (!token) return;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change role to "${newRole}"?`)) return;

    setSaving(userId);
    try {
      await pointsApi.changeUserRole(userId, newRole, token);
      toast({ title: 'Success', description: `Role updated to ${newRole}` });
      await loadUsers();
    } catch (err: unknown) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to change role', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.kickUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.rainbetUsername?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="min-h-screen bg-[#0F0604]">
      <GraphicalBackground />
      <Navbar />
      <main className="relative z-10 w-full max-w-5xl px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-sm text-gray-400 mt-1">{users.length} users total — {adminCount} admins, {userCount} users</p>
          </div>
          <Button onClick={loadUsers} disabled={loading} variant="outline" className="border-[#C98958] text-[#E7AC78] hover:bg-[#C98958]/20">
            Refresh
          </Button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'user', 'admin'] as const).map(role => (
              <Button
                key={role}
                size="sm"
                onClick={() => setRoleFilter(role)}
                variant={roleFilter === role ? 'default' : 'outline'}
                className={roleFilter === role ? 'bg-[#C98958] text-black' : 'border-[#C98958]/30 text-[#E7AC78]'}
              >
                {role === 'all' ? 'All' : role === 'admin' ? 'Admins' : 'Users'}
              </Button>
            ))}
          </div>
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
                  <th className="px-4 py-3">Points</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u._id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-white">{u.kickUsername}</td>
                    <td className="px-4 py-3 text-gray-400">{u.rainbetUsername || '-'}</td>
                    <td className="px-4 py-3 text-[#E7AC78]">{u.pointsBalance || 0}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className={u.role === 'admin' ? 'bg-red-600/20 text-red-400 border-red-600/30' : 'bg-green-600/20 text-green-400 border-green-600/30'}>
                        {u.role === 'admin' ? <><Shield className="w-3 h-3 mr-1" />Admin</> : <><ShieldOff className="w-3 h-3 mr-1" />User</>}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        onClick={() => handleChangeRole(u._id, u.role)}
                        disabled={saving === u._id}
                        variant={u.role === 'admin' ? 'outline' : 'default'}
                        className={u.role === 'admin'
                          ? 'border-green-600/50 text-green-400 hover:bg-green-600/20 h-7 px-3'
                          : 'bg-red-600 hover:bg-red-700 h-7 px-3'}
                      >
                        {saving === u._id ? '...' : u.role === 'admin' ? 'Demote' : 'Promote'}
                      </Button>
                    </td>
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
