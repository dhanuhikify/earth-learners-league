import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import leaderboardIcon from '@/assets/leaderboard-icon.jpg';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  eco_points: number;
  school_name: string | null;
  grade_level: string | null;
  achievements: string[];
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, eco_points, school_name, grade_level, achievements')
        .eq('role', 'student')
        .order('eco_points', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Trophy className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={leaderboardIcon} alt="Leaderboard" className="h-8 w-8 rounded-full" />
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Eco Champions Leaderboard
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Trophy className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-success/5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={leaderboardIcon} alt="Leaderboard" className="h-10 w-10 rounded-full shadow-lg" />
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Eco Champions Leaderboard
          </CardTitle>
        </div>
        <p className="text-muted-foreground">Top environmental champions by eco points earned</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {entries.map((entry, index) => {
            const rank = index + 1;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 p-4 border-b last:border-b-0 transition-all duration-200 hover:bg-muted/30 ${
                  rank <= 3 ? 'bg-gradient-to-r from-primary/5 to-success/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getRankBadgeColor(rank)} font-bold px-2 py-1`}>
                      #{rank}
                    </Badge>
                    {getRankIcon(rank)}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground truncate">
                      {entry.full_name}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {entry.school_name && (
                        <span className="truncate">{entry.school_name}</span>
                      )}
                      {entry.grade_level && entry.school_name && (
                        <span>•</span>
                      )}
                      {entry.grade_level && (
                        <span>Grade {entry.grade_level}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {entry.achievements && entry.achievements.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1">
                      {entry.achievements.slice(0, 3).map((achievement, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {achievement}
                        </Badge>
                      ))}
                      {entry.achievements.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{entry.achievements.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-success">
                      {entry.eco_points.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      eco points
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {entries.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No students found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Students will appear here as they earn eco points!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}