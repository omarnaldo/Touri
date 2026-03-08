import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, User, MapPin, ArrowRight, Sparkles, ArrowLeft, Languages, Calendar, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../lib/api";

export function SignUpPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState<"traveler" | "guide">("traveler");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    // Step 2: Common fields
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    age: "",
    password: "",
    confirmPassword: "",
    profileImageUrl: "",
    
    // Step 3: Guide-specific fields
    languages: [] as string[],
    yearsOfExperience: "",
    bio: "",
    city: "",
    country: "",
    specialties: [] as string[],
    dailyRate: "",
  });

  const totalSteps = userType === "guide" ? 3 : 2;

  // Available options
  const availableLanguages = [
    "English", "Spanish", "French", "German", "Italian", 
    "Portuguese", "Chinese", "Japanese", "Arabic", "Russian"
  ];

  const availableSpecialties = [
    "Architecture", "Food Tours", "History", "Adventure", 
    "Art & Museums", "Culture", "Nature", "Photography", "Wine Tours"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setIsUploadingImage(true);
    try {
      const { url } = await authService.uploadProfileImage(file);
      setFormData((prev) => ({
        ...prev,
        profileImageUrl: url,
      }));
    } catch (err: any) {
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const validateStep = () => {
    if (currentStep === 2) {
      if (!formData.firstName.trim()) return "First name is required";
      if (!formData.lastName.trim()) return "Last name is required";
      if (!formData.email.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Invalid email format";
      if (!formData.age || parseInt(formData.age) < 18) return "You must be at least 18 years old";
      if (!formData.password || formData.password.length < 8) return "Password must be at least 8 characters";
      if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    }

    if (currentStep === 3 && userType === "guide") {
      if (formData.languages.length === 0) return "Please select at least one language";
      if (!formData.yearsOfExperience) return "Years of experience is required";
      if (!formData.bio.trim()) return "Bio is required";
    }

    return null;
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setError("");
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const payload: any = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: parseInt(formData.age),
        phoneNumber: formData.phoneNumber || undefined,
        role: userType,
      };

      if (formData.profileImageUrl) {
        payload.profileImageUrl = formData.profileImageUrl;
      }

      // Add guide profile if user is a guide
      if (userType === "guide") {
        payload.guideProfile = {
          bio: formData.bio,
          languages: formData.languages,
          yearsOfExperience: parseInt(formData.yearsOfExperience),
          city: formData.city || undefined,
          country: formData.country || undefined,
          specialties: formData.specialties,
          dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
        };
      }

      await signup(payload);

      // Redirect to marketplace with verification reminder
      navigate('/marketplace', {
        state: { message: 'Account created! Please check your email to verify your account.' },
      });
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF3E7] via-[#FDF3E7] to-[#E8F5F1] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-[#3CC9A0]/10 to-[#FFB800]/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.3, 1, 1.3], rotate: [0, -180, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-tr from-[#FFB800]/10 to-[#3CC9A0]/10 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-2 mb-2 group">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0D4A3A] to-[#3CC9A0] flex items-center justify-center shadow-lg"
            >
              <span className="text-white font-bold text-2xl">G</span>
            </motion.div>
            <span className="text-3xl font-bold text-[#0D4A3A] group-hover:text-[#3CC9A0] transition-colors">GuideHub</span>
          </Link>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[#0A1628]/60 mt-2 flex items-center justify-center gap-1"
          >
            <Sparkles className="w-4 h-4 text-[#FFB800]" />
            Create your account - Step {currentStep} of {totalSteps}
          </motion.p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex items-center flex-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index + 1 <= currentStep
                      ? "bg-[#0D4A3A] text-white"
                      : "bg-white text-[#0A1628]/40"
                  } transition-all shadow-md`}
                >
                  {index + 1}
                </motion.div>
                {index < totalSteps - 1 && (
                  <div className="flex-1 h-1 mx-2 bg-white rounded">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: index + 1 < currentStep ? "100%" : "0%" }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-[#0D4A3A] rounded"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sign Up Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden"
        >
          {/* Decorative corner accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3CC9A0]/10 to-transparent rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#FFB800]/10 to-transparent rounded-tr-full" />

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6 relative">
            <AnimatePresence mode="wait">
              {/* STEP 1: Role Selection */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#0D4A3A] mb-2">Choose Your Role</h2>
                    <p className="text-[#0A1628]/70">Are you looking to explore or guide?</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      type="button"
                      onClick={() => setUserType("traveler")}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        userType === "traveler"
                          ? "border-[#0D4A3A] bg-[#0D4A3A]/5"
                          : "border-gray-200 hover:border-[#0D4A3A]/30"
                      }`}
                    >
                      <div className="text-4xl mb-2">🧳</div>
                      <div className="font-bold text-[#0D4A3A]">Traveler</div>
                      <div className="text-sm text-[#0A1628]/60 mt-1">
                        Find local guides
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => setUserType("guide")}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        userType === "guide"
                          ? "border-[#0D4A3A] bg-[#0D4A3A]/5"
                          : "border-gray-200 hover:border-[#0D4A3A]/30"
                      }`}
                    >
                      <div className="text-4xl mb-2">🗺️</div>
                      <div className="font-bold text-[#0D4A3A]">Tour Guide</div>
                      <div className="text-sm text-[#0A1628]/60 mt-1">
                        Share your expertise
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Common Fields */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-[#0D4A3A] mb-2">Personal Information</h2>
                    <p className="text-[#0A1628]/70">Tell us about yourself</p>
                  </div>

                  {/* Profile Photo Upload */}
                  <div className="flex items-center gap-4 mb-2">
                    <div className="relative">
                      {formData.profileImageUrl ? (
                        <img
                          src={formData.profileImageUrl}
                          alt="Profile preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#0D4A3A]"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#F0F1F3] flex items-center justify-center text-[#0A1628]/40 font-bold">
                          {formData.firstName
                            ? formData.firstName.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-[#0A1628] mb-1">
                        Profile Photo
                      </label>
                      <p className="text-xs text-[#0A1628]/60 mb-2">
                        Upload a clear photo of yourself. This will be shown on your profile.
                      </p>
                      <label className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0D4A3A] text-white text-sm font-medium cursor-pointer hover:bg-[#0D4A3A]/90 transition-colors">
                        <span>{isUploadingImage ? "Uploading..." : "Upload Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#0A1628] mb-2">
                        First Name *
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#0A1628]/40 w-5 h-5 group-focus-within:text-[#3CC9A0] transition-colors" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="John"
                          className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all hover:bg-[#F0F1F3]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#0A1628] mb-2">
                        Last Name *
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#0A1628]/40 w-5 h-5 group-focus-within:text-[#3CC9A0] transition-colors" />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Doe"
                          className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all hover:bg-[#F0F1F3]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">
                      Email Address *
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#0A1628]/40 w-5 h-5 group-focus-within:text-[#3CC9A0] transition-colors" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all hover:bg-[#F0F1F3]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#0A1628] mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="+1 234 567 8900"
                        className="w-full px-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all hover:bg-[#F0F1F3]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#0A1628] mb-2">
                        Age *
                      </label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#0A1628]/40 w-5 h-5 group-focus-within:text-[#3CC9A0] transition-colors" />
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="18"
                          min="18"
                          max="120"
                          className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all hover:bg-[#F0F1F3]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">
                      Password *
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#0A1628]/40 w-5 h-5 group-focus-within:text-[#3CC9A0] transition-colors" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Min. 8 characters"
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all hover:bg-[#F0F1F3]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#0A1628]/40 w-5 h-5 group-focus-within:text-[#3CC9A0] transition-colors" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Re-enter password"
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all hover:bg-[#F0F1F3]"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Guide Profile (Guide Only) */}
              {currentStep === 3 && userType === "guide" && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-[#0D4A3A] mb-2">Guide Profile</h2>
                    <p className="text-[#0A1628]/70">Share your expertise and experience</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">
                      Languages Spoken * (Select at least one)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableLanguages.map((language) => (
                        <motion.button
                          key={language}
                          type="button"
                          onClick={() => toggleLanguage(language)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            formData.languages.includes(language)
                              ? "bg-[#0D4A3A] text-white"
                              : "bg-[#F8F9FA] text-[#0A1628] hover:bg-[#E8F5F1]"
                          }`}
                        >
                          {language}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={handleInputChange}
                      placeholder="5"
                      min="0"
                      className="w-full px-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all hover:bg-[#F0F1F3]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">
                      Bio * (Tell travelers about yourself)
                    </label>
                    <div className="relative group">
                      <FileText className="absolute left-4 top-4 text-[#0A1628]/40 w-5 h-5 group-focus-within:text-[#3CC9A0] transition-colors" />
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Share your passion for guiding and what makes your tours special..."
                        rows={4}
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all hover:bg-[#F0F1F3]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#0A1628] mb-2">
                        City
                      </label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#0A1628]/40 w-5 h-5 group-focus-within:text-[#3CC9A0] transition-colors" />
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Barcelona"
                          className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all hover:bg-[#F0F1F3]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#0A1628] mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="Spain"
                        className="w-full px-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all hover:bg-[#F0F1F3]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">
                      Specialties (Optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableSpecialties.map((specialty) => (
                        <motion.button
                          key={specialty}
                          type="button"
                          onClick={() => toggleSpecialty(specialty)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            formData.specialties.includes(specialty)
                              ? "bg-[#3CC9A0] text-white"
                              : "bg-[#F8F9FA] text-[#0A1628] hover:bg-[#E8F5F1]"
                          }`}
                        >
                          {specialty}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">
                      Daily Rate (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#0A1628]/60 font-bold">$</span>
                      <input
                        type="number"
                        name="dailyRate"
                        value={formData.dailyRate}
                        onChange={handleInputChange}
                        placeholder="180"
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all hover:bg-[#F0F1F3]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-4">
              {currentStep > 1 && (
                <motion.button
                  type="button"
                  onClick={handleBack}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 border-2 border-[#0D4A3A] text-[#0D4A3A] py-4 rounded-lg hover:bg-[#0D4A3A]/5 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </motion.button>
              )}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 bg-gradient-to-r from-[#0D4A3A] to-[#3CC9A0] text-white py-4 rounded-lg hover:shadow-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : currentStep === totalSteps ? (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Sign In Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8 text-sm text-[#0A1628]/60"
          >
            Already have an account?{" "}
            <Link to="/signin" className="text-[#0D4A3A] font-bold hover:text-[#0D4A3A]/80 transition-colors">
              Sign In
            </Link>
          </motion.p>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6"
        >
          <Link to="/" className="text-sm text-[#0A1628]/60 hover:text-[#0D4A3A] transition-colors inline-flex items-center gap-1 group">
            <motion.span
              animate={{ x: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ←
            </motion.span>
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
