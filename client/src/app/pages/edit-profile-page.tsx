import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { User, MapPin, ArrowLeft, Calendar, FileText, DollarSign } from "lucide-react";
import { motion } from "motion/react";
import { Navbar } from "../components/navbar";
import { useAuth } from "../context/AuthContext";
import { userService, authService } from "../lib/api";

const availableLanguages = [
  "English", "Spanish", "French", "German", "Italian",
  "Portuguese", "Chinese", "Japanese", "Arabic", "Russian",
];

const availableSpecialties = [
  "Architecture", "Food Tours", "History", "Adventure",
  "Art & Museums", "Culture", "Nature", "Photography", "Wine Tours",
];

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    phoneNumber: "",
    profileImageUrl: "",
    bio: "",
    languages: [] as string[],
    yearsOfExperience: "",
    city: "",
    country: "",
    specialties: [] as string[],
    dailyRate: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await userService.getProfile();
        const gp = profile.guideProfile;
        setFormData({
          firstName: profile.first_name ?? "",
          lastName: profile.last_name ?? "",
          age: profile.age?.toString() ?? "",
          phoneNumber: profile.phone_number ?? "",
          profileImageUrl: profile.profile_image_url ?? "",
          bio: gp?.bio ?? "",
          languages: Array.isArray(gp?.languages) ? gp.languages : [],
          yearsOfExperience: gp?.years_of_experience?.toString() ?? "",
          city: gp?.city ?? "",
          country: gp?.country ?? "",
          specialties: Array.isArray(gp?.specialties) ? gp.specialties : [],
          dailyRate: gp?.daily_rate?.toString() ?? "",
        });
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const toggleSpecialty = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter((s) => s !== spec)
        : [...prev.specialties, spec],
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setIsUploadingImage(true);
    try {
      const { url } = await authService.uploadProfileImage(file);
      setFormData((prev) => ({ ...prev, profileImageUrl: url }));
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const payload: Parameters<typeof userService.updateProfile>[0] = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        profileImageUrl: formData.profileImageUrl || undefined,
      };

      const updated = await userService.updateProfile(payload);

      if (user?.role === "guide") {
        await userService.updateGuideProfile(user.id, {
          bio: formData.bio.trim() || undefined,
          languages: formData.languages.length > 0 ? formData.languages : undefined,
          yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience, 10) : undefined,
          dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
          city: formData.city.trim() || undefined,
          country: formData.country.trim() || undefined,
          specialties: formData.specialties.length > 0 ? formData.specialties : undefined,
        });
      }

      setUser({
        ...user!,
        firstName: updated.first_name ?? formData.firstName,
        lastName: updated.last_name ?? formData.lastName,
        profileImageUrl: updated.profile_image_url ?? formData.profileImageUrl,
      });

      navigate(-1);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF3E7] via-white to-[#E8F5F1]">
        <Navbar />
        <div className="pt-32 flex justify-center">
          <div className="w-10 h-10 border-4 border-[#3CC9A0] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF3E7] via-white to-[#E8F5F1]">
      <Navbar />

      <div className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              to="/"
              onClick={(e) => {
                e.preventDefault();
                navigate(-1);
              }}
              className="inline-flex items-center gap-2 text-[#0A1628]/70 hover:text-[#0D4A3A] transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <h1 className="text-3xl font-bold text-[#0D4A3A]">Edit Profile</h1>
            <p className="text-[#0A1628]/60 mt-1">Update your personal information</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
          >
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Profile Photo */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#F0F1F3] flex items-center justify-center overflow-hidden flex-shrink-0">
                {formData.profileImageUrl ? (
                  <img
                    src={formData.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-[#0A1628]/40">
                    {formData.firstName?.charAt(0) || "?"}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0A1628] mb-1">Profile Photo</label>
                <label className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0D4A3A] text-white text-sm font-medium cursor-pointer hover:bg-[#0D4A3A]/90 transition-colors">
                  <span>{isUploadingImage ? "Uploading..." : "Change Photo"}</span>
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

            {/* Basic Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#0A1628] mb-2">First Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A1628]/40" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0A1628] mb-2">Last Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A1628]/40" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0A1628] mb-2">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+1 234 567 8900"
                className="w-full px-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0A1628] mb-2">Age *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A1628]/40" />
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="18"
                  max="120"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none"
                />
              </div>
            </div>

            {user?.role === "guide" && (
              <>
                <hr className="border-gray-200" />
                <h2 className="text-xl font-bold text-[#0D4A3A]">Guide Profile</h2>

                <div>
                  <label className="block text-sm font-bold text-[#0A1628] mb-2">Bio</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-[#0A1628]/40" />
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Tell travelers about yourself..."
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0A1628] mb-2">Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          formData.languages.includes(lang)
                            ? "bg-[#0D4A3A] text-white"
                            : "bg-[#F8F9FA] text-[#0A1628] hover:bg-[#E8F5F1]"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0A1628] mb-2">Years of Experience</label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="5"
                    className="w-full px-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A1628]/40" />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Barcelona"
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Spain"
                      className="w-full px-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0A1628] mb-2">Specialties</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSpecialties.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialty(spec)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          formData.specialties.includes(spec)
                            ? "bg-[#3CC9A0] text-white"
                            : "bg-[#F8F9FA] text-[#0A1628] hover:bg-[#E8F5F1]"
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0A1628] mb-2">Daily Rate ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A1628]/40" />
                    <input
                      type="number"
                      name="dailyRate"
                      value={formData.dailyRate}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="180"
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-[#0D4A3A] to-[#3CC9A0] text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
