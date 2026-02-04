import db from "../config/db.js";

export async function getActiveSubscription(userId) {
  return db("user_subscriptions as us")
    .join("subscriptions as s", "us.subscription_id", "s.subscription_id")
    .where("us.user_id", userId)
    .where("us.status", "active")
    .orderBy("us.user_subscription_id", "desc")
    .select(
      "us.user_subscription_id as subscriptionInstanceId",
      "us.subscription_id",
      "s.Monthly_limit"
    )
    .first();
}

