import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PostContent from '@/components/PostContent';
import { 
  Leaf, 
  Users, 
  FileText, 
  Plus,
  LogOut,
  Send,
  TrendingUp,
  Award,
  Target,
  Trophy
} from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';
import heroImage from '@/assets/education-hero.jpg';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  is_featured: boolean;
  created_at: string;
}

interface Report {
  id: string;
  title: string;
  content: string;
  report_data: any;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalAssignments: number;
  totalPosts: number;
}

export default function OrganizationDashboard() {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalAssignments: 0,
    totalPosts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('organization_id', profile?.user_id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          profiles!reports_teacher_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      const [studentsRes, teachersRes, assignmentsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'teacher'),
        supabase.from('assignments').select('id', { count: 'exact' }),
      ]);

      setPosts(postsData || []);
      setReports(reportsData || []);
      setStats({
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        totalAssignments: assignmentsRes.count || 0,
        totalPosts: postsData?.length || 0,
      });
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

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      image_url: formData.get('image_url') as string,
      is_featured: formData.get('is_featured') === 'on',
    };

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          ...data,
          organization_id: profile?.user_id,
          image_url: data.image_url || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post created successfully",
      });

      setShowCreatePost(false);
      fetchData();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
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
      {/* Hero Section */}
      <div 
        className="relative h-48 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-green-700/60" />
        <div className="relative container mx-auto px-4 h-full flex items-center justify-between">
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-2">Organization Dashboard</h1>
            <p className="text-lg opacity-90">Welcome, {profile?.full_name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white border-white/20 hover:bg-white/10">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Enrolled in the platform</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
              <p className="text-xs text-muted-foreground">Active educators</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssignments}</div>
              <p className="text-xs text-muted-foreground">Created by teachers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Posts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">Announcements shared</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Posts & Announcements</h2>
              <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                <DialogTrigger asChild>
                  <Button variant="eco">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                    <DialogDescription>
                      Share updates and announcements with students and teachers
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <div>
                      <Label htmlFor="post-title">Post Title</Label>
                      <Input
                        id="post-title"
                        name="title"
                        placeholder="e.g., New Environmental Initiative Launch"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="post-content">Content</Label>
                      <Textarea
                        id="post-content"
                        name="content"
                        placeholder="Write your announcement or update..."
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="post-image">Image URL (Optional)</Label>
                      <Input
                        id="post-image"
                        name="image_url"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_featured"
                        name="is_featured"
                        className="rounded"
                      />
                      <Label htmlFor="is_featured">Featured Post</Label>
                    </div>
                    <Button type="submit" variant="eco" className="w-full">
                      Create Post
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className={post.is_featured ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{post.title}</CardTitle>
                          {post.is_featured && (
                            <Badge className="bg-warning">Featured</Badge>
                          )}
                        </div>
                        <CardDescription>
                          Published {format(new Date(post.created_at), 'MMM dd, yyyy')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PostContent content={post.content} />
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="mt-4 rounded-lg max-w-full h-auto max-h-48 object-cover"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Teacher Reports</h2>
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription>
                        From {report.profiles?.full_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{report.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Student Leaderboard</h2>
              </div>
              <Leaderboard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}