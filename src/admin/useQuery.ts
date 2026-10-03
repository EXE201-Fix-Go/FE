import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tải dữ liệu khi `deps` đổi hoặc gọi `reload()`. Giữ dữ liệu cũ trong lúc tải lại (đỡ nháy bảng) và bỏ qua
 * phản hồi của lượt gọi cũ nếu người dùng đã đổi trang/bộ lọc.
 */
export function useQuery<T>(fn: () => Promise<T>, deps: readonly unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    const id = ++latest.current;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => {
        if (id === latest.current) setData(d);
      })
      .catch((e: unknown) => {
        if (id === latest.current) setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.');
      })
      .finally(() => {
        if (id === latest.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}
