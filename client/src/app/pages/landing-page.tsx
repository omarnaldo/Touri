import { Link } from "react-router";
import { Navbar } from "../components/navbar";
import { Star, MapPin, Users, Shield, Clock, TrendingUp, Sparkles, Globe, Award, Heart } from "lucide-react";
import { motion } from "motion/react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FDF3E7] via-[#FDF3E7] to-[#E8F5F1] -z-10" />
        
        {/* Floating Decorative Elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 right-20 w-32 h-32 rounded-full bg-[#3CC9A0]/10 blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-40 left-10 w-40 h-40 rounded-full bg-[#FFB800]/10 blur-3xl"
        />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg border border-[#3CC9A0]/20"
              >
                <Sparkles className="w-4 h-4 text-[#3CC9A0]" />
                <span className="text-sm font-bold text-[#0D4A3A]">Trusted by 50,000+ Travelers</span>
              </motion.div>

              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-bold text-[#0D4A3A] leading-tight">
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="block"
                  >
                    Discover Local
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="block bg-gradient-to-r from-[#0D4A3A] to-[#3CC9A0] bg-clip-text text-transparent"
                  >
                    Adventures
                  </motion.span>
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl text-[#0A1628]/70 max-w-xl leading-relaxed"
                >
                  Connect with verified professional tour guides who bring authentic local experiences to life. Book personalized tours in minutes.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <Link
                  to="/marketplace"
                  className="group bg-[#0D4A3A] text-white px-8 py-4 rounded-lg hover:bg-[#0D4A3A]/90 transition-all shadow-lg hover:shadow-2xl hover:scale-105 flex items-center gap-2"
                >
                  Find Your Guide
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </Link>
                <Link
                  to="/signup"
                  className="border-2 border-[#0D4A3A] text-[#0D4A3A] px-8 py-4 rounded-lg hover:bg-[#0D4A3A]/5 transition-all hover:scale-105"
                >
                  Become a Guide
                </Link>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap gap-8 pt-4"
              >
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                      >
                        <Star className="w-5 h-5 fill-[#FFB800] text-[#FFB800]" />
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-[#0A1628]">4.9/5</div>
                    <div className="text-[#0A1628]/60">G2 Reviews</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + i * 0.1 }}
                      >
                        <Star className="w-5 h-5 fill-[#FFB800] text-[#FFB800]" />
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-[#0A1628]">4.8/5</div>
                    <div className="text-[#0A1628]/60">Capterra</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Floating Card UI Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              {/* Main Hero Image - Professional Travel Photo */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative rounded-3xl overflow-hidden shadow-2xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1748292141896-5d2904f66d0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxFZ3lwdGlhbiUyMHRvdXIlMjBndWlkZSUyMEFzd2FuJTIwTmlsZSUyMHRvdXJpc3RzfGVufDF8fHx8MTc3MjUxMjE5NXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Egyptian tour guide with tourists in Aswan"
                  className="w-full h-[600px] object-cover"
                />
                {/* Subtle gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                {/* Floating caption */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#3CC9A0] flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-[#0D4A3A] mb-1">Authentic Local Experiences</div>
                      <div className="text-sm text-[#0A1628]/70">
                        Connect with professional guides who share their culture and passion
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, type: "spring" }}
                whileHover={{ scale: 1.05, rotate: -2 }}
                className="absolute -top-4 -left-8 bg-white rounded-xl shadow-xl p-4 z-20 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full bg-[#3CC9A0]/10 flex items-center justify-center"
                  >
                    <Users className="w-6 h-6 text-[#3CC9A0]" />
                  </motion.div>
                  <div>
                    <div className="text-2xl font-bold text-[#0D4A3A]">50K+</div>
                    <div className="text-xs text-[#0A1628]/60">Happy Travelers</div>
                  </div>
                </div>
              </motion.div>

              {/* Additional Floating Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, type: "spring" }}
                whileHover={{ scale: 1.1, rotate: 3 }}
                className="absolute top-1/3 -right-6 bg-gradient-to-br from-[#FFB800] to-[#FF8A00] text-white rounded-2xl shadow-xl p-4 z-20 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6" />
                  <div>
                    <div className="text-sm font-bold">Verified</div>
                    <div className="text-xs opacity-90">Pro Guides</div>
                  </div>
                </div>
              </motion.div>

              {/* Rating Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8, type: "spring" }}
                whileHover={{ scale: 1.1 }}
                className="absolute bottom-32 -right-4 bg-white rounded-xl shadow-xl p-3 z-20 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-[#FFB800] text-[#FFB800]" />
                  <div>
                    <div className="text-lg font-bold text-[#0D4A3A]">4.9</div>
                    <div className="text-xs text-[#0A1628]/60">Average</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 lg:px-8 bg-white relative">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0D4A3A] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#3CC9A0] rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8F5F1] mb-4"
            >
              <Globe className="w-4 h-4 text-[#0D4A3A]" />
              <span className="text-sm font-bold text-[#0D4A3A]">Why Choose Us</span>
            </motion.div>
            <h2 className="text-5xl font-bold text-[#0D4A3A] mb-4">Why Choose GuideHub</h2>
            <p className="text-xl text-[#0A1628]/70 max-w-2xl mx-auto">
              Experience travel like never before with our verified professional guides
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Verified Professionals",
                desc: "Every guide is thoroughly vetted and verified. Background checks, certifications, and local expertise guaranteed.",
                gradient: "from-[#FDF3E7] to-white",
                color: "#0D4A3A",
                delay: 0.1,
              },
              {
                icon: Clock,
                title: "Instant Booking",
                desc: "Book your perfect guide in minutes. Real-time availability, instant confirmation, and flexible scheduling.",
                gradient: "from-[#E8F5F1] to-white",
                color: "#3CC9A0",
                delay: 0.2,
              },
              {
                icon: TrendingUp,
                title: "Best Price Guarantee",
                desc: "Transparent pricing with no hidden fees. Get the best value for authentic local experiences.",
                gradient: "from-[#FDF3E7] to-white",
                color: "#0D4A3A",
                delay: 0.3,
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay, duration: 0.6 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`p-8 rounded-2xl bg-gradient-to-br ${feature.gradient} cursor-pointer group`}
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-6 shadow-lg"
                  style={{ backgroundColor: feature.color }}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-[#0D4A3A] mb-4 group-hover:text-[#3CC9A0] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[#0A1628]/70 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-6 lg:px-8 bg-gradient-to-br from-[#0D4A3A] to-[#0D4A3A]/90 relative overflow-hidden">
        {/* Animated Background Shapes */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 left-10 w-64 h-64 border border-white/10 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-10 right-10 w-96 h-96 border border-white/10 rounded-full"
        />

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-lg mb-4">
              <Heart className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">Loved by Travelers</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">What Our Community Says</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Traveler from NYC",
                text: "Our guide made our Barcelona trip unforgettable! The local insights and personalized attention were worth every penny.",
                image: "https://images.unsplash.com/photo-1601734327281-438e2fa9930b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMHRvdXIlMjBndWlkZSUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NzI0MTY0MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
              },
              {
                name: "Michael Chen",
                role: "Business Traveler",
                text: "GuideHub connected me with an amazing local guide in Tokyo. Professional, knowledgeable, and made booking so easy.",
                image: "https://images.unsplash.com/photo-1697043593597-b75ca6112914?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXNwYW5pYyUyMG1hbGUlMjB0b3VyJTIwZ3VpZGUlMjBzbWlsaW5nfGVufDF8fHx8MTc3MjQxNjQxNnww&ixlib=rb-4.1.0&q=80&w=1080",
              },
              {
                name: "Emily Rodriguez",
                role: "Adventure Seeker",
                text: "I've used GuideHub in 5 different countries. The quality of guides is consistently excellent. Highly recommend!",
                image: "https://images.unsplash.com/photo-1666113604293-d34734339acb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYXRpc2ZpZWQlMjBjbGllbnQlMjB0ZXN0aW1vbmlhbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MjQxNjQyMHww&ixlib=rb-4.1.0&q=80&w=1080",
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 cursor-pointer"
              >
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.div
                      key={star}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2 + star * 0.1 }}
                    >
                      <Star className="w-5 h-5 fill-[#FFB800] text-[#FFB800]" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-white/90 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <motion.img
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                  />
                  <div>
                    <div className="font-bold text-white">{testimonial.name}</div>
                    <div className="text-sm text-white/70">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6 lg:px-8 bg-gradient-to-br from-[#FDF3E7] to-[#E8F5F1] relative overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-0 right-0 w-96 h-96 bg-[#3CC9A0]/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-[#FFB800]/20 rounded-full blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <Sparkles className="w-12 h-12 text-[#3CC9A0]" />
          </motion.div>
          <h2 className="text-5xl font-bold text-[#0D4A3A] mb-6">
            Ready to Discover Your Next Adventure?
          </h2>
          <p className="text-xl text-[#0A1628]/70 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who've discovered authentic local experiences with our verified professional guides.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              to="/marketplace"
              className="group bg-[#0D4A3A] text-white px-10 py-5 rounded-lg hover:bg-[#0D4A3A]/90 transition-all shadow-lg hover:shadow-2xl text-lg hover:scale-105 flex items-center gap-2"
            >
              Browse Guides
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </Link>
            <Link
              to="/signup"
              className="border-2 border-[#0D4A3A] text-[#0D4A3A] px-10 py-5 rounded-lg hover:bg-[#0D4A3A]/5 transition-all text-lg hover:scale-105"
            >
              Start Guiding Today
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A1628] text-white py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full bg-[#3CC9A0] flex items-center justify-center"
            >
              <span className="text-white font-bold text-xl">G</span>
            </motion.div>
            <span className="text-2xl font-bold">GuideHub</span>
          </motion.div>
          <p className="text-white/60">© 2026 GuideHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}