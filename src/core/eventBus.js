export function emit(event, data) {
  try {
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  } catch (e) {
    console.error("Emit error:", event, e);
  }
}

export function listen(event, handler) {
  window.addEventListener(event, (e) => {
    if (typeof handler === "function") {
      try {
        handler(e.detail);
      } catch (err) {
        console.error("Handler error:", event, err);
      }
    } else {
      console.warn(`Event listener for ${event} is not a function`, handler);
    }
  });
}
