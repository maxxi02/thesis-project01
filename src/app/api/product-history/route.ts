// app/api/product-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ProductHistory } from "@/models/product-history";
import { getServerSession } from "@/better-auth/action";
import { connectDB } from "@/database/mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const productId = searchParams.get("productId");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    // Build query
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: "i" } },
        { productSku: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { "soldBy.name": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      query.saleDate = {} as { $gte?: Date; $lte?: Date };
      if (startDate) {
        (query.saleDate as { $gte?: Date }).$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // Include the entire end date
        (query.saleDate as { $lte?: Date }).$lte = endDateTime;
      }
    }

    if (productId) {
      query.productId = productId;
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await ProductHistory.countDocuments(query);

    // Fetch product history with pagination
    const history = await ProductHistory.find(query)
      .sort({ saleDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      history,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching product history:", error);
    return NextResponse.json(
      { error: "Failed to fetch product history" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, data } = await request.json();

    await connectDB();

    if (action === "stats") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Get monthly stats
      const monthlyStats = await ProductHistory.aggregate([
        {
          $match: {
            saleDate: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            totalQuantity: { $sum: "$quantitySold" },
            totalTransactions: { $sum: 1 },
          },
        },
      ]);

      // Get weekly stats
      const weeklyStats = await ProductHistory.aggregate([
        {
          $match: {
            saleDate: { $gte: startOfWeek },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            totalQuantity: { $sum: "$quantitySold" },
            totalTransactions: { $sum: 1 },
          },
        },
      ]);

      // Get yearly stats
      const yearlyStats = await ProductHistory.aggregate([
        {
          $match: {
            saleDate: { $gte: startOfYear },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            totalQuantity: { $sum: "$quantitySold" },
            totalTransactions: { $sum: 1 },
          },
        },
      ]);

      // Get top selling products
      const topProducts = await ProductHistory.aggregate([
        {
          $group: {
            _id: "$productId",
            productName: { $first: "$productName" },
            productSku: { $first: "$productSku" },
            category: { $first: "$category" },
            totalQuantity: { $sum: "$quantitySold" },
            totalRevenue: { $sum: "$totalAmount" },
            transactionCount: { $sum: 1 },
          },
        },
        {
          $sort: { totalQuantity: -1 },
        },
        {
          $limit: 10,
        },
      ]);

      // Get sales by category
      const salesByCategory = await ProductHistory.aggregate([
        {
          $group: {
            _id: "$category",
            totalSales: { $sum: "$totalAmount" },
            totalQuantity: { $sum: "$quantitySold" },
            transactionCount: { $sum: 1 },
          },
        },
        {
          $sort: { totalSales: -1 },
        },
      ]);

      // Get daily sales for the last 30 days
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailySales = await ProductHistory.aggregate([
        {
          $match: {
            saleDate: { $gte: thirtyDaysAgo },
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

      return NextResponse.json({
        monthlyStats: monthlyStats[0] || {
          totalSales: 0,
          totalQuantity: 0,
          totalTransactions: 0,
        },
        weeklyStats: weeklyStats[0] || {
          totalSales: 0,
          totalQuantity: 0,
          totalTransactions: 0,
        },
        yearlyStats: yearlyStats[0] || {
          totalSales: 0,
          totalQuantity: 0,
          totalTransactions: 0,
        },
        topProducts,
        salesByCategory,
        dailySales,
      });
    }

    if (action === "create") {
      // Create new product history entry
      const newHistory = new ProductHistory({
        ...data,
        saleDate: new Date(),
      });

      await newHistory.save();
      return NextResponse.json({ success: true, history: newHistory });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing product history request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin privileges
    // You might want to implement proper role checking here
    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get("id");

    await connectDB();

    if (historyId) {
      // Delete specific history entry
      const result = await ProductHistory.findByIdAndDelete(historyId);
      if (!result) {
        return NextResponse.json(
          { error: "History entry not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "History entry deleted",
      });
    } else {
      // Clear all history (admin only)
      await ProductHistory.deleteMany({});
      return NextResponse.json({
        success: true,
        message: "All history cleared",
      });
    }
  } catch (error) {
    console.error("Error deleting product history:", error);
    return NextResponse.json(
      { error: "Failed to delete product history" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...updateData } = await request.json();

    await connectDB();

    const updatedHistory = await ProductHistory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedHistory) {
      return NextResponse.json(
        { error: "History entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, history: updatedHistory });
  } catch (error) {
    console.error("Error updating product history:", error);
    return NextResponse.json(
      { error: "Failed to update product history" },
      { status: 500 }
    );
  }
}
