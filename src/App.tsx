import React, { useState } from 'react';
import { CustomerHeader } from './components/CustomerHeader';
import { CustomerBottomNav } from './components/CustomerBottomNav';
import { CustomerHomeScreen } from './components/CustomerHomeScreen';
import { CustomerConfirmRequestScreen } from './components/CustomerConfirmRequestScreen';
import { CustomerRadarSearchingScreen } from './components/CustomerRadarSearchingScreen';
import { CustomerTrackingScreen } from './components/CustomerTrackingScreen';
import { CustomerQuoteReviewScreen } from './components/CustomerQuoteReviewScreen';
import { CustomerCompletedScreen } from './components/CustomerCompletedScreen';
import { CustomerHistoryScreen } from './components/CustomerHistoryScreen';
import { CustomerProfileScreen } from './components/CustomerProfileScreen';
import { MechanicDashboardScreen } from './components/MechanicDashboardScreen';
import { MechanicNavigationScreen } from './components/MechanicNavigationScreen';
import { MechanicQuoteCreateScreen } from './components/MechanicQuoteCreateScreen';
import { AuthPhoneScreen } from './components/AuthPhoneScreen';
import { AuthOtpScreen } from './components/AuthOtpScreen';
import { AuthRoleSelectScreen } from './components/AuthRoleSelectScreen';
import { PartnerRegisterScreen } from './components/PartnerRegisterScreen';
import { ShopOwnerScreen } from './components/ShopOwnerScreen';
import { SERVICES } from './data';
import { EntryDestination, ScreenId, ServiceItem, UserRole } from './types';

type AuthStep = 'phone' | 'otp' | 'role';

