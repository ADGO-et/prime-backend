const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
const { kycSubmitLimiter } = require("../middleware/rateLimit");

const router = express.Router();

async function generateOrderId(prisma) {
  const counter = await prisma.kycCounter.upsert({
    where: { id: "order" },
    create: { id: "order", value: 100001 },
    update: { value: { increment: 1 } },
  });
  return `PC-ORD-${counter.value}`;
}

/**
 * @swagger
 * /api/orders/submit:
 *   post:
 *     tags: [Orders]
 *     summary: Submit a new trade order
 *     description: Submit a trade order for processing (buy/sell).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TradeOrderSubmitRequest'
 *     responses:
 *       201:
 *         description: Order submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 orderId:
 *                   type: string
 *                   example: "PC-ORD-100001"
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation failed
 *       500:
 *         description: Internal server error
 */
router.post("/submit", kycSubmitLimiter, async (req, res) => {
  try {
    const {
      clientName,
      idNumber,
      csdAccountNumber,
      symbol,
      side,
      type,
      limitPrice = "",
      stopPrice = "",
      quantity,
      timeInForce,
      goodTillDate = "",
      clientSignature = "",
      receivedVia,
    } = req.body;

    if (!clientName?.trim() || !idNumber?.trim() || !csdAccountNumber?.trim() || !symbol?.trim() || !side || !type || !quantity || !timeInForce || !receivedVia) {
      return res.status(400).json({ success: false, error: "Missing required order fields" });
    }

    const orderId = await generateOrderId(prisma);

    const order = await prisma.tradeOrder.create({
      data: {
        orderId,
        clientName,
        idNumber,
        csdAccountNumber,
        symbol,
        side,
        type,
        limitPrice,
        stopPrice,
        quantity,
        timeInForce,
        goodTillDate,
        clientSignature,
        receivedVia,
        status: "Pending",
      },
    });

    res.status(201).json({
      success: true,
      orderId: order.orderId,
      message: "Trade order submitted successfully",
      order,
    });
  } catch (err) {
    console.error("Order submission error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to submit order" });
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: List trade orders
 *     description: Retrieve a paginated list of trade orders (admin/officer only).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Accepted, Rejected, all]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Unauthorized
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, search, page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      const q = search.trim();
      where.OR = [
        { orderId: { contains: q, mode: "insensitive" } },
        { clientName: { contains: q, mode: "insensitive" } },
        { symbol: { contains: q, mode: "insensitive" } },
        { csdAccountNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.tradeOrder.count({ where }),
      prisma.tradeOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
    ]);

    res.json({
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error("List orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get trade order details
 *     description: Retrieve detailed information for a single order by ID or order ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const order = await prisma.tradeOrder.findFirst({
      where: {
        OR: [{ id: req.params.id }, { orderId: req.params.id }],
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update trade order status
 *     description: Accept or reject a trade order (admin/officer only).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Accepted, Rejected, Pending]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Order not found
 */
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status, rejectionReason = "" } = req.body;
    const traderSignature = req.adminUser.name;

    if (!status || !["Accepted", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const existing = await prisma.tradeOrder.findFirst({
      where: {
        OR: [{ id: req.params.id }, { orderId: req.params.id }],
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = await prisma.tradeOrder.update({
      where: { id: existing.id },
      data: {
        status,
        rejectionReason,
        traderSignature,
        receivedBy: traderSignature,
        dateReceived: new Date().toLocaleDateString(),
        timeReceived: new Date().toLocaleTimeString(),
      },
    });

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

module.exports = router;
