import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiService, Pricing, getPricing, listServices } from '../api/catalog';
import { ServiceItem } from '../types';

/** Biểu tượng chỉ là trang trí theo mã dịch vụ; tên, mô tả, giá luôn lấy từ BE. */
const SERVICE_ICONS: Record<string, string> = {
  'tire-patch': 'album',
  'tire-pump': 'air',
  'tube-replace': 'donut_large',
  'battery-jump': 'battery_charging_full',
  'chain-fix': 'settings',
  'chain-clean': 'cleaning_services',
  'oil-change': 'water_drop',
  towing: 'rv_hookup',
};
const FALLBACK_ICON = 'build';

function toServiceItem(s: ApiService): ServiceItem {
  return {
    id: s.id,
    name: s.name,
    desc: s.description ?? '',
    price: s.price,
    priceDisplay: new Intl.NumberFormat('vi-VN').format(Math.round(s.price)),
    icon: SERVICE_ICONS[s.id] ?? FALLBACK_ICON,
  };
}

interface CatalogState {
  services: ServiceItem[];
  pricing: Pricing | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  findService: (id: string) => ServiceItem | undefined;
}

const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([listServices(), getPricing()])
      .then(([list, price]) => {
        if (cancelled) return;
        setServices(list.map(toServiceItem));
        setPricing(price);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Không tải được danh mục dịch vụ.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const value = useMemo<CatalogState>(
    () => ({ services, pricing, loading, error, reload, findService: (id) => services.find((s) => s.id === id) }),
    [services, pricing, loading, error, reload],
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogState {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
