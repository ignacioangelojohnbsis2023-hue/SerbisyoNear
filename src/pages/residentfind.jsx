import React, { useEffect, useMemo, useState } from "react";
import ResidentLayout from "../components/ResidentLayout";
import MapComponent from "../components/MapComponent";
import { API_BASE_URL } from "../lib/api";
import { geocodeNominatim } from "../lib/nominatim";

function StarRating({ rating, max = 5 }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < Math.round(rating) ? "text-amber-400" : "text-slate-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function ProviderAvatar({ name, photoUrl, size = "md" }) {
  const sizeClass = size === "lg"
    ? "h-16 w-16 text-xl"
    : size === "sm"
    ? "h-9 w-9 text-sm"
    : "h-12 w-12 text-base";

  const initials = name
    ? name.trim().split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : "?";

  return (
    <div className={`${sizeClass} flex-shrink-0 rounded-full overflow-hidden ring-2 ring-white shadow`}>
      {photoUrl ? (
        <img
          src={`${API_BASE_URL.replace("/api", "")}${photoUrl}`}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-teal-700 font-bold text-white">
          {initials}
        </div>
      )}
    </div>
  );
}

export default function ResidentFind() {
  const [providers, setProviders] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingProvider, setBookingProvider] = useState(null);
  const [serviceName, setServiceName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [mapCenter] = useState({ lat: 14.5995, lon: 120.9842 });

  const [reviewsProvider, setReviewsProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [feedbackSummary, setFeedbackSummary] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("search") || "");
  }, []);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch(`${API_BASE_URL}/resident/providers`);
        const data = await res.json();

        if (data.status === "success") {
          const enriched = [];
          for (const p of data.providers) {
            if (p.lat && p.lon) { enriched.push(p); continue; }
            if (p.address) {
              await new Promise((resolve) => setTimeout(resolve, 1100));
              const coords = await geocodeNominatim(p.address);
              if (coords) {
                const updated = { ...p, lat: coords.lat, lon: coords.lon };
                enriched.push(updated);
                fetch(`${API_BASE_URL}/profile/${p.id}/location`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ lat: coords.lat, lon: coords.lon }),
                }).catch(console.error);
              } else { enriched.push(p); }
            } else { enriched.push(p); }
          }
          setProviders(enriched);

          const summaries = {};
          await Promise.all(
            enriched.map(async (p) => {
              try {
                const r = await fetch(`${API_BASE_URL}/pro/feedbacks/${p.id}`);
                const d = await r.json();
                if (d.status === "success") {
                  summaries[p.id] = { avg_rating: d.avg_rating || 0, total: d.total || 0 };
                }
              } catch { /* ignore */ }
            })
          );
          setFeedbackSummary(summaries);
        } else {
          setErrorMessage(data.message || "Failed to load providers.");
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Something went wrong while loading providers.");
      } finally {
        setLoading(false);
      }
    }
    fetchProviders();
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/services`);
        const data = await res.json();
        if (data.status === "success") setServiceCategories(data.services || []);
      } catch (e) { console.error(e); }
    }
    fetchCategories();
  }, []);

  async function openReviews(provider) {
    setReviewsProvider(provider);
    setReviews([]);
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/pro/feedbacks/${provider.id}`);
      const data = await res.json();
      if (data.status === "success") setReviews(data.feedbacks || []);
    } catch { /* ignore */ }
    setReviewsLoading(false);
  }

  const mapMarkers = useMemo(() => {
    return providers
      .filter((p) => p.lat && p.lon)
      .map((p) => ({ id: p.id, lat: p.lat, lon: p.lon, label: p.full_name }));
  }, [providers]);

  const filteredProviders = useMemo(() => {
    let result = providers;
    const keyword = search.trim().toLowerCase();
    if (keyword) {
      result = result.filter((p) => {
        const matchesProvider =
          (p.full_name || "").toLowerCase().includes(keyword) ||
          (p.email || "").toLowerCase().includes(keyword) ||
          (p.address || "").toLowerCase().includes(keyword);
        const matchesService = (p.services || []).some((s) =>
          (s.name || "").toLowerCase().includes(keyword)
        );
        return matchesProvider || matchesService;
      });
    }
    if (serviceFilter) {
      result = result.filter((p) =>
        (p.services || []).some((s) => s.name === serviceFilter)
      );
    }
    return result;
  }, [providers, search, serviceFilter]);

  const selectedService = useMemo(() => {
    if (!bookingProvider || !serviceName) return null;
    return (bookingProvider.services || []).find((s) => s.name === serviceName);
  }, [bookingProvider, serviceName]);

  function handleSearch() {
    const params = new URLSearchParams(window.location.search);
    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }

  function handleResetSearch() {
    setSearch("");
    setServiceFilter("");
    window.history.replaceState({}, "", window.location.pathname);
  }

  function handleSearchKeyDown(e) { if (e.key === "Enter") handleSearch(); }

  function closeBookingModal() {
    setBookingProvider(null); setServiceName(""); setBookingDate(""); setBookingTime("09:00"); setNotes("");
  }

  async function handleBookSubmit(e) {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user?.id) { setErrorMessage("User not found. Please log in again."); return; }
      if (!bookingProvider) { setErrorMessage("Please select a provider."); return; }
      if (!serviceName) { setErrorMessage("Please select a service."); return; }
      if (!bookingDate) { setErrorMessage("Please select a booking date."); return; }

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const selected = new Date(bookingDate); selected.setHours(0, 0, 0, 0);
      if (selected < today) { setErrorMessage("Past dates are not allowed."); return; }

      setSubmitting(true);
      const bookingDatetime = `${bookingDate} ${bookingTime}`;
      const res = await fetch(`${API_BASE_URL}/resident/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resident_id: user.id,
          provider_id: bookingProvider.id,
          service_name: serviceName,
          booking_date: bookingDatetime,
          notes,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        closeBookingModal();
        setSuccessMessage("Booking created successfully.");
      } else {
        setErrorMessage(data.message || "Failed to create booking.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while creating booking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResidentLayout title="Find Services">
      <div className="space-y-6">
        {errorMessage && (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-red-700 shadow-sm">
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* MAP */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Provider Locations</h2>
          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">Loading map...</div>
          ) : (
            <MapComponent lat={mapCenter.lat} lon={mapCenter.lon} markers={mapMarkers} />
          )}
          {!loading && mapMarkers.length === 0 && (
            <p className="mt-3 text-sm text-slate-400">No providers have set their location yet.</p>
          )}
        </div>

        {/* SEARCH + FILTERS */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-extrabold text-slate-900">Available Providers</h2>
          <p className="mt-2 text-slate-500">Browse approved service providers and the services they offer.</p>

          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by provider name, email, or address..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 md:flex-1"
            />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 md:w-56"
            >
              <option value="">All Services</option>
              {serviceCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <button onClick={handleSearch} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800">Search</button>
            <button onClick={handleResetSearch} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reset</button>
          </div>

          {serviceFilter && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-slate-500">Filtering by:</span>
              <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                {serviceFilter}
                <button onClick={() => setServiceFilter("")} className="ml-1 text-teal-500 hover:text-teal-800">✕</button>
              </span>
            </div>
          )}
        </div>

        {successMessage && (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{successMessage}</p>
              <button onClick={() => setSuccessMessage("")} className="rounded-lg px-3 py-1 text-sm font-semibold hover:bg-emerald-100">Close</button>
            </div>
          </div>
        )}

        {/* PROVIDER CARDS */}
        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-slate-500">Loading providers...</p>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-slate-500">
              No matching providers found{serviceFilter ? ` offering "${serviceFilter}"` : ""}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProviders.map((provider) => {
              const summary = feedbackSummary[provider.id];
              const avgRating = summary?.avg_rating || 0;
              const totalReviews = summary?.total || 0;

              return (
                <div key={provider.id} className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  {/* Avatar + Name + rating */}
                  <div className="flex items-start gap-3">
                    <ProviderAvatar name={provider.full_name} photoUrl={provider.profile_picture} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-lg font-bold text-slate-900 leading-tight">{provider.full_name}</div>
                        {totalReviews > 0 ? (
                          <div className="flex flex-col items-end shrink-0">
                            <StarRating rating={avgRating} />
                            <span className="mt-0.5 text-xs text-slate-400">{avgRating.toFixed(1)} · {totalReviews} review{totalReviews !== 1 ? "s" : ""}</span>
                          </div>
                        ) : (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-400">No reviews yet</span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-slate-500 truncate">{provider.email}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-slate-600">
                    <span className="font-medium">Phone:</span> {provider.phone || "-"}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    <span className="font-medium">Address:</span> {provider.address || "-"}
                  </div>
                  {provider.lat && provider.lon && (
                    <div className="mt-2 text-xs text-teal-600 font-medium">📍 Visible on map</div>
                  )}

                  <div className="mt-4">
                    <div className="mb-2 text-sm font-semibold text-slate-700">Services</div>
                    <div className="flex flex-wrap gap-2">
                      {provider.services?.length ? (
                        provider.services.map((service) => (
                          <button
                            key={`${provider.id}-${service.id}`}
                            onClick={() => setServiceFilter(service.name)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition hover:ring-2 hover:ring-teal-300 ${
                              serviceFilter === service.name
                                ? "bg-teal-700 text-white"
                                : "bg-teal-50 text-teal-700"
                            }`}
                            title={`Filter by ${service.name}`}
                          >
                            {service.name} • ₱{service.price}
                          </button>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">No services listed</span>
                      )}
                    </div>
                  </div>

                  {totalReviews > 0 && (
                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Latest Review</p>
                      <LatestReviewPreview providerId={provider.id} />
                    </div>
                  )}

                  <div className="mt-5 flex gap-2">
                    {totalReviews > 0 && (
                      <button
                        type="button"
                        onClick={() => openReviews(provider)}
                        className="flex-1 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-100"
                      >
                        ⭐ Reviews ({totalReviews})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setBookingProvider(provider); setServiceName(""); setBookingDate(""); setBookingTime("09:00"); setNotes(""); }}
                      className="flex-1 rounded-2xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                    >
                      Book Service
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* REVIEWS MODAL */}
        {reviewsProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  <ProviderAvatar name={reviewsProvider.full_name} photoUrl={reviewsProvider.profile_picture} size="sm" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Reviews & Ratings</h2>
                    <p className="text-sm text-slate-500">{reviewsProvider.full_name}</p>
                  </div>
                </div>
                <button onClick={() => setReviewsProvider(null)}
                  className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">
                  Close
                </button>
              </div>

              {!reviewsLoading && reviews.length > 0 && (() => {
                const avg = feedbackSummary[reviewsProvider.id]?.avg_rating || 0;
                const total = feedbackSummary[reviewsProvider.id]?.total || 0;
                return (
                  <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <div className="text-center">
                      <div className="text-4xl font-extrabold text-slate-900">{avg.toFixed(1)}</div>
                      <StarRating rating={avg} />
                      <div className="mt-1 text-xs text-slate-400">{total} review{total !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => r.rating === star).length;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="w-4 text-right">{star}</span>
                            <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <div className="flex-1 h-2 rounded-full bg-slate-200">
                              <div className="h-2 rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {reviewsLoading ? (
                  <p className="py-10 text-center text-slate-400">Loading reviews…</p>
                ) : reviews.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-4xl">💬</p>
                    <p className="mt-2 font-semibold text-slate-600">No reviews yet</p>
                    <p className="text-sm text-slate-400">This provider hasn't received any reviews.</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-slate-100 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-slate-800">{review.resident_name}</div>
                        <StarRating rating={review.rating} />
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                        <span>{review.created_at?.slice(0, 10)}</span>
                        {review.is_complaint && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-500 font-semibold">Complaint</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-b-3xl border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end">
                <button
                  onClick={() => { setReviewsProvider(null); setBookingProvider(reviewsProvider); setServiceName(""); setBookingDate(""); setBookingTime("09:00"); setNotes(""); }}
                  className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Book This Provider
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOOKING MODAL */}
        {bookingProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-1">
                <ProviderAvatar name={bookingProvider.full_name} photoUrl={bookingProvider.profile_picture} />
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Book Service</h2>
                  <p className="text-slate-500 text-sm">
                    with <span className="font-semibold">{bookingProvider.full_name}</span>
                  </p>
                </div>
              </div>
              <form onSubmit={handleBookSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Service</label>
                  <select value={serviceName} onChange={(e) => setServiceName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-600" required>
                    <option value="">Select a service</option>
                    {(bookingProvider.services || []).map((service) => (
                      <option key={service.id} value={service.name}>{service.name} — ₱{service.price}</option>
                    ))}
                  </select>
                </div>

                {selectedService && (
                  <div className="rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
                    Estimated price: <span className="font-bold">₱{selectedService.price}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Booking Date <span className="text-red-500">*</span></label>
                    <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-600" required />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Preferred Time <span className="text-red-500">*</span></label>
                    <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-600" required />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
                    placeholder="Describe the service you need in detail..."
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-600" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeBookingModal}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
                    {submitting ? "Booking..." : "Confirm Booking"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ResidentLayout>
  );
}

function LatestReviewPreview({ providerId }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/pro/feedbacks/${providerId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success" && d.feedbacks?.length) {
          setPreview(d.feedbacks[0]);
        }
      })
      .catch(() => {});
  }, [providerId]);

  if (!preview) return <p className="text-xs text-slate-400">Loading…</p>;

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-700">{preview.resident_name}</span>
        <span className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className={`h-3 w-3 ${i < preview.rating ? "text-amber-400" : "text-slate-200"}`}
              fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </span>
      </div>
      {preview.comment && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-2">"{preview.comment}"</p>
      )}
    </div>
  );
}
