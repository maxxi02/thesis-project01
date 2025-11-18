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
    const { analytics, customPrompt, format }: {
      analytics: AnalyticsPayload;
      customPrompt?: string;
      format?: "paragraph" | "bullets";
    } = await req.json();

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const formatInstruction = format === "bullets"
      ? "Format your response using bullet points (•) for each key point. Keep each bullet concise (1-2 lines)."
      : "Format your response in clear, concise paragraphs. Keep it brief and to the point.";

    let prompt = "";

    if (customPrompt) {
      // Custom user question
      prompt = `You are Nivek, the AI assistant for LGW Hardware analyzing inventory data.

INVENTORY OVERVIEW:
- Total Products: ${analytics.overview.totalProducts}
- Out of Stock: ${analytics.overview.outOfStockProducts}
- Low Stock: ${analytics.overview.lowStockProducts}
- Inventory Value: ₱${analytics.overview.totalInventoryValue}

SALES (${analytics.period} days):
- Total Sales: ₱${analytics.sales.totalSales}
- Items Sold: ${analytics.sales.totalQuantitySold}
- Transactions: ${analytics.sales.totalTransactions}

TOP PRODUCTS:
${analytics.topProducts
          .slice(0, 5)
          .map((p: TopProduct) => `- ${p.productName}: ${p.totalQuantity} sold`)
          .join("\n")}

User Question: ${customPrompt}

${formatInstruction}

Provide a concise, helpful answer (max 150 words). Be direct and actionable.`;
    } else {
      // Initial analysis
      prompt = `You are Nivek, the AI assistant for LGW Hardware.

INVENTORY OVERVIEW:
- Total Products: ${analytics.overview.totalProducts}
- Out of Stock: ${analytics.overview.outOfStockProducts}
- Low Stock: ${analytics.overview.lowStockProducts}
- Inventory Value: ₱${analytics.overview.totalInventoryValue}

SALES (${analytics.period} days):
- Total Sales: ₱${analytics.sales.totalSales}
- Items Sold: ${analytics.sales.totalQuantitySold}

TOP PRODUCTS:
${analytics.topProducts
          .slice(0, 5)
          .map((p: TopProduct) => `- ${p.productName}: ${p.totalQuantity} sold`)
          .join("\n")}

STOCK ALERTS:
${analytics.stockAlerts
          .map((p: StockAlert) => `- ${p.name}: ${p.stock} units`)
          .join("\n")}

${formatInstruction}

Provide:
1. Brief greeting (1 sentence)
2. 3-4 key insights
3. Top urgent action
4. One recommendation

Keep total response under 200 words. Be concise and actionable.`;
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 800,
    });

    const text = completion.choices[0]?.message?.content || "No insights generated";
    return Response.json({ insights: text });
  } catch (error) {
    console.error("AI Analytics error:", error);
    return Response.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}