/**
 * SHARDNET STABILITY LAYER
 * Objective: Crash-proof, Offline-first, Battery-efficient
 */

export const DEMO_MODE = true;
export const DEBUG_MODE = localStorage.getItem("DEBUG") === "true";

/* 1️⃣ SAFE FUNCTION CALL WRAPPERS */
export function safeCall(fn, name = "unknown") {
  if (typeof fn === "function") {
    try {
      return fn();
    } catch (err) {
      console.error("Function error:", name, err);
    }
  } else {
    console.warn(name + " is not a function", fn);
  }
}

export async function safeCallAsync(fn, name = "unknown") {
  if (typeof fn === "function") {
    try {
      return await fn();
    } catch (err) {
      console.error("Async Function error:", name, err);
    }
  } else {
    console.warn(name + " is not a function", fn);
  }
}

/* 2️⃣ SAFE MODULE INITIALIZATION */
export function safeInit(name, fn) {
  if (typeof fn !== "function") {
    console.warn(name + " is not a function");
    return;
  }

  try {
    fn();
    console.log(name + " OK");
  } catch (e) {
    console.error(name + " failed:", e);
  }
}

/** 🛡️ SAFE COMPONENT WRAPPER (No-Crash UI) */
export function SafeComponent({ children, fallback = <span>[UI ERROR]</span> }) {
  try {
    return <>{children}</>;
  } catch (e) {
    console.error("Component Render Failure:", e);
    return fallback;
  }
}

/* 3️⃣ SAFE EVENT SYSTEM */
export function emit(event, data) {
  try {
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  } catch (e) {
    console.error("Emit failed:", event, e);
  }
}

export function listen(event, handler) {
  window.addEventListener(event, (e) => {
    safeCall(() => {
      if (typeof handler === 'function') {
        handler(e.detail);
      } else {
        console.warn(`Handler for ${event} is not a function`, handler);
      }
    }, `Event: ${event}`);
  });
}

/* 5️⃣ STORAGE RELIABILITY LAYER */
export function safeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Storage failed", e);
  }
}

export function safeGet(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

/* 6️⃣ OFFLINE LOCATION FALLBACK */
export async function getSafeLocation() {
  if (!navigator.geolocation) {
    return { lat: 0, lng: 0, fallback: true };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }),
      () => resolve({ lat: 0, lng: 0, fallback: true }),
      { timeout: 4000, enableHighAccuracy: false } // Optimized for battery
    );
  });
}

/* 7️⃣ LOW POWER MODE */
export async function isLowBattery() {
  if (navigator.getBattery) {
    const battery = await navigator.getBattery();
    return battery.level < 0.2;
  }
  return false;
}

/* 8️⃣ SAFE INTERVAL SYSTEM */
export function safeInterval(fn, time) {
  let active = true;

  async function loop() {
    if (!active) return;
    
    // Battery check
    const lowPower = await isLowBattery();
    const intervalTime = lowPower ? time * 3 : time; // Triple interval if low power

    try { 
      await fn(); 
    } catch (e) {
      if (DEBUG_MODE) console.error("Safe Interval Failure:", e);
    }
    
    setTimeout(loop, intervalTime);
  }

  loop();
  return () => { active = false; };
}
