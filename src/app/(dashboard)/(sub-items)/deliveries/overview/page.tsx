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
  startedAt?: string;
  deliveredAt?: string;
  markedBy: {
    name: string;
    email: string;
  };
}

export default function DeliveryOverview() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSession, setUserSession] = useState<Session | null>(null);
  const sseConnectionRef = useRef<EventSource | null>(null);
  const [archivedCount, setArchivedCount] = useState(0);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const router = useRouter();

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

  // Extract unique assigned dates for calendar marking
  const getAssignedDates = (): Date[] => {
    const dates = assignments.map((a) => new Date(a.assignedDate));
    // Filter unique dates (by day)
    const uniqueDates = new Map();
    dates.forEach((d) => {
      const dateKey = d.toISOString().split("T")[0];
      uniqueDates.set(dateKey, d);
    });
    return Array.from(uniqueDates.values());
  };

  const assignedDates = getAssignedDates();

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

  useEffect(() => {
    if (userSession?.user) {
      setupSSEConnection(userSession.user.id, userSession.user.email);
    }
    return () => {
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close();
      }
    };
  }, [userSession]);

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getServerSession();
      if (session?.user?.email) {
        setUserSession(session);
        await fetchAssignments(session.user.email);
        await fetchArchivedCount(session.user.email);
        await NotificationHelper.initialize();
      } else {
        setLoading(false);
        toast.error("Please log in to view your deliveries");
      }
    };
    fetchSession();
  }, []);

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

  const fetchAssignments = async (userEmail: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/deliveries/assigned?driverEmail=${encodeURIComponent(userEmail)}`
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your delivery assignments...</p>
        </div>
      </div>
    );
  }

  if (!userSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p className="text-muted-foreground mt-2">
            Please log in to view your delivery assignments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          {hasActiveDelivery && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="default" className="bg-blue-600">
                <Truck className="h-3 w-3 mr-1" />
                Active Delivery
              </Badge>
              <span className="text-sm text-blue-600">
                Complete current delivery to start new ones
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchAssignments(userSession.user.email)}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {/* Calendar Sheet Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Delivery Calendar
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[450px]">
              <SheetHeader>
                <SheetTitle>Delivery Calendar</SheetTitle>
                <SheetDescription>
                  View all dates with assigned deliveries marked in blue.
                </SheetDescription>
              </SheetHeader>
              <div className="m-2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border w-full"
                  required={false}
                  modifiers={{
                    assigned: assignedDates,
                  }}
                  modifiersClassNames={{
                    assigned: "bg-blue-100 text-blue-800 hover:bg-blue-200",
                  }}
                  modifiersStyles={{
                    assigned: {
                      border: "2px solid blue",
                      fontWeight: "bold",
                    },
                  }}
                />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {assignedDates.length} delivery dates marked
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {hasActiveDelivery && activeDelivery && (
        <Alert className="">
          <Truck className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Active Delivery:</strong> {activeDelivery.product.name}{" "}
                to {activeDelivery.customerAddress.destination}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/deliveries/assignments")}
              >
                View Details
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assignments
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            {hasActiveDelivery && stats.pending > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                Complete active delivery to start these
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.inTransit}
            </div>
            {stats.inTransit > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                Active delivery in progress
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.delivered}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Including archived deliveries
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Deliveries Available
              </h3>
              <p className="text-muted-foreground">
                You don&#39;t have any delivery assignments at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAssignments.slice(0, 5).map((assignment) => (
                <div
                  key={assignment.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    assignment.status === "in-transit" ? "" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      width={500}
                      height={500}
                      src={
                        assignment.product.image ||
                        "/placeholder.svg?height=40&width=40"
                      }
                      alt={assignment.product.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <div>
                      <p className="font-medium">{assignment.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.customerAddress.destination}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(assignment.status)}>
                      {assignment.status.replace("-", " ")}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/deliveries/assignments")}
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
    </div>
  );
}
