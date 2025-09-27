import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Send, FileImage, X } from 'lucide-react';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!profile?.user_id) return null;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('submissions')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;

    try {
      let fileUrl: string | null = null;
      
      // Upload file if selected
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        if (!fileUrl) {
          setSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignment.id,
          student_id: profile?.user_id,
          content,
          file_url: fileUrl,
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

      // Reset form
      setSelectedFile(null);
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
            <Label htmlFor="file-upload">Attach File or Image (Optional)</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-input')?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  <FileImage className="h-4 w-4" />
                  Choose File
                </Button>
                <Input
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
                    <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: Images, PDF, Word documents, Text files (Max 10MB)
              </p>
            </div>
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
            <Button type="submit" variant="eco" disabled={submitting || uploading} className="flex-1">
              {submitting || uploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? 'Uploading...' : 'Submitting...'}
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