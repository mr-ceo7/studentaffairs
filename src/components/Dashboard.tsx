import { useState, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import GatewayView from './GatewayView';
import StudentPortalView from './StudentPortalView';
import LecturerPortalView from './LecturerPortalView';
import AdminPortalView from './AdminPortalView';
import TicketDetailModal from './TicketDetailModal';

interface DashboardProps {
  onShowPricing: () => void;
  onShowAuth?: (email?: string, role?: 'student' | 'lecturer' | 'admin') => void;
}

export default function Dashboard({ onShowPricing, onShowAuth }: DashboardProps) {
  const { user } = useUser();
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleTicketClick = useCallback((ticketId: string) => {
    setActiveTicketId(ticketId);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setActiveTicketId(null);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  const triggerAuth = (email?: string, role?: 'student' | 'lecturer' | 'admin') => {
    if (onShowAuth) {
      onShowAuth(email, role);
    } else {
      onShowPricing();
    }
  };

  // If user is not logged in, render the Faculty Gateway
  if (!user) {
    return (
      <main className="pt-2 px-4 md:px-0 relative z-10 space-y-6 flex-1">
        <GatewayView onShowAuth={triggerAuth} />
      </main>
    );
  }

  // Determine portal to render based on email domain and admin flag
  const isStudent = !user.email.endsWith('@uonbi.ac.ke') && !user.is_admin;
  const isAdmin = user.is_admin;

  return (
    <main className="pt-2 px-4 md:px-0 relative z-10 space-y-6 flex-1">
      {isAdmin ? (
        <AdminPortalView 
          key={`admin-${refreshCounter}`}
          user={user} 
          onTicketClick={handleTicketClick} 
        />
      ) : isStudent ? (
        <StudentPortalView 
          key={`student-${refreshCounter}`}
          user={user} 
          onTicketClick={handleTicketClick} 
        />
      ) : (
        <LecturerPortalView 
          key={`lecturer-${refreshCounter}`}
          user={user} 
          onTicketClick={handleTicketClick} 
        />
      )}

      {/* Ticket Details Inspector Modal */}
      {activeTicketId && (
        <TicketDetailModal
          ticketId={activeTicketId}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onRefresh={handleRefresh}
        />
      )}
    </main>
  );
}
