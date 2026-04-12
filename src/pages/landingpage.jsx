import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { API_BASE_URL } from "../lib/api";
import {
  ShieldCheck, MapPin, Clock3, UserCircle2,
  ChevronLeft, ChevronRight, Search, CalendarCheck,
  Wrench, Star, ArrowRight, CheckCircle2
} from "lucide-react";

function Container({ children, className = "" }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>;
}

function PrimaryButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-7 py-3 text-sm font-semibold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-lg">
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-7 py-3 text-sm font-semibold text-teal-800 transition duration-300 hover:-translate-y-0.5 hover:bg-teal-100">
      {children}
    </button>
  );
}

function Feature({ title, description, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-white/60 p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-teal-800">
        <Icon size={22} strokeWidth={2.2} />
      </div>
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{description}</div>
    </div>
  );
}

function ServiceCard({ label, description, price, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={["w-full rounded-2xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lg",
        active ? "border-teal-700 bg-teal-700 text-white shadow-lg" : "border-slate-200 bg-white hover:border-teal-200"].join(" ")}>
      <div className={active ? "text-white/80 text-xs font-semibold uppercase" : "text-xs font-semibold uppercase text-teal-700"}>Service</div>
      <div className={active ? "mt-2 text-xl font-bold text-white" : "mt-2 text-xl font-bold text-slate-900"}>{label}</div>
      <div className={active ? "mt-2 text-sm text-white/85" : "mt-2 text-sm text-slate-600"}>{description || "Professional service available in your area."}</div>
      <div className={active ? "mt-4 text-sm font-semibold text-white" : "mt-4 text-sm font-semibold text-emerald-700"}>Starts at ₱{Number(price || 0).toLocaleString()}</div>
    </button>
  );
}

function HowItWorksStep({ number, icon: Icon, title, description, isLast }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {!isLast && <div className="absolute left-[calc(50%+40px)] top-10 hidden h-0.5 w-[calc(100%-80px)] bg-gradient-to-r from-teal-200 to-teal-100 md:block" />}
      <div className="relative z-10 flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-teal-100 bg-white shadow-lg shadow-teal-50">
        <Icon size={28} className="text-teal-700" strokeWidth={2} />
        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-[10px] font-bold text-white shadow">{number}</span>
      </div>
      <h3 className="mt-5 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-[200px] text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

/* ─── Testimonial avatar — shows provider profile picture if available ── */
function TestimonialAvatar({ name, photoUrl, isCenter }) {
  const initials = name
    ? name.trim().split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : "?";

  if (photoUrl) {
    return (
      <img
        src={`${API_BASE_URL.replace("/api", "")}${photoUrl}`}
        alt={name}
        className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-2 ring-white shadow"
      />
    );
  }

  return (
    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
      isCenter ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"
    }`}>
      {initials !== "?" ? initials : <UserCircle2 size={18} strokeWidth={2.2} />}
    </div>
  );
}

function TestimonialCard({ t, isReal, isCenter }) {
  return (
    <div className={`w-full rounded-2xl p-6 transition-all duration-500 ${
      isCenter ? "bg-white border-2 border-teal-100 shadow-2xl shadow-teal-50" : "bg-slate-50 border border-slate-100 shadow-md"
    }`}>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((s) => (
          <span key={s} className={`text-xl ${s <= t.rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
        ))}
      </div>
      <p className={`mt-3 text-sm leading-relaxed line-clamp-4 ${isCenter ? "text-slate-700" : "text-slate-500"}`}>
        "{t.comment || "Great service experience through SerbisyoNear!"}"
      </p>
      <div className="mt-5 flex items-center gap-3">
        <TestimonialAvatar name={t.provider_name} photoUrl={t.provider_picture || null} isCenter={isCenter} />
        <div>
          <div className={`text-sm font-semibold ${isCenter ? "text-slate-900" : "text-slate-500"}`}>{t.resident_name}</div>
          <div className="text-xs text-slate-400">{isReal ? `Provider: ${t.provider_name}` : t.provider_name}</div>
        </div>
      </div>
    </div>
  );
}

