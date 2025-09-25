import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Leaf className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name}!</h1>
                <p className="text-muted-foreground">Ready to learn and save the planet?</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gradient-eco px-3 py-1 rounded-full">
                <Trophy className="h-4 w-4 text-primary-foreground" />
                <span className="text-sm font-semibold text-primary-foreground">
                  {profile?.eco_points} Eco Points
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="learn" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="learn">Learn</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="learn" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Educational Content</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {educationalContent.map((content) => (
                  <Card key={content.id} className="group hover:shadow-gentle transition-all duration-300">
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      {content.thumbnail_url ? (
                        <img
                          src={content.thumbnail_url}
                          alt={content.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-eco flex items-center justify-center">
                          {getContentIcon(content.content_type)}
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {getContentIcon(content.content_type)}
                          {content.content_type}
                        </Badge>
                      </div>
                      {content.difficulty_level && (
                        <div className="absolute bottom-2 left-2">
                          <Badge className={getDifficultyColor(content.difficulty_level)}>
                            {content.difficulty_level}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{content.title}</CardTitle>
                      <CardDescription>{content.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-success">
                          <Star className="h-4 w-4" />
                          {content.eco_points_reward} points
                        </div>
                        <Button variant="eco" size="sm">
                          Start Learning
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
              <h2 className="text-2xl font-bold mb-4">Assignments</h2>
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{assignment.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {assignment.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.due_date && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due {format(new Date(assignment.due_date), 'MMM dd')}
                            </Badge>
                          )}
                          <Badge className="bg-success">
                            {assignment.eco_points_reward} points
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Submit Assignment
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {assignments.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No assignments available yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
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
                      <p className="text-sm">{post.content}</p>
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
    </div>
  );
}