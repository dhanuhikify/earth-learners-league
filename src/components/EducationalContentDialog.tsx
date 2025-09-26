import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, 
  Gamepad2, 
  FileText, 
  BookOpen, 
  Star, 
  ExternalLink,
  Play,
  Trophy
} from 'lucide-react';

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

interface EducationalContentDialogProps {
  content: EducationalContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContentComplete: () => void;
}

export default function EducationalContentDialog({ 
  content, 
  open, 
  onOpenChange, 
  onContentComplete 
}: EducationalContentDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [completing, setCompleting] = useState(false);

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'game':
        return <Gamepad2 className="h-5 w-5" />;
      case 'article':
        return <FileText className="h-5 w-5" />;
      case 'quiz':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case 'beginner':
        return 'bg-success text-success-foreground';
      case 'intermediate':
        return 'bg-warning text-warning-foreground';
      case 'advanced':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleComplete = async () => {
    setCompleting(true);

    try {
      // Update user's eco points
      if (profile?.user_id) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            eco_points: (profile.eco_points || 0) + content.eco_points_reward 
          })
          .eq('user_id', profile.user_id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Congratulations!",
        description: `You completed "${content.title}" and earned ${content.eco_points_reward} eco points!`,
      });

      onOpenChange(false);
      onContentComplete();
    } catch (error) {
      console.error('Error completing content:', error);
      toast({
        title: "Error",
        description: "Failed to complete content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  const openExternalContent = () => {
    if (content.content_url) {
      window.open(content.content_url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getContentIcon(content.content_type)}
            <div>
              <DialogTitle className="text-xl">{content.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {getContentIcon(content.content_type)}
                  {content.content_type}
                </Badge>
                {content.difficulty_level && (
                  <Badge className={getDifficultyColor(content.difficulty_level)}>
                    {content.difficulty_level}
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Thumbnail */}
          {content.thumbnail_url && (
            <div className="aspect-video relative overflow-hidden rounded-lg">
              <img
                src={content.thumbnail_url}
                alt={content.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.description}
            </p>
          </div>
          
          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {content.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Reward Info */}
          <div className="bg-gradient-eco p-4 rounded-lg">
            <div className="flex items-center gap-2 text-primary-foreground">
              <Star className="h-5 w-5" />
              <span className="font-semibold">Complete to earn {content.eco_points_reward} Eco Points</span>
            </div>
          </div>
          
          {/* Content-specific actions */}
          <div className="space-y-4">
            {content.content_type === 'video' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Watch the environmental video to learn and earn points
                </p>
                {content.content_url ? (
                  <Button onClick={openExternalContent} variant="eco" size="lg">
                    <Play className="h-5 w-5 mr-2" />
                    Watch Video
                  </Button>
                ) : (
                  <div className="bg-muted p-8 rounded-lg">
                    <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Video content coming soon...</p>
                  </div>
                )}
              </div>
            )}
            
            {content.content_type === 'game' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Play the environmental awareness game
                </p>
                {content.content_url ? (
                  <Button onClick={openExternalContent} variant="eco" size="lg">
                    <Gamepad2 className="h-5 w-5 mr-2" />
                    Start Game
                  </Button>
                ) : (
                  <div className="bg-muted p-8 rounded-lg">
                    <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Game content coming soon...</p>
                  </div>
                )}
              </div>
            )}
            
            {content.content_type === 'article' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Read the environmental article
                </p>
                {content.content_url ? (
                  <Button onClick={openExternalContent} variant="eco" size="lg">
                    <FileText className="h-5 w-5 mr-2" />
                    Read Article
                  </Button>
                ) : (
                  <div className="bg-muted p-8 rounded-lg">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Article content coming soon...</p>
                  </div>
                )}
              </div>
            )}
            
            {content.content_type === 'quiz' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Take the environmental knowledge quiz
                </p>
                {content.content_url ? (
                  <Button onClick={openExternalContent} variant="eco" size="lg">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Start Quiz
                  </Button>
                ) : (
                  <div className="bg-muted p-8 rounded-lg">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Quiz content coming soon...</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {content.content_url && (
              <Button onClick={openExternalContent} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            )}
            <Button 
              onClick={handleComplete} 
              variant="eco" 
              disabled={completing}
              className="flex-1"
            >
              {completing ? (
                <>
                  <Trophy className="h-4 w-4 mr-2 animate-pulse" />
                  Completing...
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4 mr-2" />
                  Mark as Complete
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}