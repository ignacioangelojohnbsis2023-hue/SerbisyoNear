from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey, Boolean, Float
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=True)
    middle_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    region = Column(String(150), nullable=True)
    province = Column(String(150), nullable=True)
    city = Column(String(150), nullable=True)
    barangay = Column(String(150), nullable=True)
    street = Column(String(255), nullable=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # resident, pro, admin
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    profile_picture = Column(String(500), nullable=True)  # ← NEW: e.g. "uploads/profile_pictures/3/abc.jpg"
    verification_status = Column(String(50), nullable=True, default="approved")
    is_archived = Column(Boolean, default=False)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)

    is_email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(255), nullable=True)
    reset_password_token = Column(String(255), nullable=True)
    reset_password_expires = Column(DateTime, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProviderDocument(Base):
    __tablename__ = "provider_documents"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doc_type = Column(String(100), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    is_complaint = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProviderService(Base):
    __tablename__ = "provider_services"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_category_id = Column(Integer, ForeignKey("service_categories.id"), nullable=False)
    price = Column(Integer, nullable=True, default=500)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ServiceCategory(Base):
    __tablename__ = "service_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Integer, nullable=True, default=500)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_name = Column(String(150), nullable=False)
    booking_date = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    notes = Column(Text, nullable=True)
    amount = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_archived = Column(Boolean, default=False)
    acceptance_note = Column(String(500), nullable=True)
    cancel_reason = Column(String(255), nullable=True)
    payment_status = Column(String(50), nullable=True, default="unpaid")
    payment_id = Column(String(255), nullable=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)
    is_read = Column(Boolean, default=False)
    related_booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
