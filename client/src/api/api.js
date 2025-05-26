import axios from "axios";

export default axios.create({
  baseURL: "http://localhost:9000/api/",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
