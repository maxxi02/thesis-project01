// "use client";

// import { useState, useEffect, useRef } from "react";
// import { Bell, BellRing, X, Trash2 } from "lucide-react";
// import { toast } from "sonner";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import type { Notification, NotificationResponse } from "@/types/notification";

// interface NotificationBellProps {
//   userId?: string;
//   className?: string;
// }

// export function NotificationBell({
//   userId,
//   className = "",
// }: NotificationBellProps) {
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [unreadCount, setUnreadCount] = useState<number>(0);
//   const [isOpen, setIsOpen] = useState<boolean>(false);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const eventSourceRef = useRef<EventSource | null>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Fetch notifications from API
//   const fetchNotifications = async (): Promise<void> => {
//     try {
//       setIsLoading(true);
//       const response = await fetch("/api/notifications?limit=50");

//       if (!response.ok) {
//         throw new Error("Failed to fetch notifications");
//       }

//       const data: NotificationResponse = await response.json();
//       setNotifications(data.notifications);
//       setUnreadCount(data.unreadCount);
//     } catch (error) {
//       console.error("Failed to fetch notifications:", error);
//       toast.error("Failed to load notifications");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Initialize notifications and setup real-time updates
//   useEffect(() => {
//     fetchNotifications();

//     // Setup Server-Sent Events for real-time notifications
//     if (userId) {
//       const eventSource = new EventSource(
//         `/api/notifications/stream?userId=${userId}`
//       );
//       eventSourceRef.current = eventSource;

//       eventSource.onmessage = (event) => {
//         try {
//           const newNotification: Notification = JSON.parse(event.data);

//           // Add new notification to the list
//           setNotifications((prev) => [newNotification, ...prev]);
//           setUnreadCount((prev) => prev + 1);

//           // Play notification sound and show toast
//           playNotificationSound();
//           toast.info(newNotification.message, {
//             duration: 5000,
//             action: {
//               label: "View",
//               onClick: () => setIsOpen(true),
//             },
//           });
//         } catch (error) {
//           console.error("Error parsing notification:", error);
//         }
//       };

//       eventSource.onerror = (error) => {
//         console.error("SSE connection error:", error);
//         // Attempt to reconnect after a delay
//         setTimeout(() => {
//           fetchNotifications();
//         }, 5000);
//       };
//     }

//     return () => {
//       if (eventSourceRef.current) {
//         eventSourceRef.current.close();
//       }
//     };
//   }, [userId]);

//   // Handle click outside to close dropdown
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsOpen(false);
//       }
//     };

//     if (isOpen) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [isOpen]);

//   // Play notification sound
//   const playNotificationSound = (): void => {
//     try {
//       const audio = new Audio("/notification.mp3");
//       // Set volume to be less intrusive
//       audio.volume = 0.3;
//       audio.play().catch((e) => {
//         console.log("Audio play failed (user interaction required):", e);
//       });
//     } catch (error) {
//       console.error("Audio play failed:", error);
//     }
//   };

//   // Mark notification as read
//   const markAsRead = async (id: string): Promise<void> => {
//     try {
//       const response = await fetch(`/api/notifications/${id}`, {
//         method: "PUT",
//       });

//       if (!response.ok) {
//         throw new Error("Failed to mark as read");
//       }

//       // Update local state
//       setNotifications((prev) =>
//         prev.map((notification) =>
//           notification._id === id
//             ? { ...notification, read: true }
//             : notification
//         )
//       );

//       setUnreadCount((prev) => Math.max(0, prev - 1));
//     } catch (error) {
//       console.error("Failed to mark notification as read:", error);
//       toast.error("Failed to mark as read");
//     }
//   };

//   // Delete notification
//   const deleteNotification = async (id: string): Promise<void> => {
//     try {
//       const response = await fetch(`/api/notifications/${id}`, {
//         method: "DELETE",
//       });

//       if (!response.ok) {
//         throw new Error("Failed to delete notification");
//       }

//       // Update local state
//       const notificationToDelete = notifications.find((n) => n._id === id);
//       setNotifications((prev) => prev.filter((n) => n._id !== id));

//       if (notificationToDelete && !notificationToDelete.read) {
//         setUnreadCount((prev) => Math.max(0, prev - 1));
//       }

//       toast.success("Notification deleted");
//     } catch (error) {
//       console.error("Failed to delete notification:", error);
//       toast.error("Failed to delete notification");
//     }
//   };

