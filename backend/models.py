from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey, Boolean, Float, Index
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
    phone_verified = Column(Boolean, default=False)
    phone_otp_hash = Column(String(128), nullable=True)
    phone_otp_expires = Column(DateTime, nullable=True)
    credential_types = Column(Text, nullable=True)
    experience_years = Column(Integer, nullable=True)
    experience_description = Column(Text, nullable=True)
    skill_assessment_requested = Column(Boolean, default=False)
    enhanced_verification_status = Column(String(30), nullable=True)
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
    payment_method = Column(String(20), nullable=True)
    needs_admin_review = Column(Boolean, default=False)


class CompletionProof(Base):
    __tablename__ = "completion_proofs"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    photo_url = Column(String(500), nullable=False)
    submitted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    attempt_number = Column(Integer, nullable=False, default=1)
    status = Column(String(20), nullable=False, default="pending")  # pending, approved, rejected
    rejection_reason = Column(String(500), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    attachment_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


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


class ProviderWalletTransaction(Base):
    __tablename__ = "provider_wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(80), nullable=False, unique=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True, index=True)
    transaction_type = Column(String(30), nullable=False)  # top_up, earning, fee, refund
    amount = Column(Integer, nullable=False)  # signed integer pesos
    balance_after = Column(Integer, nullable=False)
    payment_id = Column(String(255), nullable=True, index=True)
    reference = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False, default="completed")
    previous_hash = Column(String(64), nullable=True)
    transaction_hash = Column(String(64), nullable=False, unique=True)
    current_hash = Column(String(64), nullable=True)
    previous_transaction_hash = Column(String(64), nullable=True)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_wallet_provider_created", "provider_id", "created_at"),
    )
