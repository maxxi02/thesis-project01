// app/api/ai-analytics/route.ts
import Groq from "groq-sdk";

interface TopProduct {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface StockAlert {
  name: string;
  sku: string;
  stock: number;
}

interface AnalyticsPayload {
  overview: {
    totalProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    totalInventoryValue: number;
  };
  sales: {
    totalSales: number;
    totalQuantitySold: number;
    totalTransactions: number;
    averageOrderValue: number;
  };
  topProducts: TopProduct[];
  stockAlerts: StockAlert[];
  period: number;
}

export async function POST(req: Request) {
  try {
    const { analytics }: { analytics: AnalyticsPayload } = await req.json();

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const prompt = `You are Nivek, the AI assistant for LGW Hardware. You help analyze inventory and sales data.

Start your response by greeting the user and introducing yourself briefly, then provide your analysis.

INVENTORY OVERVIEW:
- Total Products: ${analytics.overview.totalProducts}
- Out of Stock: ${analytics.overview.outOfStockProducts}
- Low Stock: ${analytics.overview.lowStockProducts}
- Inventory Value: ₱${analytics.overview.totalInventoryValue}

SALES (${analytics.period} days):
- Total Sales: ₱${analytics.sales.totalSales}
- Items Sold: ${analytics.sales.totalQuantitySold}
- Transactions: ${analytics.sales.totalTransactions}
- Average Order: ₱${analytics.sales.averageOrderValue}

TOP PRODUCTS:
${analytics.topProducts
  .slice(0, 5)
  .map(
    (p: TopProduct) =>
      `- ${p.productName}: ${p.totalQuantity} sold, ₱${p.totalRevenue} revenue`
  )
  .join("\n")}

STOCK ALERTS:
${analytics.stockAlerts
  .map((p: StockAlert) => `- ${p.name} (${p.sku}): ${p.stock} units`)
  .join("\n")}

Format your response like this:
1. Brief greeting and introduction (1-2 sentences mentioning you're Nivek from LGW Hardware)
2. Key Insights section (3-4 important points)
3. Urgent Actions Needed section
4. Recommendations for Improvement section

DO NOT use asterisks or bullet points. Use clear section headers and line breaks. Write in a friendly, professional tone.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile", // Fast and smart
      temperature: 0.7,
      max_tokens: 1024,
    });

    const text =
      completion.choices[0]?.message?.content || "No insights generated";

    return Response.json({ insights: text });
  } catch (error) {
    console.error("AI Analytics error:", error);
    return Response.json(
      {
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
