import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Leaf, Users, GraduationCap, Building2, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Leaf className="h-12 w-12 text-primary-foreground" />
            <h1 className="text-5xl font-bold text-primary-foreground">
              Earth Learners League
            </h1>
          </div>
          
          <p className="text-xl text-primary-foreground/90 mb-12 leading-relaxed">
            Gamified environmental education platform connecting students, teachers, and organizations 
            for a sustainable future through interactive learning and real-world impact.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-card/20 backdrop-blur-sm rounded-xl">
              <GraduationCap className="h-12 w-12 text-primary-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-primary-foreground mb-2">Students</h3>
              <p className="text-primary-foreground/80 text-sm">
                Learn through videos, games, and challenges. Earn eco-points and compete with peers.
              </p>
            </div>
            
            <div className="text-center p-6 bg-card/20 backdrop-blur-sm rounded-xl">
              <Users className="h-12 w-12 text-primary-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-primary-foreground mb-2">Teachers</h3>
              <p className="text-primary-foreground/80 text-sm">
                Create assignments, track student progress, and submit reports to organizations.
              </p>
            </div>
            
            <div className="text-center p-6 bg-card/20 backdrop-blur-sm rounded-xl">
              <Building2 className="h-12 w-12 text-primary-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-primary-foreground mb-2">Organizations</h3>
              <p className="text-primary-foreground/80 text-sm">
                Share updates, announcements, and monitor educational impact across schools.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              variant="hero" 
              size="xl" 
              onClick={() => navigate('/auth')}
              className="mr-4"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
