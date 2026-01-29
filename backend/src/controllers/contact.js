import db from "../config/db.js";

export const contactUs = async (req, res) => {
    try {
        const { name, email, message } = req.body
        if (!email || !name || !message) {
      return res.status(400).json({ message: "Name , Email and message are required" });
    }
      const contact = await db("contact").insert({
        name ,
        email, 
        message,
    });

    if (!contact) {
      return res.status(400).json({
        message: "Failed to save , please try again",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Message sended Successfully",
    });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}