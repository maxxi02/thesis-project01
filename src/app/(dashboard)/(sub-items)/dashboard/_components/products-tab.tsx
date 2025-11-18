"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { Cell, LabelList, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIChatWidget } from "./ai-chat-widget";

// Chart configurations
const categoryChartConfig = {
  sales: {
    label: "Sales",
  },
} satisfies ChartConfig;

const topProductsChartConfig = {
  quantity: {
    label: "Quantity Sold",
  },
} satisfies ChartConfig;

interface AnalyticsData {
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
  topProducts: Array<{
    _id: string;
    productName: string;
    productSku: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  salesByCategory: Array<{
    name: string;
    sales: number;
    quantity: number;
  }>;
  dailySales: Array<{
    date: string;
    sales: number;
    quantity: number;
    transactions: number;
  }>;
  deliveries: {
    pending: number;
    inTransit: number;
    delivered: number;
    cancelled: number;
  };
  recentActivity: Array<{
    _id: string;
    productName: string;
    quantitySold: number;
    totalAmount: number;
    saleDate: string;
    soldBy: {
      name: string;
      role: string;
    };
  }>;
  stockAlerts: Array<{
    _id: string;
    name: string;
    sku: string;
    stock: number;
    status: string;
  }>;
  period: number;
}

export const ProductsTab = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30");
  // GOOGLE AI VARIABLES
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);

  // Prepare chart data - REPLACE THE EXISTING SECTION
  const topProductsChartConfig = analytics ? {
    quantity: {
      label: "Quantity Sold",
    },
    ...analytics.topProducts.slice(0, 5).reduce((acc, product, index) => {
      acc[product._id] = {
        label: product.productName,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
      return acc;
    }, {} as Record<string, { label: string; color: string }>)
  } satisfies ChartConfig : { quantity: { label: "Quantity Sold" } } satisfies ChartConfig;

  const categoryChartConfigDynamic = analytics ? {
    sales: {
      label: "Sales",
    },
    ...analytics.salesByCategory.reduce((acc, cat, index) => {
      acc[cat.name.toLowerCase().replace(/\s+/g, '-')] = {
        label: cat.name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
      return acc;
    }, {} as Record<string, { label: string; color: string }>)
  } satisfies ChartConfig : { sales: { label: "Sales" } } satisfies ChartConfig;

  const topProductsData = analytics ? analytics.topProducts
    .slice(0, 5)
    .map((product, index) => ({
      id: product._id,
      name: product.productName,
      quantity: product.totalQuantity,
      fill: `hsl(${(index * 360) / 5}, 70%, 60%)`, // Change this line
    })) : [];

  const categoryData = analytics ? analytics.salesByCategory.map((cat, index) => ({
    id: cat.name.toLowerCase().replace(/\s+/g, '-'),
    name: cat.name,
    sales: cat.sales,
    quantity: cat.quantity,
    fill: `hsl(${(index * 360) / analytics.salesByCategory.length}, 70%, 60%)`, // Change this line
  })) : [];

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const generateInsights = async (): Promise<void> => {
    if (!analytics) return;

    try {
      setLoadingInsights(true);
      const response = await fetch("/api/ai-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analytics }),
      });

      if (!response.ok) throw new Error("Failed to generate insights");

      const data: { insights: string } = await response.json();
      setAiInsights(data.insights);
    } catch (err) {
      console.error("Error generating insights:", err);
      setAiInsights("Failed to generate insights. Please try again.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?period=${period}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError("Failed to load analytics data");
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 dark:bg-muted/80"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 animate-pulse dark:bg-muted/80"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-foreground">
              {error || "No data available"}
            </p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-4">
        <label
          htmlFor="period-select"
          className="text-sm font-medium text-foreground"
        >
          Analytics Period:
        </label>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analytics.overview.totalProducts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.outOfStockProducts} out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Stock Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.overview.lowStockProducts +
                analytics.overview.outOfStockProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.lowStockProducts} low stock,{" "}
              {analytics.overview.outOfStockProducts} out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Inventory Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₱
              {analytics.overview.totalInventoryValue.toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Sales ({period} days)
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₱
              {analytics.sales.totalSales.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.sales.totalQuantitySold} items sold,{" "}
              {analytics.sales.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">
              Top Selling Products
            </CardTitle>
            <CardDescription>
              Best performers in last {period} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topProductsData.length > 0 ? (
              <ChartContainer
                config={topProductsChartConfig}
                className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" hideLabel />}
                  />
                  <Pie data={topProductsData} dataKey="quantity" nameKey="name">
                    <LabelList
                      dataKey="quantity"
                      className="fill-background"
                      stroke="none"
                      fontSize={12}
                      formatter={(value: number) => `${value}`}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No sales data available for this period
              </div>
            )}
          </CardContent>
          {analytics.sales.totalQuantitySold > 0 && (
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium leading-none text-foreground">
                {analytics.sales.totalQuantitySold} total items sold{" "}
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="leading-none text-muted-foreground">
                Average order value: ₱
                {analytics.sales.averageOrderValue.toFixed(2)}
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Sales by Category</CardTitle>
            <CardDescription>
              Revenue distribution by product category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ChartContainer
                config={categoryChartConfig}
                className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" hideLabel />}
                  />
                  <Pie data={categoryData} dataKey="sales" nameKey="name">
                    <LabelList
                      dataKey="name"
                      className="fill-background"
                      stroke="none"
                      fontSize={12}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none text-foreground">
              Total Revenue: ₱{analytics.sales.totalSales.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} <TrendingUp className="h-4 w-4" />
            </div>
            <div className="leading-none text-muted-foreground">
              Across {analytics.salesByCategory.length} categories
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Activity & Stock Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <CardDescription>Latest sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.recentActivity.length > 0 ? (
                  analytics.recentActivity.map((activity) => (
                    <TableRow key={activity._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">
                            {activity.productName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            by {activity.soldBy.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {activity.quantitySold}
                      </TableCell>
                      <TableCell className="text-foreground">
                        ₱{activity.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {new Date(activity.saleDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No recent activity
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Stock Alerts</CardTitle>
            <CardDescription>Products needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.stockAlerts.length > 0 ? (
                  analytics.stockAlerts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="font-medium text-foreground">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {product.sku}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {product.stock}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.stock === 0
                              ? "destructive"
                              : product.stock <= 10
                                ? "secondary"
                                : "default"
                          }
                        >
                          {product.stock === 0
                            ? "Out of Stock"
                            : product.stock <= 10
                              ? "Low Stock"
                              : "In Stock"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No stock alerts
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* {aiInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              🤖 AI Insights
            </CardTitle>
            <CardDescription>Smart analysis of your inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-line">
              {aiInsights}
            </div>
          </CardContent>
        </Card>
      )} */}

      {analytics && <AIChatWidget analytics={analytics} />}
    </div>
  );
};
