import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()

export const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;  // Get token from cookies

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
