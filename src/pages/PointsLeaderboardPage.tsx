import { useCallback, useEffect, useState } from 'react';
import GraphicalBackground from '@/components/GraphicalBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import pointsApi from '@/lib/pointsApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

type LeaderboardRow = {
  rank: number;
  userId: string;
  kickUsername: string;
  rainbetUsername?: string;
  pointsBalance: number;
};

type SyncResult = {
  ok?: boolean;
  processed?: number;
  seeded?: number;
  updated?: number;
  matched?: number;
  unmatched?: number;
  changes?: SyncChange[];
};

type SyncChange = {
  userId: string;
  kickUsername: string;
  apiName?: string;
  matched: boolean;
  reason?: string;
  appliedPoints?: number;
  watchtimeDelta?: number;
  levelDelta?: number;
};

type StreamRow = {
  userId: string;
  kickUsername: string;
  baseline: {
    watchtime: number;
    level: number;
    name: string;
    updatedAt?: string | null;
  };
  current: {
    watchtime: number;
    level: number;
    name: string;
    updatedAt?: string | null;
  };
  watchtimeDelta: number;
  levelDelta: number;
  watchtimePoints: number;
  levelPoints: number;
  streamPointsTotals: {
    watchtime: number;
    level: number;
  };
  pointsBalance: number;
};

