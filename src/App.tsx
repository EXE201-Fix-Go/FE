import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CustomerHeader } from './components/CustomerHeader';
import { CustomerBottomNav } from './components/CustomerBottomNav';
import { CustomerHomeScreen } from './components/CustomerHomeScreen';
import { CustomerConfirmRequestScreen } from './components/CustomerConfirmRequestScreen';
import { CustomerRadarSearchingScreen } from './components/CustomerRadarSearchingScreen';
import { CustomerTrackingScreen } from './components/CustomerTrackingScreen';
import { CustomerQuoteReviewScreen } from './components/CustomerQuoteReviewScreen';
import { CustomerCompletedScreen } from './components/CustomerCompletedScreen';
import { CustomerHistoryScreen } from './components/CustomerHistoryScreen';
import { CustomerOrderDetailScreen } from './components/CustomerOrderDetailScreen';
import { CustomerProfileScreen } from './components/CustomerProfileScreen';
import { MechanicDashboardScreen } from './components/MechanicDashboardScreen';
import { MechanicIncomeScreen } from './components/MechanicIncomeScreen';
import { MechanicNavigationScreen } from './components/MechanicNavigationScreen';
import { MechanicProfileScreen } from './components/MechanicProfileScreen';
import { MechanicQuoteCreateScreen } from './components/MechanicQuoteCreateScreen';
import { MechanicReviewsScreen } from './components/MechanicReviewsScreen';
import { AuthPhoneScreen } from './components/AuthPhoneScreen';
import { AuthOtpScreen } from './components/AuthOtpScreen';
import { PartnerRegisterScreen } from './components/PartnerRegisterScreen';
import { ShopOwnerScreen } from './components/ShopOwnerScreen';
import { NotificationHost, toast } from './components/notify';
import { SERVICES } from './data';
import { EntryDestination, ScreenId, ServiceItem, UserRole } from './types';
import { requestOtp, verifyOtp, logout, me, AppRole, AuthUser } from './api/auth';
import { ApiError, apiConfigured, setOnUnauthorized, setTokens, hasStoredSession } from './api/client';
import {
  Order, createOrder, confirmOrder, getOrder, getOrderStatus, cancelOrder, approveQuote, declineQuote, submitReview,
} from './api/orders';
import {
  Offer, PartnerProfile, PartnerStats, getPartnerMe, updatePresence, acceptOffer, declineOffer,
  arriveAtOrder, startChecking, sendQuote, completeOrder, registerPartner, QuoteLineInput,
} from './api/partner';
import { ORDER_STATUS_LABEL, isTerminal } from './domain/status';
import { uploadPhoto } from './api/uploads';
import { getPartnerDashboard } from './api/partner';
import { Coords, getCurrentPosition, GeoError, PILOT_FALLBACK, reverseGeocode } from './domain/geo';

type AuthStep = 'phone' | 'otp';
export type LocationStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unsupported';

type EntryRoute = {
  dest: EntryDestination;
};

/**
 * Login entry points are separate URLs, while the app remains a single SPA.
 * The base-aware helpers also keep the routes working on the GitHub Pages `/FE/` base.
 */
function getAppPath(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (base && (pathname === base || pathname.startsWith(`${base}/`))) {
    return pathname.slice(base.length) || '/';
  }
  return pathname || '/';
}

function getEntryRoute(): EntryRoute {
  if (typeof window === 'undefined') return { dest: 'customer' };

  const path = getAppPath(window.location.pathname);
  if (path === '/customer/login') {
    return { dest: 'customer' };
  }

  if (path === '/partner/login') {
    const requested = new URLSearchParams(window.location.search).get('dest');
    const dest: EntryDestination =
      requested === 'shop' || requested === 'staff' || requested === 'register'
        ? requested
        : 'mechanic';
    return { dest };
  }

  // The customer login is the default entry point, including `/`.
  return { dest: 'customer' };
}

/** Làng Đại học, Thủ Đức — khu vực pilot (BRD). Dùng khi chưa/không lấy được GPS thật. */
const PILOT_LOCATION = { lat: 10.87, lng: 106.803 };
const POLL_MS = 4000;
const DASHBOARD_POLL_MS = 3000;

/** Màn khách nào đang "theo dõi" đơn thì App được phép tự chuyển màn theo trạng thái. */
const CUSTOMER_WATCH_SCREENS: ScreenId[] = [
  'customer_radar_searching',
  'customer_tracking',
  'customer_quote_review',
];

