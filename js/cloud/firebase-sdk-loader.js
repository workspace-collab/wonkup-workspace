import { API_CONFIG } from '../config/api-config.js?v=9.0.0';

let sdkPromise = null;

function sdkUrl(packageName) {
  return `https://www.gstatic.com/firebasejs/${API_CONFIG.firebaseSdkVersion}/firebase-${packageName}.js`;
}

export function loadFirebaseSdk({ appCheck = false } = {}) {
  if (!sdkPromise) {
    sdkPromise = Promise.all([
      import(sdkUrl('app')),
      import(sdkUrl('auth')),
      import(sdkUrl('firestore'))
    ]).then(([app, auth, firestore]) => ({ app, auth, firestore }));
  }

  if (!appCheck) return sdkPromise;
  return Promise.all([sdkPromise, import(sdkUrl('app-check'))])
    .then(([sdk, appCheckModule]) => ({ ...sdk, appCheck: appCheckModule }));
}

export function getFirebaseSdkUrls() {
  return {
    app: sdkUrl('app'),
    auth: sdkUrl('auth'),
    firestore: sdkUrl('firestore'),
    appCheck: sdkUrl('app-check')
  };
}
