import express from 'express'
import { Subscription , SubscriptionVerify } from '../controllers/subscription.js'

const router =express.Router()

router.post("/create" , Subscription )
router.post("/verify-payment" , SubscriptionVerify )

export default router