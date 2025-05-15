import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// User services
export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getUsersByRole: async (role) => {
    const response = await api.get(`/users/role/${role}`);
    return response.data;
  },
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  }
};

// Course services
export const courseService = {
  getAllCourses: async () => {
    const response = await api.get('/courses');
    return response.data;
  },
  getCourseById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },
  createCourse: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },
  updateCourse: async (id, courseData) => {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
  },
  getAllDepartments: async () => {
    const response = await api.get('/courses/departments/all');
    return response.data;
  }
};

// Class services
export const classService = {
  getAllClasses: async () => {
    const response = await api.get('/classes');
    return response.data;
  },
  getClassById: async (id) => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },
  getClassesByTeacher: async (teacherId) => {
    const response = await api.get(`/classes/teacher/${teacherId}`);
    return response.data;
  },
  getClassesByStudent: async (studentId) => {
    const response = await api.get(`/classes/student/${studentId}`);
    return response.data;
  },
  createClass: async (classData) => {
    const response = await api.post('/classes', classData);
    return response.data;
  },
  enrollStudents: async (classId, studentIds) => {
    const response = await api.post(`/classes/${classId}/enroll`, { studentIds });
    return response.data;
  }
};

// Attendance services
export const attendanceService = {
  getAttendanceByClassAndDate: async (classId, date) => {
    const response = await api.get(`/attendance/class/${classId}/date/${date}`);
    return response.data;
  },
  getStudentAttendance: async (classId, studentId) => {
    const response = await api.get(`/attendance/class/${classId}/student/${studentId}`);
    return response.data;
  },
  recordAttendance: async (attendanceData) => {
    const response = await api.post('/attendance/record', attendanceData);
    return response.data;
  },
  getClassAttendanceReport: async (classId) => {
    const response = await api.get(`/attendance/report/class/${classId}`);
    return response.data;
  }
};

export default api;
