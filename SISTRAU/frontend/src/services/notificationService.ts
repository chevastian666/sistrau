class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  async init() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        this.swRegistration = registration;
        console.log('Service Worker registered');

        // Request notification permission
        const permission = await this.requestPermission();
        if (permission === 'granted') {
          await this.subscribeUser();
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeUser() {
    if (!this.swRegistration) return;

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || 'BKd0G0K8nPZMdFJE_gDhQLXxBmFWJeRbKKBLqEXKkHKJqp_4h_lLPcZOxJ7Gd8YcvWqGZ3XcZRU1i5WxE1a_w-Y'
        )
      });

      // Send subscription to backend
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(subscription)
      });

      console.log('User subscribed to push notifications');
    } catch (error) {
      console.error('Failed to subscribe user:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Show local notification
  async showNotification(title: string, options?: NotificationOptions) {
    if (!this.swRegistration) return;

    const defaultOptions: NotificationOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false,
      tag: 'sistrau-notification',
      ...options
    };

    await this.swRegistration.showNotification(title, defaultOptions);
  }

  // Notification types
  async notifyVehicleAlert(vehicleId: string, alert: string) {
    await this.showNotification('Alerta de Vehículo', {
      body: `${vehicleId}: ${alert}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: { type: 'vehicle_alert', vehicleId },
      actions: [
        { action: 'view', title: 'Ver detalles' },
        { action: 'dismiss', title: 'Descartar' }
      ]
    });
  }

  async notifyTripUpdate(tripId: string, status: string) {
    await this.showNotification('Actualización de Viaje', {
      body: `El viaje ${tripId} cambió a estado: ${status}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: { type: 'trip_update', tripId },
      tag: `trip-${tripId}`
    });
  }

  async notifyDriverCompliance(driverId: string, violation: string) {
    await this.showNotification('Violación de Cumplimiento', {
      body: `Conductor ${driverId}: ${violation}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      urgency: 'high',
      requireInteraction: true,
      data: { type: 'compliance_violation', driverId }
    });
  }

  async notifyMaintenanceReminder(vehicleId: string, service: string) {
    await this.showNotification('Mantenimiento Requerido', {
      body: `${vehicleId} requiere: ${service}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: { type: 'maintenance', vehicleId }
    });
  }

  // Check if notifications are supported and enabled
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  isEnabled(): boolean {
    return Notification.permission === 'granted';
  }
}

export const notificationService = new NotificationService();
export default notificationService;