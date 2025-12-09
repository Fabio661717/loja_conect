// src/types/service-worker.d.ts
// Definições de tipo para Service Worker e Push API

interface PushSubscriptionOptions {
  userVisibleOnly: boolean;
  applicationServerKey?: ArrayBuffer | null;
}

interface PushSubscriptionJSON {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh: string;
    auth: string;
  };
}

interface PushSubscription {
  readonly endpoint: string;
  readonly expirationTime: number | null;

  getKey(name: string): ArrayBuffer | null;
  toJSON(): PushSubscriptionJSON;
  unsubscribe(): Promise<boolean>;
}

interface PushManager {
  getSubscription(): Promise<PushSubscription | null>;
  subscribe(options: PushSubscriptionOptions): Promise<PushSubscription>;
}

interface ServiceWorkerRegistration {
  readonly pushManager: PushManager;
  readonly active: ServiceWorker | null;
  readonly scope: string;

  update(): Promise<void>;
  showNotification(title: string, options?: NotificationOptions): Promise<void>;
}

interface ServiceWorkerContainer {
  readonly ready: Promise<ServiceWorkerRegistration>;

  register(scriptURL: string, options?: RegistrationOptions): Promise<ServiceWorkerRegistration>;
  getRegistration(scope?: string): Promise<ServiceWorkerRegistration | undefined>;
}

interface Navigator {
  readonly serviceWorker: ServiceWorkerContainer;
}

// Extensão para Window
interface Window {
  __VAPID_PUBLIC_KEY__?: string;
}

// Declaração global para Service Worker
declare var self: ServiceWorkerGlobalScope;

interface ServiceWorkerGlobalScope {
  readonly registration: ServiceWorkerRegistration;
  skipWaiting(): Promise<void>;
  clients: Clients;
}

interface Clients {
  claim(): Promise<void>;
  matchAll(options?: ClientQueryOptions): Promise<Client[]>;
  openWindow(url: string): Promise<WindowClient | null>;
}

// Tipos para notificações
interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  actions?: NotificationAction[];
  data?: any;
  vibrate?: number[];
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}
