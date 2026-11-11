import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
})

// Attach JWT to every request once the user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pharmaassist_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If the token is invalid/expired, boot the user back to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('pharmaassist_token')
      localStorage.removeItem('pharmaassist_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
