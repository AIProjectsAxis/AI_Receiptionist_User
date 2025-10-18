"use client";
export const runtime = 'edge';

import { useEffect, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/component/NavBar";
import Sidebar from "@/component/SideBar";
import { getToken } from "@/_utils/cookies";
import { getCompanyOnBoardingApiRequest, getUserProfileApiRequest } from "@/network/api";
import { getCompanyDataThunkRequest, getProfileDetailsThunkRequest } from "@/lib/Redux/SliceActions/CompanyActions";
import { useDispatch } from "react-redux";

const publicRoutes = ["/login", "/register", "/forgot-password", "/accept-invitation"];
const acceptInvitationRoutes = ["/accept-invitation"];

const LayoutAuth = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const isActionsPath = pathname === "/actions-management";
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isActionsPath);
  const token = getToken();

  const handleUserRouting = async (companyData) => {
    const statusOnboarding = companyData?.data?.status_onboarding;
    const status = companyData?.data?.status;


    const isOnApprovalPage = pathname === "/approval-pending";
    const isOnOnboardingPage = pathname === "/onboarding";
    const isOnDashboardPage = pathname === "/dashboard";
    const isOnAuthPage = ["/login", "/register", "/forgot-password"].includes(pathname);


    // Flow 1: Onboarding completed but status pending -> Approval page
    if (statusOnboarding === "completed" && status === "pending") {
      if (!isOnApprovalPage) {
        router.replace('/approval-pending');
      }
      return;
    }

    // Flow 2: Onboarding completed and status approved -> Dashboard
    if (statusOnboarding === "completed" && status === "approved") {

      if (isOnOnboardingPage || isOnApprovalPage || isOnAuthPage) {
        router.replace('/dashboard');
      }
      return;
    }

    // Flow 3: Onboarding not completed (any step) -> Onboarding page
    if (statusOnboarding !== "completed" || ["step_1", "step_2", "step_3", "pending_onboarding"].includes(statusOnboarding)) {
      if (!isOnOnboardingPage) {
        router.replace('/onboarding');
      }
      return;
    }

    // Flow 4: Default case - if on auth pages, redirect to dashboard
    if (isOnAuthPage) {
      router.replace('/dashboard');
      return;
    }

  };

  const initializeUser = async () => {
    try {
      setIsLoading(true);

      const [userResponse, companyData] = await Promise.all([
        getUserProfileApiRequest(),
        getCompanyOnBoardingApiRequest()
      ]);

      if (userResponse.success === false) {
        router.replace("/login");
        return;
      }

      await handleUserRouting(companyData);

      dispatch(getProfileDetailsThunkRequest());
      dispatch(getCompanyDataThunkRequest());

      setIsAuthenticated(true);
    } catch (error) {
      console.log(error);
      router.replace("/login");
    } finally {
      setIsLoading(false);
      setHasInitialized(true);
    }
  };

  useEffect(() => {
    if (!pathname) return;

    if (token) {
      // Prevent authenticated users from accessing auth pages
      if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
        // Immediately redirect based on status
        getCompanyOnBoardingApiRequest()
          .then(handleUserRouting)
          .catch(() => router.replace("/dashboard"));
        return;
      }

      // Initialize user data if not already done
      if (!hasInitialized) {
        initializeUser();
      } else {
        setIsAuthenticated(true);
      }
    } else {
      setIsAuthenticated(false);
      setHasInitialized(false);
      if (!publicRoutes.includes(pathname)) {
        router.replace("/login");
      }
    }
  }, [pathname, searchParams, token, hasInitialized]);

  useEffect(() => {
    if (isActionsPath) setIsSidebarOpen(false);
  }, [isActionsPath]);

  // Prevent authenticated users from accessing auth pages
  if (token && ["/login", "/register", "/forgot-password"].includes(pathname)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show login page only for unauthenticated users
  if (!token && publicRoutes.includes(pathname)) {
    return <Suspense>{children}</Suspense>;
  }

  if (!isAuthenticated) {
    return <Suspense>{children}</Suspense>;
  }

  if (isLoading && !hasInitialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  const shouldHideNavbar = pathname === "/onboarding" ||
    publicRoutes.includes(pathname) ||
    pathname === "/approval-pending" ||
    acceptInvitationRoutes.includes(pathname);

  const shouldFullWidth = shouldHideNavbar || isActionsPath;

  return (
    <Suspense>
      <div className="flex w-full h-[100vh]">
        {!shouldHideNavbar && (
          <>
            <Navbar toggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
            <Sidebar isOpen={isSidebarOpen} />
          </>
        )}
        {isLoading ? (
          <div className="h-screen w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="h-full overflow-y-scroll overflow-x-hidden w-full main-container-wrapper">
            <main
              className={`p-5 ${shouldFullWidth ? "pt-0 !p-0" : "container mx-auto pt-20"}`}
              style={{ height: "100vh" }}
            >
              {children}
            </main>
          </div>
        )}
      </div>
    </Suspense>
  );
};

export default LayoutAuth;
