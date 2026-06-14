export type {};

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json() as { title?: string; body?: string; tag?: string; url?: string };
  event.waitUntil(
    sw.registration.showNotification(data.title ?? "WC 2026 Predictions", {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      data: { url: data.url ?? "/matches" },
    })
  );
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string })?.url ?? "/matches";
  event.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url.includes(url) && "focus" in c);
        if (existing) return (existing as WindowClient).focus();
        return sw.clients.openWindow(url);
      })
  );
});