//   // Mark all as read
//   const markAllAsRead = async (): Promise<void> => {
//     try {
//       const unreadNotifications = notifications.filter((n) => !n.read);

//       // Mark all unread notifications as read
//       await Promise.all(
//         unreadNotifications.map((notification) =>
//           fetch(`/api/notifications/${notification._id}`, { method: "PUT" })
//         )
//       );

//       setNotifications((prev) =>
//         prev.map((notification) => ({ ...notification, read: true }))
//       );
//       setUnreadCount(0);

//       toast.success("All notifications marked as read");
//     } catch (error) {
//       console.error("Failed to mark all as read:", error);
//       toast.error("Failed to mark all as read");
//     }
//   };

//   // Format time for display
//   const formatTime = (dateString: string): string => {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInMinutes = Math.floor(
//       (now.getTime() - date.getTime()) / (1000 * 60)
//     );

//     if (diffInMinutes < 1) return "Just now";
//     if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
//     if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
//     return date.toLocaleDateString();
//   };

//   return (
//     <div className={`relative ${className}`} ref={dropdownRef}>
//       {/* Bell Button */}
//       <Button
//         variant="ghost"
//         size="sm"
//         onClick={() => setIsOpen(!isOpen)}
//         className="relative p-2 hover:bg-gray-100 rounded-full"
//       >
//         {unreadCount > 0 ? (
//           <BellRing className="h-6 w-6 text-blue-600" />
//         ) : (
//           <Bell className="h-6 w-6 text-gray-600" />
//         )}

//         {/* Unread Badge */}
//         {unreadCount > 0 && (
//           <Badge
//             variant="destructive"
//             className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
//           >
//             {unreadCount > 99 ? "99+" : unreadCount}
//           </Badge>
//         )}
//       </Button>

//       {/* Dropdown */}
//       {isOpen && (
//         <div className="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-lg border border-gray-200 z-50 max-h-[80vh] flex flex-col">
//           {/* Header */}
//           <div className="p-4 border-b border-gray-200 flex items-center justify-between">
//             <h3 className="font-semibold text-lg">Notifications</h3>
//             <div className="flex items-center gap-2">
//               {unreadCount > 0 && (
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={markAllAsRead}
//                   className="text-xs"
//                 >
//                   Mark all read
//                 </Button>
//               )}
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={() => setIsOpen(false)}
//                 className="p-1 h-8 w-8"
//               >
//                 <X className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>

//           {/* Content */}
//           <ScrollArea className="flex-1 max-h-96">
//             {isLoading ? (
//               <div className="p-4 text-center text-gray-500">
//                 Loading notifications...
//               </div>
//             ) : notifications.length > 0 ? (
//               <div className="divide-y divide-gray-100">
//                 {notifications.map((notification) => (
//                   <div
//                     key={notification._id}
//                     className={`p-4 hover:bg-gray-50 transition-colors ${
//                       !notification.read
//                         ? "bg-blue-50 border-l-4 border-l-blue-500"
//                         : ""
//                     }`}
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="flex-1 min-w-0">
//                         <p
//                           className={`text-sm ${!notification.read ? "font-medium" : ""}`}
//                         >
//                           {notification.message}
//                         </p>
//                         <div className="flex items-center gap-2 mt-2">
//                           <span className="text-xs text-gray-500">
//                             {formatTime(notification.createdAt)}
//                           </span>
//                           {notification.type && (
//                             <Badge variant="secondary" className="text-xs">
//                               {notification.type}
//                             </Badge>
//                           )}
//                         </div>
//                       </div>

//                       <div className="flex items-center gap-1">
//                         {!notification.read && (
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => markAsRead(notification._id)}
//                             className="text-xs p-1 h-6"
//                           >
//                             Mark read
//                           </Button>
//                         )}
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => deleteNotification(notification._id)}
//                           className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
//                         >
//                           <Trash2 className="h-3 w-3" />
//                         </Button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="p-8 text-center text-gray-500">
//                 <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
//                 <p className="text-sm">No notifications yet</p>
//                 <p className="text-xs text-gray-400 mt-1">
//                   You&#39;ll see delivery updates here
//                 </p>
//               </div>
//             )}
//           </ScrollArea>
//         </div>
//       )}
//     </div>
//   );
// }
