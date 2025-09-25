import { useAuth } from '@/hooks/useAuth';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import TeacherDashboard from '@/components/dashboards/TeacherDashboard';
import OrganizationDashboard from '@/components/dashboards/OrganizationDashboard';

export default function Dashboard() {
  const { profile } = useAuth();

  if (!profile) {
    return null;
  }

  switch (profile.role) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'organization':
      return <OrganizationDashboard />;
    default:
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p>Invalid user role</p>
        </div>
      );
  }
}