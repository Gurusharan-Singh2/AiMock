import db from "../config/db";

export const authMiddleware = async(req, res, next) => {
  try {
    
    const token = req.cookies?.token;

    if (!token) return res.status(401).json({ message: "Unauthorized: Token not found" });

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db('users')
      .where({ id: decoded.id })
      .first(['id', 'name', 'email']);

    if (!user) return res.status(401).json({ message: "Unauthorized: User not found" });


    
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
  finally {
    await db.destroy();
  }
};