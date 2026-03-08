import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { authService } from "../lib/api";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification link is invalid or missing.");
      return;
    }

    let mounted = true;

    authService
      .verifyEmail(token)
      .then(() => {
        if (mounted) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
          setTimeout(() => navigate("/"), 2000);
        }
      })
      .catch((err: Error) => {
        if (mounted) {
          setStatus("error");
          setMessage(err.message || "Verification failed. The link may have expired.");
        }
      });

    return () => {
      mounted = false;
    };
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF3E7] via-white to-[#E8F5F1] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-20 right-20 w-64 h-64 bg-[#3CC9A0]/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-20 left-20 w-96 h-96 bg-[#FFB800]/10 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center relative z-10"
      >
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-[#3CC9A0] animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-[#0D4A3A] mb-2">Verifying your email...</h1>
            <p className="text-[#0A1628]/60">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-[#E8F5F1] flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-[#3CC9A0]" />
            </motion.div>
            <h1 className="text-2xl font-bold text-[#0D4A3A] mb-2">Email verified!</h1>
            <p className="text-[#0A1628]/60 mb-6">{message}</p>
            <p className="text-sm text-[#0A1628]/40">Redirecting you to the home page...</p>
          </>
        )}

        {status === "error" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="w-12 h-12 text-red-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-[#0D4A3A] mb-2">Verification failed</h1>
            <p className="text-[#0A1628]/60 mb-6">{message}</p>
            <Link
              to="/"
              className="inline-block bg-[#0D4A3A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0D4A3A]/90 transition-colors"
            >
              Go to Home
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
