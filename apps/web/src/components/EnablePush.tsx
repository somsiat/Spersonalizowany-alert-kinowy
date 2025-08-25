
export async function enablePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push not supported');
    return;
  }
  const reg = await navigator.serviceWorker.register('/sw.js');
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!key) {
    alert('Brak VAPID public key');
    return;
  }
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key)
  });
  await fetch((import.meta as any).env.VITE_API_URL + '/api/push/subscribe', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub)
  });
  alert('Subskrypcja zapisana ✅');
}
