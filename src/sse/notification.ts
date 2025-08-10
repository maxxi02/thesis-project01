import admin from "firebase-admin";

// Validate required fields first
if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error("FIREBASE_PROJECT_ID is required");
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error("FIREBASE_PRIVATE_KEY is required");
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error("FIREBASE_CLIENT_EMAIL is required");
}

// Create service account credentials - only include properties that admin.ServiceAccount expects
const serviceAccountKey: admin.ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
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
    if (!fcmToken) {
      console.warn("No FCM token provided for driver");
      return;
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
