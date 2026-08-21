import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StudentPortalView from '../components/StudentPortalView';
import { MemoryRouter } from 'react-router-dom';

// Mock ticket service
vi.mock('../services/ticketService', () => ({
  ticketService: {
    listTickets: vi.fn().mockResolvedValue({ tickets: [], total: 0, page: 1, per_page: 9, total_pages: 1 }),
  },
}));

describe('StudentPortalView form validation bodyguard', () => {
  const mockUser = {
    id: 1,
    name: 'Emily Wanjiru Kamau',
    email: 'emily.wanjiru@student.uonbi.ac.ke',
    reg_number: 'CS/45231/2022',
    faculty: 'Faculty of Science & Technology',
    department: 'Department of Computer Science',
  };

  it('renders the multi-step bodyguard checklist on first step', async () => {
    render(
      <MemoryRouter>
        <StudentPortalView user={mockUser} />
      </MemoryRouter>
    );

    // Switch to new-claim tab
    const newClaimBtn = screen.getAllByRole('button', { name: /New Claim Ticket/i })[0];
    fireEvent.click(newClaimBtn);

    // Verify bodyguard checklist heading is visible
    expect(screen.getByText(/Academic Integrity Disclaimer & Bodyguard Checklist/i)).toBeInTheDocument();

    // Verify requirements labels are present
    expect(screen.getByText(/I physically sat for the final exam/i)).toBeInTheDocument();
    expect(screen.getByText(/I completed all CATs and course assignments/i)).toBeInTheDocument();
    
    // Clicking next should trigger validation warning and remain on the checklist page
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);
    
    // Verify we are still on the checklist page
    expect(screen.getByText(/Academic Integrity Disclaimer & Bodyguard Checklist/i)).toBeInTheDocument();
  });
});
