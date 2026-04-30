import { useEffect, useState } from 'react';
import GraphicalBackground from '@/components/GraphicalBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import pointsApi from '@/lib/pointsApi';
import { Trophy, Gift, Flame, Eye, LogIn, Star } from 'lucide-react';

type PointsConfig = {
  _id: string;
  actionType: string;
  points: number;
  description: string;
  enabled: boolean;
  updatedBy?: string;
  updatedAt?: string;
};

type EditedState = {
  points?: number;
  enabled?: boolean;
};

const CATEGORIES = [
  {
    title: 'Giveaways',
    icon: <Gift className="w-5 h-5" />,
    actions: ['giveaway-participation', 'giveaway-win'],
    color: 'text-amber-400',
  },
  {
    title: 'Tournaments',
    icon: <Trophy className="w-5 h-5" />,
    actions: ['tournament-join', 'tournament-match-win', 'tournament-win'],
    color: 'text-yellow-400',
  },
  {
    title: 'Stream',
    icon: <Eye className="w-5 h-5" />,
    actions: ['stream-watchtime', 'stream-level'],
    color: 'text-blue-400',
  },
  {
    title: 'Other',
    icon: <Star className="w-5 h-5" />,
    actions: ['slot-call-x250', 'daily-login'],
    color: 'text-purple-400',
  },
];

export default function AdminPointsConfigPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<PointsConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedConfigs, setEditedConfigs] = useState<Record<string, EditedState>>({});

  const isAdmin = user?.role === 'admin';

  const loadConfigs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await pointsApi.getPointsConfigs(token);
      setConfigs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load points configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePointsChange = (actionType: string, points: number) => {
    setEditedConfigs(prev => ({
      ...prev,
      [actionType]: { ...prev[actionType], points }
    }));
  };

  const handleToggleEnabled = (actionType: string, enabled: boolean) => {
    setEditedConfigs(prev => ({
      ...prev,
      [actionType]: { ...prev[actionType], enabled }
    }));
  };

  const handleSaveSingle = async (config: PointsConfig) => {
    if (!token) return;
    const edit = editedConfigs[config.actionType];
    if (!edit) return;

    setSaving(true);
    try {
      await pointsApi.updatePointsConfig(
        config.actionType,
        edit.points ?? config.points,
        edit.enabled ?? config.enabled,
        token
      );
      toast({
        title: 'Success',
        description: `Updated ${config.actionType.replace(/-/g, ' ')}`,
      });
      setEditedConfigs(prev => {
        const updated = { ...prev };
        delete updated[config.actionType];
        return updated;
      });
      await loadConfigs();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update points configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!token || Object.keys(editedConfigs).length === 0) return;

    setSaving(true);
    try {
      const configsToUpdate = Object.entries(editedConfigs).map(([actionType, edit]) => {
        const original = configs.find(c => c.actionType === actionType);
        return {
          actionType,
          points: edit.points ?? original?.points ?? 0,
          enabled: edit.enabled ?? original?.enabled ?? true,
        };
      });
      await pointsApi.updateMultiplePointsConfigs(configsToUpdate, token);
      toast({
        title: 'Success',
        description: `Updated ${configsToUpdate.length} point configurations`,
      });
      setEditedConfigs({});
      await loadConfigs();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update points configurations',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!token) return;
    if (!confirm('Are you sure you want to reset all points to default values?')) return;

    setSaving(true);
    try {
      await pointsApi.resetPointsConfigs(token);
      toast({
        title: 'Success',
        description: 'Reset all points to default values',
      });
      setEditedConfigs({});
      await loadConfigs();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to reset points configurations',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getDisplayPoints = (config: PointsConfig) => {
    return editedConfigs[config.actionType]?.points ?? config.points;
  };

  const getDisplayEnabled = (config: PointsConfig) => {
    return editedConfigs[config.actionType]?.enabled ?? config.enabled;
  };

  const hasChanges = Object.keys(editedConfigs).length > 0;

  const getConfigForAction = (actionType: string) => configs.find(c => c.actionType === actionType);

  useEffect(() => {
    if (isAdmin) {
      loadConfigs();
    }
  }, [isAdmin, token]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <GraphicalBackground />
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Points Configuration</h1>
              <p className="text-gray-400">Manage point rewards for all system actions. Changes take effect immediately.</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSaveAll}
                disabled={!hasChanges || saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Saving...' : `Save All (${Object.keys(editedConfigs).length})`}
              </Button>
              <Button
                onClick={handleResetDefaults}
                disabled={saving}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              >
                Reset Defaults
              </Button>
            </div>
          </div>

          {hasChanges && (
            <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
              You have unsaved changes. Click "Save All" to apply them.
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400">Loading configurations...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {CATEGORIES.map(category => {
                const categoryConfigs = category.actions
                  .map(getConfigForAction)
                  .filter(Boolean) as PointsConfig[];

                if (categoryConfigs.length === 0) return null;

                return (
                  <div key={category.title}>
                    <div className={`flex items-center gap-2 mb-4 ${category.color}`}>
                      {category.icon}
                      <h2 className="text-lg font-semibold uppercase tracking-wider">{category.title}</h2>
                    </div>
                    <div className="grid gap-3">
                      {categoryConfigs.map(config => {
                        const isEdited = editedConfigs[config.actionType] !== undefined;
                        const currentPoints = getDisplayPoints(config);
                        const isEnabled = getDisplayEnabled(config);
                        const originalPoints = config.points;
                        const originalEnabled = config.enabled;
                        const hasPointChange = isEdited && currentPoints !== originalPoints;
                        const hasEnabledChange = isEdited && isEnabled !== originalEnabled;

                        return (
                          <Card key={config.actionType} className={`bg-slate-800/60 border-slate-700/50 transition-all ${isEdited ? 'border-yellow-500/40 ring-1 ring-yellow-500/20' : ''}`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <CardTitle className="text-white text-base capitalize">
                                      {config.actionType.replace(/-/g, ' ')}
                                    </CardTitle>
                                    <p className="text-sm text-gray-400 mt-0.5">{config.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={isEnabled ? 'default' : 'secondary'} className={isEnabled ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-gray-600/20 text-gray-400'}>
                                      {isEnabled ? 'Active' : 'Disabled'}
                                    </Badge>
                                    <Switch
                                      checked={isEnabled}
                                      onCheckedChange={(checked) => handleToggleEnabled(config.actionType, checked)}
                                      className={isEnabled ? 'data-[state=checked]:bg-green-600' : ''}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Points:</span>
                                    <Input
                                      type="number"
                                      value={currentPoints}
                                      onChange={(e) => handlePointsChange(config.actionType, Math.max(0, parseInt(e.target.value) || 0))}
                                      className={`w-20 h-8 text-sm bg-slate-700/50 border-slate-600/50 text-white ${hasPointChange ? 'border-yellow-500/50' : ''}`}
                                      min="0"
                                    />
                                    {hasPointChange && (
                                      <span className="text-xs text-yellow-400 line-through">{originalPoints}</span>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveSingle(config)}
                                    disabled={!isEdited || saving}
                                    className="h-8 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            {config.updatedAt && (
                              <CardContent className="pt-0 pb-3">
                                <p className="text-xs text-gray-500">
                                  Last updated: {new Date(config.updatedAt).toLocaleString()}
                                </p>
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                    <Separator className="mt-6 bg-slate-700/30" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}