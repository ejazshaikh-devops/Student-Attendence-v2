import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getStudents    = ()             => api.get('/students')
export const addStudent     = (data)         => api.post('/students', data)
export const deleteStudent  = (id)           => api.delete(`/students/${id}`)
export const getAttendance  = ()             => api.get('/attendance')
export const markAttendance = (id, present, date) =>
  api.post(`/attendance/${id}?present=${present}&date=${date}`)
export const getDashboard   = ()             => api.get('/dashboard/stats')
export const getClassAvg    = ()             => api.get('/class/average')
export const getWeeklyAvg   = ()             => api.get('/class/weekly-average')
export const getPerformance = (id)           => api.get(`/class/performance/${id}`)

export default api