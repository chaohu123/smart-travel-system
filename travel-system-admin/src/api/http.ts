import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  timeout: 10000
});

http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    return Promise.reject(error);
  }
);

export default http;





