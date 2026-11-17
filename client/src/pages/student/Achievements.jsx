import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Flame,
  Star,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Shield,
  Medal,
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

export default function Achievements() {
  const [badges, setBadges] = useState([]);
  const [pointsData, setPointsData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const [bRes, pRes, lRes] = await Promise.allSettled([
        api.get('/achievements/badges'),
        api.get('/achievements/points'),
        api.get('/achievements/leaderboard'),
      ]);

      if (bRes.status === 'fulfilled' && bRes.value.data?.success) {
        setBadges(bRes.value.data.data.badges || bRes.value.data.data || []);
      }
      if (pRes.status === 'fulfilled' && pRes.value.data?.success) {
        setPointsData(pRes.value.data.data);
      }
      if (lRes.status === 'fulfilled' && lRes.value.data?.success) {
        setLeaderboard(lRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Loading achievements and student rankings..." />
      </div>
    );
  }

  const earnedBadgeIds = new Set(
    (pointsData?.earned_badges || []).map((b) => b.badge_slug || b.badge_id)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Achievements & Hall of Fame</h1>
        <p className="text-sm text-text-muted mt-1">
          Gamified milestones rewarding active behavioral learning, assessment completion, and peer leadership.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Skill Points"
          value={pointsData?.total_points ?? 0}
          subtext={pointsData?.level ?? 'Beginner'}
          icon={Trophy}
          color="amber"
        />
        <StatCard
          title="Learning Streak"
          value={`${pointsData?.streak_days ?? 0} Days`}
          subtext="Daily consistency"
          icon={Flame}
          color="rose"
        />
        <StatCard
          title="Badges Unlocked"
          value={`${earnedBadgeIds.size} / ${badges.length}`}
          subtext="Milestones achieved"
          icon={Medal}
          color="purple"
        />
      </div>

      {/* Badges Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-heading">Available Badges & Honors</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b) => {
            const isEarned = earnedBadgeIds.has(b.slug) || earnedBadgeIds.has(b.id) || b.is_earned;

            return (
              <Card
                key={b.id || b.slug}
                className={`p-5 text-center flex flex-col justify-between items-center transition-all ${
                  isEarned
                    ? 'border-primary/50 bg-gradient-to-b from-surface-card to-surface shadow-md'
                    : 'border-border/60 opacity-60 bg-surface'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3 ${
                      isEarned
                        ? 'bg-primary/20 text-primary-light border border-primary/40'
                        : 'bg-surface-lighter text-text-dim border border-border'
                    }`}
                  >
                    {b.icon || '🏅'}
                  </div>

                  <h3 className="text-sm font-bold text-text-heading mb-1 line-clamp-1">
                    {b.title}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-2 mb-3 leading-relaxed">
                    {b.description}
                  </p>
                </div>

                <div className="w-full pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-accent-amber font-mono font-bold">
                    +{b.points || 50} pts
                  </span>
                  {isEarned ? (
                    <span className="text-accent-emerald flex items-center gap-1 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-text-dim flex items-center gap-1 text-[11px]">
                      <Lock className="w-3.5 h-3.5" /> Locked
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Table & Recent Points Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Privacy Preserving Leaderboard */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text-heading">Campus Skill Leaderboard</h3>
              <p className="text-xs text-text-muted">Top scholars ranked by verified soft-skill points</p>
            </div>
            <Badge variant="blue" size="sm">Privacy Protected</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-dim">
                  <th className="pb-2 font-semibold">Rank</th>
                  <th className="pb-2 font-semibold">Scholar</th>
                  <th className="pb-2 font-semibold">Department</th>
                  <th className="pb-2 font-semibold text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaderboard.map((user) => (
                  <tr key={user.rank} className="hover:bg-surface-light/50 transition-colors">
                    <td className="py-3 font-bold text-text-heading">
                      {user.rank === 1 ? '🥇 #1' : user.rank === 2 ? '🥈 #2' : user.rank === 3 ? '🥉 #3' : `#${user.rank}`}
                    </td>
                    <td className="py-3 font-semibold text-text-heading flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary-light font-bold text-[10px] flex items-center justify-center">
                        {user.display_name?.charAt(0) || 'S'}
                      </div>
                      <span>{user.display_name}</span>
                    </td>
                    <td className="py-3 text-text-muted">{user.branch}</td>
                    <td className="py-3 font-black text-accent-amber text-right font-mono">
                      {user.total_points}
                    </td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-text-muted">
                      No leaderboard entries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Points Ledger */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-text-heading">Point Activity Feed</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {(pointsData?.recent_transactions || []).map((tx, idx) => (
              <div
                key={tx.id || idx}
                className="p-3 rounded-xl bg-surface-light border border-border text-xs flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-text-heading line-clamp-1">{tx.description}</h4>
                  <span className="text-[10px] text-text-dim">
                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <span className="text-accent-emerald font-black font-mono shrink-0 pl-2">
                  +{tx.points}
                </span>
              </div>
            ))}
            {(!pointsData?.recent_transactions || pointsData.recent_transactions.length === 0) && (
              <p className="text-xs text-text-muted py-6 text-center">
                Complete modules and exercises to earn points.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
