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
import { CustomModal } from "./custom-modal";
import { CustomDialog } from "./custom-dialog";

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

// Hardcoded Batangas streets with coordinates
const BATANGAS_STREETS: BatangasCityAddress[] = [
  // Batangas City (1-20)
  {
    id: "1",
    barangay: "Poblacion",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Rizal Avenue, Poblacion, Batangas City",
    coordinates: { lat: 13.7572, lng: 121.0581 },
  },
  {
    id: "2",
    barangay: "Sto. Domingo",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Kumintang Ibaba, Sto. Domingo, Batangas City",
    coordinates: { lat: 13.7589, lng: 121.0602 },
  },
  {
    id: "3",
    barangay: "Bolbok",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "National Highway, Bolbok, Batangas City",
    coordinates: { lat: 13.7523, lng: 121.0668 },
  },
  {
    id: "4",
    barangay: "Balagtas",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Balagtas Boulevard, Batangas City",
    coordinates: { lat: 13.7591, lng: 121.0568 },
  },
  {
    id: "5",
    barangay: "Sta. Clara",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Sta. Clara Road, Batangas City",
    coordinates: { lat: 13.7642, lng: 121.0543 },
  },
  {
    id: "6",
    barangay: "Pallocan",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Pallocan West, Batangas City",
    coordinates: { lat: 13.7425, lng: 121.0847 },
  },
  {
    id: "7",
    barangay: "Gulod",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Gulod Labac, Batangas City",
    coordinates: { lat: 13.7348, lng: 121.0923 },
  },
  {
    id: "8",
    barangay: "Wawa",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Wawa, Batangas City",
    coordinates: { lat: 13.7276, lng: 121.0991 },
  },
  {
    id: "9",
    barangay: "Calicanto",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Calicanto, Batangas City",
    coordinates: { lat: 13.7528, lng: 121.0573 },
  },
  {
    id: "10",
    barangay: "Kumintang",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Kumintang Ilaya, Batangas City",
    coordinates: { lat: 13.7624, lng: 121.0641 },
  },
  {
    id: "11",
    barangay: "Cuta",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Cuta East, Batangas City",
    coordinates: { lat: 13.7692, lng: 121.0693 },
  },
  {
    id: "12",
    barangay: "Sta. Rita",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Sta. Rita Karsada, Batangas City",
    coordinates: { lat: 13.7748, lng: 121.0749 },
  },
  {
    id: "13",
    barangay: "Alangilan",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Alangilan, Batangas City",
    coordinates: { lat: 13.7795, lng: 121.0796 },
  },
  {
    id: "14",
    barangay: "San Jose Sico",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "San Jose Sico, Batangas City",
    coordinates: { lat: 13.7469, lng: 121.0897 },
  },
  {
    id: "15",
    barangay: "Banay-banay",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Banay-banay, Batangas City",
    coordinates: { lat: 13.7402, lng: 121.0964 },
  },
  {
    id: "16",
    barangay: "Marawoy",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Marawoy, Batangas City",
    coordinates: { lat: 13.7328, lng: 121.1036 },
  },
  {
    id: "17",
    barangay: "San Isidro",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "San Isidro, Batangas City",
    coordinates: { lat: 13.7259, lng: 121.1098 },
  },
  {
    id: "18",
    barangay: "San Pedro",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "San Pedro, Batangas City",
    coordinates: { lat: 13.7192, lng: 121.1167 },
  },
  {
    id: "19",
    barangay: "Sta. Rita Aplaya",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Sta. Rita Aplaya, Batangas City",
    coordinates: { lat: 13.7723, lng: 121.0824 },
  },
  {
    id: "20",
    barangay: "Malitam",
    city: "Batangas City",
    province: "Batangas",
    fullAddress: "Malitam, Batangas City",
    coordinates: { lat: 13.7658, lng: 121.0891 },
  },

  // Lipa City (21-35)
  {
    id: "21",
    barangay: "Marawoy",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Marawoy, Lipa City, Batangas",
    coordinates: { lat: 13.9418, lng: 121.1624 },
  },
  {
    id: "22",
    barangay: "Sabang",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Sabang, Lipa City, Batangas",
    coordinates: { lat: 13.9402, lng: 121.1598 },
  },
  {
    id: "23",
    barangay: "Poblacion",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "J.P. Laurel Highway, Poblacion, Lipa City",
    coordinates: { lat: 13.9421, lng: 121.1638 },
  },
  {
    id: "24",
    barangay: "Antipolo",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Antipolo, Lipa City",
    coordinates: { lat: 13.9462, lng: 121.1583 },
  },
  {
    id: "25",
    barangay: "Banay-banay",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Banay-banay, Lipa City",
    coordinates: { lat: 13.9496, lng: 121.1527 },
  },
  {
    id: "26",
    barangay: "Bulacnin",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Bulacnin, Lipa City",
    coordinates: { lat: 13.9531, lng: 121.1472 },
  },
  {
    id: "27",
    barangay: "Cumba",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Cumba, Lipa City",
    coordinates: { lat: 13.9563, lng: 121.1418 },
  },
  {
    id: "28",
    barangay: "Lodlod",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Lodlod, Lipa City",
    coordinates: { lat: 13.9595, lng: 121.1363 },
  },
  {
    id: "29",
    barangay: "Mabini",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Mabini Avenue, Lipa City",
    coordinates: { lat: 13.9382, lng: 121.1563 },
  },
  {
    id: "30",
    barangay: "San Carlos",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "San Carlos, Lipa City",
    coordinates: { lat: 13.9351, lng: 121.1624 },
  },
  {
    id: "31",
    barangay: "Tambo",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Tambo, Lipa City",
    coordinates: { lat: 13.9324, lng: 121.1589 },
  },
  {
    id: "32",
    barangay: "Tangob",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Tangob, Lipa City",
    coordinates: { lat: 13.9297, lng: 121.1554 },
  },
  {
    id: "33",
    barangay: "Tibig",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Tibig, Lipa City",
    coordinates: { lat: 13.927, lng: 121.1519 },
  },
  {
    id: "34",
    barangay: "Tipacan",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Tipacan, Lipa City",
    coordinates: { lat: 13.9243, lng: 121.1484 },
  },
  {
    id: "35",
    barangay: "Pusil",
    city: "Lipa City",
    province: "Batangas",
    fullAddress: "Pusil, Lipa City",
    coordinates: { lat: 13.9216, lng: 121.1449 },
  },

  // Tanauan City (36-50)
  {
    id: "36",
    barangay: "Poblacion",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "J.P. Laurel Street, Poblacion, Tanauan City",
    coordinates: { lat: 14.0869, lng: 121.1502 },
  },
  {
    id: "37",
    barangay: "Santor",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Santor, Tanauan City",
    coordinates: { lat: 14.0806, lng: 121.1431 },
  },
  {
    id: "38",
    barangay: "Talaga",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Talaga, Tanauan City",
    coordinates: { lat: 14.0741, lng: 121.1363 },
  },
  {
    id: "39",
    barangay: "Ambulong",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Ambulong, Tanauan City",
    coordinates: { lat: 14.0673, lng: 121.1297 },
  },
  {
    id: "40",
    barangay: "Bagbag",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Bagbag, Tanauan City",
    coordinates: { lat: 14.0917, lng: 121.1574 },
  },
  {
    id: "41",
    barangay: "Balele",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Balele, Tanauan City",
    coordinates: { lat: 14.0845, lng: 121.1642 },
  },
  {
    id: "42",
    barangay: "Banadero",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Banadero, Tanauan City",
    coordinates: { lat: 14.0773, lng: 121.1709 },
  },
  {
    id: "43",
    barangay: "Mabini Avenue",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Mabini Avenue, Tanauan City",
    coordinates: { lat: 14.0902, lng: 121.1446 },
  },
  {
    id: "44",
    barangay: "Natatas",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Natatas, Tanauan City",
    coordinates: { lat: 14.0831, lng: 121.1379 },
  },
  {
    id: "45",
    barangay: "Pagaspas",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Pagaspas, Tanauan City",
    coordinates: { lat: 14.0759, lng: 121.1312 },
  },
  {
    id: "46",
    barangay: "Pantay Matanda",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Pantay Matanda, Tanauan City",
    coordinates: { lat: 14.0687, lng: 121.1245 },
  },
  {
    id: "47",
    barangay: "Sala",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Sala, Tanauan City",
    coordinates: { lat: 14.095, lng: 121.1519 },
  },
  {
    id: "48",
    barangay: "Sambat",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Sambat, Tanauan City",
    coordinates: { lat: 14.0878, lng: 121.1586 },
  },
  {
    id: "49",
    barangay: "Ulango",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Ulango, Tanauan City",
    coordinates: { lat: 14.0806, lng: 121.1653 },
  },
  {
    id: "50",
    barangay: "Wawa",
    city: "Tanauan City",
    province: "Batangas",
    fullAddress: "Wawa, Tanauan City",
    coordinates: { lat: 14.0734, lng: 121.172 },
  },

  // Malvar (51-60)
  {
    id: "51",
    barangay: "San Pioquinto",
    city: "Malvar",
    province: "Batangas",
    fullAddress: "San Pioquinto, Malvar, Batangas",
    coordinates: { lat: 14.0456, lng: 121.1592 },
  },
  {
    id: "52",
    barangay: "Bagong Pook",
    city: "Malvar",
    province: "Batangas",
    fullAddress: "Bagong Pook, Malvar, Batangas",
    coordinates: { lat: 14.0423, lng: 121.1537 },
  },
  {
    id: "53",
    barangay: "Bilucao",
    city: "Malvar",
    province: "Batangas",
    fullAddress: "Bilucao, Malvar, Batangas",
    coordinates: { lat: 14.039, lng: 121.1482 },
  },
  {
    id: "54",
    barangay: "Bulihan",
    city: "Malvar",
    province: "Batangas",
    fullAddress: "Bulihan, Malvar, Batangas",
    coordinates: { lat: 14.0357, lng: 121.1427 },
  },
  {
    id: "55",
    barangay: "San Gregorio",
    city: "Malvar",
    province: "Batangas",
    fullAddress: "San Gregorio, Malvar, Batangas",
    coordinates: { lat: 14.0489, lng: 121.1647 },
  },
  {
    id: "56",
    barangay: "San Pedro",
    city: "Malvar",
    province: "Batangas",
    fullAddress: "San Pedro, Malvar, Batangas",
    coordinates: { lat: 14.0522, lng: 121.1702 },
  },
  {
    id: "57",
    barangay: "Sta. Cruz",
    city: "Malvar",
    province: "Batangas",
    fullAddress: "Sta. Cruz, Malvar, Batangas",
    coordinates: { lat: 14.0555, lng: 121.1757 },
  },
  {
    id: "58",
    barangay: "Luta Norte",
    city: "Malvar",
    province: "Batangas",
    fullAddress: "Luta Norte, Malvar, Batangas",
    coordinates: { lat: 14.0588, lng: 121.1812 },
  },
  {
    id: "59",
    barangay: "Luta Sur",
    city: "Malvar",
    province: "Batangas",
    fullAddress: "Luta Sur, Malvar, Batangas",
    coordinates: { lat: 14.0621, lng: 121.1867 },
  },
  {
    id: "60",
    barangay: "Poblacion",
    city: "Malvar",
    province: "Batangas",
    fullAddress: "Poblacion, Malvar, Batangas",
    coordinates: { lat: 14.0439, lng: 121.1567 },
  },

  // Santo Tomas (61-75)
  {
    id: "61",
    barangay: "Poblacion",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "Poblacion, Santo Tomas, Batangas",
    coordinates: { lat: 14.1081, lng: 121.1429 },
  },
  {
    id: "62",
    barangay: "San Vicente",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "San Vicente, Santo Tomas, Batangas",
    coordinates: { lat: 14.1148, lng: 121.1494 },
  },
  {
    id: "63",
    barangay: "Sta. Cruz",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "Sta. Cruz, Santo Tomas, Batangas",
    coordinates: { lat: 14.1215, lng: 121.1559 },
  },
  {
    id: "64",
    barangay: "San Bartolome",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "San Bartolome, Santo Tomas, Batangas",
    coordinates: { lat: 14.1282, lng: 121.1624 },
  },
  {
    id: "65",
    barangay: "San Felix",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "San Felix, Santo Tomas, Batangas",
    coordinates: { lat: 14.1349, lng: 121.1689 },
  },
  {
    id: "66",
    barangay: "San Juan",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "San Juan, Santo Tomas, Batangas",
    coordinates: { lat: 14.1014, lng: 121.1364 },
  },
  {
    id: "67",
    barangay: "San Lorenzo",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "San Lorenzo, Santo Tomas, Batangas",
    coordinates: { lat: 14.0947, lng: 121.1299 },
  },
  {
    id: "68",
    barangay: "San Mateo",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "San Mateo, Santo Tomas, Batangas",
    coordinates: { lat: 14.088, lng: 121.1234 },
  },
  {
    id: "69",
    barangay: "San Pedro",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "San Pedro, Santo Tomas, Batangas",
    coordinates: { lat: 14.0813, lng: 121.1169 },
  },
  {
    id: "70",
    barangay: "San Roque",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "San Roque, Santo Tomas, Batangas",
    coordinates: { lat: 14.0746, lng: 121.1104 },
  },
  {
    id: "71",
    barangay: "Santor",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "Santor, Santo Tomas, Batangas",
    coordinates: { lat: 14.1114, lng: 121.1499 },
  },
  {
    id: "72",
    barangay: "Talaga",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "Talaga, Santo Tomas, Batangas",
    coordinates: { lat: 14.1181, lng: 121.1564 },
  },
  {
    id: "73",
    barangay: "Ambulong",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "Ambulong, Santo Tomas, Batangas",
    coordinates: { lat: 14.1248, lng: 121.1629 },
  },
  {
    id: "74",
    barangay: "Mabini Avenue",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "Mabini Avenue, Santo Tomas, Batangas",
    coordinates: { lat: 14.1047, lng: 121.1404 },
  },
  {
    id: "75",
    barangay: "Rizal Street",
    city: "Santo Tomas",
    province: "Batangas",
    fullAddress: "Rizal Street, Santo Tomas, Batangas",
    coordinates: { lat: 14.0974, lng: 121.1339 },
  },

  // Additional Cities and Municipalities (76-100)
  {
    id: "76",
    barangay: "Poblacion",
    city: "Bauan",
    province: "Batangas",
    fullAddress: "Poblacion 1, Bauan, Batangas",
    coordinates: { lat: 13.7931, lng: 121.0095 },
  },
  {
    id: "77",
    barangay: "San Jose",
    city: "Bauan",
    province: "Batangas",
    fullAddress: "San Jose, Bauan, Batangas",
    coordinates: { lat: 13.7922, lng: 121.0089 },
  },
  {
    id: "78",
    barangay: "San Pedro",
    city: "Bauan",
    province: "Batangas",
    fullAddress: "San Pedro, Bauan, Batangas",
    coordinates: { lat: 13.7948, lng: 121.0131 },
  },
  {
    id: "79",
    barangay: "San Roque",
    city: "Bauan",
    province: "Batangas",
    fullAddress: "San Roque, Bauan, Batangas",
    coordinates: { lat: 13.7973, lng: 121.0164 },
  },
  {
    id: "80",
    barangay: "Sta. Maria",
    city: "Bauan",
    province: "Batangas",
    fullAddress: "Sta. Maria, Bauan, Batangas",
    coordinates: { lat: 13.7998, lng: 121.0198 },
  },
  {
    id: "81",
    barangay: "Poblacion",
    city: "Nasugbu",
    province: "Batangas",
    fullAddress: "Poblacion, Nasugbu, Batangas",
    coordinates: { lat: 14.0667, lng: 120.6333 },
  },
  {
    id: "82",
    barangay: "Wawa",
    city: "Nasugbu",
    province: "Batangas",
    fullAddress: "Wawa, Nasugbu, Batangas",
    coordinates: { lat: 13.7417, lng: 121.053 },
  },
  {
    id: "83",
    barangay: "Balaytigui",
    city: "Nasugbu",
    province: "Batangas",
    fullAddress: "Balaytigui, Nasugbu, Batangas",
    coordinates: { lat: 14.08, lng: 120.6467 },
  },
  {
    id: "84",
    barangay: "Poblacion",
    city: "Calaca",
    province: "Batangas",
    fullAddress: "Poblacion, Calaca, Batangas",
    coordinates: { lat: 13.9314, lng: 120.8139 },
  },
  {
    id: "85",
    barangay: "Dacanlao",
    city: "Calaca",
    province: "Batangas",
    fullAddress: "Dacanlao, Calaca, Batangas",
    coordinates: { lat: 13.9381, lng: 120.8206 },
  },
  {
    id: "86",
    barangay: "Poblacion",
    city: "Balayan",
    province: "Batangas",
    fullAddress: "Poblacion, Balayan, Batangas",
    coordinates: { lat: 13.935, lng: 120.7325 },
  },
  {
    id: "87",
    barangay: "Calamias",
    city: "Balayan",
    province: "Batangas",
    fullAddress: "Calamias, Balayan, Batangas",
    coordinates: { lat: 13.9417, lng: 120.7392 },
  },
  {
    id: "88",
    barangay: "Poblacion",
    city: "Lemery",
    province: "Batangas",
    fullAddress: "Poblacion, Lemery, Batangas",
    coordinates: { lat: 13.88, lng: 120.91 },
  },
  {
    id: "89",
    barangay: "Payapa",
    city: "Lemery",
    province: "Batangas",
    fullAddress: "Payapa, Lemery, Batangas",
    coordinates: { lat: 13.8867, lng: 120.9167 },
  },
  {
    id: "90",
    barangay: "Poblacion",
    city: "Taal",
    province: "Batangas",
    fullAddress: "Poblacion, Taal, Batangas",
    coordinates: { lat: 13.8811, lng: 120.9233 },
  },
  {
    id: "91",
    barangay: "Poblacion",
    city: "San Juan",
    province: "Batangas",
    fullAddress: "Poblacion, San Juan, Batangas",
    coordinates: { lat: 13.8264, lng: 121.3958 },
  },
  {
    id: "92",
    barangay: "Talahiban",
    city: "San Juan",
    province: "Batangas",
    fullAddress: "Talahiban, San Juan, Batangas",
    coordinates: { lat: 13.8331, lng: 121.4025 },
  },
  {
    id: "93",
    barangay: "Poblacion",
    city: "Lian",
    province: "Batangas",
    fullAddress: "Poblacion, Lian, Batangas",
    coordinates: { lat: 14.0333, lng: 120.65 },
  },
  {
    id: "94",
    barangay: "Poblacion",
    city: "Calatagan",
    province: "Batangas",
    fullAddress: "Poblacion, Calatagan, Batangas",
    coordinates: { lat: 13.8325, lng: 120.6322 },
  },
  {
    id: "95",
    barangay: "Poblacion",
    city: "Tuy",
    province: "Batangas",
    fullAddress: "Poblacion, Tuy, Batangas",
    coordinates: { lat: 14.0183, lng: 120.73 },
  },
  {
    id: "96",
    barangay: "Poblacion",
    city: "Mabini",
    province: "Batangas",
    fullAddress: "Poblacion, Mabini, Batangas",
    coordinates: { lat: 13.75, lng: 120.9333 },
  },
  {
    id: "97",
    barangay: "Poblacion",
    city: "Tingloy",
    province: "Batangas",
    fullAddress: "Poblacion, Tingloy, Batangas",
    coordinates: { lat: 13.66, lng: 120.8733 },
  },
  {
    id: "98",
    barangay: "Poblacion",
    city: "San Luis",
    province: "Batangas",
    fullAddress: "Poblacion, San Luis, Batangas",
    coordinates: { lat: 13.8217, lng: 120.9117 },
  },
  {
    id: "99",
    barangay: "Poblacion",
    city: "Agoncillo",
    province: "Batangas",
    fullAddress: "Poblacion, Agoncillo, Batangas",
    coordinates: { lat: 13.9356, lng: 120.9278 },
  },
  {
    id: "100",
    barangay: "Poblacion",
    city: "Laurel",
    province: "Batangas",
    fullAddress: "Poblacion, Laurel, Batangas",
    coordinates: { lat: 14.05, lng: 120.9167 },
  },
];