function TestimonialCarousel({ testimonials, isReal }) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState(null);
  const autoRef = useRef(null);
  const total = testimonials.length;
  const mod = (n) => ((n % total) + total) % total;

  const triggerSlide = useCallback((dir) => {
    if (isAnimating) return;
    setSlideDir(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent((c) => mod(dir === "right" ? c + 1 : c - 1));
      setIsAnimating(false);
      setSlideDir(null);
    }, 450);
  }, [isAnimating, total]);

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => triggerSlide("right"), 5000);
  }, [triggerSlide]);

  useEffect(() => { startAuto(); return () => clearInterval(autoRef.current); }, [startAuto]);

  function handlePrev() { triggerSlide("left"); startAuto(); }
  function handleNext() { triggerSlide("right"); startAuto(); }
  function handleDot(i) {
    if (isAnimating || i === current) return;
    triggerSlide(i > current ? "right" : "left");
    startAuto();
  }

  const leftIdx = mod(current - 1);
  const rightIdx = mod(current + 1);

  function getCardProps(idx) {
    let translateX = "0%", scale = 1, opacity = 1, blur = "none", zIndex = 10, isCenter = false;
    if (!isAnimating) {
      if (idx === current) { translateX = "0%"; scale = 1; opacity = 1; zIndex = 20; isCenter = true; }
      else if (idx === leftIdx) { translateX = "-115%"; scale = 0.82; opacity = 0.5; blur = "blur(2px)"; zIndex = 10; }
      else if (idx === rightIdx) { translateX = "115%"; scale = 0.82; opacity = 0.5; blur = "blur(2px)"; zIndex = 10; }
      else { translateX = "0%"; scale = 0.7; opacity = 0; zIndex = 0; }
    } else {
      if (slideDir === "right") {
        const next = mod(current + 1), far = mod(current + 2);
        if (idx === current) { translateX = "-115%"; scale = 0.82; opacity = 0.5; blur = "blur(2px)"; zIndex = 10; }
        else if (idx === next) { translateX = "0%"; scale = 1; opacity = 1; zIndex = 20; isCenter = true; }
        else if (idx === far) { translateX = "115%"; scale = 0.82; opacity = 0.5; blur = "blur(2px)"; zIndex = 10; }
        else if (idx === leftIdx) { translateX = "-220%"; scale = 0.7; opacity = 0; zIndex = 0; }
        else { translateX = "0%"; scale = 0.7; opacity = 0; zIndex = 0; }
      }
      if (slideDir === "left") {
        const prev = mod(current - 1), far = mod(current - 2);
        if (idx === current) { translateX = "115%"; scale = 0.82; opacity = 0.5; blur = "blur(2px)"; zIndex = 10; }
        else if (idx === prev) { translateX = "0%"; scale = 1; opacity = 1; zIndex = 20; isCenter = true; }
        else if (idx === far) { translateX = "-115%"; scale = 0.82; opacity = 0.5; blur = "blur(2px)"; zIndex = 10; }
        else if (idx === rightIdx) { translateX = "220%"; scale = 0.7; opacity = 0; zIndex = 0; }
        else { translateX = "0%"; scale = 0.7; opacity = 0; zIndex = 0; }
      }
    }
    return { translateX, scale, opacity, blur, zIndex, isCenter };
  }

  return (
    <div className="w-full">
      <div className="relative mx-auto h-64 w-full max-w-3xl overflow-visible">
        {testimonials.map((t, i) => {
          const { translateX, scale, opacity, blur, zIndex, isCenter } = getCardProps(i);
          return (
            <div key={i} style={{
              position: "absolute", top: 0, left: "50%", width: "320px", marginLeft: "-160px",
              transform: `translateX(${translateX}) scale(${scale})`,
              opacity, filter: blur, zIndex,
              transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
              willChange: "transform, opacity",
            }}>
              <TestimonialCard t={t} isReal={isReal} isCenter={isCenter} />
            </div>
          );
        })}
      </div>
      <div className="mt-10 flex items-center justify-center gap-5">
        <button onClick={handlePrev} disabled={isAnimating}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-teal-400 hover:text-teal-700 hover:shadow-md active:scale-95 disabled:opacity-40">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => handleDot(i)}
              className={`rounded-full transition-all duration-300 ${i === current ? "w-7 h-2.5 bg-teal-700" : "w-2.5 h-2.5 bg-slate-300 hover:bg-teal-400"}`} />
          ))}
        </div>
        <button onClick={handleNext} disabled={isAnimating}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-teal-400 hover:text-teal-700 hover:shadow-md active:scale-95 disabled:opacity-40">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

