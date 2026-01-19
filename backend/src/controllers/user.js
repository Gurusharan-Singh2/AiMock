import { checkOtpRestrictions, sendOtpByEmail, trackOtpRequests } from '../utils/authHelper.js';
import db from '../config/db.js'

  export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await db
  .select('*')
  .from('users')
  .where({ email: email })
  .first();
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    await checkOtpRestrictions(email);
    await trackOtpRequests(email);
    await sendOtpByEmail(name, email);

    res.status(200).json({ message: "OTP sent successfully to email." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}