export default function PointsLeaderboardPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [streamRows, setStreamRows] = useState<StreamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamLoading, setStreamLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncChanges, setSyncChanges] = useState<SyncChange[]>([]);
  const [showUnmatchedOnly, setShowUnmatchedOnly] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadLeaderboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await pointsApi.getPointsLeaderboard(token, 200);
      setRows(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to load points leaderboard';
      toast({ title: 'Error', description: message });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  const loadStreamRows = useCallback(async () => {
    if (!token) return;
    setStreamLoading(true);
    try {
      const data = await pointsApi.getStreamUsers(token, 500);
      setStreamRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to load stream tracker';
      toast({ title: 'Error', description: message });
    } finally {
      setStreamLoading(false);
    }
  }, [token, toast]);

  const handleRefreshAndSync = async () => {
    if (!token) return;
    setSyncing(true);
    try {
      const result = await pointsApi.syncAllStreamPoints(token, { limit: 500 });
      setSyncResult(result);
      setSyncChanges(result.changes || []);
      toast({
        title: 'Sync Complete',
        description: `Matched ${result.matched || 0}, Unmatched ${result.unmatched || 0}. Seeded ${result.seeded || 0}, updated ${result.updated || 0}`,
      });
      await loadLeaderboard();
      await loadStreamRows();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to sync stream points';
      toast({ title: 'Error', description: message });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadLeaderboard();
  }, [isAdmin, token, loadLeaderboard]);

  useEffect(() => {
    if (isAdmin) loadStreamRows();
  }, [isAdmin, token, loadStreamRows]);

  if (!isAdmin) {
    return (
      <div className='flex items-center justify-center min-h-screen text-white'>
        <div className='p-6 bg-black/60 border border-[#C98958] rounded'>Admin access required</div>
      </div>
    );
  }

  const visibleChanges = showUnmatchedOnly
    ? syncChanges.filter(c => !c.matched)
    : syncChanges;

  return (
    <div className='relative flex flex-col min-h-screen text-white'>
      <GraphicalBackground />
      <Navbar />
      <main className='relative z-10 flex-grow w-full max-w-5xl px-4 py-8 mx-auto sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-2xl font-bold'>Points Leaderboard (Admin)</h1>
          <div className='flex gap-2'>
            <button
              className='rounded border border-[#C98958] bg-black/40 px-3 py-1.5 text-sm text-[#E7AC78] hover:bg-black/60'
              onClick={loadLeaderboard}
            >
              Refresh Leaderboard
            </button>
            <button
              className='rounded border border-[#C98958] bg-[#C98958] px-3 py-1.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50'
              onClick={handleRefreshAndSync}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 inline ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Refreshing & Syncing...' : 'Refresh & Sync'}
            </button>
          </div>
        </div>

        {syncResult && (
          <div className='mb-4 rounded-lg border border-[#C98958]/40 bg-black/50 p-4'>
            <div className='flex items-center gap-4 flex-wrap text-sm'>
              <span className='text-[#E7AC78]'>
                Processed: <strong>{syncResult.processed || 0}</strong>
              </span>
              <span className='text-green-400'>
                Matched: <strong>{syncResult.matched || 0}</strong>
              </span>
              <span className='text-red-400'>
                Unmatched: <strong>{syncResult.unmatched || 0}</strong>
              </span>
              <span className='text-blue-400'>
                Seeded: <strong>{syncResult.seeded || 0}</strong>
              </span>
              <span className='text-yellow-400'>
                Updated: <strong>{syncResult.updated || 0}</strong>
              </span>
            </div>
          </div>
        )}

        {syncChanges.length > 0 && (
          <div className='mb-6 rounded-lg border border-[#C98958]/40 bg-black/45 p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-semibold text-[#E7AC78]'>Sync Details</h3>
              <div className='flex gap-2 items-center'>
                <label className='flex items-center gap-2 text-xs text-gray-400 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={showUnmatchedOnly}
                    onChange={(e) => setShowUnmatchedOnly(e.target.checked)}
                    className='rounded border-[#C98958]/30 bg-black/40'
                  />
                  Show unmatched only
                </label>
              </div>
            </div>
            <div className='max-h-64 overflow-y-auto space-y-1'>
              {visibleChanges.map((change) => (
                <div
                  key={change.userId}
                  className={`flex items-center justify-between px-3 py-2 rounded text-sm ${
                    change.matched
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  <div className='flex items-center gap-2'>
                    {change.matched ? (
                      <CheckCircle className='w-4 h-4 text-green-400' />
                    ) : (
                      <XCircle className='w-4 h-4 text-red-400' />
                    )}
                    <span className='font-medium text-white'>{change.kickUsername}</span>
                    {change.matched && change.apiName && (
                      <span className='text-xs text-gray-400'>
                        → API: {change.apiName}
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-3 text-xs'>
                    {change.matched ? (
                      <>
                        {change.appliedPoints !== undefined && change.appliedPoints > 0 && (
                          <span className='text-yellow-400'>+{change.appliedPoints} pts</span>
                        )}
                        {change.watchtimeDelta !== undefined && change.watchtimeDelta > 0 && (
                          <span className='text-blue-400'>+{change.watchtimeDelta} wt</span>
                        )}
                        {change.levelDelta !== undefined && change.levelDelta > 0 && (
                          <span className='text-purple-400'>+{change.levelDelta} lvl</span>
                        )}
                      </>
                    ) : (
                      <span className='text-red-400'>{change.reason || 'no match'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <section className='mb-6 rounded border border-[#C98958] bg-black/45 p-4'>
          <div className='mb-3 flex items-center justify-between gap-3'>
            <div>
              <h2 className='text-lg font-semibold text-[#E7AC78]'>Live Stream Tracker</h2>
              <p className='text-sm text-[#C98958]'>Tracks the Botrix snapshot, your starting baseline, and the points earned from each delta.</p>
            </div>
            <div className='text-sm text-[#E7AC78]'>{streamLoading ? 'Loading...' : `${streamRows.length} users`}</div>
          </div>

          {streamRows.length === 0 ? (
            <div className='text-sm text-[#C98958]'>No stream data loaded yet. Click "Refresh & Sync" to fetch and sync all users.</div>
          ) : (
            <div className='overflow-x-auto rounded border border-[#C98958]/30'>
              <table className='w-full min-w-[980px] text-sm'>
                <thead className='border-b border-[#C98958]/30 bg-black/50 text-left text-[#E7AC78]'>
                  <tr>
                    <th className='px-3 py-2'>Kick Username</th>
                    <th className='px-3 py-2'>Botrix Name</th>
                    <th className='px-3 py-2'>Start Watchtime</th>
                    <th className='px-3 py-2'>Current Watchtime</th>
                    <th className='px-3 py-2'>Watchtime +</th>
                    <th className='px-3 py-2'>Current Level</th>
                    <th className='px-3 py-2'>Level +</th>
                    <th className='px-3 py-2'>Watchtime Pts</th>
                    <th className='px-3 py-2'>Level Pts</th>
                    <th className='px-3 py-2'>Points Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {streamRows.map((row) => (
                    <tr key={row.userId} className='border-b border-[#C98958]/20'>
                      <td className='px-3 py-2 font-medium text-white'>{row.kickUsername}</td>
                      <td className='px-3 py-2 text-[#E7AC78]'>{row.current.name || row.baseline.name || '-'}</td>
                      <td className='px-3 py-2'>{row.baseline.watchtime}</td>
                      <td className='px-3 py-2'>{row.current.watchtime}</td>
                      <td className='px-3 py-2 font-semibold text-[#C98958]'>+{row.watchtimeDelta}</td>
                      <td className='px-3 py-2'>{row.current.level}</td>
                      <td className='px-3 py-2 font-semibold text-[#C98958]'>+{row.levelDelta}</td>
                      <td className='px-3 py-2 font-semibold text-[#E7AC78]'>{row.watchtimePoints}</td>
                      <td className='px-3 py-2 font-semibold text-[#E7AC78]'>{row.levelPoints}</td>
                      <td className='px-3 py-2 font-semibold text-[#E7AC78]'>{row.pointsBalance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

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
