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
import { toast } from "sonner";

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
  saleType: "sale" | "delivery";
  status: "completed" | "delivered" | "pending" | "cancelled";
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
    category: string;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("all");

  // User state
  const [user, setUser] = useState<{ role?: string }>({ role: "admin" });

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

  // Fetch product history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "20");
      params.append("includeDeliveries", "true");
      if (searchTerm) params.append("search", searchTerm);
      if (selectedStatus && selectedStatus !== "all")
        params.append("status", selectedStatus);

      const response = await fetch(`/api/product-history?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setHistory(data.history || []);
        setPagination(data.pagination || null);
      } else {
        setError(data.error || "Failed to fetch history");
      }
    } catch (error) {
      setError("Network error while fetching history");
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedStatus]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(
        `/api/product-history?action=stats&${params.toString()}`
      );
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
  }, [searchTerm]);

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
        setShowClearDialog(false);
        // Refetch stats after clearing
        fetchStats();
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
    if (!history.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Date",
      "Product Name",
      "SKU",
      "Category",
      "Quantity",
      "Unit Price",
      "Total Amount",
      "Sale Type",
      "Status",
      "Sold By",
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
      item.saleType,
      item.status,
      item.soldBy.name,
      item.notes || "",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-history-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  // Initialize data
  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [fetchHistory, fetchStats]);

  // Refetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchStats();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus, fetchStats]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    fetchHistory();
  }, [currentPage, fetchHistory]);

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get sale type badge variant
  const getSaleTypeVariant = (saleType: string) => {
    return saleType === "delivery" ? "default" : "secondary";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
          <p className="text-muted-foreground mt-2">
            Track and analyze your product sales and deliveries
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={!history.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {user?.role === "admin" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              disabled={!history.length}
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
              className="ml-auto border-red-200"
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
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.monthlyStats?.totalSales || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.monthlyStats?.totalTransactions || 0} transactions
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
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.weeklyStats?.totalSales || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.weeklyStats?.totalQuantity || 0} units sold
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
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    stats?.monthlyStats?.totalTransactions &&
                      stats.monthlyStats.totalSales
                      ? stats.monthlyStats.totalSales /
                          stats.monthlyStats.totalTransactions
                      : 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Per transaction</p>
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
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.yearlyStats?.totalSales || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.yearlyStats?.totalQuantity || 0} total units
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Sales History
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label
                htmlFor={searchInputId}
                className="text-sm font-medium block"
              >
                Search Products
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={searchInputId}
                  placeholder="Search by name, SKU, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Search by product name, SKU, or category
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor={statusSelectId}
                className="text-sm font-medium block"
              >
                Status
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id={statusSelectId}>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Top Selling Products Sidebar */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Products
            </CardTitle>
            <CardDescription>Best performing products</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.topProducts?.map((product, index) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {product.productName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {product.productSku} • {product.category}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold text-sm">
                        {product.totalQuantity} sold
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(product.totalRevenue)}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!stats?.topProducts || stats.topProducts.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    No sales data available
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales History Table - Main Content */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Sales & Delivery History</CardTitle>
            <CardDescription>
              {pagination
                ? `Showing ${Math.min(
                    pagination.totalCount,
                    (pagination.currentPage - 1) * pagination.limit + 1
                  )}-${Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.totalCount
                  )} of ${pagination.totalCount} transactions`
                : "Loading..."}
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
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sales history found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sales and delivery transactions will appear here
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sold By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item._id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(item.saleDate)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.productSku}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.quantitySold}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(item.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getSaleTypeVariant(item.saleType)}
                            className="capitalize"
                          >
                            {item.saleType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(item.status)}
                            className="capitalize"
                          >
                            {(item.status === "completed" ||
                              item.status === "delivered") && (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.soldBy.name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages} •{" "}
                  {pagination.totalCount} total records
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2 px-4">
                    <span className="text-sm text-muted-foreground">Page</span>
                    <Input
                      type="number"
                      min="1"
                      max={pagination.totalPages}
                      value={pagination.currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= pagination.totalPages) {
                          handlePageChange(page);
                        }
                      }}
                      className="w-16 h-8 text-center"
                    />
                    <span className="text-sm text-muted-foreground">
                      of {pagination.totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales by Category */}
      {stats?.salesByCategory && stats.salesByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>
              Revenue distribution across product categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.salesByCategory.map((category) => (
                <div key={category._id} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{category.category}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue:</span>
                      <span className="font-medium">
                        {formatCurrency(category.totalSales)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Units Sold:</span>
                      <span className="font-medium">
                        {category.totalQuantity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Transactions:
                      </span>
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
              This action will permanently delete all sales and delivery history
              records. This cannot be undone. Are you sure you want to continue?
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
  );
};

export default ProductHistoryView;