export default function ProductManagement() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const MAX_PRICE = 500000;
  const MAX_STOCK = 500;
  const MIN_PRICE = 0;
  const MIN_STOCK = 0;

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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // BUG FIX: Get current date in local timezone for proper date comparisons
  const getCurrentLocalDate = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  };

  // BUG FIX: Check if selected date is in the past
  const isDateInPast = (dateString: string) => {
    if (!dateString) return false;
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  // BUG FIX: Get minimum time for time input based on selected date
  const getMinTime = () => {
    if (!shipmentData.estimatedDelivery) return "00:00";

    const selectedDate = new Date(shipmentData.estimatedDelivery.split("T")[0]);
    const today = new Date();

    // If selected date is today, return current time, otherwise return "00:00"
    if (selectedDate.toDateString() === today.toDateString()) {
      const hours = today.getHours().toString().padStart(2, "0");
      const minutes = today.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }

    return "00:00";
  };

  // Handle image upload
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

  // BUG FIX: Improved session fetching with error handling
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const session = await getServerSession();
        if (session?.user?.email) {
          setUserSession(session);
          setUserRole(session.user.role || null);
          setupSSEConnection(session.user.id, session.user.email);
          await NotificationHelper.initialize();
          NotificationHelper.registerUserInteraction();
        } else {
          toast.error("Please log in to view your products");
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        toast.error("Failed to load session");
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchSession();
    }

    return () => {
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close();
      }
    };
  }, [mounted]); // BUG FIX: Added mounted dependency

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Authentication error handler
  const handleAuthError = (response: Response) => {
    if (response.status === 401) {
      toast.error("Session expired. Please log in again.");
      window.location.href = "/login";
      return true;
    }
    return false;
  };

  // Fetch categories
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

  // Add new category
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

  // Fetch products
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

  // Fetch delivery personnel
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

  // BUG FIX: Improved estimated delivery date/time handling
  const handleEstimatedDeliveryChange = (date: string, time: string) => {
    let estimatedDelivery = "";

    if (date) {
      if (isDateInPast(date)) {
        toast.error("Cannot set delivery date in the past");
        return;
      }

      if (time) {
        estimatedDelivery = `${date}T${time}`;
      } else {
        estimatedDelivery = `${date}T00:00`;
      }
    }

    setShipmentData({
      ...shipmentData,
      estimatedDelivery,
    });
  };

  // Product addition methods
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

  // Add new product
  const confirmAddProduct = async () => {
    const price = parseFloat(newProductData.price);
    const stock = parseInt(newProductData.stock);

    // Validate required fields
    if (!newProductData.sku.trim()) {
      toast.error("SKU is required");
      return;
    }

    if (price < MIN_PRICE || price > MAX_PRICE) {
      toast.error(
        `Price must be between ₱${MIN_PRICE} and ₱${MAX_PRICE.toLocaleString()}`
      );
      return;
    }

    if (stock < MIN_STOCK || stock > MAX_STOCK) {
      toast.error(`Stock must be between ${MIN_STOCK} and ${MAX_STOCK} units`);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductData.name,
          sku: newProductData.sku,
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

  // Handle sell functionality
  const handleSell = (product: Product) => {
    setSelectedProduct(product);
    setSellData({ quantity: "", note: "" });
    setShowSellModal(true);
  };

  const confirmSell = async () => {
    if (!selectedProduct) return;

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

  // Handle ship functionality
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

    if (loading) {
      toast.error("Processing shipment, please wait...");
      return;
    }

    // BUG FIX: Validate estimated delivery date
    if (shipmentData.estimatedDelivery) {
      const selectedDate = new Date(
        shipmentData.estimatedDelivery.split("T")[0]
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        toast.error("Estimated delivery date cannot be in the past");
        return;
      }
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

      // Get coordinates from hardcoded data
      const selectedAddress = BATANGAS_STREETS.find(
        (addr) => addr.fullAddress === shipmentData.destination
      );
      const coordinates = selectedAddress?.coordinates || null;

      console.log("📍 [SHIP] Selected address:", selectedAddress);
      console.log("📍 [SHIP] Coordinates:", coordinates);

      const shipmentPayload = {
        quantity: parseInt(shipmentData.quantity),
        deliveryPersonnel: {
          id: driver.id,
          fullName: driver.name,
          email: driver.email,
          fcmToken: driver.fcmToken,
        },
        destination: shipmentData.destination,
        coordinates: coordinates,
        note: shipmentData.note,
        estimatedDelivery: shipmentData.estimatedDelivery || null,
        markedBy: {
          name: userSession?.user?.name || "Admin",
          email: userSession?.user?.email || "admin@example.com",
          role: userSession?.user?.role || "admin",
        },
      };

      console.log("📦 [SHIP] Sending shipment request:", shipmentPayload);

      const response = await fetch(
        `/api/products/${selectedProduct._id}/to-ship`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shipmentPayload),
        }
      );

      if (handleAuthError(response)) {
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ [SHIP] Shipment failed:", errorData);
        throw new Error(errorData.error || "Failed to mark as to ship");
      }

      const result = await response.json();
      console.log("✅ [SHIP] Shipment confirmed successfully:", result);

      setShowShipModal(false);
      setShipmentData({
        quantity: "",
        destination: "",
        note: "",
        driverId: "",
        estimatedDelivery: "",
      });

      // Send notification
      console.log("📱 [NOTIFICATION] Sending shipment notification");
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
              coordinates: coordinates,
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
      }).catch((err) =>
        console.error("❌ [NOTIFICATION] Notification error:", err)
      );

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
      console.error("❌ [SHIP] Error confirming shipment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to confirm shipment"
      );
    } finally {
      setLoading(false);
    }
  };

  // Edit product functionality
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

    const price = parseFloat(editProductData.price);
    const stock = parseInt(editProductData.stock);

    if (price < MIN_PRICE || price > MAX_PRICE) {
      toast.error(
        `Price must be between ₱${MIN_PRICE} and ₱${MAX_PRICE.toLocaleString()}`
      );
      return;
    }

    if (stock < MIN_STOCK || stock > MAX_STOCK) {
      toast.error(`Stock must be between ${MIN_STOCK} and ${MAX_STOCK} units`);
      return;
    }

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

  // Delete product functionality
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

  // Get status badge for product
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

  // SSE connection setup
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

  // Effects
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

  // Loading state
  if (loading && products.length === 0) {
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
        {userRole !== "cashier" && (
          <Button onClick={handleAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
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
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(product.status!, product.stock)}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2 mb-4">
                      <h3 className="font-semibold text-lg line-clamp-1 break-words">
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
                          {userRole !== "cashier" && (
                            <>
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
                            </>
                          )}
                          {userRole === "cashier" && (
                            <DropdownMenuItem disabled>
                              No actions available
                            </DropdownMenuItem>
                          )}
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
                              src={product.image || "/placeholder.svg"}
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
                                {userRole !== "cashier" && (
                                  <>
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
                                  </>
                                )}
                                {userRole === "cashier" && (
                                  <DropdownMenuItem disabled>
                                    No actions available
                                  </DropdownMenuItem>
                                )}
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
      <CustomModal
        isOpen={showAddMethodModal}
        onClose={() => setShowAddMethodModal(false)}
        title="Add New Product"
        description="Choose how you'd like to add a new product to your inventory."
        maxWidth="max-w-md"
      >
        <div className="grid gap-4">
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
      </CustomModal>

      <CustomModal
        isOpen={showAddCategoryModal}
        onClose={() => {
          setShowAddCategoryModal(false);
          setNewCategory("");
        }}
        title="Add New Category"
        description="Enter the name for the new category."
        maxWidth="max-w-md"
        zIndex={60}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCategoryModal(false);
                setNewCategory("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={addCategory}
              disabled={!newCategory.trim() || loading}
            >
              {loading ? "Adding..." : "Add Category"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-category-name">Category Name</Label>
            <Input
              id="new-category-name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCategory.trim()) {
                  addCategory();
                }
              }}
            />
          </div>
        </div>
      </CustomModal>

      {/* Add Product Modal */}
      <CustomModal
        isOpen={showAddProductModal}
        onClose={() => {
          setShowAddProductModal(false);
          setImageFile(null);
          setImagePreview("");
        }}
        title="Add New Product"
        description="Enter the details for the new product. Fields marked with * are required."
        maxWidth="max-w-md"
        footer={
          <>
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
                !newProductData.sku ||
                !newProductData.category ||
                !newProductData.price ||
                !newProductData.stock
              }
            >
              Add Product
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-4">
          {/* Product Name - Required */}
          <div className="grid gap-2">
            <Label htmlFor="new-name" className="flex items-center gap-1">
              Product Name
              <span className="text-red-500">*</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {newProductData.name.length}/100
              </span>
            </Label>
            <Input
              id="new-name"
              value={newProductData.name}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 100) {
                  setNewProductData({ ...newProductData, name: value });
                } else {
                  toast.error("Product name cannot exceed 100 characters");
                }
              }}
              placeholder="Enter product name"
              maxLength={100}
              required
            />
          </div>

          {/* SKU - Required */}
          <div className="grid gap-2">
            <Label htmlFor="new-sku" className="flex items-center gap-1">
              SKU
              <span className="text-red-500">*</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {newProductData.sku.length}/50
              </span>
            </Label>
            <Input
              id="new-sku"
              value={newProductData.sku}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 50) {
                  setNewProductData({ ...newProductData, sku: value });
                } else {
                  toast.error("SKU cannot exceed 50 characters");
                }
              }}
              placeholder="e.g., PROD-001, LAPTOP-MAX, PHONE-X2024"
              maxLength={50}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use a unique SKU format: Category-Number or Brand-Model-Year
            </p>
          </div>

          {/* Category - Required */}
          <div className="grid gap-2">
            <Label htmlFor="new-category" className="flex items-center gap-1">
              Category
              <span className="text-red-500">*</span>
            </Label>
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
            {/* Price - Required */}
            <div className="grid gap-2">
              <Label htmlFor="new-price" className="flex items-center gap-1">
                Price
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-price"
                type="number"
                step="0.01"
                min={MIN_PRICE}
                max={MAX_PRICE}
                value={newProductData.price}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = parseFloat(value);

                  if (numValue > MAX_PRICE) {
                    toast.error(
                      `Price cannot exceed ₱${MAX_PRICE.toLocaleString()}`
                    );
                    return;
                  }

                  if (numValue < 0) {
                    return;
                  }

                  setNewProductData({
                    ...newProductData,
                    price: value,
                  });
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "-" ||
                    e.key === "+" ||
                    e.key === "e" ||
                    e.key === "E"
                  ) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  const pasteData = e.clipboardData.getData("text");
                  const numValue = parseFloat(pasteData);
                  if (
                    isNaN(numValue) ||
                    numValue < MIN_PRICE ||
                    numValue > MAX_PRICE
                  ) {
                    e.preventDefault();
                    toast.error(
                      `Price must be between ₱${MIN_PRICE} and ₱${MAX_PRICE.toLocaleString()}`
                    );
                  }
                }}
                placeholder="0.00"
                required
              />
            </div>

            {/* Stock - Required */}
            <div className="grid gap-2">
              <Label htmlFor="new-stock" className="flex items-center gap-1">
                Stock
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-stock"
                type="number"
                min={MIN_STOCK}
                max={MAX_STOCK}
                value={newProductData.stock}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = parseInt(value);

                  if (value === "") {
                    setNewProductData({
                      ...newProductData,
                      stock: "",
                    });
                    return;
                  }

                  if (numValue > MAX_STOCK) {
                    toast.error(`Stock cannot exceed ${MAX_STOCK} units`);
                    return;
                  }

                  if (numValue < 0) {
                    return;
                  }

                  setNewProductData({
                    ...newProductData,
                    stock: value,
                  });
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "-" ||
                    e.key === "+" ||
                    e.key === "." ||
                    e.key === "e" ||
                    e.key === "E"
                  ) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  const pasteData = e.clipboardData.getData("text");
                  const numValue = parseInt(pasteData);
                  if (
                    isNaN(numValue) ||
                    numValue < MIN_STOCK ||
                    numValue > MAX_STOCK
                  ) {
                    e.preventDefault();
                    toast.error(
                      `Stock must be between ${MIN_STOCK} and ${MAX_STOCK} units`
                    );
                  }
                }}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Description - Optional */}
          <div className="grid gap-2">
            <Label
              htmlFor="new-description"
              className="flex items-center gap-1"
            >
              Description
              <span className="text-xs text-muted-foreground">(Optional)</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {(newProductData.description || "").length}/100
              </span>
            </Label>
            <Textarea
              id="new-description"
              value={newProductData.description}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 100) {
                  setNewProductData({
                    ...newProductData,
                    description: value,
                  });
                } else {
                  toast.error("Description cannot exceed 100 characters");
                }
              }}
              placeholder="Product description"
              maxLength={100}
              rows={4}
            />
          </div>

          {/* Product Image - Optional */}
          <div className="grid gap-2">
            <Label htmlFor="new-image" className="flex items-center gap-1">
              Product Image
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </Label>
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
      </CustomModal>

      {/* Object Detection Modal */}
      <ObjectDetectionModal
        isOpen={showObjectDetectionModal}
        onOpenChange={setShowObjectDetectionModal}
        onProductFound={handleProductFound}
      />

      {/* ========== SELL MODAL WITH VALIDATION ========== */}
      <CustomModal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        title="Confirm Sale"
        description={`Process sale of ${selectedProduct?.name}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowSellModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmSell}
              disabled={
                loading ||
                !sellData.quantity ||
                Number.parseInt(sellData.quantity) <= 0 ||
                Number.parseInt(sellData.quantity) >
                  (selectedProduct?.stock || 0)
              }
            >
              {loading ? "Processing..." : "Process Sale"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="sell-quantity">Quantity to Sell</Label>
            <Input
              id="sell-quantity"
              type="number"
              placeholder="Enter quantity"
              value={sellData.quantity}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value);

                if (value === "") {
                  setSellData({ ...sellData, quantity: "" });
                  return;
                }

                if (numValue > (selectedProduct?.stock || 0)) {
                  toast.error(
                    `Cannot exceed available stock of ${selectedProduct?.stock} units`
                  );
                  return;
                }

                if (numValue < 0) {
                  return;
                }

                setSellData({ ...sellData, quantity: value });
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "-" ||
                  e.key === "+" ||
                  e.key === "." ||
                  e.key === "e" ||
                  e.key === "E"
                ) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const pasteData = e.clipboardData.getData("text");
                const numValue = parseInt(pasteData);
                if (
                  isNaN(numValue) ||
                  numValue <= 0 ||
                  numValue > (selectedProduct?.stock || 0)
                ) {
                  e.preventDefault();
                  toast.error(
                    `Quantity must be between 1 and ${selectedProduct?.stock} units`
                  );
                }
              }}
              max={selectedProduct?.stock}
              min="1"
            />
            <p className="text-sm text-muted-foreground">
              Available stock: {selectedProduct?.stock}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sell-note">
              Sale Note (Optional)
              <span className="text-xs text-muted-foreground ml-2">
                {sellData.note.length}/100
              </span>
            </Label>
            <Textarea
              id="sell-note"
              placeholder="Add notes about this sale"
              value={sellData.note}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 100) {
                  setSellData({ ...sellData, note: value });
                } else {
                  toast.error("Sale note cannot exceed 100 characters");
                }
              }}
              rows={3}
              maxLength={100}
            />
          </div>

          {sellData.quantity && selectedProduct && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Sale Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Product:</div>
                <div className="font-medium">{selectedProduct.name}</div>

                <div className="text-muted-foreground">Quantity:</div>
                <div className="font-medium">{sellData.quantity} units</div>

                <div className="text-muted-foreground">Remaining Stock:</div>
                <div className="font-medium">
                  {selectedProduct.stock - Number.parseInt(sellData.quantity)}{" "}
                  units
                </div>
              </div>
            </div>
          )}
        </div>
      </CustomModal>

      {/* ========== SHIP MODAL WITH VALIDATION ========== */}
      <CustomModal
        isOpen={showShipModal}
        onClose={() => {
          setShowShipModal(false);
        }}
        title="📦 Ship Product"
        description={`Configure shipment details for ${selectedProduct?.name}`}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowShipModal(false);
              }}
            >
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
          </>
        }
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ship-quantity">Quantity to Ship</Label>
            <Input
              id="ship-quantity"
              type="number"
              placeholder="Enter quantity"
              value={shipmentData.quantity}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value);

                if (value === "") {
                  setShipmentData({ ...shipmentData, quantity: "" });
                  return;
                }

                if (numValue > (selectedProduct?.stock || 0)) {
                  toast.error(
                    `Cannot exceed available stock of ${selectedProduct?.stock} units`
                  );
                  return;
                }

                if (numValue < 0) {
                  return;
                }

                setShipmentData({ ...shipmentData, quantity: value });
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "-" ||
                  e.key === "+" ||
                  e.key === "." ||
                  e.key === "e" ||
                  e.key === "E"
                ) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const pasteData = e.clipboardData.getData("text");
                const numValue = parseInt(pasteData);
                if (
                  isNaN(numValue) ||
                  numValue <= 0 ||
                  numValue > (selectedProduct?.stock || 0)
                ) {
                  e.preventDefault();
                  toast.error(
                    `Quantity must be between 1 and ${selectedProduct?.stock} units`
                  );
                }
              }}
              max={selectedProduct?.stock}
              min="1"
            />
            <p className="text-sm text-muted-foreground">
              Available stock: {selectedProduct?.stock}
            </p>
          </div>

          {/* UPDATED: Destination Address as Dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="destination">Destination Address</Label>
            <Select
              value={shipmentData.destination}
              onValueChange={(value) =>
                setShipmentData({ ...shipmentData, destination: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery address" />
              </SelectTrigger>
              <SelectContent>
                {BATANGAS_STREETS.map((address) => (
                  <SelectItem key={address.id} value={address.fullAddress}>
                    <div className="flex flex-col">
                      <span className="font-medium">{address.fullAddress}</span>
                      <span className="text-xs text-muted-foreground">
                        {address.barangay}, {address.city}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select from pre-defined Batangas delivery locations
            </p>
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
              <SelectContent>
                {deliveryPersonnel.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{driver.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {driver.email}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">
              Delivery Note (Optional)
              <span className="text-xs text-muted-foreground ml-2">
                {shipmentData.note.length}/100
              </span>
            </Label>
            <Textarea
              id="note"
              placeholder="Special instructions for delivery personnel"
              value={shipmentData.note}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 100) {
                  setShipmentData({ ...shipmentData, note: value });
                } else {
                  toast.error("Note cannot exceed 100 characters");
                }
              }}
              rows={3}
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="estimatedDeliveryDate">
                Estimated Delivery Date (Optional)
              </Label>
              <Input
                id="estimatedDeliveryDate"
                type="date"
                value={shipmentData.estimatedDelivery?.split("T")[0] || ""}
                onChange={(e) => {
                  const date = e.target.value;
                  const time =
                    shipmentData.estimatedDelivery?.split("T")[1] || "00:00";

                  if (date && isDateInPast(date)) {
                    toast.error("Cannot set delivery date in the past");
                    return;
                  }

                  handleEstimatedDeliveryChange(date, time);
                }}
                min={getCurrentLocalDate()} // BUG FIX: Use current local date
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estimatedDeliveryTime">
                Estimated Delivery Time (Optional)
              </Label>
              <Input
                id="estimatedDeliveryTime"
                type="time"
                value={shipmentData.estimatedDelivery?.split("T")[1] || ""}
                onChange={(e) => {
                  const time = e.target.value;
                  const date =
                    shipmentData.estimatedDelivery?.split("T")[0] ||
                    getCurrentLocalDate();
                  handleEstimatedDeliveryChange(date, time);
                }}
                min={getMinTime()} // BUG FIX: Dynamic min time based on selected date
                disabled={!shipmentData.estimatedDelivery?.split("T")[0]} // BUG FIX: Disable if no date selected
              />
            </div>
          </div>

          {shipmentData.estimatedDelivery && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Estimated Delivery:</strong>{" "}
                {new Date(shipmentData.estimatedDelivery).toLocaleString()}
              </p>
            </div>
          )}

          {shipmentData.quantity && selectedProduct && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Shipment Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Product:</div>
                <div className="font-medium">{selectedProduct.name}</div>

                <div className="text-muted-foreground">Quantity:</div>
                <div className="font-medium">{shipmentData.quantity} units</div>

                <div className="text-muted-foreground">Remaining Stock:</div>
                <div className="font-medium">
                  {selectedProduct.stock -
                    Number.parseInt(shipmentData.quantity)}{" "}
                  units
                </div>

                {shipmentData.destination && (
                  <>
                    <div className="text-muted-foreground">Destination:</div>
                    <div className="font-medium">
                      {shipmentData.destination}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </CustomModal>

      {/* ========== EDIT PRODUCT MODAL WITH VALIDATION ========== */}
      <CustomModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setImageFile(null);
          setImagePreview("");
        }}
        title="Edit Product"
        description={`Make changes to ${selectedProduct?.name}`}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setImageFile(null);
                setImagePreview("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmEdit} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">
              Product Name
              <span className="text-xs text-muted-foreground ml-2">
                {editProductData.name.length}/100
              </span>
            </Label>
            <Input
              id="edit-name"
              value={editProductData.name}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 100) {
                  setEditProductData({
                    ...editProductData,
                    name: value,
                  });
                } else {
                  toast.error("Product name cannot exceed 100 characters");
                }
              }}
              placeholder="Enter product name"
              maxLength={100}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-sku">
              SKU
              <span className="text-xs text-muted-foreground ml-2">
                {editProductData.sku.length}/100
              </span>
            </Label>
            <Input
              id="edit-sku"
              value={editProductData.sku}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 100) {
                  setEditProductData({
                    ...editProductData,
                    sku: value,
                  });
                } else {
                  toast.error("SKU cannot exceed 100 characters");
                }
              }}
              placeholder="Product SKU"
              maxLength={100}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Price (₱)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min={MIN_PRICE}
                max={MAX_PRICE}
                value={editProductData.price}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = parseFloat(value);

                  if (numValue > MAX_PRICE) {
                    toast.error(
                      `Price cannot exceed ₱${MAX_PRICE.toLocaleString()}`
                    );
                    return;
                  }

                  if (numValue < 0) {
                    return;
                  }

                  setEditProductData({
                    ...editProductData,
                    price: value,
                  });
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "-" ||
                    e.key === "+" ||
                    e.key === "e" ||
                    e.key === "E"
                  ) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  const pasteData = e.clipboardData.getData("text");
                  const numValue = parseFloat(pasteData);
                  if (
                    isNaN(numValue) ||
                    numValue < MIN_PRICE ||
                    numValue > MAX_PRICE
                  ) {
                    e.preventDefault();
                    toast.error(
                      `Price must be between ₱${MIN_PRICE} and ₱${MAX_PRICE.toLocaleString()}`
                    );
                  }
                }}
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-stock">Stock</Label>
              <Input
                id="edit-stock"
                type="number"
                min={MIN_STOCK}
                max={MAX_STOCK}
                value={editProductData.stock}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = parseInt(value);

                  if (value === "") {
                    setEditProductData({
                      ...editProductData,
                      stock: "",
                    });
                    return;
                  }

                  if (numValue > MAX_STOCK) {
                    toast.error(`Stock cannot exceed ${MAX_STOCK} units`);
                    return;
                  }

                  if (numValue < 0) {
                    return;
                  }

                  setEditProductData({
                    ...editProductData,
                    stock: value,
                  });
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "-" ||
                    e.key === "+" ||
                    e.key === "." ||
                    e.key === "e" ||
                    e.key === "E"
                  ) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  const pasteData = e.clipboardData.getData("text");
                  const numValue = parseInt(pasteData);
                  if (
                    isNaN(numValue) ||
                    numValue < MIN_STOCK ||
                    numValue > MAX_STOCK
                  ) {
                    e.preventDefault();
                    toast.error(
                      `Stock must be between ${MIN_STOCK} and ${MAX_STOCK} units`
                    );
                  }
                }}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-description">
              Description
              <span className="text-xs text-muted-foreground ml-2">
                {(editProductData.description || "").length}/100
              </span>
            </Label>
            <Textarea
              id="edit-description"
              value={editProductData.description}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 100) {
                  setEditProductData({
                    ...editProductData,
                    description: value,
                  });
                } else {
                  toast.error("Description cannot exceed 100 characters");
                }
              }}
              placeholder="Product description"
              rows={3}
              maxLength={100}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-image">Product Image</Label>
            <Input
              id="edit-image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setImagePreview(base64String);
                    setEditProductData({
                      ...editProductData,
                      image: base64String,
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Upload a new image or keep the existing one
            </p>
          </div>

          {/* Image Preview */}
          {(imagePreview || editProductData.image) && (
            <div className="grid gap-2">
              <Label>Image Preview</Label>
              <div className="relative w-full h-48 border rounded-md overflow-hidden bg-gray-50">
                <Image
                  src={imagePreview || editProductData.image || ""}
                  alt="Product preview"
                  fill
                  className="object-contain"
                />
              </div>
              {(imagePreview || editProductData.image) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                    setEditProductData({
                      ...editProductData,
                      image: "",
                    });
                  }}
                  className="w-fit"
                >
                  Remove Image
                </Button>
              )}
            </div>
          )}
        </div>
      </CustomModal>

      {/* Delete Confirmation dialog */}
      <CustomDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone and will permanently remove the product from your inventory.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
