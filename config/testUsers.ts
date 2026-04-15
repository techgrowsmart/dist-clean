// Test Users Configuration for Gogrowsmart Portal
export const TEST_USERS = {
  student: {
    email: 'student1@example.com',
    password: 'test123',
    name: 'Test Student',
    role: 'student',
    id: 'test-student-001',
    phone: '+919876543210',
    enrolledSubjects: ['Mathematics', 'Science', 'English'],
    grade: '10th'
  },
  teacher: {
    email: 'teacher56@example.com', 
    password: 'test123',
    name: 'Test Teacher',
    role: 'teacher',
    id: 'test-teacher-001',
    phone: '+919876543211',
    subjects: ['Mathematics', 'Science'],
    experience: '5 years',
    qualification: 'M.Sc. Mathematics'
  }
};

export const isTestUser = (email: string) => {
  return email === TEST_USERS.student.email || email === TEST_USERS.teacher.email;
};

export const getTestUser = (email: string) => {
  if (email === TEST_USERS.student.email) return TEST_USERS.student;
  if (email === TEST_USERS.teacher.email) return TEST_USERS.teacher;
  return null;
};
