import crypto from 'crypto'
import Razorpay from 'razorpay';
import db from "../config/db.js";
export const Subscription = async (req, res) => {
    console.log("subscription")
    try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: req.body.amount * 100, 
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
     console.error(error);
        res.status(500).json({ message: "Internal server error" });
  }
}

export const SubscriptionVerify = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === razorpay_signature) {
    res.json({ status: "success" });
  } else {
    res.status(400).json({ status: "failure" });
  }
    
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
  }
}

export const createSubscriptionPlan=async(req,res)=>{
   try {
      const {name , features , price}=req.body
        if (!name || !features || !price) {
      return res.status(400).json({ message: "Name , features and price are required" });
    }
      const plan = await db("subscriptions").insert({
        name ,
        features, 
        price,
        isActive:1,
    });

    if (!plan) {
      return res.status(400).json({
        message: "Failed to create , please try again",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Created Successfully",
    });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
} 

export const getSubscriptionPlan=async(req,res)=>{
  try {
    const plans = await db("subscriptions").select("*")

    if (!plans) {
      return res.status(404).json({
        message: "Plans not found"
      });
    }
    res.status(200).json({
      message: " Plan get successfully",
      plans
    });

  } catch (error) {
     console.error(error);
        res.status(500).json({ message: "Internal server error" });
  }
}

export const deleteSubscriptionPlan=async(req,res)=>{
  try {
     const {subscription_id}=req.params
     console.log(subscription_id);
     
 const plans = await db("subscriptions")
  .where({ subscription_id })
  .del();


    if (!plans) {
      return res.status(404).json({
        message: "Plans not deleted"
      });
    }
    res.status(200).json({
      message: " Plan deleted successfully",
      plans
    });


  } catch (error) {
     console.error(error);
        res.status(500).json({ message: "Internal server error" });
  }
}