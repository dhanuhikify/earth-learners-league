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
import { 
  Leaf, 
  Users, 
  FileText, 
  Plus,
  LogOut,
  Calendar,
  CheckCircle,
  Clock,
  Send
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

interface Submission {
  id: string;
  content: string;
  submitted_at: string;
  grade: string | null;
  student_id: string;
  assignment_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface StudentProfile {
  user_id: string;
  full_name: string;
  email: string;
  eco_points: number;
  school_name: string | null;
  grade_level: string | null;
}

export default function TeacherDashboard() {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showCreateReport, setShowCreateReport] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch teacher's assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('teacher_id', profile?.user_id)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Fetch submissions for teacher's assignments
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles!submissions_student_id_fkey(full_name, email)
        `)
        .in('assignment_id', assignmentsData?.map(a => a.id) || [])
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Fetch student profiles
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, eco_points, school_name, grade_level')
        .eq('role', 'student')
        .order('full_name');

      if (studentsError) throw studentsError;

      setAssignments(assignmentsData || []);
      setSubmissions(submissionsData || []);
      setStudents(studentsData || []);
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

  const handleCreateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      due_date: formData.get('due_date') as string,
      eco_points_reward: parseInt(formData.get('eco_points_reward') as string),
    };

    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          ...data,
          teacher_id: profile?.user_id,
          due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment created successfully",
      });

      setShowCreateAssignment(false);
      fetchData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
      });
    }
  };

  const handleCreateReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
    };

    try {
      // Calculate report data
      const reportData = {
        totalAssignments: assignments.length,
        totalSubmissions: submissions.length,
        totalStudents: students.length,
        averagePoints: students.reduce((sum, s) => sum + s.eco_points, 0) / students.length || 0,
      };

      const { error } = await supabase
        .from('reports')
        .insert({
          ...data,
          teacher_id: profile?.user_id,
          report_data: reportData,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report submitted successfully",
      });

      setShowCreateReport(false);
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report",
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
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Leaf className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
                <p className="text-muted-foreground">Welcome, {profile?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Report to Organizations</DialogTitle>
                    <DialogDescription>
                      Create a report about student progress and environmental activities
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateReport} className="space-y-4">
                    <div>
                      <Label htmlFor="report-title">Report Title</Label>
                      <Input
                        id="report-title"
                        name="title"
                        placeholder="e.g., Monthly Environmental Progress Report"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="report-content">Report Content</Label>
                      <Textarea
                        id="report-content"
                        name="content"
                        placeholder="Describe student progress, achievements, and environmental activities..."
                        rows={6}
                        required
                      />
                    </div>
                    <Button type="submit" variant="eco" className="w-full">
                      Submit Report
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="assignments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Assignments</h2>
              <Dialog open={showCreateAssignment} onOpenChange={setShowCreateAssignment}>
                <DialogTrigger asChild>
                  <Button variant="eco">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                      Create an environmental learning assignment for your students
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAssignment} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Assignment Title</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="e.g., Water Conservation Project"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe the assignment requirements..."
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="due_date">Due Date (Optional)</Label>
                      <Input
                        id="due_date"
                        name="due_date"
                        type="datetime-local"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eco_points_reward">Eco Points Reward</Label>
                      <Input
                        id="eco_points_reward"
                        name="eco_points_reward"
                        type="number"
                        min="1"
                        defaultValue="10"
                        required
                      />
                    </div>
                    <Button type="submit" variant="eco" className="w-full">
                      Create Assignment
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

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
                            <Calendar className="h-3 w-3" />
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
                    <p className="text-sm text-muted-foreground">
                      Created {format(new Date(assignment.created_at), 'MMM dd, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {assignments.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No assignments created yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your first assignment to get started!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Student Submissions</h2>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {submission.profiles?.full_name}
                          </CardTitle>
                          <CardDescription>
                            {submission.profiles?.email}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(submission.submitted_at), 'MMM dd')}
                          </Badge>
                          {submission.grade ? (
                            <Badge className="bg-success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Graded
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending Review</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{submission.content}</p>
                      {!submission.grade && (
                        <Button variant="outline" size="sm">
                          Grade Submission
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {submissions.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No submissions yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Student Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                  <Card key={student.user_id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{student.full_name}</CardTitle>
                      <CardDescription>{student.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Eco Points</span>
                          <Badge className="bg-success">{student.eco_points}</Badge>
                        </div>
                        {student.school_name && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">School</span>
                            <span className="text-sm">{student.school_name}</span>
                          </div>
                        )}
                        {student.grade_level && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Grade</span>
                            <span className="text-sm">{student.grade_level}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {students.length === 0 && (
                  <Card className="col-span-full">
                    <CardContent className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No students found.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}