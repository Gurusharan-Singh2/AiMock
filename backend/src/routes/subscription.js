import express from 'express'
import { Subscription , SubscriptionVerify ,createSubscriptionPlan ,deleteSubscriptionPlan,getSubscriptionPlan, editSubscriptionPlan } from '../controllers/subscription.js'

const router =express.Router()

router.post("/create" , Subscription )
router.post("/verify-payment" , SubscriptionVerify )
router.post("/createPlan" , createSubscriptionPlan )
router.get("/getPlan" , getSubscriptionPlan)
router.delete("/deletePlan/:subscription_id",deleteSubscriptionPlan)
router.put("/editPlan/:subscription_id" , editSubscriptionPlan)
export default router