import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Report {
  id: string;
  postId: string;
  postContent: string;
  postAuthor: {
    email: string;
    name: string;
    role: string;
    profile_pic: string;
  };
  reportedBy: string;
  reasons: string[];
  additionalComment?: string;
  reportType: string;
  timestamp: string;
  status: 'pending_review' | 'reviewed' | 'resolved' | 'dismissed';
}

const REPORTS_KEY = 'gogrowsmart_reports';

/**
 * Get all stored reports from AsyncStorage
 * Use this in a developer dashboard or admin panel to view reports
 */
export const getAllReports = async (): Promise<Report[]> => {
  try {
    const reportsJson = await AsyncStorage.getItem(REPORTS_KEY);
    return reportsJson ? JSON.parse(reportsJson) : [];
  } catch (error) {
    console.error('Failed to get reports:', error);
    return [];
  }
};

/**
 * Get reports by status
 */
export const getReportsByStatus = async (status: Report['status']): Promise<Report[]> => {
  try {
    const allReports = await getAllReports();
    return allReports.filter(report => report.status === status);
  } catch (error) {
    console.error('Failed to get reports by status:', error);
    return [];
  }
};

/**
 * Update report status
 */
export const updateReportStatus = async (
  reportId: string,
  newStatus: Report['status']
): Promise<boolean> => {
  try {
    const allReports = await getAllReports();
    const updatedReports = allReports.map(report =>
      report.id === reportId ? { ...report, status: newStatus } : report
    );
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(updatedReports));
    console.log(`Report ${reportId} status updated to ${newStatus}`);
    return true;
  } catch (error) {
    console.error('Failed to update report status:', error);
    return false;
  }
};

/**
 * Delete a specific report
 */
export const deleteReport = async (reportId: string): Promise<boolean> => {
  try {
    const allReports = await getAllReports();
    const filteredReports = allReports.filter(report => report.id !== reportId);
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(filteredReports));
    console.log(`Report ${reportId} deleted`);
    return true;
  } catch (error) {
    console.error('Failed to delete report:', error);
    return false;
  }
};

/**
 * Clear all reports (use with caution - for development/testing only)
 */
export const clearAllReports = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(REPORTS_KEY);
    console.log('All reports cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear reports:', error);
    return false;
  }
};

/**
 * Get report statistics
 */
export const getReportStats = async () => {
  try {
    const allReports = await getAllReports();
    return {
      total: allReports.length,
      pending: allReports.filter(r => r.status === 'pending_review').length,
      reviewed: allReports.filter(r => r.status === 'reviewed').length,
      resolved: allReports.filter(r => r.status === 'resolved').length,
      dismissed: allReports.filter(r => r.status === 'dismissed').length,
    };
  } catch (error) {
    console.error('Failed to get report stats:', error);
    return { total: 0, pending: 0, reviewed: 0, resolved: 0, dismissed: 0 };
  }
};

/**
 * Debug function to log all reports to console
 * Call this from any component to see all stored reports
 */
export const logAllReports = async () => {
  const reports = await getAllReports();
  console.log('===== STORED REPORTS =====');
  console.log(JSON.stringify(reports, null, 2));
  console.log('=========================');
  return reports;
};
