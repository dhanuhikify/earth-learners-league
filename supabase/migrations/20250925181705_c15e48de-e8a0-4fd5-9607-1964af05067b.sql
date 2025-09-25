-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'organization')),
  avatar_url TEXT,
  school_name TEXT,
  grade_level TEXT,
  eco_points INTEGER DEFAULT 0,
  achievements TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  eco_points_reward INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  grade TEXT,
  teacher_feedback TEXT,
  eco_points_earned INTEGER DEFAULT 0,
  UNIQUE(assignment_id, student_id)
);

-- Create posts table for organization announcements
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table for teacher reports to organizations
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  report_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create educational content table
CREATE TABLE public.educational_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'game', 'article', 'quiz')),
  content_url TEXT,
  thumbnail_url TEXT,
  eco_points_reward INTEGER DEFAULT 5,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Assignments policies
CREATE POLICY "Everyone can view assignments" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Teachers can create assignments" ON public.assignments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can update their own assignments" ON public.assignments FOR UPDATE USING (
  teacher_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'teacher')
);

-- Submissions policies
CREATE POLICY "Students can view their own submissions" ON public.submissions FOR SELECT USING (
  student_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.assignments WHERE id = assignment_id AND teacher_id = auth.uid())
);
CREATE POLICY "Students can create submissions" ON public.submissions FOR INSERT WITH CHECK (
  student_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'student')
);
CREATE POLICY "Students can update their own submissions" ON public.submissions FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "Teachers can update submissions for their assignments" ON public.submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.assignments WHERE id = assignment_id AND teacher_id = auth.uid())
);

-- Posts policies
CREATE POLICY "Everyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Organizations can create posts" ON public.posts FOR INSERT WITH CHECK (
  organization_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'organization')
);
CREATE POLICY "Organizations can update their own posts" ON public.posts FOR UPDATE USING (organization_id = auth.uid());

-- Reports policies
CREATE POLICY "Teachers and organizations can view reports" ON public.reports FOR SELECT USING (
  teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'organization')
);
CREATE POLICY "Teachers can create reports" ON public.reports FOR INSERT WITH CHECK (
  teacher_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'teacher')
);

-- Educational content policies
CREATE POLICY "Everyone can view active educational content" ON public.educational_content FOR SELECT USING (is_active = true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample educational content
INSERT INTO public.educational_content (title, description, content_type, content_url, thumbnail_url, eco_points_reward, difficulty_level, tags) VALUES
('Climate Change Basics', 'Learn about the fundamental concepts of climate change and its impact on our planet', 'video', 'https://www.youtube.com/embed/dcBXMhfaHaM', 'https://images.unsplash.com/photo-1569163139202-de2ff7929d8c?w=400', 10, 'beginner', ARRAY['climate', 'environment', 'basics']),
('Renewable Energy Quiz', 'Test your knowledge about different types of renewable energy sources', 'quiz', '/quiz/renewable-energy', 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400', 15, 'intermediate', ARRAY['energy', 'renewable', 'quiz']),
('Eco Warriors Game', 'Interactive game where you make eco-friendly choices and see their impact', 'game', '/games/eco-warriors', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', 20, 'beginner', ARRAY['game', 'interactive', 'choices']),
('Water Conservation Guide', 'Comprehensive guide on water conservation techniques for schools and homes', 'article', '/articles/water-conservation', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400', 12, 'intermediate', ARRAY['water', 'conservation', 'guide']);