import express from "express";
import { makeStripeGateway } from "../payments/stripeGateway";
import { makeQiGateway } from "../payments/qiGateway";


const router = express.Router();


const useQi = process.env.USE_QI === "1";
const stripeSecret = process.env.STRIPE_SECRET_KEY || "";


const gateway = useQi ? makeQiGateway() : makeStripeGateway(stripeSecret);


// POST /payments/checkout
router.post("/checkout", async (req, res) => {
try {
const { amountIQD, description, returnUrl, metadata } = req.body || {};
if (!amountIQD || amountIQD <= 0) {
return res.status(400).json({ ok: false, error: "amountIQD required" });
}
const result = await gateway.createIntent({ amountIQD, description, returnUrl, metadata });
res.status(result.ok ? 200 : 400).json(result);
} catch (e: any) {
res.status(500).json({ ok: false, error: e?.message || "server error" });
}
});


// GET /payments/status/:ref
router.get("/status/:ref", async (req, res) => {
try {
const status = await gateway.getStatus(req.params.ref);
res.json({ status });
} catch (e: any) {
res.status(500).json({ error: e?.message || "server error" });
}
});


export default router;