/// <reference lib="webworker" />

export {}; // marks this as a module

// Explicitly type `self` as ServiceWorkerGlobalScope
declare const self: ServiceWorkerGlobalScope;

self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "RECheck", {
      body: data.body || "You have a new message!",
      icon: "/vite.png",
    })
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === "TEST_NOTIFICATION") {
    self.registration.showNotification("Test Notification", {
      body: "This came from the service worker 🚀",
      icon: "/vite.png",
    });
  }
});
