
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      // Check protocol to prevent "Invalid URL" errors in environments like about:srcdoc or data: URLs
      if (!window.location.protocol.startsWith('http')) {
        return;
      }

      // Explicitly construct the absolute URL using window.location.href.
      // This is critical to bypass <base> tags injected by preview environments (like AI Studio/IDX)
      // which would otherwise cause the Service Worker URL to resolve to a different origin (e.g. ai.studio),
      // triggering a "Script URL origin does not match" registration error.
      const swUrl = new URL('service-worker.js', window.location.href).href;

      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    } catch (error) {
      // If construction fails, we purposefully do NOT fallback to a relative path ('./service-worker.js')
      // because that fallback is what causes the origin mismatch in preview environments.
      console.warn('Service Worker registration skipped due to environment:', error);
    }
  });
}
