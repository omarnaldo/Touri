import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Navbar } from "../components/navbar";
import { Search, Star, MapPin, DollarSign, Filter, Zap, TrendingUp, CheckCircle, MessageCircle, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { userService, chatService } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Guide {
  id: string;
  first_name: string;
  last_name: string;
  profile_image_url: string | null;
  bio: string;
  languages: string[];
  years_of_experience: number;
  daily_rate: number | null;
  specialties: string[];
  city: string;
  country: string;
  average_rating: number;
  total_reviews: number;
  is_available: boolean;
}

export function MarketplacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [flashMessage, setFlashMessage] = useState<string | null>(
    (location.state as { message?: string })?.message ?? null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalGuides: 0 });
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const fetchGuides = async () => {
    setIsLoading(true);
    try {
      const filters: any = { page: pagination.currentPage, limit: 10 };
      if (selectedCity) filters.city = selectedCity;
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (minRating) filters.minRating = parseFloat(minRating);

      const data = await userService.getGuides(filters);
      setGuides(data.guides);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch guides:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openGuideProfile = async (guideId: string) => {
    setIsProfileLoading(true);
    setProfileError("");
    try {
      const data = await userService.getGuideById(guideId);
      setSelectedGuide(data);
    } catch (error: any) {
      console.error("Failed to fetch guide profile:", error);
      setProfileError(error.message || "Failed to load guide profile");
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, [selectedCity, maxPrice, minRating]);

  useEffect(() => {
    setFlashMessage((location.state as { message?: string })?.message ?? null);
  }, [location.state]);

  const handleContactGuide = async (guideId: string) => {
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }
    try {
      const room = await chatService.getOrCreateRoom(guideId);
      navigate("/chat", { state: { roomId: room.id } });
    } catch (error) {
      console.error("Failed to create chat room:", error);
    }
  };

  // Filter guides by search query (client-side for name/specialty search)
  const filteredGuides = guides.filter((guide) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      `${guide.first_name} ${guide.last_name}`.toLowerCase().includes(query) ||
      guide.city?.toLowerCase().includes(query) ||
      guide.country?.toLowerCase().includes(query) ||
      guide.specialties?.some((s) => s.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF3E7] via-white to-[#E8F5F1] relative overflow-hidden">
      <Navbar />

      {/* Decorative Background Elements */}
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-20 right-10 w-64 h-64 bg-[#3CC9A0]/5 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ rotate: -360, scale: [1.2, 1, 1.2] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-20 left-10 w-96 h-96 bg-[#FFB800]/5 rounded-full blur-3xl"
      />

      <div className="pt-32 pb-20 px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          {flashMessage && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-[#E8F5F1] border border-[#3CC9A0]/30 rounded-xl flex items-center justify-between gap-4"
              >
                <span className="text-[#0D4A3A] text-sm font-medium">{flashMessage}</span>
                <button
                  onClick={() => setFlashMessage(null)}
                  className="text-[#0D4A3A]/60 hover:text-[#0D4A3A] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            </AnimatePresence>
          )}
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg border border-[#3CC9A0]/20 mb-4"
            >
              <TrendingUp className="w-4 h-4 text-[#3CC9A0]" />
              <span className="text-sm font-bold text-[#0D4A3A]">
                {pagination.totalGuides > 0
                  ? `${pagination.totalGuides} Professional Guide${pagination.totalGuides !== 1 ? "s" : ""}`
                  : "Professional Guides"}
              </span>
            </motion.div>
            <h1 className="text-6xl font-bold text-[#0D4A3A] mb-4">
              Find Your Perfect Guide
            </h1>
            <p className="text-xl text-[#0A1628]/70 max-w-2xl mx-auto">
              Browse verified professional local guides from around the world
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="relative max-w-2xl mx-auto group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#0A1628]/40 w-5 h-5 group-focus-within:text-[#3CC9A0] transition-colors" />
              <input
                type="text"
                placeholder="Search by city, guide name, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-5 rounded-xl bg-white shadow-lg border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-all"
              />
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                <Zap className="w-5 h-5 text-[#FFB800]" />
              </motion.div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filter Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-[#0D4A3A]" />
                  <h2 className="text-xl font-bold text-[#0D4A3A]">Filters</h2>
                </div>

                <div className="space-y-6">
                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      placeholder="e.g. Barcelona"
                      className="w-full p-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-colors"
                    />
                  </div>

                  {/* Max Price */}
                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">
                      Max Price (per day)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A1628]/40" />
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="e.g. 200"
                        min="0"
                        className="w-full pl-9 pr-3 py-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Min Rating */}
                  <div>
                    <label className="block text-sm font-bold text-[#0A1628] mb-2">
                      Minimum Rating
                    </label>
                    <select
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                      className="w-full p-3 rounded-lg bg-[#F8F9FA] border-2 border-transparent focus:border-[#3CC9A0] focus:outline-none text-[#0A1628] cursor-pointer transition-colors"
                    >
                      <option value="">Any Rating</option>
                      <option value="4">4+ Stars</option>
                      <option value="4.5">4.5+ Stars</option>
                      <option value="5">5 Stars</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <button
                    onClick={() => {
                      setSelectedCity("");
                      setMaxPrice("");
                      setMinRating("");
                      setSearchQuery("");
                    }}
                    className="w-full text-sm text-[#3CC9A0] hover:text-[#0D4A3A] transition-colors font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Guide Cards Grid */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-[#3CC9A0] animate-spin" />
                </div>
              ) : filteredGuides.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-[#0D4A3A] mb-2">No guides found</h3>
                  <p className="text-[#0A1628]/60">Try adjusting your filters or search query</p>
                </motion.div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredGuides.map((guide, index) => (
                    <motion.div
                      key={guide.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      whileHover={{ y: -10, scale: 1.02 }}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group cursor-pointer relative"
                      onClick={() => openGuideProfile(guide.id)}
                    >
                      {/* Guide Photo */}
                      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#0D4A3A] to-[#3CC9A0]">
                        {guide.profile_image_url ? (
                          <motion.img
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                            src={guide.profile_image_url}
                            alt={`${guide.first_name} ${guide.last_name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-6xl font-bold text-white/30">
                              {guide.first_name?.charAt(0)}{guide.last_name?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center gap-1 shadow-lg"
                        >
                          <Star className="w-4 h-4 fill-[#FFB800] text-[#FFB800]" />
                          <span className="font-bold text-sm text-[#0A1628]">{Number(guide.average_rating).toFixed(1)}</span>
                          <span className="text-xs text-[#0A1628]/60">({guide.total_reviews})</span>
                        </motion.div>

                        {/* Availability Indicator */}
                        {guide.is_available && (
                          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-[#0A1628]">Available Now</span>
                          </div>
                        )}
                      </div>

                      {/* Guide Info */}
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-[#0D4A3A] mb-1 group-hover:text-[#3CC9A0] transition-colors">
                            {guide.first_name} {guide.last_name}
                          </h3>
                          <div className="flex items-center gap-1 text-[#0A1628]/60">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{guide.city}{guide.country ? `, ${guide.country}` : ""}</span>
                          </div>
                        </div>

                        {guide.bio && (
                          <p className="text-sm text-[#0A1628]/70 leading-relaxed line-clamp-2">
                            {guide.bio}
                          </p>
                        )}

                        {/* Specialty Tags */}
                        {guide.specialties && guide.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {guide.specialties.map((tag, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-full bg-[#E8F5F1] text-[#0D4A3A] text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price and CTA */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            {guide.daily_rate ? (
                              <>
                                <DollarSign className="w-5 h-5 text-[#0D4A3A]" />
                                <span className="text-2xl font-bold text-[#0D4A3A]">
                                  {Number(guide.daily_rate).toFixed(0)}
                                </span>
                                <span className="text-sm text-[#0A1628]/60">/day</span>
                              </>
                            ) : (
                              <span className="text-sm text-[#0A1628]/60">Contact for pricing</span>
                            )}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactGuide(guide.id);
                            }}
                            className="bg-[#0D4A3A] text-white px-6 py-3 rounded-lg hover:bg-[#0D4A3A]/90 transition-all shadow-lg flex items-center gap-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Contact
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <motion.button
                      key={page}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setPagination((prev) => ({ ...prev, currentPage: page }));
                        fetchGuides();
                      }}
                      className={`w-10 h-10 rounded-lg font-bold transition-all ${
                        page === pagination.currentPage
                          ? "bg-[#0D4A3A] text-white shadow-lg"
                          : "bg-white text-[#0A1628] hover:bg-[#E8F5F1]"
                      }`}
                    >
                      {page}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Guide Profile Preview Modal */}
        <AnimatePresence>
          {selectedGuide && (
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGuide(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedGuide(null)}
                  className="absolute top-4 right-4 bg-white/80 rounded-full p-1 shadow hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5 text-[#0A1628]" />
                </button>

                {isProfileLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-[#3CC9A0] animate-spin" />
                  </div>
                ) : (
                  <>
                    {profileError && (
                      <div className="p-4 bg-red-50 text-red-700 text-sm">
                        {profileError}
                      </div>
                    )}
                    {selectedGuide?.guide && (
                      <div>
                        <div className="relative h-48 bg-gradient-to-br from-[#0D4A3A] to-[#3CC9A0]">
                          {selectedGuide.guide.profile_image_url ? (
                            <img
                              src={selectedGuide.guide.profile_image_url}
                              alt={`${selectedGuide.guide.first_name} ${selectedGuide.guide.last_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-6xl font-bold text-white/30">
                                {selectedGuide.guide.first_name?.charAt(0)}
                                {selectedGuide.guide.last_name?.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="absolute bottom-4 left-6">
                            <h2 className="text-3xl font-bold text-white mb-1">
                              {selectedGuide.guide.first_name} {selectedGuide.guide.last_name}
                            </h2>
                            <div className="flex items-center gap-2 text-white/80">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">
                                {selectedGuide.guide.city}
                                {selectedGuide.guide.country ? `, ${selectedGuide.guide.country}` : ""}
                              </span>
                            </div>
                          </div>
                          <div className="absolute top-4 left-4 bg-white rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
                            <Star className="w-4 h-4 fill-[#FFB800] text-[#FFB800]" />
                            <span className="font-bold text-sm text-[#0A1628]">
                              {Number(selectedGuide.guide.average_rating || 0).toFixed(1)}
                            </span>
                            <span className="text-xs text-[#0A1628]/60">
                              ({selectedGuide.guide.total_reviews || 0} reviews)
                            </span>
                          </div>
                        </div>

                        <div className="p-6 space-y-4">
                          {selectedGuide.guide.bio && (
                            <p className="text-sm text-[#0A1628]/80 leading-relaxed">
                              {selectedGuide.guide.bio}
                            </p>
                          )}

                          <div className="grid md:grid-cols-2 gap-4 text-sm text-[#0A1628]/80">
                            <div className="space-y-1">
                              <p className="font-semibold text-[#0D4A3A]">Languages</p>
                              <p>
                                {Array.isArray(selectedGuide.guide.languages) &&
                                selectedGuide.guide.languages.length > 0
                                  ? selectedGuide.guide.languages.join(", ")
                                  : "Not specified"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-[#0D4A3A]">Experience</p>
                              <p>
                                {selectedGuide.guide.years_of_experience || 0} years guiding
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-[#0D4A3A]">Specialties</p>
                              <p>
                                {Array.isArray(selectedGuide.guide.specialties) &&
                                selectedGuide.guide.specialties.length > 0
                                  ? selectedGuide.guide.specialties.join(", ")
                                  : "Not specified"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-[#0D4A3A]">Daily Rate</p>
                              <p>
                                {selectedGuide.guide.daily_rate
                                  ? `$${Number(selectedGuide.guide.daily_rate).toFixed(0)}/day`
                                  : "Contact for pricing"}
                              </p>
                            </div>
                          </div>

                          {Array.isArray(selectedGuide.reviews) &&
                            selectedGuide.reviews.length > 0 && (
                              <div className="mt-4">
                                <p className="font-semibold text-[#0D4A3A] mb-2">
                                  Recent Reviews
                                </p>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                  {selectedGuide.reviews.map((review: any) => (
                                    <div
                                      key={review.id}
                                      className="p-3 rounded-lg bg-[#F8F9FA] text-xs"
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold">
                                          {review.first_name} {review.last_name}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Star className="w-3 h-3 fill-[#FFB800] text-[#FFB800]" />
                                          {Number(review.rating).toFixed(1)}
                                        </span>
                                      </div>
                                      <p className="text-[#0A1628]/80 line-clamp-3">
                                        {review.comment}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                              onClick={() => {
                                if (selectedGuide?.guide?.id) {
                                  handleContactGuide(selectedGuide.guide.id);
                                }
                              }}
                              className="bg-[#0D4A3A] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#0D4A3A]/90 transition-colors flex items-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Contact Guide
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}