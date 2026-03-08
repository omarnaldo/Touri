import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/landing-page";
import { MarketplacePage } from "./pages/marketplace-page";
import { SignInPage } from "./pages/signin-page";
import { SignUpPage } from "./pages/signup-page";
import { VerifyEmailPage } from "./pages/verify-email-page";
import ChatPage from "./pages/chat-page";
import { EditProfilePage } from "./pages/edit-profile-page";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/marketplace",
    Component: MarketplacePage,
  },
  {
    path: "/signin",
    Component: SignInPage,
  },
  {
    path: "/signup",
    Component: SignUpPage,
  },
  {
    path: "/verify-email",
    Component: VerifyEmailPage,
  },
  {
    path: "/chat",
    element: (
      <ProtectedRoute>
        <ChatPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <EditProfilePage />
      </ProtectedRoute>
    ),
  },
]);
