// Leaflet nạp qua CDN (index.html) nên chỉ có sẵn ở window, không import module.
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any;
  }
}

export {};
