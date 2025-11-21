import admin from "firebase-admin";

let isInitialized = false;

// Lazy initialization - only runs when actually needed (at runtime)
function initializeFirebase() {
  if (isInitialized) {
    return;
  }

  // Skip during build time
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn("Firebase credentials not available - skipping initialization");
    return;
  }

  // Validate required fields
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("FIREBASE_PRIVATE_KEY is required");
  }
  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error("FIREBASE_CLIENT_EMAIL is required");
  }

  // Check if already initialized
  if (admin.apps.length > 0) {
    isInitialized = true;
    return;
  }

  try {
    // Create service account credentials
    const serviceAccountKey: admin.ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    isInitialized = true;
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }
}

export async function sendNotificationToDriver(
  fcmToken: string,
  shipmentDetails: {
    productName: string;
    quantity: number;
    destination: string;
    estimatedDelivery?: Date;
  }
) {
  try {
    // Initialize Firebase only when this function is called (runtime)
    initializeFirebase();

    if (!isInitialized) {
      console.warn("Firebase not initialized - skipping notification");
      return null;
    }

    if (!fcmToken) {
      console.warn("No FCM token provided for driver");
      return null;
    }

    const message = {
      notification: {
        title: "New Shipment Assigned",
        body: `You've been assigned to deliver ${shipmentDetails.quantity} units of ${shipmentDetails.productName} to ${shipmentDetails.destination}`,
      },
      data: {
        type: "shipment_assigned",
        productName: shipmentDetails.productName,
        quantity: shipmentDetails.quantity.toString(),
        destination: shipmentDetails.destination,
        estimatedDelivery:
          shipmentDetails.estimatedDelivery?.toISOString() || "",
      },
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log("Successfully sent notification:", response);
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}