const FALLBACK_TESTIMONIALS = [
  { comment: "SerbisyoNear makes it easier to find local help without guessing who to trust.", rating: 5, resident_name: "Metro Manila Resident", provider_name: "Platform User", provider_picture: null },
  { comment: "The provider verification flow helps make the service booking process feel safer.", rating: 5, resident_name: "Home Service Customer", provider_name: "Verified Account Holder", provider_picture: null },
  { comment: "Everything from finding a service to booking a provider is so much more organized.", rating: 5, resident_name: "Barangay Resident", provider_name: "Returning User", provider_picture: null },
  { comment: "I found a reliable plumber in my area within minutes. Very convenient!", rating: 4, resident_name: "QC Resident", provider_name: "Happy Customer", provider_picture: null },
  { comment: "The booking process is smooth and the providers are professional.", rating: 5, resident_name: "Makati Local", provider_name: "Satisfied User", provider_picture: null },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ services_count: 0, approved_providers_count: 0, completed_bookings_count: 0 });
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);

  useEffect(() => {
    async function fetchLandingData() {
      try {
        const res = await fetch(`${API_BASE_URL}/landing/summary`);
        const data = await res.json();
        if (data.status === "success") { setServices(data.services || []); setStats(data.stats || {}); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    async function fetchTestimonials() {
      try {
        const res = await fetch(`${API_BASE_URL}/landing/testimonials`);
        const data = await res.json();
        if (data.status === "success" && data.testimonials?.length > 0) setTestimonials(data.testimonials);
        else setTestimonials(FALLBACK_TESTIMONIALS);
      } catch (e) { console.error(e); setTestimonials(FALLBACK_TESTIMONIALS); }
      finally { setTestimonialsLoading(false); }
    }
    fetchLandingData();
    fetchTestimonials();
  }, []);

  const featuredServices = useMemo(() => services.slice(0, 4), [services]);
  const isRealFeedback = testimonials.length > 0 && testimonials[0]?.resident_name !== "Metro Manila Resident";

  const carouselItems = useMemo(() => {
    if (testimonials.length === 0) return [];
    if (testimonials.length < 3) {
      const padded = [...testimonials];
      while (padded.length < 3) padded.push(...testimonials);
      return padded.slice(0, 3);
    }
    return testimonials;
  }, [testimonials]);

  return (
    <div className="bg-white">
      <Navbar />

      {/* Hero */}
      <section className="py-16">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-1.5 text-xs font-semibold text-teal-700">
                <ShieldCheck size={13} strokeWidth={2.5} />
                Trusted by residents across Metro Manila
              </div>
              <h1 className="text-5xl font-extrabold leading-tight text-slate-900">
                Expert Help, Right <br />Around the Corner <br />in Metro Manila.
              </h1>
              <p className="mt-6 max-w-xl text-base text-slate-600">
                Connect with trusted household workers and maintenance pros in your barangay. All providers are verified, bookings are simple, and help is always nearby.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <PrimaryButton onClick={() => navigate("/signup")}>Find a Service <ArrowRight size={15} /></PrimaryButton>
                <SecondaryButton onClick={() => navigate("/signup")}>Join as Provider</SecondaryButton>
              </div>
              <div className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { value: stats.services_count, label: "Available Services" },
                  { value: stats.approved_providers_count, label: "Approved Providers" },
                  { value: stats.completed_bookings_count, label: "Completed Bookings" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-2xl font-extrabold text-slate-900">{loading ? "..." : Number(s.value || 0).toLocaleString()}</div>
                    <div className="mt-1 text-sm text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="group relative w-full max-w-xl overflow-hidden rounded-[2.25rem] shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1800&auto=format&fit=crop"
                  alt="Professional home service technician at work"
                  className="h-[360px] w-full object-cover transition duration-500 group-hover:scale-105 md:h-[420px]"
                />
                <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                    <Star size={18} className="text-amber-500" fill="currentColor" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">4.9 / 5.0</div>
                    <div className="text-xs text-slate-500">Average provider rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* About */}
      <section className="border-y border-slate-100 bg-slate-50 py-16">
        <Container>
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-teal-700">About the Platform</div>
              <h2 className="mt-3 text-3xl font-extrabold leading-snug text-slate-900">Built to Remove the Guesswork from Finding Local Help</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                SerbisyoNear was built to connect Metro Manila residents with verified local service providers, making it easier to find trusted help without the guesswork. Whether you need an aircon technician, a plumber, or a house cleaner, we've already done the vetting — so you don't have to.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Every provider goes through identity and background verification",
                  "Transparent pricing before you commit to any booking",
                  "Barangay-level service matching for faster response times",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-teal-600" strokeWidth={2.2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "18+", label: "Service Categories", sub: "From aircon to carpentry" },
                { value: "₱500", label: "Starting Price", sub: "Transparent & upfront" },
                { value: "NCR", label: "Coverage Area", sub: "All 17 cities & municipalities" },
                { value: "100%", label: "Verified Providers", sub: "ID & background checked" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-2xl font-extrabold text-teal-700">{stat.value}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">{stat.label}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="bg-teal-50 py-14">
        <Container>
          <div className="grid gap-10 md:grid-cols-3">
            <Feature icon={ShieldCheck} title="Verified Pros" description="All service providers are verified for your safety." />
            <Feature icon={MapPin} title="Location Based" description="Find available workers near your barangay." />
            <Feature icon={Clock3} title="Fast Booking" description="Book services quickly through one simple platform." />
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <Container>
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-teal-700">Simple Process</div>
            <h2 className="mt-3 text-4xl font-extrabold text-slate-900">How SerbisyoNear Works</h2>
            <p className="mt-3 text-slate-500">From sign-up to service done — it only takes a few steps.</p>
          </div>
          <div className="mt-16 grid gap-10 md:grid-cols-4">
            {[
              { number: 1, icon: UserCircle2, title: "Create Your Account", description: "Sign up for free as a resident or register as a service provider." },
              { number: 2, icon: Search, title: "Browse Services", description: "Explore verified providers offering services in your barangay." },
              { number: 3, icon: CalendarCheck, title: "Book a Schedule", description: "Pick a time that works for you and confirm your booking instantly." },
              { number: 4, icon: Wrench, title: "Get It Done", description: "Your provider arrives, completes the job, and you leave a review." },
            ].map((step, i, arr) => (
              <HowItWorksStep key={step.number} {...step} isLast={i === arr.length - 1} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <PrimaryButton onClick={() => navigate("/signup")}>Get Started — It's Free <ArrowRight size={15} /></PrimaryButton>
          </div>
        </Container>
      </section>

      {/* Services */}
      <section id="services" className="bg-slate-50 py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-teal-700">What We Cover</div>
              <h2 className="mt-2 text-4xl font-extrabold text-slate-900">Services We Offer</h2>
              <p className="mt-2 text-slate-600">Real service categories currently available in SerbisyoNear.</p>
            </div>
            {!loading && services.length > 4 && (
              <button onClick={() => navigate("/signup")}
                className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 transition">
                View all {services.length} services <ArrowRight size={15} />
              </button>
            )}
          </div>
          {loading ? (
            <div className="mt-12 text-center text-slate-500">Loading services...</div>
          ) : featuredServices.length === 0 ? (
            <div className="mt-12 text-center text-slate-500">No services available yet.</div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featuredServices.map((service, index) => (
                <ServiceCard key={service.id} label={service.name} description={service.description}
                  price={service.price} active={index === 0} onClick={() => navigate("/signup")} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="overflow-hidden bg-gradient-to-b from-white to-slate-50 py-24">
        <Container>
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-teal-700">Reviews</div>
            <h2 className="mt-3 text-4xl font-extrabold text-slate-900">What People Are Saying</h2>
            <p className="mt-3 text-base text-slate-500">
              {isRealFeedback ? "Real reviews from residents who used SerbisyoNear." : "Built for residents who want a simpler way to find trusted local services."}
            </p>
          </div>
          {isRealFeedback && (
            <div className="mt-4 flex justify-center">
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                ✓ Verified reviews from actual bookings
              </span>
            </div>
          )}
          <div className="mt-14">
            {testimonialsLoading ? (
              <div className="flex items-center justify-center gap-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`w-72 rounded-2xl border border-slate-100 bg-slate-50 p-6 animate-pulse ${i === 1 ? "w-80 opacity-100" : "opacity-40"}`}>
                    <div className="h-4 w-20 rounded bg-slate-200" />
                    <div className="mt-4 h-16 rounded bg-slate-200" />
                    <div className="mt-5 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-200 flex-shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-24 rounded bg-slate-200" />
                        <div className="h-3 w-16 rounded bg-slate-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : carouselItems.length > 0 ? (
              <>
                <TestimonialCarousel testimonials={carouselItems} isReal={isRealFeedback} />
                <p className="mt-4 text-center text-xs text-slate-400">Showing {carouselItems.length} reviews · Use arrows to browse</p>
              </>
            ) : null}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-teal-800 py-20">
        <Container>
          <div className="text-center text-white">
            <h3 className="text-4xl font-extrabold leading-tight">
              Ready to Find Your Perfect Service <br className="hidden md:block" />Provider?
            </h3>
            <p className="mt-4 text-white/85">Join SerbisyoNear and connect with trusted local service providers today.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button onClick={() => navigate("/signup")}
                className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-teal-800 shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-teal-50 hover:shadow-lg">
                Get Started Now
              </button>
              <button onClick={() => navigate("/signup")}
                className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-white/60">
                Register as Provider
              </button>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
