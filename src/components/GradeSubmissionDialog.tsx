import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, X } from 'lucide-react';

interface Submission {
  id: string;
  content: string;
  submitted_at: string;
  grade: string | null;
  student_id: string;
  assignment_id: string;
  eco_points_earned: number;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  eco_points_reward: number;
}

interface GradeSubmissionDialogProps {
  submission: Submission;
  assignment: Assignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGradeComplete: () => void;
}

export default function GradeSubmissionDialog({ 
  submission, 
  assignment,
  open, 
  onOpenChange, 
  onGradeComplete 
}: GradeSubmissionDialogProps) {
  const { toast } = useToast();
  const [grading, setGrading] = useState(false);

  const handleGradeSubmission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGrading(true);

    const formData = new FormData(e.currentTarget);
    const grade = formData.get('grade') as string;
    const feedback = formData.get('feedback') as string;
    const ecoPointsEarned = parseInt(formData.get('eco_points_earned') as string);

    try {
      // Update submission with grade and feedback
      const { error: submissionError } = await supabase
        .from('submissions')
        .update({
          grade,
          teacher_feedback: feedback,
          eco_points_earned: ecoPointsEarned,
        })
        .eq('id', submission.id);

      if (submissionError) throw submissionError;

      // Update student's total eco points
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('eco_points')
        .eq('user_id', submission.student_id)
        .single();

      if (profileError) throw profileError;

      const newEcoPoints = (currentProfile.eco_points || 0) + ecoPointsEarned;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ eco_points: newEcoPoints })
        .eq('user_id', submission.student_id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Submission graded successfully! Student awarded ${ecoPointsEarned} eco points.`,
      });

      onOpenChange(false);
      onGradeComplete();
    } catch (error) {
      console.error('Error grading submission:', error);
      toast({
        title: "Error",
        description: "Failed to grade submission. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGrading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Grade Submission
          </DialogTitle>
          <DialogDescription>
            Review and grade {submission.profiles?.full_name}'s submission for "{assignment.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Student Submission */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Student Response:</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {submission.content}
            </p>
          </div>

          {/* Grading Form */}
          <form onSubmit={handleGradeSubmission} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grade">Grade *</Label>
                <Select name="grade" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+ (Excellent)</SelectItem>
                    <SelectItem value="A">A (Very Good)</SelectItem>
                    <SelectItem value="B+">B+ (Good)</SelectItem>
                    <SelectItem value="B">B (Satisfactory)</SelectItem>
                    <SelectItem value="C+">C+ (Average)</SelectItem>
                    <SelectItem value="C">C (Below Average)</SelectItem>
                    <SelectItem value="D">D (Poor)</SelectItem>
                    <SelectItem value="F">F (Fail)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="eco_points_earned">Eco Points to Award *</Label>
                <Input
                  id="eco_points_earned"
                  name="eco_points_earned"
                  type="number"
                  min="0"
                  max={assignment.eco_points_reward}
                  defaultValue={assignment.eco_points_reward}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max: {assignment.eco_points_reward} points
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="feedback">Teacher Feedback</Label>
              <Textarea
                id="feedback"
                name="feedback"
                placeholder="Provide constructive feedback to help the student improve..."
                rows={4}
              />
            </div>
            
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="h-4 w-4" />
                <span className="font-semibold">Grading Impact</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                This grade will be visible to the student and eco points will be added to their total score.
              </p>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" variant="eco" disabled={grading} className="flex-1">
                {grading ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                    Grading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Grade
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}