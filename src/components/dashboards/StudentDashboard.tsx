import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SubmissionDialog from '@/components/SubmissionDialog';
import EducationalContentDialog from '@/components/EducationalContentDialog';
import PostContent from '@/components/PostContent';
import { 
  Leaf, 
  Trophy, 
  BookOpen, 
  Video, 
  Gamepad2, 
  FileText, 
  Upload,
  LogOut,
  Star,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import Leaderboard from '@/components/Leaderboard';
import heroImage from '@/assets/education-hero.jpg';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  eco_points_reward: number;
  created_at: string;
}

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string | null;
  thumbnail_url: string | null;
  eco_points_reward: number;
  difficulty_level: string | null;
  tags: string[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export default function StudentDashboard() {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [educationalContent, setEducationalContent] = useState<EducationalContent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedContent, setSelectedContent] = useState<EducationalContent | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Fetch educational content
      const { data: contentData, error: contentError } = await supabase
        .from('educational_content')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (contentError) throw contentError;

      // Fetch organization posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_organization_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (postsError) throw postsError;

      setAssignments(assignmentsData || []);
      setEducationalContent(contentData || []);
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'game':
        return <Gamepad2 className="h-4 w-4" />;
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'quiz':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case 'beginner':
        return 'bg-success';
      case 'intermediate':
        return 'bg-warning';
      case 'advanced':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Leaf className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-success-muted/20">
      {/* Enhanced Hero Section */}
      <div 
        className="relative h-64 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-info/60" />
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-2">Welcome, {profile?.full_name}! 🌱</h1>
            <p className="text-lg opacity-90">Continue your environmental learning journey</p>
            <div className="flex items-center gap-2 mt-4 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full shadow-glow">
              <Trophy className="h-6 w-6 text-yellow-400 animate-pulse" />
              <span className="font-semibold text-yellow-400 text-lg">{profile?.eco_points || 0} Eco Points</span>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white border-white/30 hover:bg-white/20 backdrop-blur-sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Header */}
      <header className="border-b bg-gradient-card backdrop-blur-sm shadow-gentle">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-eco rounded-full shadow-eco">
                <Leaf className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-eco bg-clip-text text-transparent">Dashboard</h2>
                <p className="text-muted-foreground">Explore, Learn, and Earn Eco Points 🌟</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="learn" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/90 backdrop-blur-sm shadow-card p-1 rounded-xl">
            <TabsTrigger 
              value="learn" 
              className="data-[state=active]:bg-gradient-eco data-[state=active]:text-white transition-all rounded-lg"
            >
              🎓 Learn
            </TabsTrigger>
            <TabsTrigger 
              value="assignments" 
              className="data-[state=active]:bg-gradient-sky data-[state=active]:text-white transition-all rounded-lg"
            >
              📝 Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard" 
              className="data-[state=active]:bg-gradient-earth data-[state=active]:text-white transition-all rounded-lg"
            >
              🏆 Leaders
            </TabsTrigger>
            <TabsTrigger 
              value="announcements" 
              className="data-[state=active]:bg-gradient-sunset data-[state=active]:text-white transition-all rounded-lg"
            >
              📢 News
            </TabsTrigger>
            <TabsTrigger 
              value="progress" 
              className="data-[state=active]:bg-gradient-forest data-[state=active]:text-white transition-all rounded-lg"
            >
              📊 Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learn" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4 bg-gradient-eco bg-clip-text text-transparent">
                🎓 Educational Content
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {educationalContent.map((content) => (
                  <Card key={content.id} className="group hover:shadow-eco transition-all duration-300 hover:scale-[1.02] bg-gradient-card backdrop-blur-sm">
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      {content.thumbnail_url ? (
                        <img
                          src={content.thumbnail_url}
                          alt={content.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-eco flex items-center justify-center">
                          <div className="text-white text-4xl">
                            {getContentIcon(content.content_type)}
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="flex items-center gap-1 bg-white/90 backdrop-blur-sm">
                          {getContentIcon(content.content_type)}
                          {content.content_type}
                        </Badge>
                      </div>
                      {content.difficulty_level && (
                        <div className="absolute bottom-2 left-2">
                          <Badge className={`${getDifficultyColor(content.difficulty_level)} text-white shadow-gentle`}>
                            {content.difficulty_level}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground">{content.title}</CardTitle>
                      <CardDescription className="text-muted-foreground">{content.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          <div className="p-1 bg-gradient-eco rounded-full">
                            <Star className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-success">{content.eco_points_reward} points</span>
                        </div>
                        <Button 
                          className="bg-gradient-eco hover:shadow-eco text-white transition-all"
                          size="sm"
                          onClick={() => setSelectedContent(content)}
                        >
                          Start Learning 🚀
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4 bg-gradient-sky bg-clip-text text-transparent">
                📝 Your Assignments
              </h2>
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="bg-gradient-card hover:shadow-eco transition-all hover:scale-[1.01]">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-foreground">{assignment.title}</CardTitle>
                          <CardDescription className="mt-2 text-muted-foreground">
                            {assignment.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.due_date && (
                            <Badge variant="outline" className="flex items-center gap-1 border-warning/30 text-warning">
                              <Clock className="h-3 w-3" />
                              Due {format(new Date(assignment.due_date), 'MMM dd')}
                            </Badge>
                          )}
                          <Badge className="bg-gradient-eco text-white shadow-gentle">
                            🏆 {assignment.eco_points_reward} points
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                        <Button 
                          className="bg-gradient-sky hover:shadow-eco text-white transition-all flex items-center gap-2"
                          onClick={() => setSelectedAssignment(assignment)}
                        >
                          <Upload className="h-4 w-4" />
                          Submit Assignment 📤
                        </Button>
                    </CardContent>
                  </Card>
                ))}
                {assignments.length === 0 && (
                  <Card className="bg-gradient-sky/10 border-info/30">
                    <CardContent className="text-center py-12">
                      <div className="p-4 bg-gradient-sky rounded-full w-fit mx-auto mb-4">
                        <BookOpen className="h-12 w-12 text-white" />
                      </div>
                      <p className="text-lg font-semibold text-info mb-2">No assignments available yet</p>
                      <p className="text-muted-foreground">Check back later for exciting eco-challenges! 🌟</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Eco Champions</h2>
              </div>
              <Leaderboard />
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Latest Announcements</h2>
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <CardTitle>{post.title}</CardTitle>
                      <CardDescription>
                        By {post.profiles?.full_name} • {format(new Date(post.created_at), 'MMM dd, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PostContent content={post.content} />
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="mt-4 rounded-lg max-w-full h-auto"
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
                {posts.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No announcements yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-success" />
                      Eco Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-success mb-2">
                      {profile?.eco_points}
                    </div>
                    <Progress value={(profile?.eco_points || 0) % 100} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {100 - ((profile?.eco_points || 0) % 100)} points to next level
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-warning" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-warning mb-2">
                      {profile?.achievements?.length || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Badges earned so far
                    </p>
                    {profile?.achievements && profile.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {profile.achievements.map((achievement, index) => (
                          <Badge key={index} variant="secondary">
                            {achievement}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialogs */}
      {selectedAssignment && (
        <SubmissionDialog
          assignment={selectedAssignment}
          open={!!selectedAssignment}
          onOpenChange={(open) => !open && setSelectedAssignment(null)}
          onSubmissionComplete={fetchData}
        />
      )}
      
      {selectedContent && (
        <EducationalContentDialog
          content={selectedContent}
          open={!!selectedContent}
          onOpenChange={(open) => !open && setSelectedContent(null)}
          onContentComplete={fetchData}
        />
      )}
    </div>
  );
}