import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, LogOut, User } from "lucide-react";
import touriLogo from "./figma/touri-logo-transparent.png";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const isAuthPage = location.pathname === "/signin" || location.pathname === "/signup";

  // Don't show navbar on auth pages
  if (isAuthPage) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={touriLogo} alt="Touri Logo" className="h-25 w-auto" />
            {/* <span className="text-2xl font-bold text-[#0D4A3A]">Touri</span> */}
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-[#0A1628] hover:text-[#0D4A3A] transition-colors">
              Home
            </Link>
            <Link to="/marketplace" className="text-[#0A1628] hover:text-[#0D4A3A] transition-colors">
              Find Guides
            </Link>
            {isAuthenticated && (
              <Link to="/chat" className="text-[#0A1628] hover:text-[#0D4A3A] transition-colors flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                Chat
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-[#0A1628] hover:text-[#0D4A3A] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#3CC9A0] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:inline text-sm font-medium">{user.firstName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-[#0A1628]/60 hover:text-red-500 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="hidden md:block text-[#0D4A3A] hover:text-[#0D4A3A]/80 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-[#0D4A3A] text-white px-6 py-3 rounded-lg hover:bg-[#0D4A3A]/90 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
