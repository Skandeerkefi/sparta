import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import GraphicalBackground from '@/components/GraphicalBackground';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import pointsApi from '@/lib/pointsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, History, RefreshCw, Search } from 'lucide-react';

type TransactionUser = {
  _id: string;
  kickUsername?: string;
  rainbetUsername?: string;
  role?: 'user' | 'admin';
};

type Transaction = {
  _id: string;
  user: TransactionUser | string;
  amount: number;
  type: string;
  meta?: Record<string, any> | null;
  createdAt: string;
};

const transactionTypes = [
  'daily-login',
  'tournament-join',
  'tournament-win',
  'tournament-bet-stake',
  'tournament-bet-win',
  'slot-call-x1600',
  'giveaway-participation',
  'giveaway-win',
  'admin-adjust',
  'stream-watchtime',
  'stream-level',
  'kick-subscribed',
  'redemption',
  'redemption-refund',
  'hold',
];

export default function AdminTransactionLogsPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [lastLoaded, setLastLoaded] = useState<string | null>(null);
  const debouncedUserQuery = useDebounce(userQuery, 350);

  const isAdmin = user?.role === 'admin';

  const loadTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await pointsApi.listTransactions(token, {
        user: debouncedUserQuery.trim() || undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        limit: 1000,
      });
      setTransactions(Array.isArray(data) ? data : []);
      setLastLoaded(new Date().toLocaleString());
    } catch (err: unknown) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load transaction logs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [debouncedUserQuery, selectedType, token, toast]);

  useEffect(() => {
    if (isAdmin) loadTransactions();
  }, [isAdmin, loadTransactions]);

  const transactionsWithLabels = useMemo(() => {
    return transactions.map((transaction) => {
      const userDoc = typeof transaction.user === 'string' ? null : transaction.user;
      const userId = userDoc && typeof userDoc === 'object' ? userDoc._id : null;
      const userLabel = userDoc && typeof userDoc === 'object'
        ? [userDoc.kickUsername, userDoc.rainbetUsername].filter(Boolean).join(' / ')
        : typeof transaction.user === 'string'
          ? transaction.user
          : 'Unknown user';
      return {
        ...transaction,
        userId,
        userLabel,
      };
    });
  }, [transactions]);

  if (!isAdmin) {
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
      <main className='relative z-10 mx-auto flex-grow w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <div className='flex items-center gap-2 text-[#E7AC78] mb-2'>
              <History className='w-5 h-5' />
              <span className='text-sm uppercase tracking-[0.3em]'>Admin</span>
            </div>
            <h1 className='text-3xl font-bold text-white'>Points Transaction Logs</h1>
            <p className='mt-2 text-sm text-gray-400'>Filter by transaction type or by user to inspect point history.</p>
          </div>
          <div className='flex items-center gap-3'>
            <Button onClick={loadTransactions} disabled={loading} variant='outline' className='border-[#C98958] text-[#E7AC78] hover:bg-[#C98958]/20'>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <section className='mb-6 rounded-xl border border-[#C98958]/30 bg-black/40 p-4 backdrop-blur-sm'>
          <div className='flex items-center gap-2 mb-4 text-[#E7AC78]'>
            <Filter className='w-4 h-4' />
            <span className='text-sm font-semibold uppercase tracking-[0.25em]'>Filters</span>
          </div>
          <div className='grid gap-4 md:grid-cols-[1.5fr_1fr_auto]'>
            <div className='relative'>
              <Search className='absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2' />
              <Input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder='Search by kick username, rainbet username, or user id'
                className='pl-10 text-white bg-slate-800/60 border-slate-700'
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className='text-white bg-slate-800/60 border-slate-700'>
                <SelectValue placeholder='Filter by type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All transaction types</SelectItem>
                {transactionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant='outline'
              className='border-slate-700 text-gray-200 hover:bg-slate-800'
              onClick={() => {
                setUserQuery('');
                setSelectedType('all');
              }}
            >
              Clear
            </Button>
          </div>
        </section>

        <div className='flex items-center justify-between mb-3 text-sm text-gray-400'>
          <span>{loading ? 'Loading logs...' : `${transactionsWithLabels.length} transaction${transactionsWithLabels.length === 1 ? '' : 's'} shown`}</span>
          <span>{lastLoaded ? `Last updated ${lastLoaded}` : 'Not loaded yet'}</span>
        </div>

        {loading ? (
          <div className='py-16 text-center text-gray-400'>Loading transactions...</div>
        ) : transactionsWithLabels.length === 0 ? (
          <div className='py-16 text-center text-gray-400'>No transactions found for the selected filters.</div>
        ) : (
          <div className='overflow-hidden border rounded-xl border-slate-700/50 bg-black/30'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead className='border-b border-slate-700 bg-slate-800/50'>
                  <tr className='text-left text-[#E7AC78]'>
                    <th className='px-4 py-3'>User</th>
                    <th className='px-4 py-3'>Type</th>
                    <th className='px-4 py-3'>Amount</th>
                    <th className='px-4 py-3'>Details</th>
                    <th className='px-4 py-3'>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsWithLabels.map((transaction) => {
                    const amountPositive = transaction.amount >= 0;
                    const metaText = transaction.meta
                      ? transaction.meta.note || transaction.meta.source || transaction.meta.reason || JSON.stringify(transaction.meta)
                      : '-';

                    return (
                      <tr key={transaction._id} className='border-b border-slate-700/30 hover:bg-slate-800/30'>
                        <td className='px-4 py-3'>
                          <div className='font-medium text-white'>
                            {transaction.userLabel}
                          </div>
                          <div className='text-xs text-gray-500'>{transaction.userId || ''}</div>
                        </td>
                        <td className='px-4 py-3'>
                          <Badge className='bg-[#C98958]/20 text-[#E7AC78] border border-[#C98958]/30'>
                            {transaction.type}
                          </Badge>
                        </td>
                        <td className={`px-4 py-3 font-semibold ${amountPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {amountPositive ? `+${transaction.amount}` : transaction.amount}
                        </td>
                        <td className='px-4 py-3 text-gray-300 max-w-[18rem] truncate'>{metaText}</td>
                        <td className='px-4 py-3 text-gray-400 whitespace-nowrap'>
                          {new Date(transaction.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}