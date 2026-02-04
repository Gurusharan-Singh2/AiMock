import crypto from "crypto";
import db from "../config/db.js";
import instance from "../libs/razorpay.js";


export const createSubscriptionOrder = async (req, res) => {
  try {
    const { user_id, subscription_id } = req.body;

    if (!user_id || !subscription_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

   
    const plan = await db("subscriptions")
      .where({ subscription_id, isActive: 1 })
      .first();

    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }


    if (plan.price <= 0) {
      return res.status(400).json({
        message: "Free plan does not require payment",
      });
    }

   
  

    
    const order = await instance.orders.create({
      amount: plan.price * 100, 
      currency: "INR",
      receipt: `sub_${Date.now()}`,
      notes: {
        user_id,
        subscription_id,
      },
    });

    console.log("Razorpay order created:", order.id);

    
    await db("user_subscriptions").insert({
      user_id,
      subscription_id,
      razorpay_order_id: order.id,
      amount: plan.price,
      status: "pending",
    });

    return res.status(200).json({
      success: true,
      order,
      plan,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const verifySubscriptionPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    
    const subscription = await db("user_subscriptions")
      .where({ razorpay_order_id })
      .first();

    if (!subscription) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (subscription.status !== "pending") {
      return res.status(400).json({ message: "Order already processed" });
    }

    
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await db("user_subscriptions")
      .where({ razorpay_order_id })
      .update({
        razorpay_payment_id,
        status: "active",
        start_date: startDate,
        end_date: endDate,
        updated_at: new Date(),
      });

    return res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const getUserActiveSubscription = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: "User ID required" });
    }

    const subscription = await db("user_subscriptions")
      .join(
        "subscriptions",
        "user_subscriptions.subscription_id",
        "subscriptions.subscription_id"
      )
      .where({
        "user_subscriptions.user_id": user_id,
        "user_subscriptions.status": "active",
      })
      .where("user_subscriptions.end_date", ">", db.fn.now())
      .select(
        "user_subscriptions.subscription_id",
        "user_subscriptions.start_date",
        "user_subscriptions.end_date",
        "subscriptions.name",
        "subscriptions.features",
        "subscriptions.Monthly_limit"
      )
      .first();

    return res.status(200).json({
      success: true,
      subscription: subscription || null,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
