
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use relative path './service-worker.js' which resolves to the root relative to index.html
    // This avoids issues with constructing absolute URLs in sandboxed or cloud environments
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('✅ SW registered:', reg.scope))
      .catch(err => console.error('❌ SW registration failed:', err));
  });
}