export default function App() {
  // Deep-link cho dev/QA: ?screen=<id> nhảy thẳng tới một màn (bỏ qua đăng nhập).
  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const startScreen = params.get('screen') as ScreenId | null;
  const initialRole: UserRole =
    startScreen &&
    (startScreen.startsWith('mechanic_') ||
      startScreen === 'shop_owner' ||
      startScreen === 'partner_register')
      ? 'mechanic'
      : 'customer';

  const [activeScreen, setActiveScreen] = useState<ScreenId>(
    startScreen ?? 'customer_home'
  );
  const [selectedService, setSelectedService] = useState<ServiceItem>(SERVICES[0]);
  const [currentAddress, setCurrentAddress] = useState<string>(
    '242 Cống Quỳnh, P. Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh'
  );

  // ── Trạng thái đăng nhập ──────────────────────────────────────────
  const [authed, setAuthed] = useState<boolean>(!!startScreen);
  const [authStep, setAuthStep] = useState<AuthStep>('role');
  const [phone, setPhone] = useState<string>('');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [pendingDest, setPendingDest] = useState<EntryDestination>('customer');

  const handleLogout = () => {
    setAuthed(false);
    setAuthStep('role');
    setPhone('');
  };

  // Bước 1: chọn vai trò → sang nhập SĐT (chưa đăng nhập)
  const handleRoleSelected = (dest: EntryDestination) => {
    setPendingDest(dest);
    setAuthStep('phone');
  };

  // Bước cuối: OTP hợp lệ → vào đúng app theo vai trò đã chọn (ràng role)
  const routeAfterAuth = () => {
    setAuthed(true);
    switch (pendingDest) {
      case 'customer':
        setRole('customer');
        setActiveScreen('customer_home');
        break;
      case 'shop':
        setRole('mechanic');
        setActiveScreen('shop_owner');
        break;
      case 'register':
        setRole('mechanic');
        setActiveScreen('partner_register');
        break;
      case 'staff':
      case 'mechanic':
      default:
        setRole('mechanic');
        setActiveScreen('mechanic_dashboard');
        break;
    }
  };

  // Quay lại cổng chọn vai trò
  const backToEntry = () => {
    setAuthed(false);
    setAuthStep('role');
  };

  // ── Luồng: Chọn vai trò → SĐT → OTP → vào đúng app ───────────────
  if (!authed) {
    return (
      <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-surface relative shadow-2xl overflow-x-hidden">
        {authStep === 'role' && <AuthRoleSelectScreen onSelect={handleRoleSelected} />}
        {authStep === 'phone' && (
          <AuthPhoneScreen
            dest={pendingDest}
            onBack={() => setAuthStep('role')}
            onSubmit={(p) => {
              setPhone(p);
              setAuthStep('otp');
            }}
          />
        )}
        {authStep === 'otp' && (
          <AuthOtpScreen
            phone={phone}
            onBack={() => setAuthStep('phone')}
            onVerified={routeAfterAuth}
          />
        )}
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
      case 'customer_profile':
        return 'Tài Khoản & Xe';
      default:
        return undefined;
    }
  };

  const isPartnerFull =
    activeScreen === 'partner_register' || activeScreen === 'shop_owner';
  const isCustomerFlow = !activeScreen.startsWith('mechanic_') && !isPartnerFull;
  const showCustomerBottomNav =
    activeScreen === 'customer_home' ||
    activeScreen === 'customer_history' ||
    activeScreen === 'customer_profile';

  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-surface relative shadow-2xl overflow-x-hidden">

      {/* Customer Header for customer views */}
      {isCustomerFlow && (
        <CustomerHeader
          title={getHeaderTitle()}
          showBackButton={activeScreen !== 'customer_home'}
          onBack={() => {
            if (activeScreen === 'customer_confirm_request') setActiveScreen('customer_home');
            else if (activeScreen === 'customer_radar_searching')
              setActiveScreen('customer_confirm_request');
            else if (activeScreen === 'customer_tracking') setActiveScreen('customer_home');
            else if (activeScreen === 'customer_quote_review') setActiveScreen('customer_tracking');
            else if (activeScreen === 'customer_completed') setActiveScreen('customer_home');
            else if (activeScreen === 'customer_history') setActiveScreen('customer_home');
            else if (activeScreen === 'customer_profile') setActiveScreen('customer_home');
            else setActiveScreen('customer_home');
          }}
          onProfileClick={() => setActiveScreen('customer_profile')}
        />
      )}

      {/* Main Screen Content */}
      <div className={`flex-1 flex flex-col ${
        isCustomerFlow
          ? 'pt-[calc(64px+env(safe-area-inset-top))]'
          : 'pt-[env(safe-area-inset-top)]'
      }`}>
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
          />
        )}

        {activeScreen === 'customer_confirm_request' && (
          <CustomerConfirmRequestScreen
            selectedService={selectedService}
            currentAddress={currentAddress}
            onBack={() => setActiveScreen('customer_home')}
            onConfirmDispatch={(note) => {
              setActiveScreen('customer_radar_searching');
            }}
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
            onCancel={() => setActiveScreen('customer_home')}
            onMechanicMatched={() => setActiveScreen('customer_tracking')}
          />
        )}

        {activeScreen === 'customer_tracking' && (
          <CustomerTrackingScreen
            onArrivedAndQuote={() => setActiveScreen('customer_quote_review')}
            onCancel={() => setActiveScreen('customer_home')}
          />
        )}

        {activeScreen === 'customer_quote_review' && (
          <CustomerQuoteReviewScreen
            onAccept={() => setActiveScreen('customer_completed')}
            onDecline={() => setActiveScreen('customer_home')}
          />
        )}

        {activeScreen === 'customer_completed' && (
          <CustomerCompletedScreen
            onBackToHome={() => setActiveScreen('customer_home')}
            onViewWarranty={() => setActiveScreen('customer_history')}
          />
        )}

        {activeScreen === 'customer_history' && (
          <CustomerHistoryScreen
            onBackToHome={() => setActiveScreen('customer_home')}
            onViewInvoice={() => setActiveScreen('customer_completed')}
          />
        )}

        {activeScreen === 'customer_profile' && (
          <CustomerProfileScreen onLogout={backToEntry} />
        )}

        {/* Mechanic Views */}
        {activeScreen === 'mechanic_dashboard' && (
          <MechanicDashboardScreen
            onAcceptJob={() => setActiveScreen('mechanic_navigation')}
            onLogout={backToEntry}
          />
        )}

        {activeScreen === 'mechanic_navigation' && (
          <MechanicNavigationScreen
            onArrived={() => setActiveScreen('mechanic_quote_create')}
            onBackToDashboard={() => setActiveScreen('mechanic_dashboard')}
          />
        )}

        {activeScreen === 'mechanic_quote_create' && (
          <MechanicQuoteCreateScreen
            onQuoteSent={() => {
              alert(
                'Báo giá 120.000 ₫ đã được gửi thành công đến điện thoại khách hàng (Trần Thị Mai Lan)!'
              );
            }}
            onJobFinished={() => {
              alert('Đã hoàn tất sửa chữa và thu 120.000 ₫ thành công! Chuyển về màn hình hoàn tất.');
              setActiveScreen('customer_completed');
            }}
            onBackToNavigation={() => setActiveScreen('mechanic_navigation')}
          />
        )}

        {/* App Đối tác — Đăng ký (KYC) & Chủ tiệm */}
        {activeScreen === 'partner_register' && (
          <PartnerRegisterScreen
            phone={phone}
            onBack={backToEntry}
            onSubmitted={() => {
              alert('Đã gửi hồ sơ KYC. Fix&Go sẽ duyệt trong vòng 24 giờ.');
              setActiveScreen('mechanic_dashboard');
            }}
          />
        )}

        {activeScreen === 'shop_owner' && <ShopOwnerScreen onBack={backToEntry} />}
      </div>

      {/* Customer Bottom Navigation Bar */}
      {showCustomerBottomNav && (
        <CustomerBottomNav
          currentScreen={activeScreen}
          onNavigate={(screen) => setActiveScreen(screen)}
        />
      )}
    </div>
  );
}
