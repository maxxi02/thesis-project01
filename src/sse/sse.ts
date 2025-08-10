let clients: {
  id: string;
  controller: ReadableStreamDefaultController;
  userId: string;
  userEmail: string;
}[] = [];

export function addClient(client: {
  id: string;
  controller: ReadableStreamDefaultController;
  userId: string;
  userEmail: string;
}) {
  clients.push(client);
}

export function removeClient(clientId: string) {
  clients = clients.filter((client) => client.id !== clientId);
}

export function sendEventToUser(
  userEmail: string,
  data: Record<string, unknown>
) {
  const userClients = clients.filter((c) => c.userEmail === userEmail);

  userClients.forEach((client) => {
    try {
      client.controller.enqueue(
        `data: ${JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    } catch (error) {
      console.log("Error sending event to user:", error);
      removeClient(client.id);
    }
  });

  return userClients.length > 0;
}
