import apiClient from './apiClient';

export interface ClearanceRecord {
  id: number;
  student_id?: number;
  student_name: string;
  reg_number: string;
  program: string;
  faculty: string;
  department: string;
  department_status: 'approved' | 'pending' | 'rejected';
  library_status: 'approved' | 'pending' | 'rejected';
  finance_status: 'approved' | 'pending' | 'rejected';
  hostel_status: 'approved' | 'pending' | 'rejected';
  sports_status: 'approved' | 'pending' | 'rejected';
  dean_status: 'approved' | 'pending' | 'rejected';
  registry_status: 'approved' | 'pending' | 'rejected';
  outstanding_fee: number;
  remarks?: string;
  certificate_ready: boolean;
  updated_at?: string;
}

export const clearanceService = {
  async getMyClearance(): Promise<ClearanceRecord> {
    const res = await apiClient.get<ClearanceRecord>('/clearance/my');
    return res.data;
  },

  async listRecords(faculty?: string): Promise<ClearanceRecord[]> {
    const params = new URLSearchParams();
    if (faculty) params.append('faculty', faculty);
    const res = await apiClient.get<ClearanceRecord[]>(`/clearance/records?${params.toString()}`);
    return res.data;
  },

  async updateDepartmentStatus(
    recordId: number,
    department: string,
    statusVal: string
  ): Promise<ClearanceRecord> {
    const res = await apiClient.post<ClearanceRecord>(
      `/clearance/${recordId}/action?department=${department}&status_val=${statusVal}`
    );
    return res.data;
  },
};
