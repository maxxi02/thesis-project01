"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Package,
  User,
  RefreshCw,
  Truck,
  Clock,
  Calendar as CalendarIcon,
  AlertCircleIcon,
  ChevronRight,
  History,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Session } from "@/better-auth/auth-types";
import { NotificationHelper } from "../../../../../notification/notification-helper";
import { getServerSession } from "@/better-auth/action";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeliveryAssignment {
  id: string;
  product: {
    name: string;
    image: string;
    quantity: number;
  };
  customerAddress: {
    destination: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  driver: {
    fullName: string;
    email: string;
  };
  status: "pending" | "in-transit" | "delivered" | "cancelled";
  note?: string;
  assignedDate: string;
  estimatedDelivery?: string;
  startedAt?: string;
  deliveredAt?: string;
  archivedAt?: string;
  markedBy: {
    name: string;
    email: string;
  };
}

export default function DeliveryOverview() {
  const [archivedDeliveries, setArchivedDeliveries] = useState<
    DeliveryAssignment[]
  >([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreArchived, setHasMoreArchived] = useState(false);
  const ITEMS_PER_PAGE = 5;

  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSession, setUserSession] = useState<Session | null>(null);
  const sseConnectionRef = useRef<EventSource | null>(null);
  const [archivedCount, setArchivedCount] = useState(0);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDelivery, setSelectedDelivery] =
    useState<DeliveryAssignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Fetch archived deliveries
  const fetchArchivedDeliveries = async (
    userEmail: string,
    page: number = 0
  ) => {
    try {
      setArchivedLoading(true);
      const response = await fetch(
        `/api/deliveries/archived/list?driverEmail=${encodeURIComponent(
          userEmail
        )}&limit=${ITEMS_PER_PAGE}&skip=${page * ITEMS_PER_PAGE}`
      );

      if (!response.ok) throw new Error("Failed to fetch archived deliveries");

      const data = await response.json();
      setArchivedDeliveries(data.deliveries || []);
      setHasMoreArchived(data.hasMore || false);
    } catch (error) {
      console.error("Error fetching archived deliveries:", error);
      toast.error("Failed to load delivery history");
    } finally {
      setArchivedLoading(false);
    }
  };

  // Fetch assignments
  const fetchAssignments = async (userEmail: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/deliveries/assigned?driverEmail=${encodeURIComponent(
          userEmail
        )}&includeDetails=true`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setAssignments([]);
          return;
        }
        throw new Error("Failed to fetch assignments");
      }

      const data = await response.json();
      const validAssignments = Array.isArray(data)
        ? data.filter(
            (assignment: DeliveryAssignment) =>
              assignment.driver.email === userEmail
          )
        : data.driver.email === userEmail
        ? [data]
        : [];
      setAssignments(validAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setAssignments([]);
      if (error instanceof Error && !error.message.includes("404")) {
        toast.error("Failed to load delivery assignments");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch archived count
  const fetchArchivedCount = async (userEmail: string) => {
    try {
      const response = await fetch(
        `/api/deliveries/archived/count?driverEmail=${encodeURIComponent(
          userEmail
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        setArchivedCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching archived count:", error);
    }
  };

  // Initialize session and data
  useEffect(() => {
    const fetchSession = async () => {
      const session = await getServerSession();
      if (session?.user?.email) {
        setUserSession(session);
        await fetchAssignments(session.user.email);
        await fetchArchivedCount(session.user.email);
        await fetchArchivedDeliveries(session.user.email, 0);
        await NotificationHelper.initialize();
      } else {
        setLoading(false);
        toast.error("Please log in to view your deliveries");
      }
    };
    fetchSession();
  }, []);

  // SSE Connection
  useEffect(() => {
    if (userSession?.user) {
      const setupSSEConnection = (userId: string, userEmail: string) => {
        if (sseConnectionRef.current) {
          sseConnectionRef.current.close();
        }

        const connection = new EventSource(
          `/api/sse?userId=${userId}&userEmail=${encodeURIComponent(userEmail)}`
        );
        sseConnectionRef.current = connection;

        connection.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            switch (data.type) {
              case "DELIVERY_STATUS_UPDATE":
                if (userSession?.user.email) {
                  fetchAssignments(userSession.user.email);
                }
                break;
              case "NEW_ASSIGNMENT":
                try {
                  NotificationHelper.triggerNotification({
                    sound: true,
                    vibration: true,
                    respectAudioSettings: true,
                    type: "assignment",
                  });
                } catch (notifError) {
                  console.warn("Notification failed:", notifError);
                }
                toast.info("New Delivery Assignment", {
                  description: `You have been assigned to deliver ${data.data.productName}`,
                });
                if (userSession?.user.email) {
                  fetchAssignments(userSession.user.email);
                }
                break;
            }
          } catch (error) {
            console.error("Error parsing SSE data:", error);
          }
        };

        connection.onerror = () => {
          setTimeout(() => {
            if (userSession) {
              setupSSEConnection(userId, userEmail);
            }
          }, 5000);
        };
      };

      setupSSEConnection(userSession.user.id, userSession.user.email);
    }

    return () => {
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close();
      }
    };
  }, [userSession]);

  // Background cleanup
  useEffect(() => {
    const performCleanup = async () => {
      try {
        fetch("/api/deliveries/auto-cleanup", { method: "POST" });
      } catch (error) {
        console.error("Background cleanup failed:", error);
      }
    };

    const lastCleanup = sessionStorage.getItem("last-cleanup");
    const now = new Date().getTime();
    if (!lastCleanup || now - parseInt(lastCleanup) > 24 * 60 * 60 * 1000) {
      performCleanup();
      sessionStorage.setItem("last-cleanup", now.toString());
    }
  }, []);

  // Pagination handlers
  const handleNextPage = () => {
    if (hasMoreArchived && userSession?.user.email) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchArchivedDeliveries(userSession.user.email, nextPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0 && userSession?.user.email) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchArchivedDeliveries(userSession.user.email, prevPage);
    }
  };

  // Date utilities
  const getLocalDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getAssignedDates = (): Date[] => {
    const dateMap = new Map<string, Date>();
    assignments.forEach((a) => {
      const d = new Date(a.assignedDate);
      const key = getLocalDateKey(d);
      if (!dateMap.has(key)) {
        dateMap.set(key, new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      }
    });
    return Array.from(dateMap.values());
  };

  const getEstimatedDeliveryDates = (): Date[] => {
    const dateMap = new Map<string, Date>();
    assignments
      .filter((a) => a.estimatedDelivery)
      .forEach((a) => {
        const d = new Date(a.estimatedDelivery!);
        const key = getLocalDateKey(d);
        if (!dateMap.has(key)) {
          dateMap.set(
            key,
            new Date(d.getFullYear(), d.getMonth(), d.getDate())
          );
        }
      });
    return Array.from(dateMap.values());
  };

  const getEstimatedDeliveriesForDate = (
    selectedDate: Date | undefined
  ): DeliveryAssignment[] => {
    if (!selectedDate) return [];
    const dateKey = getLocalDateKey(selectedDate);
    return assignments.filter((assignment) => {
      if (!assignment.estimatedDelivery) return false;
      const estDate = new Date(assignment.estimatedDelivery);
      const estDateKey = getLocalDateKey(estDate);
      return estDateKey === dateKey;
    });
  };

  const assignedDates = getAssignedDates();
  const estimatedDates = getEstimatedDeliveryDates();

  const getUniqueDateCount = (): number => {
    const allKeys = new Set<string>();
    assignedDates.forEach((d) => allKeys.add(getLocalDateKey(d)));
    estimatedDates.forEach((d) => allKeys.add(getLocalDateKey(d)));
    return allKeys.size;
  };

  const uniqueDateCount = getUniqueDateCount();

  // Stats and data
  const getDeliveryStats = () => {
    return {
      total: assignments.length,
      pending: assignments.filter((a) => a.status === "pending").length,
      inTransit: assignments.filter((a) => a.status === "in-transit").length,
      delivered:
        assignments.filter((a) => a.status === "delivered").length +
        archivedCount,
      cancelled: assignments.filter((a) => a.status === "cancelled").length,
    };
  };

  const stats = getDeliveryStats();
  const hasActiveDelivery = assignments.some((a) => a.status === "in-transit");
  const activeDelivery = assignments.find((a) => a.status === "in-transit");
  const sortedAssignments = [...assignments].sort((a, b) => {
    const statusOrder = {
      "in-transit": 0,
      pending: 1,
      delivered: 2,
      cancelled: 3,
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading your delivery assignments...
          </p>
        </div>
      </div>
    );
  }

  // Authentication state
  if (!userSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Authentication Required
          </h2>
          <p className="text-muted-foreground">
            Please log in to view your delivery assignments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
              Delivery Overview
            </h1>
            {hasActiveDelivery && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="default" className="bg-blue-600 shrink-0">
                  <Truck className="h-3 w-3 mr-1" />
                  Active Delivery
                </Badge>
                <span className="text-sm text-blue-600 break-words">
                  Complete current delivery to start new ones
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              onClick={() => fetchAssignments(userSession.user.email)}
              disabled={loading}
              size="sm"
              className="shrink-0"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Delivery Calendar</span>
                  <span className="sm:hidden">Calendar</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:w-[450px] overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>Your Deliveries</SheetTitle>
                  <SheetDescription className="text-sm break-words">
                    Monitor your delivery schedule with blue markers indicating
                    assignment dates and green for estimated delivery times.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="flex justify-center gap-6 mb-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="w-3 h-3 bg-blue-100 border-2 border-blue-500 rounded"></div>
                      <span>Current Date</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="w-3 h-3 bg-green-100 border-2 border-green-500 rounded"></div>
                      <span>Est. Delivery Date</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center break-words">
                    {uniqueDateCount} unique delivery date
                    {uniqueDateCount !== 1 ? "s" : ""} marked
                  </p>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    modifiers={{
                      assigned: assignedDates,
                      estimated: estimatedDates,
                    }}
                    modifiersClassNames={{
                      assigned: "bg-blue-100 text-blue-800 hover:bg-blue-200",
                      estimated:
                        "bg-green-100 text-green-800 hover:bg-green-200",
                    }}
                    modifiersStyles={{
                      assigned: {
                        border: "2px solid blue",
                        fontWeight: "bold",
                      },
                      estimated: {
                        border: "2px solid green",
                        fontWeight: "bold",
                      },
                    }}
                  />
                  {date && getEstimatedDeliveriesForDate(date).length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3 break-words">
                        Deliveries estimated for{" "}
                        {date.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                      <div className="space-y-4">
                        {getEstimatedDeliveriesForDate(date).map(
                          (assignment) => (
                            <Alert key={assignment.id}>
                              <AlertCircleIcon className="h-4 w-4" />
                              <AlertDescription className="break-words">
                                <p className="font-medium mb-1">
                                  Note from the cashier:
                                </p>
                                <p className="text-sm">{assignment.note}</p>
                              </AlertDescription>
                            </Alert>
                          )
                        )}
                      </div>
                    </div>
                  )}
                  {date && getEstimatedDeliveriesForDate(date).length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm break-words">
                        No deliveries estimated for this date
                      </p>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Active Delivery Alert */}
      {hasActiveDelivery && activeDelivery && (
        <Alert className="bg-blue-50 border-blue-200">
          <Truck className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 flex-1">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm break-words">
                    <strong>Active Delivery:</strong>{" "}
                    {activeDelivery.product.name} to{" "}
                    {activeDelivery.customerAddress.destination}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 bg-white"
                  onClick={() => {
                    setSelectedDelivery(activeDelivery);
                    setIsModalOpen(true);
                  }}
                >
                  View Details
                </Button>
              </div>
              {activeDelivery.note && (
                <div className="mt-2 p-2 bg-blue-100 rounded text-sm">
                  <p className="font-medium text-blue-900 break-words">
                    Message from {activeDelivery.markedBy.name}:
                  </p>
                  <p className="text-blue-800 mt-1 break-words">
                    {activeDelivery.note}
                  </p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">
              Total Assignments
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            {hasActiveDelivery && stats.pending > 0 && (
              <p className="text-xs text-orange-600 mt-1 break-words">
                Complete active delivery to start these
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">
              In Transit
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.inTransit}
            </div>
            {stats.inTransit > 0 && (
              <p className="text-xs text-blue-600 mt-1 break-words">
                Active delivery in progress
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.delivered}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2 break-words">
                No Deliveries Available
              </h3>
              <p className="text-muted-foreground break-words">
                You don&#39;t have any delivery assignments at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAssignments.slice(0, 5).map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Image
                      width={40}
                      height={40}
                      src={assignment.product.image || "/placeholder.svg"}
                      alt={assignment.product.name}
                      className="h-10 w-10 rounded object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {assignment.product.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {assignment.customerAddress.destination}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={getStatusColor(assignment.status)}>
                      {assignment.status.replace("-", " ")}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDelivery(assignment);
                        setIsModalOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery History */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 break-words">
              <History className="h-5 w-5 shrink-0" />
              Delivery History
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 break-words">
              View your completed deliveries
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              userSession?.user.email &&
              fetchArchivedDeliveries(userSession.user.email, currentPage)
            }
            disabled={archivedLoading}
            className="shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                archivedLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {archivedLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : archivedDeliveries.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2 break-words">
                No Delivery History
              </h3>
              <p className="text-muted-foreground break-words">
                Your completed deliveries will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {archivedDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-muted/30 gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Image
                        width={40}
                        height={40}
                        src={delivery.product.image || "/placeholder.svg"}
                        alt={delivery.product.name}
                        className="h-10 w-10 rounded object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium break-words">
                          {delivery.product.name}
                        </p>
                        <p className="text-sm text-muted-foreground break-words">
                          {delivery.customerAddress.destination}
                        </p>
                        {delivery.deliveredAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Delivered:{" "}
                            {new Date(
                              delivery.deliveredAt
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Delivered
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setIsModalOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {(currentPage > 0 || hasMoreArchived) && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 0 || archivedLoading}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground order-1 sm:order-2">
                    Page {currentPage + 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!hasMoreArchived || archivedLoading}
                    className="w-full sm:w-auto order-3"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delivery Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription className="break-words">
              Complete information about this delivery assignment
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              {/* Product Info */}
              <div className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg">
                <Image
                  width={80}
                  height={80}
                  src={selectedDelivery.product.image || "/placeholder.svg"}
                  alt={selectedDelivery.product.name}
                  className="h-20 w-20 rounded object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg break-words">
                    {selectedDelivery.product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Quantity: {selectedDelivery.product.quantity}
                  </p>
                  <Badge
                    variant={getStatusColor(selectedDelivery.status)}
                    className="mt-2"
                  >
                    {selectedDelivery.status.replace("-", " ")}
                  </Badge>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4 shrink-0" />
                  Delivery Address
                </h4>
                <p className="text-sm break-words">
                  {selectedDelivery.customerAddress.destination}
                </p>
                {selectedDelivery.customerAddress.coordinates && (
                  <p className="text-xs text-muted-foreground mt-1 break-words">
                    Coordinates:{" "}
                    {selectedDelivery.customerAddress.coordinates.lat},{" "}
                    {selectedDelivery.customerAddress.coordinates.lng}
                  </p>
                )}
              </div>

              {/* Driver Info */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0" />
                  Driver Information
                </h4>
                <p className="text-sm font-medium break-words">
                  {selectedDelivery.driver.fullName}
                </p>
                <p className="text-xs text-muted-foreground break-words">
                  {selectedDelivery.driver.email}
                </p>
              </div>

              {/* Timeline */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0" />
                  Timeline
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground shrink-0">
                      Assigned:
                    </span>
                    <span className="font-medium break-words text-right">
                      {new Date(selectedDelivery.assignedDate).toLocaleString()}
                    </span>
                  </div>
                  {selectedDelivery.estimatedDelivery && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-muted-foreground shrink-0">
                        Estimated Delivery:
                      </span>
                      <span className="font-medium text-blue-600 break-words text-right">
                        {new Date(
                          selectedDelivery.estimatedDelivery
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedDelivery.startedAt && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-muted-foreground shrink-0">
                        Started:
                      </span>
                      <span className="font-medium break-words text-right">
                        {new Date(selectedDelivery.startedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedDelivery.deliveredAt && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-muted-foreground shrink-0">
                        Delivered:
                      </span>
                      <span className="font-medium break-words text-right">
                        {new Date(
                          selectedDelivery.deliveredAt
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message/Note */}
              {selectedDelivery.note && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2 break-words">
                    Message from {selectedDelivery.markedBy.name}
                  </h4>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {selectedDelivery.note}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 break-words">
                    {selectedDelivery.markedBy.email}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="sm:order-1"
                >
                  Close
                </Button>
                {selectedDelivery.status === "pending" && (
                  <Button
                    onClick={() => router.push("/deliveries/assignments")}
                    className="sm:order-2"
                  >
                    Go to Assignments
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
