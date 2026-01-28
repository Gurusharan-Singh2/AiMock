import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, payload, expiresIn = "40d") => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

  res.cookie("token", token, {
    httpOnly: true,     
    secure: process.env.NODE_ENV === "production", 
    sameSite: "none",  
    maxAge: 40 * 24 * 60 * 60 * 1000, 
  });

  return token;
};
