"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Package,
  Bell,
  RefreshCw,
  Eye,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { getServerSession } from "@/better-auth/action";

interface DeliveryTracking {
  id: string;
  product: {
    name: string;
    image: string;
    quantity: number;
    sku: string;
  };
  customerAddress: {
    destination: string;
  };
  driver: {
    id: string;
    fullName: string;
    email: string;
  };
  status: "pending" | "in-transit" | "delivered" | "cancelled";
  note: string;
  assignedDate: string;
  updatedAt: string;
  startedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  markedBy: {
    name: string;
    email: string;
    role: string;
  };
  notifications: Array<{
    type: string;
    createdAt: string;
    read: boolean;
    message?: string;
  }>;
}

export const DeliveryTab = () => {
  const [deliveries, setDeliveries] = useState<DeliveryTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedDelivery, setSelectedDelivery] =
    useState<DeliveryTracking | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const sseConnectionRef = useRef<EventSource | null>(null);

  // Setup SSE connection for real-time updates
  useEffect(() => {
    const setupSSE = async () => {
      try {
        const session = await getServerSession();
        if (session?.user?.email) {
          const connection = new EventSource(
            `/api/sse?userId=${session.user.id}&userEmail=${encodeURIComponent(session.user.email)}`
          );
          connection.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (
                data.type === "DELIVERY_STATUS_UPDATE" ||
                data.type === "DELIVERY_COMPLETED"
              ) {
                toast.info("Delivery Status Updated", {
                  description: `${data.data.productName} - Status: ${data.data.newStatus}`,
                });
                fetchDeliveries();
              }
            } catch (error) {
              console.error("Error parsing SSE data:", error);
            }
          };
          sseConnectionRef.current = connection;
        }
      } catch (error) {
        console.error("Error setting up SSE:", error);
      }
    };

    setupSSE();
    return () => {
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close();
      }
    };
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/deliveries/track-deliveries", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch deliveries");
      }
      const data = await response.json();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      toast.error("Failed to load delivery tracking data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "in-transit":
        return "default";
      case "delivered":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "in-transit":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (filter === "all") return true;
    return delivery.status === filter;
  });

  const getDeliveryStats = () => {
    return {
      total: deliveries.length,
      pending: deliveries.filter((d) => d.status === "pending").length,
      inTransit: deliveries.filter((d) => d.status === "in-transit").length,
      delivered: deliveries.filter((d) => d.status === "delivered").length,
      cancelled: deliveries.filter((d) => d.status === "cancelled").length,
    };
  };

  const stats = getDeliveryStats();

  // Pagination logic
  const totalPages = Math.ceil(filteredDeliveries.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedDeliveries = filteredDeliveries.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading delivery tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Delivery Tracking</h2>
          <p className="text-muted-foreground">
            Track all delivery assignments and their status
          </p>
        </div>
        <Button onClick={fetchDeliveries} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Delivery Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting pickup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">
              Currently being delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">
              Completed deliveries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">Issues encountered</p>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Tracking Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Delivery Tracking
              </CardTitle>
              <CardDescription>
                Monitor all delivery assignments and their current status
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deliveries</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Notifications</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDeliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {filter === "all"
                            ? "No deliveries found"
                            : `No ${filter.replace("-", " ")} deliveries found`}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Image
                            src={
                              delivery.product.image ||
                              "/placeholder.svg?height=40&width=40"
                            }
                            width={500}
                            height={500}
                            alt={delivery.product.name}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                          <div>
                            <div className="font-medium">
                              {delivery.product.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {delivery.product.quantity} • SKU:{" "}
                              {delivery.product.sku}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src="/placeholder.svg?height=32&width=32"
                              alt={delivery.driver.fullName}
                            />
                            <AvatarFallback>
                              {delivery.driver.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {delivery.driver.fullName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {delivery.driver.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="max-w-[200px] truncate">
                            {delivery.customerAddress.destination}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(delivery.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(delivery.status)}
                            {delivery.status.replace("-", " ")}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(delivery.assignedDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {delivery.notifications.some((n) => !n.read) ? (
                          <Badge variant="destructive" className="text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            {
                              delivery.notifications.filter((n) => !n.read)
                                .length
                            }{" "}
                            New
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            None
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDelivery(delivery)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredDeliveries.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredDeliveries.length)} of{" "}
                  {filteredDeliveries.length} deliveries
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Rows per page</p>
                  <Select
                    value={`${pageSize}`}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((size) => (
                        <SelectItem key={size} value={`${size}`}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0 bg-transparent"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <span className="sr-only">Go to first page</span>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0 bg-transparent"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0 bg-transparent"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only">Go to next page</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0 bg-transparent"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only">Go to last page</span>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Details Dialog */}
      <Dialog
        open={!!selectedDelivery}
        onOpenChange={() => setSelectedDelivery(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Delivery Details #{selectedDelivery?.id.slice(-6).toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Complete information about this delivery assignment
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Product Information</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Name:</strong> {selectedDelivery.product.name}
                      </p>
                      <p>
                        <strong>Quantity:</strong>{" "}
                        {selectedDelivery.product.quantity}
                      </p>
                      <p>
                        <strong>SKU:</strong> {selectedDelivery.product.sku}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Destination</h4>
                    <p className="text-sm">
                      {selectedDelivery.customerAddress.destination}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Driver Information</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Name:</strong>{" "}
                        {selectedDelivery.driver.fullName}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedDelivery.driver.email}
                      </p>
                      <p>
                        <strong>Status:</strong>
                        <Badge
                          variant={getStatusColor(selectedDelivery.status)}
                          className="ml-2"
                        >
                          {selectedDelivery.status.replace("-", " ")}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Assigned:</strong>{" "}
                    {new Date(selectedDelivery.assignedDate).toLocaleString()}
                  </p>
                  {selectedDelivery.startedAt && (
                    <p>
                      <strong>Started:</strong>{" "}
                      {new Date(selectedDelivery.startedAt).toLocaleString()}
                    </p>
                  )}
                  {selectedDelivery.deliveredAt && (
                    <p>
                      <strong>Delivered:</strong>{" "}
                      {new Date(selectedDelivery.deliveredAt).toLocaleString()}
                    </p>
                  )}
                  {selectedDelivery.cancelledAt && (
                    <p>
                      <strong>Cancelled:</strong>{" "}
                      {new Date(selectedDelivery.cancelledAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {selectedDelivery.note && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-yellow-800">
                      {selectedDelivery.note}
                    </p>
                  </div>
                </div>
              )}

              {selectedDelivery.notifications.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Activity Log</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedDelivery.notifications.map(
                      (notification, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-3 rounded text-sm"
                        >
                          <p>
                            {notification.message ||
                              `${notification.type} update`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
