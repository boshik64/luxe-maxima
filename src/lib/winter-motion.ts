/**
 * Мост для iOS: permission DeviceOrientation/Motion только из user gesture.
 * Запрос идёт сразу из клика «снежинки», слушатели подключает WinterSnow.
 */

type Handler = () => void;

const grantedListeners = new Set<Handler>();
let granted = false;
let requesting: Promise<boolean> | null = null;

type Permissioned = {
  requestPermission?: () => Promise<"granted" | "denied" | "default">;
};

function needsPermission() {
  if (typeof window === "undefined") return false;
  const orientation = DeviceOrientationEvent as unknown as Permissioned;
  const motion = DeviceMotionEvent as unknown as Permissioned;
  return (
    typeof orientation.requestPermission === "function" ||
    typeof motion.requestPermission === "function"
  );
}

export function isWinterMotionGranted() {
  return granted;
}

export function winterMotionNeedsPermission() {
  return needsPermission();
}

export function onWinterMotionGranted(handler: Handler) {
  grantedListeners.add(handler);
  if (granted) handler();
  return () => {
    grantedListeners.delete(handler);
  };
}

function notifyGranted() {
  granted = true;
  grantedListeners.forEach((handler) => handler());
}

/** Вызывать синхронно из клика (toggle снежинки / первый тап). */
export function enableWinterMotion(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  if (!needsPermission()) {
    notifyGranted();
    return Promise.resolve(true);
  }

  // Без HTTPS iOS не выдаёт доступ — не спамим диалогами.
  if (!window.isSecureContext) {
    return Promise.resolve(false);
  }

  if (granted) return Promise.resolve(true);
  if (requesting) return requesting;

  requesting = (async () => {
    try {
      const orientation = DeviceOrientationEvent as unknown as Permissioned;
      const motion = DeviceMotionEvent as unknown as Permissioned;

      if (typeof orientation.requestPermission === "function") {
        const status = await orientation.requestPermission();
        if (status !== "granted") return false;
      }
      if (typeof motion.requestPermission === "function") {
        const status = await motion.requestPermission();
        if (status !== "granted") return false;
      }
      notifyGranted();
      return true;
    } catch {
      return false;
    } finally {
      requesting = null;
    }
  })();

  return requesting;
}
