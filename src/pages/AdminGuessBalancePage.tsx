import { useCallback, useEffect, useState } from 'react';
import GraphicalBackground from '@/components/GraphicalBackground';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Trophy } from 'lucide-react';
import guessApi from '@/lib/guessApi';

type Event = {
  _id: string;
  title: string;
  state: 'open' | 'closed' | 'resolved';
  guesses: { user: string; kickUsername: string; guess: number }[];
  finalBalance: number;
  winners: { kickUsername: string; guess: number; rank: number; points: number }[];
  rewardPoints: { first: number; second: number; third: number };
  createdAt: string;
};

export default function AdminGuessBalancePage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [finalBalance, setFinalBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const loadEvents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await guessApi.getAllGuessEvents(token);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleCreate = async () => {
    if (!token || !newTitle.trim()) return;
    try {
      await guessApi.createGuessEvent(newTitle.trim(), token);
      toast({ title: 'Created', description: `Event "${newTitle}" started!` });
      setNewTitle('');
      await loadEvents();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed', variant: 'destructive' });
    }
  };

  const handleAction = async (eventId: string, action: 'close' | 'reopen' | 'delete') => {
    if (!token) return;
    if (action === 'delete' && !confirm('Delete this event?')) return;
    setActionLoading(eventId);
    try {
      if (action === 'close') await guessApi.closeGuessEvent(eventId, token);
      else if (action === 'reopen') await guessApi.reopenGuessEvent(eventId, token);
      else await guessApi.deleteGuessEvent(eventId, token);
      toast({ title: 'Done', description: `Event ${action}d` });
      await loadEvents();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (eventId: string) => {
    if (!token || !finalBalance) return;
    const num = parseInt(finalBalance);
    if (isNaN(num) || num < 0) {
      toast({ title: 'Error', description: 'Enter a valid number', variant: 'destructive' });
      return;
    }
    setActionLoading(eventId);
    try {
      await guessApi.resolveGuessEvent(eventId, num, token);
      toast({ title: 'Resolved!', description: `Winners awarded points` });
      setFinalBalance('');
      await loadEvents();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (isAdmin) loadEvents();
  }, [isAdmin, token, loadEvents]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0F0604]">
        <GraphicalBackground />
        <Navbar />
        <div className="container relative z-10 px-4 py-8 mx-auto">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-white">Access Denied</h1>
            <p className="text-gray-300">Admin only.</p>
          </div>
        </div>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0604]">
      <GraphicalBackground />
      <Navbar />
      <main className="relative z-10 w-full max-w-4xl px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">🎯 Guess the Balance — Admin</h1>
          <Button onClick={loadEvents} disabled={loading} variant="outline" className="text-orange-400 border-orange-600/50 hover:bg-orange-600/20">Refresh</Button>
        </div>

        {/* Create Event */}
        <Card className="mb-6 bg-orange-950/60 border-orange-500/30">
          <CardHeader>
            <CardTitle className="text-white">Start New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input placeholder="Event title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                className="text-white bg-orange-900/30 border-orange-600/50" />
              <Button onClick={handleCreate} disabled={!newTitle.trim()} className="text-black bg-orange-600 hover:bg-orange-500">Start Event</Button>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        {loading ? (
          <div className="py-8 text-center text-orange-400/70">Loading...</div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-orange-400/70">No events yet.</div>
        ) : (
          <div className="space-y-4">
            {events.map(evt => (
              <Card key={evt._id} className="bg-orange-950/60 border-orange-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{evt.title}</CardTitle>
                      <p className="mt-1 text-sm text-orange-400/70">{evt.guesses.length} guesses • {new Date(evt.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className={evt.state === 'open' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : evt.state === 'closed' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : 'bg-red-600/20 text-red-400 border-red-600/30'}>
                      {evt.state === 'open' ? '🟢 Open' : evt.state === 'closed' ? '🟡 Closed' : '🔴 Resolved'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {evt.state === 'open' && (
                    <Button size="sm" onClick={() => handleAction(evt._id, 'close')} disabled={actionLoading === evt._id} className="text-black bg-orange-600 hover:bg-orange-700">
                      Close Guessing
                    </Button>
                  )}
                  {evt.state === 'closed' && (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Input type="number" placeholder="Final balance" value={finalBalance} onChange={(e) => setFinalBalance(e.target.value)}
                          className="w-40 h-8 text-white bg-orange-900/30 border-orange-600/50" />
                        <Button size="sm" onClick={() => handleResolve(evt._id)}
                          disabled={actionLoading === evt._id || !finalBalance}
                          className="text-black bg-orange-600 hover:bg-orange-700">
                          <Trophy className="w-4 h-4 mr-1" /> Resolve & Award
                        </Button>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleAction(evt._id, 'reopen')}
                        className="text-orange-400 border-orange-600/50 hover:bg-orange-600/20">
                        Reopen
                      </Button>
                    </div>
                  )}
                  {evt.state === 'resolved' && evt.winners.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <p className="text-sm font-semibold text-orange-400">Final Balance: {evt.finalBalance}</p>
                      {evt.winners.map(w => (
                        <div key={w.rank} className="flex items-center justify-between p-2 text-sm border rounded bg-orange-700/20 border-orange-500/20">
                          <span className="text-white">{w.rank === 1 ? '🥇' : w.rank === 2 ? '🥈' : '🥉'} {w.kickUsername} — guessed {w.guess}</span>
                          <Badge className="text-orange-400 bg-orange-500/20 border-orange-500/30">+{w.points} pts</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleAction(evt._id, 'delete')}
                    className="mt-3 text-orange-400 border-orange-600/50 hover:bg-orange-600/20 hover:text-orange-400">
                    <Trash2 className="w-4 h-4" /> Delete Event
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
    </div>
  );
}
