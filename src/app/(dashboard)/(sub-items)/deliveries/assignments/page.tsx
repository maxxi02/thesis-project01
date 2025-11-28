// app/(dashboard)/deliveries/assignments/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Package,
  MapPin,
  User,
  MessageSquare,
  Navigation,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Truck,
  XCircle,
  AlertTriangle,
  Map,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Session } from "@/better-auth/auth-types";
import { NotificationHelper } from "../../../../../notification/notification-helper";
import { getServerSession } from "@/better-auth/action";
import dynamic from "next/dynamic";
import { CoordinatesResponse } from "@/types/coordinates";

const DeliveryMap = dynamic(() => import("../_components/delivery-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

const isUrgent = (estimatedDelivery?: string) => {
  if (!estimatedDelivery) return false;
  const now = new Date().getTime();
  const deliveryTime = new Date(estimatedDelivery).getTime();
  const hoursUntilDelivery = (deliveryTime - now) / (1000 * 60 * 60);
  return hoursUntilDelivery <= 2 && hoursUntilDelivery > 0;
};

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
  archivedAt?: string; // Add this field
  estimatedDelivery?: string;
  markedBy: {
    name: string;
    email: string;
  };
}

interface DeliveryNotificationProps {
  assignment: DeliveryAssignment;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusUpdate: (id: string, newStatus: string) => void;
  userSession: Session;
  hasActiveDelivery: boolean;
  canStartDelivery: boolean;
  onFocusOnMap: (assignmentId: string) => void;
}

function DeliveryNotification({
  assignment,
  isExpanded,
  onToggleExpand,
  onStatusUpdate,
  hasActiveDelivery,
  canStartDelivery,
  onFocusOnMap,
}: DeliveryNotificationProps) {
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
        return <Navigation className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in-transit":
        return "In Transit";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  if (!isExpanded) {
    return (
      <Card
        className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
          assignment.status === "in-transit"
            ? "border-l-blue-500 bg-blue-50/30"
            : isUrgent(assignment.estimatedDelivery)
              ? "border-l-orange-500 bg-orange-50/30"
              : "border-l-gray-300"
        }`}
        onClick={onToggleExpand}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
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
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {assignment.product.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {assignment.customerAddress.destination}
                </p>
                {assignment.estimatedDelivery && (
                  <p
                    className={`text-xs flex items-center gap-1 mt-1 ${
                      isUrgent(assignment.estimatedDelivery)
                        ? "text-orange-600 font-medium"
                        : "text-blue-600"
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    Due:{" "}
                    {new Date(
                      assignment.estimatedDelivery
                    ).toLocaleDateString()}{" "}
                    {new Date(assignment.estimatedDelivery).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusColor(assignment.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(assignment.status)}
                  <span>{getStatusText(assignment.status)}</span>
                </div>
              </Badge>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`border-l-4 ${
        assignment.status === "in-transit"
          ? "border-l-blue-500 bg-blue-50/30"
          : "border-l-gray-300"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold">
              Delivery #{assignment.id.slice(-6).toUpperCase()}
            </h3>
            <Badge variant={getStatusColor(assignment.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(assignment.status)}
                <span>{getStatusText(assignment.status)}</span>
              </div>
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleExpand}>
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Assigned on {new Date(assignment.assignedDate).toLocaleDateString()}
        </p>
        {assignment.estimatedDelivery && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3 w-3 text-blue-600" />
            <span className="text-blue-600 font-medium">
              Estimated Delivery:{" "}
              {new Date(assignment.estimatedDelivery).toLocaleDateString()} at{" "}
              {new Date(assignment.estimatedDelivery).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
        {assignment.startedAt && (
          <p className="text-sm text-blue-600">
            Started on {new Date(assignment.startedAt).toLocaleDateString()} at{" "}
            {new Date(assignment.startedAt).toLocaleTimeString()}
          </p>
        )}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Assigned by:</span>
          <span className="font-medium">{assignment.markedBy.name}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Product Details</h4>
          </div>
          <div className="flex items-center space-x-3 bg-muted/50 p-3 rounded-lg">
            <Image
              width={500}
              height={500}
              src={
                assignment.product.image ||
                "/placeholder.svg?height=48&width=48"
              }
              alt={assignment.product.name}
              className="h-12 w-12 rounded object-cover"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">{assignment.product.name}</p>
              <p className="text-xs text-muted-foreground">
                Quantity: {assignment.product.quantity} units
              </p>
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Delivery Address</h4>
            {assignment.customerAddress.coordinates && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFocusOnMap(assignment.id)}
              >
                <Map className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {assignment.customerAddress.destination}
            </p>
          </div>
        </div>
        {assignment.note && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Special Instructions</h4>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                <p className="text-sm text-yellow-800">{assignment.note}</p>
              </div>
            </div>
          </>
        )}

        {assignment.estimatedDelivery &&
          isUrgent(assignment.estimatedDelivery) && (
            <>
              <Separator />
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Urgent Delivery!</strong> This order is due within 2
                  hours. Expected by{" "}
                  {new Date(assignment.estimatedDelivery).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </AlertDescription>
              </Alert>
            </>
          )}
        {assignment.status === "pending" &&
          hasActiveDelivery &&
          !canStartDelivery && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                You cannot start a new delivery while you have an active
                delivery in progress. Please complete your current delivery
                first.
              </AlertDescription>
            </Alert>
          )}
        <div className="pt-2 space-y-2">
          {assignment.status === "pending" && (
            <Button
              className="w-full"
              size="sm"
              onClick={() => onStatusUpdate(assignment.id, "in-transit")}
              disabled={hasActiveDelivery && !canStartDelivery}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {hasActiveDelivery && !canStartDelivery
                ? "Cannot Start - Active Delivery"
                : "Start Delivery"}
            </Button>
          )}
          {assignment.status === "in-transit" && (
            <div className="space-y-2">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                  <Truck className="h-4 w-4" />
                  Delivery in Progress
                </div>
                <p className="text-blue-700 text-xs mt-1">
                  Complete this delivery before starting another one
                </p>
              </div>
              <Button
                className="w-full"
                size="sm"
                variant="default"
                onClick={() => onStatusUpdate(assignment.id, "delivered")}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Delivered
              </Button>
              <Button
                className="w-full"
                size="sm"
                variant="destructive"
                onClick={() => onStatusUpdate(assignment.id, "cancelled")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Delivery
              </Button>
            </div>
          )}
          {assignment.status === "delivered" && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-700">
                Delivery Completed Successfully!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Delivered on{" "}
                {assignment.deliveredAt
                  ? new Date(assignment.deliveredAt).toLocaleDateString()
                  : "N/A"}
              </p>
              <p className="text-xs text-green-600 mt-2">
                Thank you for your service!
              </p>
            </div>
          )}
          {assignment.status === "cancelled" && (
            <div className="text-center py-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">
                Delivery Cancelled
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This delivery has been cancelled
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DeliveryAssignments() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSession, setUserSession] = useState<Session | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedAssignment, setSelectedAssignment] =
    useState<DeliveryAssignment | null>(null);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{
    lat: number;
    lng: number;
    id: string;
    name?: string;
    address?: string;
  } | null>(null);
  const sseConnectionRef = useRef<EventSource | null>(null);

  // Add this function inside the DeliveryAssignments component
  const fetchCoordinatesForAssignment = async (
    address: string
  ): Promise<{ lat: number; lng: number } | null> => {
    try {
      console.log("📍 [ASSIGNMENTS] Fetching coordinates for:", address);

      const response = await fetch("/api/locations/coordinates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data: CoordinatesResponse = await response.json();

      if (data.success && data.coordinates) {
        console.log("✅ [ASSIGNMENTS] Coordinates found:", data.coordinates);
        return data.coordinates;
      }

      console.warn("⚠️ [ASSIGNMENTS] No coordinates found for:", address);
      return null;
    } catch (error) {
      console.error("❌ [ASSIGNMENTS] Error fetching coordinates:", error);
      return null;
    }
  };

  const [archivedCount, setArchivedCount] = useState(0);

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
  const setupSSEConnection = (userId: string, userEmail: string) => {
    if (sseConnectionRef.current) {
      sseConnectionRef.current.close();
    }
    const connection = new EventSource(
      `/api/sse?userId=${userId}&userEmail=${encodeURIComponent(userEmail)}`
    );
    sseConnectionRef.current = connection;
    connection.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "DELIVERY_STATUS_UPDATE":
            if (userSession?.user.email) {
              fetchAssignments(userSession.user.email);
              fetchArchivedCount(userSession.user.email);
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
              await fetchAssignments(userSession.user.email);
            }

            // If coordinates are provided, use them; otherwise fetch them
            let coordinates = data.data.coordinates;
            if (!coordinates?.lat || !coordinates?.lng) {
              console.log("📍 [SSE] No coordinates in SSE data, fetching...");
              coordinates = await fetchCoordinatesForAssignment(
                data.data.destination
              );
            }

            if (coordinates?.lat && coordinates?.lng) {
              setSelectedMapLocation({
                id: data.data.assignmentId,
                lat: coordinates.lat,
                lng: coordinates.lng,
                name: data.data.productName,
                address: data.data.destination,
              });
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

      // Fetch coordinates for assignments that don't have them
      const assignmentsWithCoordinates = await Promise.all(
        validAssignments.map(async (assignment: DeliveryAssignment) => {
          // If coordinates already exist, return as-is
          if (
            assignment.customerAddress.coordinates?.lat &&
            assignment.customerAddress.coordinates?.lng
          ) {
            console.log(
              "✅ [ASSIGNMENTS] Assignment already has coordinates:",
              assignment.id
            );
            return assignment;
          }

          // Fetch coordinates using the new API
          console.log(
            "📍 [ASSIGNMENTS] Fetching coordinates for assignment:",
            assignment.id
          );
          const coordinates = await fetchCoordinatesForAssignment(
            assignment.customerAddress.destination
          );

          // Return assignment with fetched coordinates
          return {
            ...assignment,
            customerAddress: {
              ...assignment.customerAddress,
              coordinates: coordinates || undefined,
            },
          };
        })
      );

      console.log(
        "📍 [ASSIGNMENTS] Final assignments with coordinates:",
        assignmentsWithCoordinates.map((a) => ({
          id: a.id,
          hasCoordinates: !!a.customerAddress.coordinates,
        }))
      );

      setAssignments(assignmentsWithCoordinates);
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

  const handleStatusUpdate = async (
    assignmentId: string,
    newStatus: string
  ) => {
    if (!userSession) return;
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment || assignment.driver.email !== userSession.user.email) {
      toast.error("Unauthorized: You can only update your own deliveries");
      return;
    }
    const hasActiveDelivery = assignments.some(
      (a) => a.status === "in-transit"
    );
    if (
      newStatus === "in-transit" &&
      hasActiveDelivery &&
      assignment.status === "pending"
    ) {
      toast.error("Cannot start new delivery", {
        description:
          "You must complete your current delivery before starting a new one.",
      });
      return;
    }
    try {
      const response = await fetch(`/api/deliveries/${assignmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          driverEmail: userSession.user.email,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }
      const data = await response.json();
      if (data.delivery.driver.email !== userSession.user.email) {
        throw new Error("Security error: Assignment ownership mismatch");
      }
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? data.delivery : a))
      );
      if (newStatus === "delivered") {
        toast.success("Delivery Completed", {
          description: "Great job! This delivery has been archived.",
        });
        // Immediately refetch to update counts (no delay needed)
        if (userSession?.user.email) {
          await fetchAssignments(userSession.user.email);
          await fetchArchivedCount(userSession.user.email);
        }
      } else if (newStatus === "cancelled") {
        toast.success("Delivery Cancelled");
      } else if (newStatus === "in-transit") {
        toast.success("Delivery Started", {
          description: "You can now proceed with the delivery.",
        });
      }
      if (newStatus === "in-transit") {
        await fetch("/api/notifications/delivery-started", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliveryId: assignmentId,
            driverName: assignment.driver.fullName,
            driverEmail: assignment.driver.email,
          }),
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update delivery status"
      );
    }
  };
  const toggleCardExpansion = (assignmentId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  const focusOnAssignment = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (
      assignment?.customerAddress.coordinates?.lat &&
      assignment?.customerAddress.coordinates?.lng
    ) {
      setSelectedMapLocation({
        id: assignmentId,
        lat: assignment.customerAddress.coordinates.lat,
        lng: assignment.customerAddress.coordinates.lng,
        name: assignment.product.name,
        address: assignment.customerAddress.destination,
      });
    } else {
      toast.error("Location coordinates not available for this delivery");
    }
  };

  const hasActiveDelivery = assignments.some((a) => a.status === "in-transit");
  const activeDelivery = assignments.find((a) => a.status === "in-transit");

  const mapLocations = assignments
    .filter(
      (assignment) =>
        assignment.customerAddress.coordinates?.lat &&
        assignment.customerAddress.coordinates?.lng &&
        assignment.status === "in-transit"
    )
    .map((assignment) => ({
      id: assignment.id,
      lat: assignment.customerAddress.coordinates!.lat,
      lng: assignment.customerAddress.coordinates!.lng,
      name: assignment.product.name,
      address: assignment.customerAddress.destination,
      status: assignment.status,
    }));

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
        </div>
      </div>

      {hasActiveDelivery && activeDelivery && (
        <Alert className="flex items-center md:justify-start justify-center">
          <Truck />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Active Delivery:</strong> {activeDelivery.product.name}{" "}
                to {activeDelivery.customerAddress.destination}
              </div>
              <Button
                className="m-2"
                size="sm"
                variant="outline"
                onClick={() => {
                  setExpandedCards(new Set([activeDelivery.id]));
                }}
              >
                View Details
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Map Section */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            {mapLocations.length > 0 ? (
              <DeliveryMap
                center={
                  selectedMapLocation ||
                  mapLocations[0] || { lat: 14.5995, lng: 120.9842 }
                }
                locations={mapLocations}
                selectedLocationId={selectedMapLocation?.id}
              />
            ) : (
              <div className="flex items-center justify-center h-full border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No delivery locations to display
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center space-y-4">
              <Package className="h-16 w-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-semibold">
                No Deliveries Available
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don&#39;t have any delivery assignments at the moment.
                Please standby for new assignments.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-blue-800 text-sm">
                  <strong>Status:</strong> Standby - Ready for assignments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        sortedAssignments.map((assignment) => (
          <DeliveryNotification
            key={assignment.id}
            assignment={assignment}
            isExpanded={expandedCards.has(assignment.id)}
            onToggleExpand={() => toggleCardExpansion(assignment.id)}
            onStatusUpdate={handleStatusUpdate}
            userSession={userSession}
            hasActiveDelivery={hasActiveDelivery}
            canStartDelivery={
              assignment.status === "in-transit" || !hasActiveDelivery
            }
            onFocusOnMap={focusOnAssignment}
          />
        ))
      )}

      <Dialog
        open={!!selectedAssignment}
        onOpenChange={() => setSelectedAssignment(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
            <DialogDescription>
              Complete information about this delivery assignment
            </DialogDescription>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Product Information</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Name:</strong> {selectedAssignment.product.name}
                    </p>
                    <p>
                      <strong>Quantity:</strong>{" "}
                      {selectedAssignment.product.quantity}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <Badge variant={getStatusColor(selectedAssignment.status)}>
                    {selectedAssignment.status.replace("-", " ")}
                  </Badge>
                </div>
              </div>
              {selectedAssignment.estimatedDelivery && (
                <div>
                  <h4 className="font-semibold mb-2">Estimated Delivery</h4>
                  <div className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">
                      {new Date(
                        selectedAssignment.estimatedDelivery
                      ).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(
                        selectedAssignment.estimatedDelivery
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <h4 className="font-semibold mb-2">Delivery Address</h4>
                <p className="text-sm">
                  {selectedAssignment.customerAddress.destination}
                </p>
                {selectedAssignment.customerAddress.coordinates && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      focusOnAssignment(selectedAssignment.id);
                    }}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    View on Map
                  </Button>
                )}
              </div>
              {selectedAssignment.note && (
                <div>
                  <h4 className="font-semibold mb-2">Special Instructions</h4>
                  <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                    <p className="text-sm text-yellow-800">
                      {selectedAssignment.note}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
