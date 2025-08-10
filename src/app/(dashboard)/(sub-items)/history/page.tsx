"use client";

import { useState, useEffect, useMemo, useId, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  DollarSign,
  Package,
  Trash2,
  ShoppingCart,
  Loader2,
  Download,
  Calendar,
  Filter,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Search,
} from "lucide-react";

interface ProductHistoryItem {
  _id: string;
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  quantitySold: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string;
  soldBy: {
    name: string;
    email: string;
  };
  notes?: string;
  saleType: string;
  status: string;
}

interface ProductHistoryStats {
  monthlyStats: {
    totalSales: number;
    totalQuantity: number;
    totalTransactions: number;
  };
  weeklyStats: {
    totalSales: number;
    totalQuantity: number;
    totalTransactions: number;
  };
  yearlyStats: {
    totalSales: number;
    totalQuantity: number;
    totalTransactions: number;
  };
  topProducts: Array<{
    _id: string;
    productName: string;
    productSku: string;
    category: string;
    totalQuantity: number;
    totalRevenue: number;
    transactionCount: number;
  }>;
  salesByCategory: Array<{
    _id: string;
    totalSales: number;
    totalQuantity: number;
    transactionCount: number;
  }>;
  dailySales: Array<{
    _id: string;
    totalSales: number;
    totalQuantity: number;
    transactionCount: number;
  }>;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

const ProductHistoryView = () => {
  // Generate stable IDs for form inputs
  const searchInputId = useId();
  const startDateId = useId();
  const endDateId = useId();
  const categorySelectId = useId();
  const statusSelectId = useId();

  const [history, setHistory] = useState<ProductHistoryItem[]>([]);
  const [stats, setStats] = useState<ProductHistoryStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // User state
  const [user, setUser] = useState<{ role?: string } | null>(null);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get unique categories from history
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(history.map((item) => item.category))];
    return uniqueCategories.filter(Boolean);
  }, [history]);

  // Fetch product history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "20");
      if (searchTerm) params.append("search", searchTerm);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedProductId) params.append("productId", selectedProductId);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedStatus) params.append("status", selectedStatus);

      const response = await fetch(`/api/product-history?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setHistory(data.history);
        setPagination(data.pagination);
      } else {
        setError(data.error || "Failed to fetch history");
      }
    } catch (error) {
      setError("Network error while fetching history");
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    searchTerm,
    startDate,
    endDate,
    selectedProductId,
    selectedCategory,
    selectedStatus,
  ]);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch("/api/product-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "stats" }),
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      } else {
        console.error("Error fetching stats:", data.error);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Clear product history (admin only)
  const clearProductHistory = async () => {
    try {
      setClearingHistory(true);
      const response = await fetch("/api/product-history", {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        setHistory([]);
        setStats(null);
        fetchStats();
        setShowClearDialog(false);
      } else {
        setError(data.error || "Failed to clear product history");
      }
    } catch (error) {
      setError("Network error while clearing history");
      console.error("Error clearing history:", error);
    } finally {
      setClearingHistory(false);
    }
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (!history.length) return;
    const headers = [
      "Date",
      "Product Name",
      "SKU",
      "Category",
      "Quantity",
      "Unit Price",
      "Total Amount",
      "Sold By",
      "Status",
      "Notes",
    ];
    const csvData = history.map((item) => [
      formatDate(item.saleDate),
      item.productName,
      item.productSku,
      item.category,
      item.quantitySold,
      item.unitPrice,
      item.totalAmount,
      item.soldBy.name,
      item.status,
      item.notes || "",
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-history-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setSelectedProductId("");
    setSelectedCategory("");
    setSelectedStatus("");
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchHistory();
    fetchStats();
    setUser({ role: "admin" });
  }, [fetchHistory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchHistory();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchHistory]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="min-h-screen">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            {user?.role === "admin" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowClearDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-2 pt-6">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.monthlyStats.totalSales || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">
                      {stats?.monthlyStats.totalTransactions || 0} transactions
                    </span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Weekly Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.weeklyStats.totalSales || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">
                      {stats?.weeklyStats.totalQuantity || 0} units sold
                    </span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Sale Value
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      stats?.monthlyStats.totalTransactions
                        ? stats.monthlyStats.totalSales /
                            stats.monthlyStats.totalTransactions
                        : 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per transaction this month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Yearly Revenue
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.yearlyStats.totalSales || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">
                      {stats?.yearlyStats.totalQuantity || 0} units this year
                    </span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Sales History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label htmlFor={searchInputId} className="text-sm font-medium">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={searchInputId}
                    placeholder="Search products, SKU, notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor={startDateId} className="text-sm font-medium">
                  Start Date
                </label>
                <Input
                  id={startDateId}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor={endDateId} className="text-sm font-medium">
                  End Date
                </label>
                <Input
                  id={endDateId}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor={categorySelectId}
                  className="text-sm font-medium"
                >
                  Category
                </label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger id={categorySelectId}>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All categories">
                      All categories
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor={statusSelectId} className="text-sm font-medium">
                  Status
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger id={statusSelectId}>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All statuses">All statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Top Selling Products */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>
                Best performing products by quantity sold
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.topProducts.map((product, index) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {product.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.productSku}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">
                          {product.totalQuantity} units
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(product.totalRevenue)}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!stats?.topProducts || stats.topProducts.length === 0) && (
                    <p className="text-center text-gray-500 py-4">
                      No sales data available
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales History Table */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Sales History</CardTitle>
              <CardDescription>
                {pagination &&
                  `Showing ${
                    (pagination.currentPage - 1) * pagination.limit + 1
                  }-${Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.totalCount
                  )} of ${pagination.totalCount} transactions`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading sales history...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No sales history found</p>
                  <p className="text-sm text-gray-400">
                    Sales transactions will appear here once you start selling
                    products
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Sold By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item) => (
                        <TableRow key={item._id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {item.productName}
                          </TableCell>
                          <TableCell>{item.productSku}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.quantitySold}</TableCell>
                          <TableCell>
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(item.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.saleDate)}
                            </div>
                          </TableCell>
                          <TableCell>{item.soldBy.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === "completed"
                                  ? "default"
                                  : item.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {item.status === "completed" && (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={!pagination.hasPrevPage}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sales by Category */}
        {stats && stats.salesByCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
              <CardDescription>
                Performance breakdown by product categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.salesByCategory.map((category) => (
                  <div
                    key={category._id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <h3 className="font-medium mb-2">{category._id}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium">
                          {formatCurrency(category.totalSales)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Units sold:</span>
                        <span className="font-medium">
                          {category.totalQuantity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transactions:</span>
                        <span className="font-medium">
                          {category.transactionCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clear History Confirmation Dialog */}
        <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear Product History</DialogTitle>
              <DialogDescription>
                This will permanently delete all product sales history data.
                This action cannot be undone. Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowClearDialog(false)}
                disabled={clearingHistory}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={clearProductHistory}
                disabled={clearingHistory}
              >
                {clearingHistory && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {clearingHistory ? "Clearing..." : "Clear History"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProductHistoryView;
