-- Create storage bucket for student submissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('submissions', 'submissions', false);

-- Create storage policies for submissions
CREATE POLICY "Students can upload their own submission files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can view their own submission files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Teachers can view submission files for their assignments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'submissions' AND 
  EXISTS (
    SELECT 1 FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    WHERE a.teacher_id = auth.uid()
    AND s.file_url LIKE '%' || (storage.foldername(name))[2] || '%'
  )
);