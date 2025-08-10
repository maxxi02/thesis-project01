// app/api/analytics/route.ts
import { getServerSession } from "@/better-auth/action";
import { connectDB } from "@/database/mongodb";
import { Product } from "@/models/product";
import { ProductHistory } from "@/models/product-history";
import { ToShip } from "@/models/toship";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days

    const now = new Date();
    const periodDays = parseInt(period);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - periodDays);

    // 1. Product Overview Stats
    const totalProducts = await Product.countDocuments();
    const outOfStockProducts = await Product.countDocuments({
      $or: [{ stock: 0 }, { status: "out-of-stock" }],
    });
    const lowStockProducts = await Product.countDocuments({
      stock: { $gt: 0, $lte: 10 },
      status: { $ne: "out-of-stock" },
    });

    // Total inventory value
    const inventoryValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$price", "$stock"] } },
        },
      },
    ]);

    // 2. Sales Analytics (from ProductHistory)
    const salesStats = await ProductHistory.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          totalQuantitySold: { $sum: "$quantitySold" },
          totalTransactions: { $sum: 1 },
          averageOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    // 3. Top Selling Products
    const topSellingProducts = await ProductHistory.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$productId",
          productName: { $first: "$productName" },
          productSku: { $first: "$productSku" },
          totalQuantity: { $sum: "$quantitySold" },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { totalQuantity: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // 4. Sales by Category
    const salesByCategory = await ProductHistory.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$category",
          totalSales: { $sum: "$totalAmount" },
          totalQuantity: { $sum: "$quantitySold" },
        },
      },
      {
        $sort: { totalSales: -1 },
      },
    ]);

    // 5. Daily Sales Trend
    const dailySales = await ProductHistory.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$saleDate" },
          },
          totalSales: { $sum: "$totalAmount" },
          totalQuantity: { $sum: "$quantitySold" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // 6. Delivery Analytics
    const deliveryStats = await ToShip.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // 7. Recent Activity (last 10 transactions)
    const recentActivity = await ProductHistory.find({
      saleDate: { $gte: startDate },
    })
      .sort({ saleDate: -1 })
      .limit(10)
      .select("productName quantitySold totalAmount saleDate soldBy")
      .lean();

    // 8. Stock Alerts
    const stockAlerts = await Product.find({
      $or: [{ stock: 0 }, { stock: { $lte: 10, $gt: 0 } }],
    })
      .select("name sku stock status")
      .sort({ stock: 1 })
      .limit(10)
      .lean();

    // Format response
    const analytics = {
      overview: {
        totalProducts,
        outOfStockProducts,
        lowStockProducts,
        totalInventoryValue: inventoryValue[0]?.totalValue || 0,
      },
      sales: {
        totalSales: salesStats[0]?.totalSales || 0,
        totalQuantitySold: salesStats[0]?.totalQuantitySold || 0,
        totalTransactions: salesStats[0]?.totalTransactions || 0,
        averageOrderValue: salesStats[0]?.averageOrderValue || 0,
      },
      topProducts: topSellingProducts,
      salesByCategory: salesByCategory.map((cat) => ({
        name: cat._id || "Uncategorized",
        sales: cat.totalSales,
        quantity: cat.totalQuantity,
      })),
      dailySales: dailySales.map((day) => ({
        date: day._id,
        sales: day.totalSales,
        quantity: day.totalQuantity,
        transactions: day.transactionCount,
      })),
      deliveries: {
        pending: deliveryStats.find((d) => d._id === "pending")?.count || 0,
        inTransit:
          deliveryStats.find((d) => d._id === "in-transit")?.count || 0,
        delivered: deliveryStats.find((d) => d._id === "delivered")?.count || 0,
        cancelled: deliveryStats.find((d) => d._id === "cancelled")?.count || 0,
      },
      recentActivity,
      stockAlerts,
      period: periodDays,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
