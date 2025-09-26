import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Send } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  eco_points_reward: number;
}

interface SubmissionDialogProps {
  assignment: Assignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmissionComplete: () => void;
}

export default function SubmissionDialog({ 
  assignment, 
  open, 
  onOpenChange, 
  onSubmissionComplete 
}: SubmissionDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      content: formData.get('content') as string,
      file_url: formData.get('file_url') as string,
    };

    try {
      const { error } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignment.id,
          student_id: profile?.user_id,
          content: data.content,
          file_url: data.file_url || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Assignment submitted successfully! You earned ${assignment.eco_points_reward} eco points.`,
      });

      // Update user's eco points
      if (profile?.user_id) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            eco_points: (profile.eco_points || 0) + assignment.eco_points_reward 
          })
          .eq('user_id', profile.user_id);

        if (updateError) {
          console.error('Error updating eco points:', updateError);
        }
      }

      onOpenChange(false);
      onSubmissionComplete();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Assignment: {assignment.title}</DialogTitle>
          <DialogDescription>
            {assignment.description}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="content">Assignment Response *</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Write your response, observations, and learnings here..."
              rows={6}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="file_url">Supporting File/Image URL (Optional)</Label>
            <Input
              id="file_url"
              name="file_url"
              type="url"
              placeholder="https://example.com/your-project-image.jpg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload your files to any cloud service and paste the link here
            </p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 text-success">
              <Send className="h-4 w-4" />
              <span className="font-semibold">Reward: {assignment.eco_points_reward} Eco Points</span>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="eco" disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Assignment
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}