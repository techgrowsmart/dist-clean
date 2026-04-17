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
  teacher31: {
    email: 'teacher31@example.com',
    password: 'test123',
    name: 'Test Teacher 31',
    role: 'teacher',
    id: 'test-teacher-031',
    phone: '+919876543212',
    subjects: ['Physics', 'Chemistry'],
    experience: '7 years',
    qualification: 'M.Sc. Physics'
  },
  teacher56: {
    email: 'teacher56@example.com', 
    password: 'test123',
    name: 'Test Teacher 56',
    role: 'teacher',
    id: 'test-teacher-056',
    phone: '+919876543211',
    subjects: ['Mathematics', 'Science'],
    experience: '5 years',
    qualification: 'M.Sc. Mathematics'
  }
};

export const isTestUser = (email: string) => {
  return email === TEST_USERS.student.email || 
         email === TEST_USERS.teacher31.email || 
         email === TEST_USERS.teacher56.email;
};

export const getTestUser = (email: string) => {
  if (email === TEST_USERS.student.email) return TEST_USERS.student;
  if (email === TEST_USERS.teacher31.email) return TEST_USERS.teacher31;
  if (email === TEST_USERS.teacher56.email) return TEST_USERS.teacher56;
  return null;
};
