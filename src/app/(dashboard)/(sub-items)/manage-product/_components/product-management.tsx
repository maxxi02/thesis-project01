"use client";
import { useState, useEffect, useRef } from "react";
import {
  Package,
  MoreVertical,
  Plus,
  Search,
  Grid,
  List,
  Scan,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product } from "@/types/product-types";
import type { Session } from "@/better-auth/auth-types";
import Image from "next/image";
import { NotificationHelper } from "@/notification/notification-helper";
import { getServerSession } from "@/better-auth/action";
import { ObjectDetectionModal } from "@/lib/tensorflow/object-detection-model";

interface DeliveryPersonnel {
  id: string;
  name: string;
  email: string;
  role: string;
  fcmToken?: string;
}

interface ShipmentData {
  quantity: string;
  destination: string;
  note: string;
  driverId: string;
  estimatedDelivery?: string;
}

interface ProductFormData {
  name: string;
  sku: string;
  price: string;
  stock: string;
  category: string;
  description?: string;
  image?: string;
}

export interface BatangasCityAddress {
  id: string;
  barangay: string;
  city: string;
  province: string;
  fullAddress: string;
  cityCode?: string;
  barangayCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export default function ProductManagement() {
  const sseConnectionRef = useRef<EventSource | null>(null);
  const [userSession, setUserSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<
    DeliveryPersonnel[]
  >([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showObjectDetectionModal, setShowObjectDetectionModal] =
    useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [filteredAddresses, setFilteredAddresses] = useState<
    BatangasCityAddress[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("cards");
  const [mounted, setMounted] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [shipmentData, setShipmentData] = useState<ShipmentData>({
    quantity: "",
    destination: "",
    note: "",
    driverId: "",
    estimatedDelivery: "",
  });

  const [sellData, setSellData] = useState({
    quantity: "",
    note: "",
  });

  const [editProductData, setEditProductData] = useState<ProductFormData>({
    name: "",
    sku: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    image: "",
  });

  const [newProductData, setNewProductData] = useState<ProductFormData>({
    name: "",
    sku: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    image: "",
  });
  selectedProduct;

  // api states for location
  const [apiLocations, setApiLocations] = useState<BatangasCityAddress[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setNewProductData({
          ...newProductData,
          image: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);
        // Changed to allCities=true
        const response = await fetch("/api/locations/batangas?allCities=true");
        const data = await response.json();

        if (data.success && data.locations?.length > 0) {
          setApiLocations(data.locations);
          toast.success(
            `Loaded ${data.count} locations from all Batangas cities`
          );
        } else {
          setApiLocations([]);
          toast.error("No locations available from API");
        }
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        setApiLocations([]);
        toast.error("Failed to load locations from API");
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      loadLocations();
    }
  }, [mounted]);

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAuthError = (response: Response) => {
    if (response.status === 401) {
      toast.error("Session expired. Please log in again.");
      window.location.href = "/login";
      return true;
    }
    return false;
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (handleAuthError(response)) return;

      const data = await response.json();
      setCategories(
        data.categories?.map((c: { name: string }) => c.name) || []
      );
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to fetch categories");
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      setLoading(true);
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory.trim() }),
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        toast.success("Category added successfully");
        setShowAddCategoryModal(false);
        setNewCategory("");
        await fetchCategories();
        if (showAddProductModal) {
          setNewProductData({
            ...newProductData,
            category: newCategory.trim(),
          });
        } else if (showEditModal) {
          setEditProductData({
            ...editProductData,
            category: newCategory.trim(),
          });
        }
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (handleAuthError(response)) return;

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryPersonnel = async () => {
    try {
      const response = await authClient.admin.listUsers({
        query: { limit: 100 },
      });

      if (response.data?.users) {
        const deliveryUsers = await Promise.all(
          response.data.users
            .filter((user) => user.role?.toLowerCase() === "delivery")
            .map(async (user) => {
              try {
                const driverResponse = await fetch(`/api/drivers/${user.id}`);
                const driverData = await driverResponse.json();
                return {
                  id: user.id,
                  name: user.name || "",
                  email: user.email,
                  role: user.role || "delivery",
                  fcmToken: driverData.success
                    ? driverData.driver?.fcmToken || ""
                    : "",
                };
              } catch (error) {
                console.error(
                  `Error fetching driver info for ${user.id}:`,
                  error
                );
                return {
                  id: user.id,
                  name: user.name || "",
                  email: user.email,
                  role: user.role || "delivery",
                  fcmToken: "",
                };
              }
            })
        );
        setDeliveryPersonnel(deliveryUsers);
      }
    } catch (error) {
      console.error("Failed to fetch delivery personnel:", error);
      toast.error("Failed to fetch delivery personnel");
    }
  };

  const handleAddressChange = (value: string) => {
    setAddressInput(value);
    setShipmentData({ ...shipmentData, destination: value });

    if (value.length > 1 && apiLocations.length > 0) {
      const filtered = apiLocations.filter(
        (addr: BatangasCityAddress) =>
          addr.city.toLowerCase().includes(value.toLowerCase()) ||
          addr.fullAddress.toLowerCase().includes(value.toLowerCase()) ||
          addr.barangay.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredAddresses(filtered.slice(0, 5));
      setShowDropdown(true);
    } else {
      setFilteredAddresses([]);
      setShowDropdown(false);
    }
  };

  const handleAddProduct = () => {
    setShowAddMethodModal(true);
  };

  const handleManualAdd = () => {
    setShowAddMethodModal(false);
    setImageFile(null);
    setImagePreview("");
    setNewProductData({
      name: "",
      sku: "",
      price: "",
      stock: "",
      category: "",
      description: "",
      image: "",
    });
    setShowAddProductModal(true);
  };

  const handleObjectDetectionAdd = () => {
    setShowAddMethodModal(false);
    setShowObjectDetectionModal(true);
  };

  const handleProductFound = (productName: string) => {
    setNewProductData({
      name: productName,
      sku: "",
      price: "",
      stock: "",
      category: "",
      description: "",
      image: "",
    });
    setShowObjectDetectionModal(false);
    setShowAddProductModal(true);
    toast.success("Product detected!", {
      description: `Form pre-filled with "${productName}". Please complete the remaining details.`,
    });
  };

  const confirmAddProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductData.name,
          sku:
            newProductData.sku ||
            `${newProductData.category
              .toUpperCase()
              .replace(/\s+/g, "-")}-${Date.now()}`,
          category: newProductData.category,
          price: parseFloat(newProductData.price) || 0,
          stock: parseInt(newProductData.stock) || 0,
          description: newProductData.description || "",
          image:
            newProductData.image || "/placeholder.svg?height=300&width=300",
        }),
      });

      if (handleAuthError(response)) return;

      const data = await response.json();
      if (response.ok) {
        toast.success("Product Added", {
          description: `${data.product.name} has been added successfully.`,
        });
        setShowAddProductModal(false);
        fetchProducts();
        setNewProductData({
          name: "",
          sku: "",
          price: "",
          stock: "",
          category: "",
          description: "",
          image: "",
        });
      } else {
        toast.error("Error", {
          description: data.error || "Failed to create product",
        });
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const handleSell = (product: Product) => {
    setSelectedProduct(product);
    setSellData({ quantity: "", note: "" });
    setShowSellModal(true);
  };

  const confirmSell = async () => {
    if (!selectedProduct) return;

    // Validate before sending
    const quantity = parseInt(sellData.quantity);
    if (!quantity || quantity <= 0 || quantity > selectedProduct.stock) {
      toast.error("Invalid quantity");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/products/${selectedProduct._id}/sold`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantityToDeduct: quantity,
            notes:
              sellData.note ||
              `Sold via Product Management - ${selectedProduct.name}`,
          }),
        }
      );

      if (handleAuthError(response)) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process sale");
      }

      toast.success("Sale Processed", {
        description: `${sellData.quantity} units of ${selectedProduct.name} sold successfully.`,
      });
      setShowSellModal(false);
      await fetchProducts();
    } catch (error) {
      console.error("Error processing sale:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process sale"
      );
    } finally {
      setLoading(false);
    }
  };
  const handleShip = (product: Product) => {
    setSelectedProduct(product);
    setShipmentData({
      quantity: "",
      destination: "",
      note: "",
      driverId: "",
      estimatedDelivery: "",
    });
    setShowShipModal(true);
  };

  const confirmShipment = async () => {
    if (!selectedProduct) return;

    // Prevent multiple submissions
    if (loading) {
      toast.error("Processing shipment, please wait...");
      return;
    }

    try {
      setLoading(true);

      const driver = deliveryPersonnel.find(
        (d) => d.id === shipmentData.driverId
      );
      if (!driver) {
        toast.error("Please select a delivery person");
        setLoading(false);
        return;
      }

      const selectedAddress = apiLocations.find(
        (addr: BatangasCityAddress) =>
          addr.fullAddress === shipmentData.destination
      );

      const response = await fetch(
        `/api/products/${selectedProduct._id}/to-ship`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantity: parseInt(shipmentData.quantity),
            deliveryPersonnel: {
              id: driver.id,
              fullName: driver.name,
              email: driver.email,
              fcmToken: driver.fcmToken,
            },
            destination: shipmentData.destination,
            coordinates: selectedAddress?.coordinates || null,
            note: shipmentData.note,
            estimatedDelivery: shipmentData.estimatedDelivery || null,
            markedBy: {
              name: userSession?.user?.name || "Admin",
              email: userSession?.user?.email || "admin@example.com",
              role: userSession?.user?.role || "admin",
            },
          }),
        }
      );

      if (handleAuthError(response)) {
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark as to ship");
      }

      const result = await response.json();

      // Close modal and reset BEFORE notifications to prevent double-click
      setShowShipModal(false);
      setShipmentData({
        quantity: "",
        destination: "",
        note: "",
        driverId: "",
        estimatedDelivery: "",
      });

      // Send notification (non-blocking)
      fetch("/api/notifications/newShipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverEmail: driver.email,
          shipmentData: {
            id: result.shipmentId,
            product: {
              id: selectedProduct._id,
              name: selectedProduct.name,
              sku: selectedProduct.sku,
              image: selectedProduct.image || "",
              quantity: parseInt(shipmentData.quantity),
            },
            customerAddress: {
              destination: shipmentData.destination,
              coordinates: selectedAddress?.coordinates || null,
            },
            deliveryPersonnel: {
              id: driver.id,
              fullName: driver.name,
              email: driver.email,
              fcmToken: driver.fcmToken || "",
            },
            status: "pending",
            note: shipmentData.note || "",
            assignedDate: new Date().toISOString(),
            estimatedDelivery: shipmentData.estimatedDelivery || null,
            markedBy: {
              name: userSession?.user?.name || "Admin",
              email: userSession?.user?.email || "admin@example.com",
              role: userSession?.user?.role || "admin",
            },
          },
        }),
      }).catch((err) => console.error("Notification error:", err));

      NotificationHelper.triggerNotification({
        sound: true,
        respectAudioSettings: true,
        type: "assignment",
        vibration: true,
      });

      toast.success("Shipment Confirmed", {
        description: `${parseInt(shipmentData.quantity)} units of ${
          selectedProduct.name
        } assigned to ${driver.name} for delivery.`,
      });

      await fetchProducts();
    } catch (error) {
      console.error("Error confirming shipment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to confirm shipment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditProductData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      description: product.description || "",
      image: product.image || "",
    });
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/products/${selectedProduct._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editProductData,
          price: parseFloat(editProductData.price) || 0,
          stock: parseInt(editProductData.stock) || 0,
        }),
      });

      if (handleAuthError(response)) return;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      toast.success("Product Updated", {
        description: `${selectedProduct.name} has been updated successfully.`,
      });
      setShowEditModal(false);
      await fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update product"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/products/${selectedProduct._id}`, {
        method: "DELETE",
      });

      if (handleAuthError(response)) return;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      toast.success("Product Deleted", {
        description: `${selectedProduct.name} has been deleted successfully.`,
      });
      setShowDeleteModal(false);
      await fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete product"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (stock < 10) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          In Stock
        </Badge>
      );
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

    connection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "DELIVERY_STATUS_UPDATE":
            NotificationHelper.triggerNotification({
              sound: true,
              vibration: false,
              respectAudioSettings: true,
              type: "status",
            });
            toast.info("Delivery Status Updated", {
              description: `Delivery #${data.data.assignmentId.slice(
                -6
              )} is now ${data.data.newStatus.toUpperCase()}`,
            });
            break;
          case "SHIPMENT_DELIVERED":
            NotificationHelper.triggerNotification({
              sound: true,
              vibration: true,
              respectAudioSettings: true,
              type: "completion",
            });
            toast.success("Delivery Completed! 🎉", {
              description: `${data.data.productName} has been successfully delivered`,
            });
            fetchProducts();
            break;
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    connection.onerror = () => {
      setTimeout(() => {
        if (userSession) {
          setupSSEConnection(userSession.user.id, userSession.user.email);
        }
      }, 5000);
    };
  };

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getServerSession();
      if (session?.user?.email) {
        setUserSession(session);
        setupSSEConnection(session.user.id, session.user.email);
        await NotificationHelper.initialize();
        NotificationHelper.registerUserInteraction();
      } else {
        setLoading(false);
        toast.error("Please log in to view your deliveries");
      }
    };
    fetchSession();

    return () => {
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchProducts();
      fetchCategories();
      fetchDeliveryPersonnel();
    }
  }, [mounted]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200"></div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Cards View
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Table View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No products found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm
                    ? "Try a different search term"
                    : "No products available"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product._id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square relative bg-gray-100">
                    <Image
                      width={500}
                      height={500}
                      src={product.image || ""}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(product.status!, product.stock)}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2 mb-4">
                      <h3 className="font-semibold text-lg line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description ||
                          `High-quality ${product.category.toLowerCase()} product`}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-primary">
                          ₱{product.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Stock:{" "}
                          <span className="font-medium">{product.stock}</span>
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSell(product)}
                        disabled={product.stock === 0}
                        className="w-full rounded-md"
                      >
                        🛒 Sell
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShip(product)}
                        disabled={product.stock === 0}
                        className="w-full rounded-md"
                      >
                        📦 Ship
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(product)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No products found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm
                    ? "Try a different search term"
                    : "No products available"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <div className="w-12 h-12 relative bg-gray-100 rounded-md overflow-hidden">
                            <Image
                              width={48}
                              height={48}
                              src={product.image || ""}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {product.description ||
                                `High-quality ${product.category.toLowerCase()} product`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {product.sku}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₱{product.price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{product.stock}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(product.status!, product.stock)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSell(product)}
                              disabled={product.stock === 0}
                              className="h-8 px-3"
                            >
                              🛒 Sell
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShip(product)}
                              disabled={product.stock === 0}
                              className="h-8 px-3"
                            >
                              📦 Ship
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">More options</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEdit(product)}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(product)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Method Selection Modal */}
      <Dialog open={showAddMethodModal} onOpenChange={setShowAddMethodModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Product
            </DialogTitle>
            <DialogDescription>
              Choose how you&#39;d like to add a new product to your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              onClick={handleManualAdd}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 bg-transparent"
            >
              <Edit className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Manual Entry</div>
                <div className="text-sm text-muted-foreground">
                  Enter product details manually
                </div>
              </div>
            </Button>
            <Button
              onClick={handleObjectDetectionAdd}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 bg-transparent"
            >
              <Scan className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Object Detection</div>
                <div className="text-sm text-muted-foreground">
                  Use camera to detect and identify products
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog
        open={showAddCategoryModal}
        onOpenChange={setShowAddCategoryModal}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Category
            </DialogTitle>
            <DialogDescription>
              Enter the name for the new category.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-category-name">Category Name</Label>
              <Input
                id="new-category-name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCategoryModal(false);
                setNewCategory("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={addCategory} disabled={!newCategory.trim()}>
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Product
            </DialogTitle>
            <DialogDescription>
              Enter the details for the new product.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-name">Product Name</Label>
              <Input
                id="new-name"
                value={newProductData.name}
                onChange={(e) =>
                  setNewProductData({ ...newProductData, name: e.target.value })
                }
                placeholder="Enter product name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-sku">SKU (Optional)</Label>
              <Input
                id="new-sku"
                value={newProductData.sku}
                onChange={(e) =>
                  setNewProductData({ ...newProductData, sku: e.target.value })
                }
                placeholder="Leave blank to auto-generate"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-category">Category</Label>
              <div className="flex flex-col gap-1">
                <Select
                  value={newProductData.category}
                  onValueChange={(value) =>
                    setNewProductData({ ...newProductData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="self-start p-0 h-auto text-xs"
                  onClick={() => setShowAddCategoryModal(true)}
                >
                  + Add New Category
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-price">Price</Label>
                <Input
                  id="new-price"
                  type="number"
                  step="0.01"
                  value={newProductData.price}
                  onChange={(e) =>
                    setNewProductData({
                      ...newProductData,
                      price: e.target.value,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-stock">Stock</Label>
                <Input
                  id="new-stock"
                  type="number"
                  value={newProductData.stock}
                  onChange={(e) =>
                    setNewProductData({
                      ...newProductData,
                      stock: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-description">Description</Label>
              <Textarea
                id="new-description"
                value={newProductData.description}
                onChange={(e) =>
                  setNewProductData({
                    ...newProductData,
                    description: e.target.value,
                  })
                }
                placeholder="Product description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-image">Product Image</Label>
              <Input
                id="new-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {imagePreview && (
                <div className="mt-2 relative w-full h-32 border rounded-md overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddProductModal(false);
                setImageFile(null);
                setImagePreview("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAddProduct}
              disabled={
                !newProductData.name ||
                !newProductData.category ||
                !newProductData.price
              }
            >
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Object Detection Modal */}
      <ObjectDetectionModal
        isOpen={showObjectDetectionModal}
        onOpenChange={setShowObjectDetectionModal}
        onProductFound={handleProductFound}
      />

      {/* Sell Product Modal */}
      <Dialog open={showSellModal} onOpenChange={setShowSellModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">🛒</span>
              Sell Product
            </DialogTitle>
            <DialogDescription>
              Process sale for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sell-quantity">Quantity to Sell</Label>
              <Input
                id="sell-quantity"
                type="number"
                placeholder="Enter quantity"
                value={sellData.quantity}
                onChange={(e) =>
                  setSellData({ ...sellData, quantity: e.target.value })
                }
                max={selectedProduct?.stock}
                min="1"
              />
              <p className="text-sm text-muted-foreground">
                Available stock: {selectedProduct?.stock}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sell-note">Sale Note (Optional)</Label>
              <Textarea
                id="sell-note"
                placeholder="Additional notes about this sale"
                value={sellData.note}
                onChange={(e) =>
                  setSellData({ ...sellData, note: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSellModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmSell}
              disabled={
                !sellData.quantity ||
                Number.parseInt(sellData.quantity) <= 0 ||
                Number.parseInt(sellData.quantity) >
                  (selectedProduct?.stock || 0)
              }
            >
              Process Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ship Product Modal */}
      <Dialog open={showShipModal} onOpenChange={setShowShipModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">📦</span>
              Ship Product
            </DialogTitle>
            <DialogDescription>
              Configure shipment details for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity to Ship</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={shipmentData.quantity}
                onChange={(e) =>
                  setShipmentData({ ...shipmentData, quantity: e.target.value })
                }
                max={selectedProduct?.stock}
                min="1"
              />
              <p className="text-sm text-muted-foreground">
                Available stock: {selectedProduct?.stock}
              </p>
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="destination">Destination Address</Label>
              <div className="relative">
                <Input
                  id="destination"
                  placeholder="Start typing city or street..."
                  value={addressInput}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() =>
                    addressInput.length > 1 && setShowDropdown(true)
                  }
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                {showDropdown && filteredAddresses.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 dark:bg-black dark:text-white bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredAddresses.map((address) => (
                      <li
                        key={address.id}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-black cursor-pointer"
                        onMouseDown={() => {
                          setAddressInput(address.fullAddress);
                          setShipmentData({
                            ...shipmentData,
                            destination: address.fullAddress,
                          });
                          setShowDropdown(false);
                        }}
                      >
                        <div className="font-medium">
                          {address.fullAddress
                            ? `${address.fullAddress}, `
                            : ""}
                          {address.barangay}
                        </div>
                        <div className="text-sm text-gray-500">
                          {address.city}, {address.province}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="driver">Select Driver</Label>
              <Select
                value={shipmentData.driverId}
                onValueChange={(value) =>
                  setShipmentData({ ...shipmentData, driverId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose delivery personnel" />
                </SelectTrigger>
                <SelectContent className="wrap-break-word">
                  {deliveryPersonnel.map((driver) => (
                    <SelectItem
                      className="wrap-break-word"
                      key={driver.id}
                      value={driver.id}
                    >
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Delivery Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Special instructions for delivery personnel"
                value={shipmentData.note}
                onChange={(e) =>
                  setShipmentData({ ...shipmentData, note: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estimatedDelivery">
                Estimated Delivery Date (Optional)
              </Label>
              <Input
                id="estimatedDelivery"
                type="datetime-local"
                value={shipmentData.estimatedDelivery}
                onChange={(e) =>
                  setShipmentData({
                    ...shipmentData,
                    estimatedDelivery: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShipModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmShipment}
              disabled={
                loading ||
                !shipmentData.quantity ||
                !shipmentData.destination ||
                !shipmentData.driverId ||
                Number.parseInt(shipmentData.quantity) <= 0 ||
                Number.parseInt(shipmentData.quantity) >
                  (selectedProduct?.stock || 0)
              }
            >
              {loading ? "Processing..." : "Confirm Shipment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Product
            </DialogTitle>
            <DialogDescription>
              Make changes to {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={editProductData.name}
                onChange={(e) =>
                  setEditProductData({
                    ...editProductData,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                value={editProductData.sku}
                onChange={(e) =>
                  setEditProductData({
                    ...editProductData,
                    sku: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={editProductData.price}
                onChange={(e) =>
                  setEditProductData({
                    ...editProductData,
                    price: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-stock">Stock Quantity</Label>
              <Input
                id="edit-stock"
                type="number"
                value={editProductData.stock}
                onChange={(e) =>
                  setEditProductData({
                    ...editProductData,
                    stock: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <div className="flex flex-col gap-1">
                <Select
                  value={editProductData.category}
                  onValueChange={(value) =>
                    setEditProductData({ ...editProductData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="self-start p-0 h-auto text-xs"
                  onClick={() => setShowAddCategoryModal(true)}
                >
                  + Add New Category
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editProductData.description}
                onChange={(e) =>
                  setEditProductData({
                    ...editProductData,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                value={editProductData.image || ""}
                onChange={(e) =>
                  setEditProductData({
                    ...editProductData,
                    image: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Product
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProduct?.name}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
