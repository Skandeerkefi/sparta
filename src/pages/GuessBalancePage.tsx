import { useCallback, useEffect, useState } from 'react';
import GraphicalBackground from '@/components/GraphicalBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Clock, Users } from 'lucide-react';
import guessApi from '@/lib/guessApi';

type ActiveEvent = {
  _id: string;
  title: string;
  state: 'open' | 'closed' | 'resolved';
  guesses: { user: string; kickUsername: string; guess: number; createdAt: string }[];
  finalBalance: number;
  winners: { kickUsername: string; guess: number; rank: number; points: number }[];
  rewardPoints: { first: number; second: number; third: number };
  createdAt: string;
};

export default function GuessBalancePage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [event, setEvent] = useState<ActiveEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [guessValue, setGuessValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasGuessed, setHasGuessed] = useState(false);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await guessApi.getActiveEvent();
      setEvent(data);
      if (data && user) {
        setHasGuessed(data.guesses.some((g: any) => g.user === user.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSubmitGuess = async () => {
    if (!token || !event) return;
    const num = parseInt(guessValue);
    if (isNaN(num) || num < 0) {
      toast({ title: 'Error', description: 'Enter a valid number', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await guessApi.submitGuess(event._id, num, token);
      toast({ title: 'Success', description: `Guess of ${num} submitted!` });
      setGuessValue('');
      setHasGuessed(true);
      await loadEvent();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to submit', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { loadEvent(); }, [loadEvent]);

  return (
    <div className="min-h-screen bg-[#0F0604]">
      <GraphicalBackground />
      <Navbar />
      <main className="relative z-10 w-full max-w-3xl px-4 py-8 mx-auto">
        <h1 className="mb-6 text-2xl font-bold text-white">🎯 Guess the Balance</h1>

        {loading ? (
          <div className="py-12 text-center text-orange-400/70">Loading...</div>
        ) : !event ? (
          <div className="py-12 text-center text-orange-400/70">
            <p className="text-lg">No active event right now.</p>
            <p className="mt-2 text-sm">Check back later!</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-orange-950/60 border-orange-500/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span>{event.title}</span>
                  <Badge variant={event.state === 'open' ? 'default' : event.state === 'closed' ? 'secondary' : 'outline'}
                    className={event.state === 'open' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : event.state === 'closed' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : 'bg-red-600/20 text-red-400 border-red-600/30'}>
                    {event.state === 'open' ? '🟢 Open' : event.state === 'closed' ? '🟡 Closed' : '🔴 Resolved'}
                  </Badge>
                </CardTitle>
                <p className="mt-1 text-sm text-orange-400/70">
                  <Users className="inline w-4 h-4 mr-1" />{event.guesses.length} guesses
                </p>
              </CardHeader>
            </Card>

            {event.state === 'open' && (
              <Card className="bg-orange-950/60 border-orange-500/30">
                <CardContent className="pt-6">
                  {hasGuessed ? (
                    <div className="py-4 text-center">
                      <p className="text-lg font-semibold text-orange-400">✓ You already submitted a guess!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-orange-200">Enter your guess for the final balance:</p>
                      <div className="flex gap-3">
                        <Input
                          type="number"
                          value={guessValue}
                          onChange={(e) => setGuessValue(e.target.value)}
                          placeholder="Your guess..."
                          className="text-white bg-orange-900/30 border-orange-600/50"
                        />
                        <Button onClick={handleSubmitGuess} disabled={submitting || !guessValue} className="text-black bg-orange-600 hover:bg-orange-500">
                          {submitting ? 'Submitting...' : 'Submit Guess'}
                        </Button>
                      </div>
                      <p className="text-xs text-orange-400/60">One guess per user. Make it count!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {event.state === 'closed' && (
              <div className="py-8 text-center text-orange-400">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-lg font-semibold">Guessing is closed!</p>
                <p className="mt-1 text-sm text-orange-400/70">The admin will reveal the final balance soon.</p>
              </div>
            )}

            {event.state === 'resolved' && (
              <Card className="bg-orange-950/60 border-orange-500/30">
                <CardHeader>
                  <CardTitle className="text-orange-400">🏆 Results — Final Balance: {event.finalBalance}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.winners.map((w) => (
                    <div key={w.rank} className={`flex items-center justify-between p-3 rounded-lg ${
                      w.rank === 1 ? 'bg-orange-500/20 border border-orange-500/30' 
                        : w.rank === 2 ? 'bg-orange-600/20 border border-orange-600/30'
                        : 'bg-orange-700/20 border border-orange-700/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{w.rank === 1 ? '🥇' : w.rank === 2 ? '🥈' : '🥉'}</span>
                        <div>
                          <p className="font-semibold text-white">{w.kickUsername}</p>
                          <p className="text-xs text-orange-400/70">Guessed: {w.guess}</p>
                        </div>
                      </div>
                      <Badge className="text-orange-400 bg-orange-500/20 border-orange-500/30">+{w.points} pts</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {event.state === 'resolved' && event.guesses.length > 0 && (
              <Card className="bg-orange-950/30 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-base text-orange-400">All Guesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 overflow-y-auto max-h-64">
                    {[...event.guesses].sort((a, b) => Math.abs(a.guess - event.finalBalance) - Math.abs(b.guess - event.finalBalance)).map((g, i) => (
                      <div key={i} className="flex justify-between py-1 text-sm border-b border-orange-500/20">
                        <span className="text-orange-200">{g.kickUsername}</span>
                        <span className="text-orange-400">{g.guess}</span>
                        <span className="text-orange-500">off by {Math.abs(g.guess - event.finalBalance)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
      
    </div>
    
  );
}