/** Trạng thái hiện tại của đơn; backend cũ chưa có /status thì tải đơn đầy đủ. */
async function pollStatus(id: string): Promise<string> {
  try {
    return (await getOrderStatus(id)).status;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return (await getOrder(id)).status;
    throw e;
  }
}

function customerScreenFor(o: Order): ScreenId | null {
  switch (o.status) {
    case 'PENDING_CONFIRMATION':
    case 'REQUESTED':
      return 'customer_radar_searching';
    case 'WAITING_FOR_APPROVAL':
    case 'ADDITIONAL_QUOTE':
      return 'customer_quote_review';
    case 'COMPLETED':
      return 'customer_completed';
    case 'CANCELLED':
    case 'NO_PARTNER_FOUND':
    case 'EXPIRED':
      return null;
    default:
      return 'customer_tracking';
  }
}

export default function App() {
  // Deep-link cho dev/QA: ?screen=<id> nhảy thẳng tới một màn (bỏ qua đăng nhập, dữ liệu mẫu).
  const params =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const startScreen = params.get('screen') as ScreenId | null;
  const entryRoute = getEntryRoute();
  const initialRole: UserRole =
    startScreen &&
    (startScreen.startsWith('mechanic_') || startScreen === 'shop_owner' || startScreen === 'partner_register')
      ? 'mechanic'
      : entryRoute.dest === 'customer'
        ? 'customer'
        : 'mechanic';

  const [activeScreen, setActiveScreen] = useState<ScreenId>(startScreen ?? 'customer_home');
  const [selectedService, setSelectedService] = useState<ServiceItem>(SERVICES[0]);
  const [currentAddress, setCurrentAddress] = useState<string>('Cổng KTX khu B, Làng Đại học, Thủ Đức');

  // ── Vị trí GPS thật ───────────────────────────────────────────────
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  /** Lấy vị trí; trả về toạ độ dùng được + cờ `real` (true nếu là GPS thật, false nếu fallback pilot). */
  const locate = useCallback(async (): Promise<{ coords: Coords; real: boolean }> => {
    setLocationStatus('locating');
    try {
      const c = await getCurrentPosition();
      setCoords(c);
      setLocationStatus('ready');
      return { coords: c, real: true };
    } catch (e) {
      setLocationStatus(e instanceof GeoError && e.kind === 'unsupported' ? 'unsupported' : 'denied');
      return { coords: PILOT_FALLBACK, real: false };
    }
  }, []);
  /** Định vị + đổi tên "Vị trí hiện tại" theo GPS thật (reverse geocode). Dùng cho luồng khách. */
  const locateAndName = useCallback(async () => {
    const { coords: c, real } = await locate();
    if (!real) return; // bị từ chối → giữ địa chỉ hiện tại, không đặt tên theo vị trí mẫu
    const name = await reverseGeocode(c.lat, c.lng);
    if (name) setCurrentAddress(name);
  }, [locate]);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  // Khách vào trang chủ lần đầu: xin quyền và lấy vị trí ngay để đặt đơn đúng chỗ.
  useEffect(() => {
    if (activeScreen === 'customer_home' && locationStatus === 'idle') void locateAndName();
  }, [activeScreen, locationStatus, locateAndName]);

  // ── Trạng thái đăng nhập ──────────────────────────────────────────
  const [authed, setAuthed] = useState<boolean>(!!startScreen);
  const [authStep, setAuthStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<{ otpId: string; devCode?: string | null } | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [pendingDest, setPendingDest] = useState<EntryDestination>(entryRoute.dest);
  const live = !startScreen && apiConfigured; // deep-link hoặc build không có backend = chế độ demo

  // ── Ghi nhớ đăng nhập: khôi phục phiên từ refresh token đã lưu ─────
  const [restoring, setRestoring] = useState<boolean>(() => live && hasStoredSession());
  useEffect(() => {
    if (!live || authed || !hasStoredSession()) {
      setRestoring(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const u = await me(); // client tự refresh access token bằng refresh token đã lưu
        if (cancelled) return;
        setUser(u);
        setAuthed(true);
        switch (u.appRole) {
          case 'P_IND':
          case 'P_STAFF':
            setRole('mechanic');
            setActiveScreen('mechanic_dashboard');
            break;
          case 'P_SHOP':
            setRole('mechanic');
            setActiveScreen('shop_owner');
            break;
          default: // CUSTOMER / ADMIN
            setRole('customer');
            setActiveScreen('customer_home');
            break;
        }
      } catch {
        setTokens(null, null); // refresh token hỏng/hết hạn → xoá, yêu cầu đăng nhập lại
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ chạy 1 lần lúc mở app

  // ── Khách: đơn đang theo dõi ──────────────────────────────────────
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // ── Thợ: hồ sơ, lời mời, đơn đang làm ─────────────────────────────
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [jobs, setJobs] = useState<Offer[]>([]);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const resetAll = useCallback(() => {
    setAuthed(false);
    setAuthStep('phone');
    setPhone('');
    setOtp(null);
    setUser(null);
    setPendingDest(getEntryRoute().dest);
    setCurrentOrder(null);
    setProfile(null);
    setOffers([]);
    setJobs([]);
    setActiveOrder(null);
    setActiveScreen('customer_home');
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      resetAll();
      toast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'info');
    });
  }, [resetAll]);

  const handleLogout = () => {
    logout().catch(() => {});
    resetAll();
  };

  const handlePartnerDestChange = useCallback((dest: EntryDestination) => {
    if (dest !== 'mechanic' && dest !== 'shop' && dest !== 'staff') return;
    setPendingDest(dest);

    // Giữ lựa chọn khi người dùng refresh hoặc chia sẻ deep-link đăng nhập đối tác.
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (dest === 'mechanic') url.searchParams.delete('dest');
    else url.searchParams.set('dest', dest);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  // Bước 1: nhập SĐT → backend gửi OTP (dev: trả devCode)
  const handlePhoneSubmit = async (p: string) => {
    setPhone(p);
    if (!live) {
      setOtp({ otpId: 'demo', devCode: '123456' });
      setAuthStep('otp');
      return;
    }
    const res = await requestOtp(p);   // lỗi (429 quá số lần, mạng…) hiện ngay trên màn SĐT
    setOtp({ otpId: res.otpId, devCode: res.devCode });
    setAuthStep('otp');
  };

  // Bước 3: OTP hợp lệ → vào đúng app theo vai trò THẬT của tài khoản (ràng role ở backend)
  const routeAfterAuth = (appRole: AppRole) => {
    setAuthed(true);
    const wantsPartner = pendingDest !== 'customer';
    switch (appRole) {
      case 'CUSTOMER':
        if (pendingDest === 'register' || wantsPartner) {
          // Số này chưa là đối tác → đi đăng ký KYC
          setRole('mechanic');
          setActiveScreen('partner_register');
        } else {
          setRole('customer');
          setActiveScreen('customer_home');
        }
        break;
      case 'P_SHOP':
        setRole('mechanic');
        setActiveScreen('shop_owner');
        if (pendingDest === 'customer') toast('Số này là tài khoản chủ tiệm — đã chuyển sang app Đối tác.', 'info');
        break;
      case 'P_IND':
      case 'P_STAFF':
        setRole('mechanic');
        setActiveScreen('mechanic_dashboard');
        if (pendingDest === 'customer') toast('Số này là tài khoản thợ — đã chuyển sang app Đối tác.', 'info');
        break;
      case 'ADMIN':
        setRole('customer');
        setActiveScreen('customer_home');
        toast('Tài khoản ADMIN: prototype chưa có màn quản trị, dùng docs/order-flow.http để duyệt KYC.', 'info');
        break;
    }
  };

  const handleVerify = async (code: string) => {
    if (!otp) throw new Error('Chưa gửi OTP.');
    if (!live) {
      // Demo: vào đúng app theo vai trò đã chọn, dữ liệu mẫu
      const demoRole: AppRole =
        pendingDest === 'customer'
          ? 'CUSTOMER'
          : pendingDest === 'shop'
            ? 'P_SHOP'
            : pendingDest === 'staff'
              ? 'P_STAFF'
              : pendingDest === 'register'
                ? 'CUSTOMER'
                : 'P_IND';
      routeAfterAuth(demoRole);
      return;
    }
    const res = await verifyOtp(otp.otpId, code);
    setUser(res.user);
    routeAfterAuth(res.role);
  };

  const backToEntry = handleLogout;

  // ── Khách: poll đơn đang theo dõi và tự chuyển màn ────────────────
  const lastNotified = useRef<string | null>(null);
  useEffect(() => {
    if (!live || !currentOrder || !CUSTOMER_WATCH_SCREENS.includes(activeScreen)) return;
    let inFlight = false;
    const id = setInterval(async () => {
      if (document.hidden) return; // tab bị ẩn → ngừng bắn request (tiết kiệm mạng/pin)
      if (inFlight) return; // không xếp chồng request khi mạng chậm
      inFlight = true;
      try {
        if ((await pollStatus(currentOrder.id)) === currentOrder.status) return; // chưa đổi → không tải lại đơn đầy đủ
        const o = await getOrder(currentOrder.id);
        setCurrentOrder(o);
        const target = customerScreenFor(o);
        if (target === null) {
          if (lastNotified.current !== o.id) {
            lastNotified.current = o.id;
            toast(
              o.status === 'NO_PARTNER_FOUND'
                ? 'Rất tiếc, hiện chưa có thợ nào gần bạn nhận đơn. Vui lòng thử lại sau.'
                : `Đơn ${o.orderCode}: ${ORDER_STATUS_LABEL[o.status]}.`,
              'info'
            );
          }
          setActiveScreen('customer_home');
        } else if (target !== activeScreen) {
          setActiveScreen(target);
        }
      } catch {
        /* giữ màn hiện tại, thử lại ở lần poll sau */
      } finally {
        inFlight = false;
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [live, currentOrder?.id, currentOrder?.status, activeScreen]); // eslint-disable-line react-hooks/exhaustive-deps

  const placeOrder = async (note: string, extraServiceIds: string[], photos: File[]) => {
    // Ảnh hiện trường lên máy chủ trước (BR05), rồi mới tạo đơn với URL thật để thợ xem được.
    const photoUrls = await Promise.all(photos.map(uploadPhoto));
    const created = await createOrder({
      serviceId: selectedService.id,
      extraServiceIds,
      addressText: currentAddress,
      note,
      photoUrls,
      lat: coords?.lat ?? PILOT_LOCATION.lat,
      lng: coords?.lng ?? PILOT_LOCATION.lng,
    });
    const confirmed = await confirmOrder(created.id); // BR01: xác nhận phí gọi thợ → điều phối
    setCurrentOrder(confirmed);
    const target = customerScreenFor(confirmed);
    if (target) {
      setActiveScreen(target);
    } else {
      // Điều phối kết thúc ngay (thường NO_PARTNER_FOUND khi không có thợ trong bán kính vị trí GPS).
      // Trước đây về home lặng lẽ → trông như "không đặt được đơn". Nay báo rõ.
      lastNotified.current = confirmed.id;
      setActiveScreen('customer_home');
      toast(
        confirmed.status === 'NO_PARTNER_FOUND'
          ? 'Chưa có thợ nào gần vị trí của bạn nhận đơn. Khu vực thí điểm hiện quanh Làng ĐH Thủ Đức — hãy thử lại sau, hoặc kiểm tra lại vị trí.'
          : `Đơn ${confirmed.orderCode}: ${ORDER_STATUS_LABEL[confirmed.status]}.`,
        'info'
      );
    }
  };

  const cancelCurrent = async (reason: string) => {
    if (!currentOrder) return;
    try {
      const o = await cancelOrder(currentOrder.id, reason);
      setCurrentOrder(o);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Không hủy được đơn.', 'error');
    }
    setActiveScreen('customer_home');
  };

  const openOrder = (o: Order) => {
    setCurrentOrder(o);
    setActiveScreen(customerScreenFor(o) ?? 'customer_history');
  };

  /** Mở màn chi tiết cho một đơn trong lịch sử. Lấy bản mới nhất (đủ history) nếu có backend. */
  const openOrderDetail = async (o: Order) => {
    setDetailOrder(o);
    setActiveScreen('customer_order_detail');
    if (apiConfigured) {
      try {
        setDetailOrder(await getOrder(o.id));
      } catch {
        /* giữ bản đã có trong danh sách */
      }
    }
  };

  // ── Thợ: hồ sơ + poll lời mời/đơn khi ở dashboard ─────────────────
  const partnerInFlight = useRef(false);
  const refreshPartner = useCallback(async () => {
    if (partnerInFlight.current) return;
    partnerInFlight.current = true;
    try {
      const d = await getPartnerDashboard();   // 1 request thay vì 4 → nhẹ pool kết nối, nhanh hơn
      const p = d.profile;
      setProfile(p);
      setOffers(d.offers);
      setJobs(d.jobs);
      setStats(d.stats);
      setPartnerError(
        p.verificationStatus !== 'APPROVED'
          ? 'Hồ sơ KYC đang chờ Fix&Go duyệt — bạn chưa nhận được đơn. (Admin duyệt qua API /admin/partners/{id}/verify)'
          : null
      );
    } catch (e: unknown) {
      setPartnerError(e instanceof Error ? e.message : 'Không tải được dữ liệu đối tác.');
    } finally {
      partnerInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (
      !live ||
      (activeScreen !== 'mechanic_dashboard' &&
        activeScreen !== 'mechanic_income' &&
        activeScreen !== 'mechanic_reviews' &&
        activeScreen !== 'mechanic_profile')
    ) return;
    let cancelled = false;
    partnerInFlight.current = false;   // vừa quay về dashboard: làm mới ngay, không chờ request cũ
    (async () => {
      // Lần đầu vào: nếu đã duyệt mà đang OFFLINE thì bật ONLINE tại vị trí GPS thật (fallback pilot).
      try {
        const p = await getPartnerMe();
        if (!cancelled && p.verificationStatus === 'APPROVED' && p.availability === 'OFFLINE') {
          await updatePresence('ONLINE'); // giữ vị trí đã đăng ký (không ép GPS thiết bị người test)
        }
      } catch {
        /* báo ở refreshPartner */
      }
      if (!cancelled) refreshPartner();
    })();
    const id = setInterval(() => {
      if (!document.hidden) refreshPartner(); // ẩn tab → ngừng poll dashboard
    }, DASHBOARD_POLL_MS);
    // Quay lại tab → làm mới ngay, không đợi hết chu kỳ.
    const onVisible = () => {
      if (!document.hidden) refreshPartner();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [live, activeScreen, refreshPartner]);

  const openJob = async (job: Offer) => {
    const o = await getOrder(job.orderId);
    setActiveOrder(o);
    if (o.status === 'ASSIGNED') setActiveScreen('mechanic_navigation');
    else if (o.status === 'ARRIVED') {
      const c = await startChecking(o.id);
      setActiveOrder(c);
      setActiveScreen('mechanic_quote_create');
    } else setActiveScreen('mechanic_quote_create');
  };

  // Thợ ở màn báo giá: poll để biết khách đã duyệt chưa
  useEffect(() => {
    if (!live || !activeOrder || activeScreen !== 'mechanic_quote_create') return;
    let inFlight = false;
    const id = setInterval(async () => {
      if (document.hidden) return; // tab ẩn → ngừng poll báo giá
      if (inFlight) return;
      inFlight = true;
      try {
        if ((await pollStatus(activeOrder.id)) === activeOrder.status) return;
        const o = await getOrder(activeOrder.id);
        setActiveOrder(o);
        if (isTerminal(o.status)) {
          toast(`Đơn ${o.orderCode}: ${ORDER_STATUS_LABEL[o.status]}.`, 'info');
          setActiveOrder(null);
          setActiveScreen('mechanic_dashboard');
        }
      } catch {
        /* thử lại lần sau */
      } finally {
        inFlight = false;
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [live, activeOrder?.id, activeOrder?.status, activeScreen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Đang khôi phục phiên đã ghi nhớ → splash nhẹ, tránh nháy màn đăng nhập.
  if (restoring) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-surface gap-3">
        <span className="material-symbols-outlined text-[40px] text-primary animate-spin">progress_activity</span>
        <p className="font-label-md text-on-surface-variant">Đang khôi phục phiên đăng nhập…</p>
      </div>
    );
  }

  // ── Luồng: URL đăng nhập → SĐT → OTP → vào đúng app ──────────────
  if (!authed) {
    return (
      <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-surface relative shadow-2xl overflow-x-hidden">
        {authStep === 'phone' && (
          <AuthPhoneScreen
            dest={pendingDest}
            onDestChange={handlePartnerDestChange}
            onSubmit={handlePhoneSubmit}
          />
        )}
        {authStep === 'otp' && (
          <AuthOtpScreen
            phone={phone}
            dest={pendingDest}
            devCode={otp?.devCode}
            onBack={() => setAuthStep('phone')}
            onVerify={handleVerify}
            onResend={async () => {
              if (!live) return;
              const res = await requestOtp(phone);
              setOtp({ otpId: res.otpId, devCode: res.devCode });
            }}
          />
        )}
        <NotificationHost />
      </div>
    );
  }

  // Helper title for CustomerHeader
  const getHeaderTitle = () => {
    switch (activeScreen) {
      case 'customer_confirm_request':
        return 'Xác Nhận Dịch Vụ';
      case 'customer_radar_searching':
        return 'Chi Tiết Cứu Hộ';
      case 'customer_tracking':
        return 'Theo Dõi Trực Tiếp';
      case 'customer_quote_review':
        return 'Báo Giá Minh Bạch';
      case 'customer_completed':
        return 'Hóa Đơn & Đánh Giá';
      case 'customer_history':
        return 'Lịch Sử Cứu Hộ';
      case 'customer_order_detail':
        return 'Chi Tiết Đơn';
      case 'customer_profile':
        return 'Tài Khoản & Xe';
      default:
        return undefined;
    }
  };

  const isPartnerFull = activeScreen === 'partner_register' || activeScreen === 'shop_owner';
  const isCustomerFlow = !activeScreen.startsWith('mechanic_') && !isPartnerFull;
  const showCustomerBottomNav =
    activeScreen === 'customer_home' || activeScreen === 'customer_history' || activeScreen === 'customer_profile';

  const trackingLive =
    live && currentOrder
      ? {
          orderCode: currentOrder.orderCode,
          status: currentOrder.status,
          statusLabel: ORDER_STATUS_LABEL[currentOrder.status],
          mechanicName: currentOrder.partner?.fullName,
          mechanicPhone: currentOrder.partner?.phone,
          address: currentOrder.addressText,
          customerLat: currentOrder.lat,
          customerLng: currentOrder.lng,
          partnerLat: currentOrder.partner?.lat ?? null,
          partnerLng: currentOrder.partner?.lng ?? null,
        }
      : undefined;

  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-surface relative shadow-2xl overflow-x-hidden">
      {isCustomerFlow && (
        <CustomerHeader
          title={getHeaderTitle()}
          showBackButton={activeScreen !== 'customer_home'}
          onBack={() => {
            if (activeScreen === 'customer_confirm_request') setActiveScreen('customer_home');
            else if (activeScreen === 'customer_radar_searching') setActiveScreen('customer_home');
            else if (activeScreen === 'customer_tracking') setActiveScreen('customer_home');
            else if (activeScreen === 'customer_quote_review') setActiveScreen('customer_tracking');
            else setActiveScreen('customer_home');
          }}
          onProfileClick={() => setActiveScreen('customer_profile')}
        />
      )}

      <div
        className={`flex-1 flex flex-col ${
          isCustomerFlow ? 'pt-[calc(64px+env(safe-area-inset-top))]' : 'pt-[env(safe-area-inset-top)]'
        }`}
      >
        {activeScreen === 'customer_home' && (
          <CustomerHomeScreen
            onSelectService={(service) => {
              setSelectedService(service);
              setActiveScreen('customer_confirm_request');
            }}
            currentAddress={currentAddress}
            onUpdateAddress={() => {
              const newAddr = prompt('Nhập địa chỉ gặp sự cố mới:', currentAddress);
              if (newAddr) setCurrentAddress(newAddr);
            }}
            coords={coords}
            locationStatus={locationStatus}
            onLocate={() => void locateAndName()}
          />
        )}

        {activeScreen === 'customer_confirm_request' && (
          <CustomerConfirmRequestScreen
            selectedService={selectedService}
            currentAddress={currentAddress}
            gpsAccuracy={locationStatus === 'ready' ? coords?.accuracy ?? null : null}
            coords={locationStatus === 'ready' ? coords : null}
            onLocate={() => void locateAndName()}
            isLocating={locationStatus === 'locating'}
            onBack={() => setActiveScreen('customer_home')}
            onConfirmDispatch={
              live
                ? placeOrder
                : async () => {
                    setActiveScreen('customer_radar_searching');
                  }
            }
            onChangeService={() => setActiveScreen('customer_home')}
            onEditAddress={() => {
              const newAddr = prompt('Chỉnh sửa địa chỉ:', currentAddress);
              if (newAddr) setCurrentAddress(newAddr);
            }}
          />
        )}

        {activeScreen === 'customer_radar_searching' && (
          <CustomerRadarSearchingScreen
            service={selectedService}
            address={currentAddress}
            onCancel={() => (live ? cancelCurrent('Khách hủy khi đang tìm thợ') : setActiveScreen('customer_home'))}
            onMechanicMatched={live ? undefined : () => setActiveScreen('customer_tracking')}
            orderCode={currentOrder?.orderCode}
            statusText={
              currentOrder
                ? `${ORDER_STATUS_LABEL[currentOrder.status]} — đang phát tới thợ trong bán kính…`
                : undefined
            }
          />
        )}

        {activeScreen === 'customer_tracking' && (
          <CustomerTrackingScreen
            onArrivedAndQuote={live ? undefined : () => setActiveScreen('customer_quote_review')}
            onCancel={() => (live ? cancelCurrent('Khách hủy chuyến') : setActiveScreen('customer_home'))}
            live={trackingLive}
          />
        )}

        {activeScreen === 'customer_quote_review' && (
          <CustomerQuoteReviewScreen
            quote={live ? currentOrder?.quote : undefined}
            orderCode={currentOrder?.orderCode}
            mechanicName={currentOrder?.partner?.fullName}
            onAccept={async () => {
              if (live && currentOrder?.quote) {
                await approveQuote(currentOrder.id, currentOrder.quote.id);
                setCurrentOrder(await getOrder(currentOrder.id));
                setActiveScreen('customer_tracking');
              } else setActiveScreen('customer_completed');
            }}
            onDecline={async () => {
              if (live && currentOrder?.quote) {
                await declineQuote(currentOrder.id, currentOrder.quote.id, 'Khách từ chối báo giá');
                setCurrentOrder(await getOrder(currentOrder.id));
              }
              setActiveScreen('customer_home');
            }}
          />
        )}

        {activeScreen === 'customer_completed' && (
          <CustomerCompletedScreen
            order={live ? currentOrder : undefined}
            onSubmitReview={
              live && currentOrder
                ? async (rating, feedback) => {
                    await submitReview(currentOrder.id, rating, feedback);
                  }
                : undefined
            }
            onBackToHome={() => setActiveScreen('customer_home')}
            onViewWarranty={() => setActiveScreen('customer_history')}
          />
        )}

        {activeScreen === 'customer_history' && (
          <CustomerHistoryScreen
            onBackToHome={() => setActiveScreen('customer_home')}
            onOpen={openOrderDetail}
          />
        )}

        {activeScreen === 'customer_order_detail' && detailOrder && (
          <CustomerOrderDetailScreen
            order={detailOrder}
            onBack={() => setActiveScreen('customer_history')}
            onResume={openOrder}
            onViewInvoice={(o) => {
              setCurrentOrder(o);
              setActiveScreen('customer_completed');
            }}
          />
        )}

        {activeScreen === 'customer_profile' && (
          <CustomerProfileScreen onLogout={backToEntry} user={user} />
        )}

        {/* Mechanic Views */}
        {activeScreen === 'mechanic_dashboard' && (
          <MechanicDashboardScreen
            onAcceptJob={() => setActiveScreen('mechanic_navigation')}
            onOpenIncome={() => setActiveScreen('mechanic_income')}
            onOpenReviews={() => setActiveScreen('mechanic_reviews')}
            onOpenProfile={() => setActiveScreen('mechanic_profile')}
            live={
              live
                ? {
                    profile,
                    stats,
                    offers,
                    jobs,
                    error: partnerError,
                    onAccept: async (assignmentId) => {
                      // Mốc tính phí di chuyển = vị trí ĐĂNG KÝ hiện tại của thợ (partner_profiles.current_lat/lng),
                      // KHÔNG ghi đè bằng GPS thiết bị người test — nhờ vậy km luôn tính đúng dù test 1 máy.
                      const accepted = await acceptOffer(assignmentId);
                      setOffers([]);
                      await openJob(accepted);
                    },
                    onDecline: async (assignmentId) => {
                      await declineOffer(assignmentId, 'Đang bận');
                      refreshPartner();
                    },
                    onOpenJob: (job) => openJob(job).catch((e: unknown) => toast(e instanceof Error ? e.message : 'Lỗi', 'error')),
                    onToggleReady: async (ready) => {
                      // Chỉ bật/tắt trực tuyến; giữ nguyên vị trí đăng ký của thợ.
                      setProfile(await updatePresence(ready ? 'ONLINE' : 'OFFLINE'));
                    },
                  }
                : undefined
            }
          />
        )}

        {activeScreen === 'mechanic_income' && (
          <MechanicIncomeScreen
            displayName={profile?.fullName || user?.fullName}
            stats={stats}
            live={live}
            onRescue={() => setActiveScreen('mechanic_dashboard')}
            onReviews={() => setActiveScreen('mechanic_reviews')}
            onProfile={() => setActiveScreen('mechanic_profile')}
          />
        )}

        {activeScreen === 'mechanic_reviews' && (
          <MechanicReviewsScreen
            displayName={profile?.fullName || user?.fullName}
            stats={stats}
            live={live}
            onRescue={() => setActiveScreen('mechanic_dashboard')}
            onIncome={() => setActiveScreen('mechanic_income')}
            onProfile={() => setActiveScreen('mechanic_profile')}
          />
        )}

        {activeScreen === 'mechanic_profile' && (
          <MechanicProfileScreen
            profile={profile}
            stats={stats}
            live={live}
            displayName={user?.fullName}
            phone={user?.phone}
            onRescue={() => setActiveScreen('mechanic_dashboard')}
            onIncome={() => setActiveScreen('mechanic_income')}
            onReviews={() => setActiveScreen('mechanic_reviews')}
            onLogout={backToEntry}
          />
        )}

        {activeScreen === 'mechanic_navigation' && (
          <MechanicNavigationScreen
            live={
              live && activeOrder
                ? {
                    orderCode: activeOrder.orderCode,
                    contactName: currentOrderContactName(activeOrder),
                    addressText: activeOrder.addressText,
                    note: activeOrder.note,
                    serviceName: activeOrder.serviceName,
                    photoUrls: activeOrder.photoUrls,
                  }
                : undefined
            }
            onArrived={async () => {
              if (live && activeOrder) {
                try {
                  await arriveAtOrder(activeOrder.id);
                  setActiveOrder(await startChecking(activeOrder.id));
                } catch (e: unknown) {
                  toast(e instanceof Error ? e.message : 'Không cập nhật được.', 'error');
                  return;
                }
              }
              setActiveScreen('mechanic_quote_create');
            }}
            onBackToDashboard={() => setActiveScreen('mechanic_dashboard')}
          />
        )}

        {activeScreen === 'mechanic_quote_create' && (
          <MechanicQuoteCreateScreen
            live={
              live && activeOrder
                ? {
                    orderCode: activeOrder.orderCode,
                    status: activeOrder.status,
                    contactName: currentOrderContactName(activeOrder),
                    contactPhone: activeOrder.contactPhone,
                    approvedTotal: activeOrder.quote?.status === 'APPROVED' ? activeOrder.quote.totalAmount : null,
                    callOutFee: activeOrder.callOutFee,
                    travelDistanceKm: activeOrder.travelDistanceKm ?? null,
                    travelFee: activeOrder.travelFee ?? null,
                    serviceId: activeOrder.serviceId,
                    extraServiceIds: activeOrder.extraServiceIds,
                    quoteRevision: activeOrder.quote?.revisionNo ?? null,
                  }
                : undefined
            }
            onQuoteSent={async (items: QuoteLineInput[]) => {
              if (live && activeOrder) {
                await sendQuote(activeOrder.id, items);
                setActiveOrder(await getOrder(activeOrder.id));
              } else {
                toast('Báo giá đã được gửi đến khách hàng!', 'success');
              }
            }}
            onJobFinished={async () => {
              if (live && activeOrder) {
                const o = await completeOrder(activeOrder.id);
                toast(`Đã hoàn tất ${o.orderCode}. Đã ghi nhận thu ${o.payment?.amount.toLocaleString('vi-VN')} ₫ tiền mặt từ khách.`, 'success');
                setActiveOrder(null);
                setActiveScreen('mechanic_dashboard');
              } else {
                toast('Đã hoàn tất sửa chữa và thu 120.000 ₫ thành công!', 'success');
                setActiveScreen('mechanic_dashboard');
              }
            }}
            onBackToNavigation={() => setActiveScreen('mechanic_navigation')}
          />
        )}

        {/* App Đối tác — Đăng ký (KYC) & Chủ tiệm */}
        {activeScreen === 'partner_register' && (
          <PartnerRegisterScreen
            phone={phone}
            onBack={backToEntry}
            onSubmitted={async (input) => {
              if (live) {
                const p = await registerPartner(input);
                setProfile(p);
                toast('Đã gửi hồ sơ KYC. Fix&Go sẽ duyệt trong vòng 24 giờ — bạn chưa nhận đơn cho tới khi được duyệt.', 'success');
                setActiveScreen(p.partnerType === 'SHOP' ? 'shop_owner' : 'mechanic_dashboard');
              } else {
                toast('Đã gửi hồ sơ KYC. Fix&Go sẽ duyệt trong vòng 24 giờ.', 'success');
                setActiveScreen('mechanic_dashboard');
              }
            }}
          />
        )}

        {activeScreen === 'shop_owner' && <ShopOwnerScreen onBack={backToEntry} live={live} />}
      </div>

      {showCustomerBottomNav && (
        <CustomerBottomNav currentScreen={activeScreen} onNavigate={(screen) => setActiveScreen(screen)} />
      )}
      <NotificationHost />
    </div>
  );
}

/** Tên khách hiện cho thợ (kèm SĐT liên hệ nếu có). */
function currentOrderContactName(o: Order): string {
  return o.contactName || o.contactPhone || o.orderCode;
}
