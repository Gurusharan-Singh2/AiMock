import { axiosInstance } from "./axios";

export const signup = async (SignupData) => {
      const res = await axiosInstance.post("/auth/signup", SignupData)
      return res.data;
}

export const login = async (loginData) => {
      const res = await axiosInstance.post("/auth/login", loginData)
      return res.data;
}
export const logout = async () => {
      const res = await axiosInstance.post("/auth/logout",)
      return res.data;
}