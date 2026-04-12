from fastapi import FastAPI, Query, Request, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
import shutil, math
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from datetime import datetime, timedelta
from models import User, Booking, ProviderService, ServiceCategory, Feedback, ProviderDocument, Notification
import requests as http_requests 
import base64

import re
import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

UPLOAD_DIR = "uploads/provider_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_DOC_TYPES = {
    "government_id": "Government-Issued ID",
    "diploma": "Diploma / Academic Certificate",
    "certificate": "Skills / Trade Certificate",
    "other": "Other Document",
}

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_FILE_BYTES = 5 * 1024 * 1024  # 5 MB per file

PROFILE_PIC_DIR = "uploads/profile_pictures"
os.makedirs(PROFILE_PIC_DIR, exist_ok=True)

ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_PROFILE_PIC_BYTES = 3 * 1024 * 1024  # 3 MB



app = FastAPI(title="SerbisyoNear API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.0.100:5173",
    "http://192.168.100.9:5173",
    "http://192.168.1.31:5173",
    "http://10.11.193.248:5173",
    "http://10.11.193.248:5173",
    "http://10.243.97.236:5173",
    "http://192.168.100.238:5173",
    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

Base.metadata.create_all(bind=engine)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def generate_token():
    return secrets.token_urlsafe(32)


def send_email(to_email: str, subject: str, body: str):
    mail_username = os.getenv("MAIL_USERNAME")
    mail_password = os.getenv("MAIL_PASSWORD")
    mail_from = os.getenv("MAIL_FROM")
    mail_server = os.getenv("MAIL_SERVER")
    mail_port = int(os.getenv("MAIL_PORT", 587))

    if not all([mail_username, mail_password, mail_from, mail_server]):
        raise Exception("Email configuration is missing in .env")

    message = MIMEMultipart()
    message["From"] = mail_from
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "html"))

    server = smtplib.SMTP(mail_server, mail_port)
    server.starttls()
    server.login(mail_username, mail_password)
    server.sendmail(mail_from, to_email, message.as_string())
    server.quit()

def validate_password(password: str):
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least 1 uppercase letter."
    if not re.search(r"[a-z]", password):
        return "Password must contain at least 1 lowercase letter."
    if not re.search(r"[0-9]", password):
        return "Password must contain at least 1 number."
    if not re.search(r"[^A-Za-z0-9]", password):
        return "Password must contain at least 1 special character."
    if len(password.encode("utf-8")) > 72:
        return "Password is too long. Please use 72 bytes or fewer."
    return None

def create_notification(db, user_id: int, title: str, message: str, notif_type: str, booking_id: int = None):
    """Helper to create a notification record. Call this inside other endpoints."""
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        related_booking_id=booking_id,
    )
    db.add(notif)

def get_paymongo_auth():
    secret_key = os.getenv("PAYMONGO_SECRET_KEY", "")
    encoded = base64.b64encode(f"{secret_key}:".encode()).decode()
    return f"Basic {encoded}"


class UpdateLocationRequest(BaseModel):
    lat: float
    lon: float

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ProviderServiceItem(BaseModel):
    id: int
    price: int = 500

class UpdateProviderServicesRequest(BaseModel):
    services: list[dict] | None = None
    service_ids: list[int] | None = None   

class UpdateProfileRequest(BaseModel):
    full_name: str
    phone: str | None = None
    address: str | None = None

class CreateBookingRequest(BaseModel):
    resident_id: int
    provider_id: int
    service_name: str
    booking_date: str
    notes: str | None = None

class SignupRequest(BaseModel):
    full_name: str
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    email: EmailStr
    password: str
    role: str
    phone: str | None = None
    address: str | None = None
    region: str | None = None
    province: str | None = None
    city: str | None = None
    barangay: str | None = None
    street: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LocationData(BaseModel):
    user_id: int
    lat: float
    lon: float

class ChangePasswordRequest(BaseModel):
    user_id: int
    current_password: str
    new_password: str

class CancelBookingRequest(BaseModel):
    reason: str | None = None

class AcceptBookingRequest(BaseModel):
    note: str | None = None

@app.post("/profile/{user_id}/upload-photo")
async def upload_profile_picture(user_id: int, file: UploadFile = File(...)):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"status": "error", "message": "User not found"}

        content_type = file.content_type or ""
        if content_type not in ALLOWED_IMAGE_MIME:
            return {"status": "error", "message": "Only JPEG, PNG, or WEBP images are allowed"}

        contents = await file.read()
        if len(contents) > MAX_PROFILE_PIC_BYTES:
            return {"status": "error", "message": "Image too large. Max 3 MB."}

        if user.profile_picture:
            old_path = user.profile_picture.lstrip("/")
            if os.path.exists(old_path):
                os.remove(old_path)

        import uuid
        ext = content_type.split("/")[-1]
        filename = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(PROFILE_PIC_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(contents)

        public_url = f"/uploads/profile_pictures/{filename}"
        user.profile_picture = public_url
        db.commit()

        return {
            "status": "success",
            "message": "Profile picture updated",
            "profile_picture": public_url,
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/payment/force-paid/{booking_id}")
def force_mark_paid(booking_id: int):
    """Demo/testing only — manually marks a booking as paid."""
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return {"status": "error", "message": "Booking not found"}
        booking.payment_status = "paid"
        db.commit()
        create_notification(
            db,
            user_id=booking.provider_id,
            title="Payment Received!",
            message=f"Payment of ₱{booking.amount} for {booking.service_name} (Booking #{booking.id}) has been completed.",
            notif_type="booking_completed",
            booking_id=booking.id,
        )
        db.commit()
        return {"status": "success", "message": f"Booking #{booking_id} marked as paid"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.post("/payment/create/{booking_id}")
def create_payment_link(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return {"status": "error", "message": "Booking not found"}

        if booking.payment_status == "paid":
            return {"status": "error", "message": "Booking already paid"}

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        amount_cents = (booking.amount or 500) * 100

        payload = {
            "data": {
                "attributes": {
                    "amount": amount_cents,
                    "description": f"Payment for {booking.service_name} - Booking #{booking.id}",
                    "remarks": f"Booking #{booking.id}",
                    "redirect": {
                        "success": f"{frontend_url}/payment/success?booking_id={booking.id}",
                        "failed": f"{frontend_url}/payment/failed?booking_id={booking.id}",
                    },
                    "payment_method_types": ["gcash"],
                }
            }
        }

        response = http_requests.post(
            "https://api.paymongo.com/v1/links",
            json=payload,
            headers={
                "Authorization": get_paymongo_auth(),
                "Content-Type": "application/json",
            },
        )

        result = response.json()

        if response.status_code not in (200, 201):
            error_detail = result.get("errors", [{}])[0].get("detail", "PayMongo error")
            return {"status": "error", "message": error_detail}

        link_data = result["data"]
        checkout_url = link_data["attributes"]["checkout_url"]
        link_id = link_data["id"]

        booking.payment_id = link_id
        booking.payment_status = "pending"
        db.commit()

        return {
            "status": "success",
            "checkout_url": checkout_url,
            "link_id": link_id,
        }

    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.get("/payment/verify/{booking_id}")
def verify_payment(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return {"status": "error", "message": "Booking not found"}

        if booking.payment_status == "paid":
            return {"status": "success", "payment_status": "paid"}

        if not booking.payment_id:
            return {"status": "error", "message": "No payment found for this booking"}

        response = http_requests.get(
            f"https://api.paymongo.com/v1/links/{booking.payment_id}",
            headers={"Authorization": get_paymongo_auth()},
        )

        result = response.json()

        if response.status_code != 200:
            return {"status": "error", "message": "Failed to verify payment"}

        link_status = result["data"]["attributes"]["status"]
        if link_status == "paid":
            booking.payment_status = "paid"
            db.commit()

            create_notification(
                db,
                user_id=booking.provider_id,
                title="Payment Received!",
                message=f"Payment of ₱{booking.amount} for {booking.service_name} (Booking #{booking.id}) has been completed.",
                notif_type="booking_completed",
                booking_id=booking.id,
            )
            db.commit()

            return {"status": "success", "payment_status": "paid"}
        else:
            booking.payment_status = "unpaid"
            db.commit()
            return {"status": "success", "payment_status": "unpaid"}

    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.get("/payment/status/{booking_id}")
def get_payment_status(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return {"status": "error", "message": "Booking not found"}
        return {
            "status": "success",
            "payment_status": booking.payment_status or "unpaid",
            "amount": booking.amount,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.get("/notifications/{user_id}")
def get_notifications(user_id: int):
    db = SessionLocal()
    try:
        notifs = (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(50)
            .all()
        )
        unread_count = sum(1 for n in notifs if not n.is_read)
        return {
            "status": "success",
            "notifications": [
                {
                    "id": n.id,
                    "title": n.title,
                    "message": n.message,
                    "type": n.type,
                    "is_read": n.is_read,
                    "related_booking_id": n.related_booking_id,
                    "created_at": str(n.created_at),
                }
                for n in notifs
            ],
            "unread_count": unread_count,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.put("/notifications/{user_id}/read-all")
def mark_all_notifications_read(user_id: int):
    db = SessionLocal()
    try:
        db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True})
        db.commit()
        return {"status": "success", "message": "All notifications marked as read"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.put("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int):
    db = SessionLocal()
    try:
        notif = db.query(Notification).filter(Notification.id == notif_id).first()
        if not notif:
            return {"status": "error", "message": "Notification not found"}
        notif.is_read = True
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.put("/resident/bookings/{booking_id}/cancel")
def cancel_resident_booking(booking_id: int, payload: CancelBookingRequest = None):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return {"status": "error", "message": "Booking not found"}
        if booking.status != "pending":
            return {"status": "error", "message": "Only pending bookings can be cancelled"}
        booking.status = "cancelled"
        booking.cancel_reason = payload.reason if payload else None
        db.commit()
        return {"status": "success", "message": "Booking cancelled successfully"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.put("/profile/{user_id}/services")
def update_profile_services(user_id: int, payload: UpdateProviderServicesRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id, User.role == "pro").first()
        if not user:
            return {"status": "error", "message": "Provider not found"}

        db.query(ProviderService).filter(ProviderService.provider_id == user_id).delete()

        if payload.services:
            new_rows = [
                ProviderService(
                    provider_id=user_id,
                    service_category_id=s["id"],
                    price=s.get("price", 500),
                )
                for s in payload.services
            ]
        elif payload.service_ids:
            new_rows = [
                ProviderService(provider_id=user_id, service_category_id=sid)
                for sid in payload.service_ids
            ]
        else:
            new_rows = []

        if new_rows:
            db.add_all(new_rows)

        db.commit()
        return {"status": "success", "message": "Services updated successfully"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.post("/provider/documents/upload")
async def upload_provider_documents(
    provider_id: int = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
):
    db = SessionLocal()
    try:
        provider = db.query(User).filter(User.id == provider_id, User.role == "pro").first()
        if not provider:
            return {"status": "error", "message": "Provider not found"}

        if doc_type not in ALLOWED_DOC_TYPES:
            return {"status": "error", "message": f"Invalid doc_type. Allowed: {list(ALLOWED_DOC_TYPES.keys())}"}

        content_type = file.content_type or ""
        if content_type not in ALLOWED_MIME:
            return {"status": "error", "message": "Only JPEG, PNG, WEBP, or PDF files are allowed"}

        contents = await file.read()
        if len(contents) > MAX_FILE_BYTES:
            return {"status": "error", "message": "File too large. Max 5MB per file."}

        provider_dir = os.path.join(UPLOAD_DIR, str(provider_id))
        os.makedirs(provider_dir, exist_ok=True)

        import uuid
        safe_name = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(provider_dir, safe_name)
        with open(file_path, "wb") as f:
            f.write(contents)

        doc = ProviderDocument(
            provider_id=provider_id,
            doc_type=doc_type,
            file_name=file.filename,
            file_path=file_path,
            mime_type=content_type,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        return {
            "status": "success",
            "message": "Document uploaded successfully",
            "document": {
                "id": doc.id,
                "doc_type": doc.doc_type,
                "file_name": doc.file_name,
                "url": f"/uploads/provider_docs/{provider_id}/{safe_name}",
            },
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.get("/admin/providers/{provider_id}/documents")
def get_provider_documents(provider_id: int):
    db = SessionLocal()
    try:
        docs = (
            db.query(ProviderDocument)
            .filter(ProviderDocument.provider_id == provider_id)
            .order_by(ProviderDocument.uploaded_at.asc())
            .all()
        )

        result = []
        for doc in docs:
            relative = doc.file_path.replace("\\", "/")
            if not relative.startswith("/"):
                relative = "/" + relative

            result.append({
                "id": doc.id,
                "doc_type": doc.doc_type,
                "doc_type_label": ALLOWED_DOC_TYPES.get(doc.doc_type, doc.doc_type),
                "file_name": doc.file_name,
                "mime_type": doc.mime_type,
                "url": relative,
                "uploaded_at": str(doc.uploaded_at),
            })

        return {"status": "success", "documents": result, "total": len(result)}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.delete("/admin/providers/documents/{doc_id}")
def delete_provider_document(doc_id: int):
    db = SessionLocal()
    try:
        doc = db.query(ProviderDocument).filter(ProviderDocument.id == doc_id).first()
        if not doc:
            return {"status": "error", "message": "Document not found"}

        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)

        db.delete(doc)
        db.commit()
        return {"status": "success", "message": "Document deleted"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.post("/change-password")
def change_password(payload: ChangePasswordRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            return {"status": "error", "message": "User not found"}
        if user.password != payload.current_password:
            return {"status": "error", "message": "Current password is incorrect"}
        
        password_error = validate_password(payload.new_password)
        if password_error:
            return {"status": "error", "message": password_error}
        
        if payload.current_password == payload.new_password:
            return {"status": "error", "message": "New password must differ from current password"}

        user.password = payload.new_password
        db.commit()
        return {"status": "success", "message": "Password changed successfully"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/landing/testimonials")
def get_landing_testimonials():
    db = SessionLocal()
    try:
        feedbacks = (
            db.query(Feedback)
            .filter(
                Feedback.is_archived == False,
                Feedback.is_complaint == False,
                Feedback.rating >= 4,
            )
            .order_by(Feedback.id.desc())
            .limit(6)
            .all()
        )

        result = []
        for fb in feedbacks:
            resident = db.query(User).filter(User.id == fb.resident_id).first()
            provider = db.query(User).filter(User.id == fb.provider_id).first()
            result.append({
                "comment": fb.comment,
                "rating": fb.rating,
                "resident_name": resident.full_name if resident else "Anonymous",
                "provider_name": provider.full_name if provider else "Unknown",
                "service": fb.booking_id,
            })

        return {"status": "success", "testimonials": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.post("/feedback/debug")
async def feedback_debug(request: Request):
    body = await request.json()
    print("FEEDBACK DEBUG:", body)
    return {"received": body}

@app.get("/pro/feedbacks/{provider_id}")
def get_provider_feedbacks(provider_id: int):
    db = SessionLocal()
    try:
        feedbacks = (
            db.query(Feedback)
            .filter(
                Feedback.provider_id == provider_id,
                Feedback.is_archived == False
            )
            .order_by(Feedback.id.desc())
            .all()
        )

        result = []
        for fb in feedbacks:
            resident = db.query(User).filter(User.id == fb.resident_id).first()
            result.append({
                "id": fb.id,
                "booking_id": fb.booking_id,
                "resident_name": resident.full_name if resident else "Unknown",
                "rating": fb.rating,
                "comment": fb.comment,
                "is_complaint": fb.is_complaint,
                "created_at": str(fb.created_at),
            })

        avg_rating = (
            round(sum(f["rating"] for f in result) / len(result), 1)
            if result else 0
        )

        return {
            "status": "success",
            "feedbacks": result,
            "avg_rating": avg_rating,
            "total": len(result),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.put("/admin/users/{user_id}/archive")
def archive_user(user_id: int):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"status": "error", "message": "User not found"}
        user.is_archived = not user.is_archived
        db.commit()
        return {"status": "success", "message": "User archive status updated"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.put("/admin/bookings/{booking_id}/archive")
def archive_booking(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return {"status": "error", "message": "Booking not found"}
        booking.is_archived = not booking.is_archived
        db.commit()
        return {"status": "success", "message": "Booking archive status updated"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


class FeedbackRequest(BaseModel):
    booking_id: int
    resident_id: int
    provider_id: int
    rating: int
    comment: str | None = None
    is_complaint: bool = False

@app.post("/feedback")
def submit_feedback(payload: FeedbackRequest):
    db = SessionLocal()
    try:
        existing = db.query(Feedback).filter(
            Feedback.booking_id == payload.booking_id,
            Feedback.resident_id == payload.resident_id
        ).first()
        if existing:
            return {"status": "error", "message": "Feedback already submitted for this booking"}

        fb = Feedback(
            booking_id=payload.booking_id,
            resident_id=payload.resident_id,
            provider_id=payload.provider_id,
            rating=payload.rating,
            comment=payload.comment,
            is_complaint=payload.is_complaint,
        )
        db.add(fb)
        db.commit()
        db.refresh(fb)
        return {"status": "success", "message": "Feedback submitted"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/admin/feedbacks")
def get_admin_feedbacks(is_complaint: bool = Query(default=None)):
    db = SessionLocal()
    try:
        query = db.query(Feedback).filter(Feedback.is_archived == False)
        if is_complaint is not None:
            query = query.filter(Feedback.is_complaint == is_complaint)
        feedbacks = query.order_by(Feedback.id.desc()).all()

        result = []
        for fb in feedbacks:
            resident = db.query(User).filter(User.id == fb.resident_id).first()
            provider = db.query(User).filter(User.id == fb.provider_id).first()
            result.append({
                "id": fb.id,
                "booking_id": fb.booking_id,
                "resident_name": resident.full_name if resident else "Unknown",
                "provider_name": provider.full_name if provider else "Unknown",
                "rating": fb.rating,
                "comment": fb.comment,
                "is_complaint": fb.is_complaint,
                "created_at": str(fb.created_at),
            })
        return {"status": "success", "feedbacks": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.put("/admin/feedbacks/{feedback_id}/archive")
def archive_feedback(feedback_id: int):
    db = SessionLocal()
    try:
        fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
        if not fb:
            return {"status": "error", "message": "Feedback not found"}
        fb.is_archived = True
        db.commit()
        return {"status": "success", "message": "Feedback archived"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/resident/nearest-providers/{user_id}")
def get_nearest_providers(user_id: int):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.lat is None or user.lon is None:
            return {"status": "error", "message": "User location not set"}

        providers = db.query(User).filter(User.role == "pro").all()

        results = []
        for p in providers:
            if p.lat is None or p.lon is None:
                continue
            distance = haversine(user.lat, user.lon, p.lat, p.lon)
            results.append({
                "id": p.id,
                "name": p.full_name,
                "service": getattr(p, "service", "Service"),
                "lat": p.lat,
                "lon": p.lon,
                "distance": round(distance, 2)
            })

        results.sort(key=lambda x: x["distance"])
        return {"status": "success", "providers": results[:5]}
    finally:
        db.close()

@app.post("/resident/location")
def save_location(data: LocationData):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == data.user_id).first()
        if not user:
            return {"status": "error", "message": "User not found"}

        user.lat = data.lat
        user.lon = data.lon
        db.commit()
        return {"status": "success", "message": "Location saved"}
    finally:
        db.close() 

@app.get("/landing/summary")
def get_landing_summary():
    db = SessionLocal()
    try:
        services = db.query(ServiceCategory).order_by(ServiceCategory.name.asc()).all()

        approved_providers_count = (
            db.query(User)
            .filter(User.role == "pro", User.verification_status == "approved")
            .count()
        )

        completed_bookings_count = (
            db.query(Booking)
            .filter(Booking.status == "completed")
            .count()
        )

        return {
            "status": "success",
            "stats": {
                "services_count": len(services),
                "approved_providers_count": approved_providers_count,
                "completed_bookings_count": completed_bookings_count,
            },
            "services": [
                {
                    "id": service.id,
                    "name": service.name,
                    "description": service.description,
                    "price": service.price,
                }
                for service in services
            ],
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

    finally:
        db.close()

# ── FIX #6: monthly_earnings now only counts paid bookings ────────────────────
@app.get("/pro/dashboard/{provider_id}")
def get_pro_dashboard(provider_id: int):
    db = SessionLocal()
    try:
        bookings = (
            db.query(Booking)
            .filter(Booking.provider_id == provider_id)
            .order_by(Booking.id.desc())
            .all()
        )

        new_requests = [b for b in bookings if b.status == "pending"]
        upcoming_jobs = [b for b in bookings if b.status == "confirmed"]
        completed_jobs = [b for b in bookings if b.status == "completed"]

        now = datetime.now()
        monthly_earnings = 0

        job_counts = {}
        for b in bookings:
            job_counts[b.service_name] = job_counts.get(b.service_name, 0) + 1
        most_frequent_job = max(job_counts, key=job_counts.get) if job_counts else "—"

        for b in completed_jobs:
            # FIX #6: only count paid bookings
            if b.payment_status != "paid":
                continue
            if not b.booking_date:
                continue
            try:
                booking_date_obj = datetime.strptime(str(b.booking_date)[:10], "%Y-%m-%d")
                if booking_date_obj.month == now.month and booking_date_obj.year == now.year:
                    monthly_earnings += b.amount or 0
            except Exception:
                continue

        recent_requests = []
        for booking in new_requests[:5]:
            resident = db.query(User).filter(User.id == booking.resident_id).first()
            recent_requests.append({
                "id": booking.id,
                "service_name": booking.service_name,
                "resident_name": resident.full_name if resident else "Unknown",
                "booking_date": str(booking.booking_date),
                "notes": booking.notes or "",
                "amount": booking.amount or 0,
            })

        return {
            "status": "success",
            "stats": {
                "new_requests": len(new_requests),
                "upcoming_jobs": len(upcoming_jobs),
                "completed_jobs": len(completed_jobs),
                "monthly_earnings": monthly_earnings,
                "most_frequent_job": most_frequent_job,
            },
            "recent_requests": recent_requests,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

    finally:
        db.close()

# ── FIX #5: revenue = paid only + new pending_revenue field ──────────────────
@app.get("/admin/reports")
def get_admin_reports():
    db = SessionLocal()
    try:
        bookings = db.query(Booking).all()

        total_bookings = len(bookings)
        total_completed = sum(1 for b in bookings if b.status == "completed")
        total_pending = sum(1 for b in bookings if b.status == "pending")
        total_confirmed = sum(1 for b in bookings if b.status == "confirmed")
        total_cancelled = sum(1 for b in bookings if b.status == "cancelled")

        # FIX #5: only paid bookings count as confirmed revenue
        total_revenue = sum(
            (b.amount or 0) for b in bookings
            if b.status == "completed" and b.payment_status == "paid"
        )
        # New: completed but not yet paid
        pending_revenue = sum(
            (b.amount or 0) for b in bookings
            if b.status == "completed" and b.payment_status != "paid"
        )

        service_counts = {}
        for booking in bookings:
            service_counts[booking.service_name] = service_counts.get(booking.service_name, 0) + 1

        top_services = sorted(
            [{"service_name": name, "count": count} for name, count in service_counts.items()],
            key=lambda x: x["count"],
            reverse=True,
        )[:5]

        return {
            "status": "success",
            "summary": {
                "total_bookings": total_bookings,
                "total_completed": total_completed,
                "total_pending": total_pending,
                "total_confirmed": total_confirmed,
                "total_cancelled": total_cancelled,
                "total_revenue": total_revenue,       # paid only
                "pending_revenue": pending_revenue,   # new field
            },
            "top_services": top_services,
            "distribution": [
                {"label": "Completed", "value": total_completed, "color": "#0d9488"},
                {"label": "Pending",   "value": total_pending,   "color": "#f59e0b"},
                {"label": "Confirmed", "value": total_confirmed,  "color": "#3b82f6"},
                {"label": "Cancelled", "value": total_cancelled,  "color": "#ef4444"},
            ],
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

    finally:
        db.close()

@app.get("/pro/earnings/{provider_id}")
def get_provider_earnings(provider_id: int):
    db = SessionLocal()
    try:
        paid_jobs = (
            db.query(Booking)
            .filter(
                Booking.provider_id == provider_id,
                Booking.status == "completed",
                Booking.payment_status == "paid",
            )
            .order_by(Booking.id.desc())
            .all()
        )

        unpaid_jobs = (
            db.query(Booking)
            .filter(
                Booking.provider_id == provider_id,
                Booking.status == "completed",
                Booking.payment_status != "paid",
            )
            .order_by(Booking.id.desc())
            .all()
        )

        total_earnings = sum((b.amount or 0) for b in paid_jobs)
        pending_earnings = sum((b.amount or 0) for b in unpaid_jobs)

        def booking_to_dict(b, db):
            resident = db.query(User).filter(User.id == b.resident_id).first()
            return {
                "id": b.id,
                "service_name": b.service_name,
                "booking_date": b.booking_date,
                "resident_name": resident.full_name if resident else "Unknown",
                "amount": b.amount or 0,
                "status": b.status,
                "payment_status": b.payment_status or "unpaid",
            }

        history = [booking_to_dict(b, db) for b in paid_jobs]
        pending_list = [booking_to_dict(b, db) for b in unpaid_jobs]

        return {
            "status": "success",
            "summary": {
                "total_completed_jobs": len(paid_jobs),
                "total_earnings": total_earnings,
                "pending_earnings": pending_earnings,
                "pending_jobs": len(unpaid_jobs),
            },
            "history": history,
            "pending_payments": pending_list,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.put("/profile/{user_id}/location")
def update_profile_location(user_id: int, payload: UpdateLocationRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"status": "error", "message": "User not found"}
        user.lat = payload.lat
        user.lon = payload.lon
        db.commit()
        return {"status": "success", "message": "Location saved"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.put("/profile/{user_id}/services")
def update_profile_services_v2(user_id: int, payload: UpdateProviderServicesRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id, User.role == "pro").first()
        if not user:
            return {"status": "error", "message": "Provider not found"}

        db.query(ProviderService).filter(ProviderService.provider_id == user_id).delete()

        new_rows = [
            ProviderService(
                provider_id=user_id,
                service_category_id=item.id,
                price=item.price,
            )
            for item in payload.services
        ]

        if new_rows:
            db.add_all(new_rows)

        db.commit()
        return {"status": "success", "message": "Provider services updated successfully"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/services")
def get_services():
    db = SessionLocal()
    try:
        services = db.query(ServiceCategory).order_by(ServiceCategory.name.asc()).all()
        return {
            "status": "success",
            "services": [
                {"id": service.id, "name": service.name, "description": service.description}
                for service in services
            ],
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.get("/profile/{user_id}/services")
def get_profile_services(user_id: int):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id, User.role == "pro").first()
        if not user:
            return {"status": "error", "message": "Provider not found"}

        rows = db.query(ProviderService).filter(ProviderService.provider_id == user_id).all()

        services = []
        for row in rows:
            category = db.query(ServiceCategory).filter(ServiceCategory.id == row.service_category_id).first()
            services.append({
                "id": row.service_category_id,
                "name": category.name if category else "",
                "price": row.price or category.price or 500,
            })

        return {
            "status": "success",
            "service_ids": [s["id"] for s in services],
            "services": services,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/profile/{user_id}")
def get_profile(user_id: int):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"status": "error", "message": "User not found"}

        return {
            "status": "success",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "phone": user.phone,
                "address": user.address,
                "verification_status": user.verification_status,
                "created_at": str(user.created_at) if user.created_at else None,
                "lat": user.lat,
                "lon": user.lon,
                "profile_picture": user.profile_picture or None,
            },
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.put("/profile/{user_id}")
def update_profile(user_id: int, payload: UpdateProfileRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"status": "error", "message": "User not found"}

        user.full_name = payload.full_name
        user.phone = payload.phone
        user.address = payload.address

        db.commit()
        db.refresh(user)

        return {
            "status": "success",
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "phone": user.phone,
                "address": user.address,
                "verification_status": user.verification_status,
            },
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/resident/dashboard/{resident_id}")
def get_resident_dashboard(resident_id: int):
    db = SessionLocal()
    try:
        bookings = (
            db.query(Booking)
            .filter(Booking.resident_id == resident_id)
            .order_by(Booking.id.desc())
            .all()
        )

        active_count = len([b for b in bookings if b.status in ["pending", "confirmed"]])
        completed_count = len([b for b in bookings if b.status == "completed"])
        total_bookings = len(bookings)
        cancelled_count = len([b for b in bookings if b.status == "cancelled"])

        latest_bookings = []
        for booking in bookings[:5]:
            provider = db.query(User).filter(User.id == booking.provider_id).first()
            latest_bookings.append({
                "id": booking.id,
                "service": booking.service_name,
                "pro": provider.full_name if provider else "Unknown",
                "date": str(booking.booking_date),
                "status": booking.status.capitalize(),
            })

        recommended_pros_query = (
            db.query(User)
            .filter(User.role == "pro", User.verification_status == "approved")
            .order_by(User.id.desc())
            .limit(5)
            .all()
        )

        recommended_pros = []
        for provider in recommended_pros_query:
            provider_service = (
                db.query(ProviderService)
                .filter(ProviderService.provider_id == provider.id)
                .first()
            )

            service_name = "General Service"
            if provider_service:
                service_category = (
                    db.query(ServiceCategory)
                    .filter(ServiceCategory.id == provider_service.service_category_id)
                    .first()
                )
                if service_category:
                    service_name = service_category.name

            recommended_pros.append({
                "id": provider.id,
                "pro": provider.full_name,
                "service": service_name,
                "area": provider.address if provider.address else "No address",
                "profile_picture": provider.profile_picture or None,
            })

        stats = [
            {"label": "Active Bookings",     "value": active_count,    "hint": "In progress / upcoming"},
            {"label": "Completed Services",  "value": completed_count, "hint": "Finished jobs"},
            {"label": "Total Bookings",      "value": total_bookings,  "hint": "All your bookings"},
            {"label": "Cancelled Bookings",  "value": cancelled_count, "hint": "Cancelled requests"},
        ]

        return {
            "status": "success",
            "stats": stats,
            "latest_bookings": latest_bookings,
            "recommended_pros": recommended_pros,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.put("/resident/bookings/{booking_id}/cancel")
def cancel_resident_booking_simple(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return {"status": "error", "message": "Booking not found"}
        if booking.status != "pending":
            return {"status": "error", "message": "Only pending bookings can be cancelled"}
        booking.status = "cancelled"
        db.commit()
        return {"status": "success", "message": "Booking cancelled successfully"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.put("/pro/jobs/{booking_id}/complete")
def complete_provider_job(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return {"status": "error", "message": "Booking not found"}

        if booking.payment_status != "paid":
            return {"status": "error", "message": "Resident must pay before job can be marked complete"}

        booking.status = "completed"

        create_notification(
            db,
            user_id=booking.resident_id,
            title="Job Completed",
            message=f"Your {booking.service_name} service on {booking.booking_date} has been marked as completed. Please leave a review!",
            notif_type="booking_completed",
            booking_id=booking.id,
        )

        db.commit()
        return {"status": "success", "message": "Job marked as completed"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.post("/resident/book")
def create_booking(payload: CreateBookingRequest):
    db = SessionLocal()
    try:
        resident = db.query(User).filter(User.id == payload.resident_id, User.role == "resident").first()
        provider = db.query(User).filter(User.id == payload.provider_id, User.role == "pro").first()

        if not resident:
            return {"status": "error", "message": "Resident not found"}
        if not provider:
            return {"status": "error", "message": "Provider not found"}
        if provider.verification_status != "approved":
            return {"status": "error", "message": "Provider is not approved"}

        category = db.query(ServiceCategory).filter(ServiceCategory.name == payload.service_name).first()
        if not category:
            return {"status": "error", "message": "Selected service does not exist"}

        provider_service = (
            db.query(ProviderService)
            .filter(
                ProviderService.provider_id == payload.provider_id,
                ProviderService.service_category_id == category.id,
            )
            .first()
        )
        if not provider_service:
            return {"status": "error", "message": "This provider does not offer the selected service"}

        new_booking = Booking(
            resident_id=payload.resident_id,
            provider_id=payload.provider_id,
            service_name=payload.service_name,
            booking_date=payload.booking_date,
            status="pending",
            notes=payload.notes,
            amount=provider_service.price or category.price or 500,
        )
        db.add(new_booking)
        db.flush()

        create_notification(
            db,
            user_id=provider.id,
            title="New Booking Request",
            message=f"{resident.full_name} requested {payload.service_name} on {payload.booking_date}.",
            notif_type="booking_created",
            booking_id=new_booking.id,
        )

        db.commit()
        db.refresh(new_booking)

        return {
            "status": "success",
            "message": "Booking created successfully",
            "booking": {
                "id": new_booking.id,
                "service_name": new_booking.service_name,
                "booking_date": new_booking.booking_date,
                "status": new_booking.status,
            },
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.get("/resident/providers")
def get_resident_providers():
    db = SessionLocal()
    try:
        providers = (
            db.query(User)
            .filter(User.role == "pro", User.verification_status == "approved")
            .order_by(User.id.desc())
            .all()
        )

        result = []
        for user in providers:
            provider_service_rows = (
                db.query(ProviderService)
                .filter(ProviderService.provider_id == user.id)
                .all()
            )

            service_items = []
            for row in provider_service_rows:
                category = db.query(ServiceCategory).filter(ServiceCategory.id == row.service_category_id).first()
                if category:
                    service_items.append({
                        "id": category.id,
                        "name": category.name,
                        "price": row.price or category.price or 500,
                    })

            result.append({
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "address": user.address,
                "lat": user.lat,
                "lon": user.lon,
                "profile_picture": user.profile_picture or None,
                "services": service_items,
            })

        return {"status": "success", "providers": result}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/pro/jobs/{provider_id}")
def get_provider_jobs(provider_id: int):
    db = SessionLocal()
    try:
        bookings = (
            db.query(Booking)
            .filter(Booking.provider_id == provider_id)
            .order_by(Booking.id.desc())
            .all()
        )

        results = []
        for booking in bookings:
            resident = db.query(User).filter(User.id == booking.resident_id).first()
            results.append({
                "id": booking.id,
                "service_name": booking.service_name,
                "booking_date": booking.booking_date,
                "created_at": str(booking.created_at) if booking.created_at else None,
                "status": booking.status,
                "notes": booking.notes,
                "amount": booking.amount,
                "resident_name": resident.full_name if resident else "Unknown",
            })

        return {"status": "success", "jobs": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/pro/requests/{provider_id}")
def get_provider_requests(provider_id: int):
    db = SessionLocal()
    try:
        bookings = (
            db.query(Booking)
            .filter(Booking.provider_id == provider_id, Booking.status == "pending")
            .order_by(Booking.id.desc())
            .all()
        )

        results = []
        for booking in bookings:
            resident = db.query(User).filter(User.id == booking.resident_id).first()
            results.append({
                "id": booking.id,
                "service_name": booking.service_name,
                "booking_date": booking.booking_date,
                "status": booking.status,
                "notes": booking.notes,
                "amount": booking.amount,
                "resident_name": resident.full_name if resident else "Unknown",
                "resident_phone": resident.phone if resident else None,
            })

        return {"status": "success", "requests": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.put("/pro/requests/{booking_id}/accept")
def accept_provider_request(booking_id: int, payload: AcceptBookingRequest = None):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return {"status": "error", "message": "Booking not found"}

        booking.status = "confirmed"
        if payload and payload.note:
            booking.acceptance_note = payload.note

        provider = db.query(User).filter(User.id == booking.provider_id).first()

        create_notification(
            db,
            user_id=booking.resident_id,
            title="Booking Accepted!",
            message=f"Your {booking.service_name} booking on {booking.booking_date} was accepted by {provider.full_name if provider else 'your provider'}.",
            notif_type="booking_accepted",
            booking_id=booking.id,
        )

        db.commit()
        return {"status": "success", "message": "Booking accepted successfully"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.put("/pro/requests/{booking_id}/decline")
def decline_provider_request(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return {"status": "error", "message": "Booking not found"}

        booking.status = "cancelled"
        provider = db.query(User).filter(User.id == booking.provider_id).first()

        create_notification(
            db,
            user_id=booking.resident_id,
            title="Booking Declined",
            message=f"Unfortunately, your {booking.service_name} booking on {booking.booking_date} was declined by {provider.full_name if provider else 'the provider'}.",
            notif_type="booking_declined",
            booking_id=booking.id,
        )

        db.commit()
        return {"status": "success", "message": "Booking declined successfully"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

# ── FIX #4: added payment_status and cancel_reason to response ────────────────
@app.get("/resident/bookings/{resident_id}")
def get_resident_bookings(resident_id: int):
    db = SessionLocal()
    try:
        bookings = (
            db.query(Booking)
            .filter(Booking.resident_id == resident_id)
            .order_by(Booking.id.desc())
            .all()
        )

        results = []
        for booking in bookings:
            provider = db.query(User).filter(User.id == booking.provider_id).first()
            results.append({
                "id": booking.id,
                "service_name": booking.service_name,
                "booking_date": booking.booking_date,
                "status": booking.status,
                "notes": booking.notes,
                "amount": booking.amount,
                "provider_id": booking.provider_id,
                "provider_name": provider.full_name if provider else "Unknown",
                "created_at": str(booking.created_at) if booking.created_at else "-",
                "acceptance_note": booking.acceptance_note or None,
                "cancel_reason": booking.cancel_reason or None,        # FIX #4
                "payment_status": booking.payment_status or "unpaid",  # FIX #4
            })

        return {"status": "success", "bookings": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

# ── FIX #3: added payment_status to admin bookings response ──────────────────
@app.get("/admin/bookings")
def get_admin_bookings(search: str = Query(default=""), status: str = Query(default="")):
    db = SessionLocal()
    try:
        bookings = db.query(Booking).order_by(Booking.id.desc()).all()

        search_value = search.strip().lower()
        status_value = status.strip().lower()

        results = []
        for booking in bookings:
            resident = db.query(User).filter(User.id == booking.resident_id).first()
            provider = db.query(User).filter(User.id == booking.provider_id).first()

            booking_data = {
                "id": booking.id,
                "service_name": booking.service_name,
                "booking_date": booking.booking_date,
                "status": booking.status,
                "notes": booking.notes,
                "amount": booking.amount,
                "resident_name": resident.full_name if resident else "Unknown",
                "provider_name": provider.full_name if provider else "Unknown",
                "is_archived": booking.is_archived or False,
                "created_at": str(booking.created_at) if booking.created_at else "-",
                "payment_status": booking.payment_status or "unpaid",  # FIX #3
            }

            matches_search = True
            matches_status = True

            if search_value:
                matches_search = (
                    search_value in str(booking_data["id"]).lower()
                    or search_value in (booking_data["service_name"] or "").lower()
                    or search_value in (booking_data["resident_name"] or "").lower()
                    or search_value in (booking_data["provider_name"] or "").lower()
                )

            if status_value and status_value != "all":
                matches_status = (booking_data["status"] or "").lower() == status_value

            if matches_search and matches_status:
                results.append(booking_data)

        return {"status": "success", "bookings": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/admin/stats")
def get_admin_stats():
    db = SessionLocal()
    try:
        total_users = db.query(User).count()
        total_residents = db.query(User).filter(User.role == "resident").count()
        total_pros = db.query(User).filter(User.role == "pro").count()
        total_admins = db.query(User).filter(User.role == "admin").count()

        pending_verifications = (
            db.query(User)
            .filter(User.role == "pro", User.verification_status == "pending")
            .count()
        )

        return {
            "status": "success",
            "stats": {
                "total_users": total_users,
                "total_residents": total_residents,
                "total_pros": total_pros,
                "total_admins": total_admins,
                "pending_verifications": pending_verifications
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/admin/providers")
def get_admin_providers(search: str = Query(default=""), status: str = Query(default="")):
    db = SessionLocal()
    try:
        query = db.query(User).filter(User.role == "pro")

        if search.strip():
            search_term = f"%{search.strip()}%"
            query = query.filter(
                (User.full_name.like(search_term)) |
                (User.email.like(search_term))
            )

        if status.strip() and status.lower() != "all":
            query = query.filter(User.verification_status == status.strip().lower())

        providers = query.order_by(User.id.desc()).all()

        return {
            "status": "success",
            "providers": [
                {
                    "id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone,
                    "address": user.address,
                    "role": user.role,
                    "verification_status": user.verification_status,
                }
                for user in providers
            ],
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/admin/pending-pros")
def get_admin_pending_pros():
    db = SessionLocal()
    try:
        providers = (
            db.query(User)
            .filter(User.role == "pro", User.verification_status == "pending")
            .order_by(User.id.desc())
            .limit(5)
            .all()
        )

        return {
            "status": "success",
            "providers": [
                {
                    "id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone,
                    "address": user.address,
                    "service": "General Service",
                    "location": user.address or "No address",
                }
                for user in providers
            ],
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.put("/admin/providers/{user_id}/approve")
def approve_provider(user_id: int):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id, User.role == "pro").first()
        if not user:
            return {"status": "error", "message": "Provider not found"}

        user.verification_status = "approved"

        create_notification(
            db,
            user_id=user.id,
            title="Account Approved!",
            message="Congratulations! Your provider account has been approved by the admin. You can now receive bookings.",
            notif_type="provider_approved",
        )

        db.commit()
        return {"status": "success", "message": "Provider approved successfully"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.put("/admin/providers/{user_id}/reject")
def reject_provider(user_id: int):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id, User.role == "pro").first()
        if not user:
            return {"status": "error", "message": "Provider not found"}

        user.verification_status = "rejected"

        create_notification(
            db,
            user_id=user.id,
            title="Account Not Approved",
            message="Your provider account application was not approved. Please contact support for more information.",
            notif_type="provider_rejected",
        )

        db.commit()
        return {"status": "success", "message": "Provider rejected successfully"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.get("/admin/recent-users")
def get_admin_recent_users():
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.id.desc()).limit(5).all()
        return {
            "status": "success",
            "users": [
                {"id": user.id, "full_name": user.full_name, "email": user.email, "role": user.role, "status": "Active"}
                for user in users
            ],
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/admin/users")
def get_admin_users(search: str = Query(default=""), role: str = Query(default="")):
    db = SessionLocal()
    try:
        query = db.query(User)

        if search.strip():
            search_term = f"%{search.strip()}%"
            query = query.filter(
                (User.full_name.like(search_term)) |
                (User.email.like(search_term))
            )

        if role.strip() and role.lower() != "all":
            query = query.filter(User.role == role.strip().lower())

        users = query.order_by(User.id.desc()).all()

        return {
            "status": "success",
            "users": [
                {
                    "id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "role": user.role,
                    "phone": user.phone,
                    "address": user.address,
                    "is_archived": user.is_archived or False,
                    "created_at": str(user.created_at) if user.created_at else "-",
                }
                for user in users
            ],
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "SerbisyoNear backend is running"}


@app.get("/test-db")
def test_db():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "success", "message": "Database connected successfully"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/seed-demo-v2")
def seed_demo_v2():
    db = SessionLocal()
    try:
        db.query(Feedback).delete()
        db.query(Booking).delete()
        db.query(ProviderService).delete()
        db.query(ProviderDocument).delete()
        db.query(ServiceCategory).delete()
        db.query(User).delete()
        db.commit()

        categories_data = [
            ("Plumbing",            "Pipe leaks, faucet repair, water system installation"),
            ("Electrical Work",     "Wiring, outlets, circuit breakers, lighting installation"),
            ("House Cleaning",      "General cleaning, deep cleaning, move-in/out cleaning"),
            ("Carpentry",           "Furniture assembly, woodwork, shelving, door & window repair"),
            ("Appliance Repair",    "Repair for washing machines, refrigerators, aircons, fans"),
            ("Aircon Services",     "Aircon cleaning, freon recharge, installation & repair"),
            ("Painting",            "Interior and exterior wall painting, surface preparation"),
            ("Roofing",             "Roof repair, waterproofing, gutter installation"),
            ("Welding & Fabrication","Metal works, gates, grills, railings, structural welding"),
            ("Masonry & Tiling",    "Tile laying, concrete repair, plastering, grouting"),
            ("Gardening & Landscaping","Lawn mowing, pruning, landscaping, garden maintenance"),
            ("Pest Control",        "Termite treatment, rodent control, cockroach fumigation"),
            ("Hauling & Moving",    "Furniture moving, balikbayan box delivery, truck rental"),
            ("Deep Well & Pump Services","Deep well drilling, water pump installation & repair"),
            ("CCTV & Intercom Installation","Security camera setup, intercom, door access systems"),
            ("Auto Repair & Detailing","Basic car repair, oil change, car wash, detailing"),
            ("Laundry Services",    "Wash, dry & fold, pick-up and delivery laundry"),
            ("General Repair & Handyman","Miscellaneous home repair, odd jobs, maintenance work"),
        ]
        cats = []
        for name, desc in categories_data:
            c = ServiceCategory(name=name, description=desc, price=500)
            db.add(c)
            cats.append(c)
        db.flush()

        def cat(name):
            return next(c for c in cats if c.name == name)

        admin = User(
            first_name="Admin", middle_name=None, last_name="User", full_name="Admin User",
            email="admin@serbisyonear.com", password="admin123",
            role="admin", phone=None, address=None,
            region="NCR", province="Metro Manila", city="Caloocan", barangay=None, street=None,
            verification_status="approved", is_email_verified=True,
        )
        resident1 = User(
            first_name="Steve", middle_name="Encarnation", last_name="Gutierrez",
            full_name="Steve E. Gutierrez", email="gutssteve@gmail.com", password="steveguts123",
            role="resident", phone="09171234567",
            address="123 Rizal Ave, Barangay 10, Caloocan City",
            region="NCR", province="Metro Manila", city="Caloocan",
            barangay="Barangay 10", street="123 Rizal Ave",
            verification_status="approved", is_email_verified=True, lat=14.6507, lon=121.0491,
        )
        resident2 = User(
            first_name="Jose", middle_name="Dela", last_name="Cruz", full_name="Jose Dela Cruz",
            email="jose@example.com", password="Jose@1234",
            role="resident", phone="09289876543",
            address="45 Mabini St, Barangay 5, Quezon City",
            region="NCR", province="Metro Manila", city="Quezon City",
            barangay="Barangay 5", street="45 Mabini St",
            verification_status="approved", is_email_verified=True, lat=14.6760, lon=121.0437,
        )
        pro1 = User(
            first_name="John", middle_name="R", last_name="Lanoba", full_name="Jr Lanoba",
            email="lanobajr@gmail.com", password="jrlanoba123",
            role="pro", phone="09991112233",
            address="78 Bonifacio St, Barangay 22, Caloocan City",
            region="NCR", province="Metro Manila", city="Caloocan",
            barangay="Barangay 22", street="78 Bonifacio St",
            verification_status="approved", is_email_verified=True, lat=14.6580, lon=121.0450,
        )
        pro2 = User(
            first_name="Ana", middle_name="Lim", last_name="Villanueva", full_name="Ana Lim Villanueva",
            email="ana@example.com", password="Ana@12345",
            role="pro", phone="09554445566",
            address="12 Aguinaldo Ave, Barangay 7, Malabon",
            region="NCR", province="Metro Manila", city="Malabon",
            barangay="Barangay 7", street="12 Aguinaldo Ave",
            verification_status="approved", is_email_verified=True, lat=14.6630, lon=120.9570,
        )
        pro3 = User(
            first_name="Ramon", middle_name="Buenaventura", last_name="Flores",
            full_name="Ramon Buenaventura Flores", email="ramon@example.com", password="Ramon@1234",
            role="pro", phone="09221234321",
            address="99 Quezon Blvd, Barangay 11, Quezon City",
            region="NCR", province="Metro Manila", city="Quezon City",
            barangay="Barangay 11", street="99 Quezon Blvd",
            verification_status="pending", is_email_verified=True, lat=14.6520, lon=121.0330,
        )

        for u in [admin, resident1, resident2, pro1, pro2, pro3]:
            db.add(u)
        db.flush()

        for c_name, price in [("Plumbing", 600), ("Electrical Work", 700), ("General Repair & Handyman", 500)]:
            db.add(ProviderService(provider_id=pro1.id, service_category_id=cat(c_name).id, price=price))
        for c_name, price in [("House Cleaning", 500), ("Laundry Services", 400), ("Gardening & Landscaping", 550)]:
            db.add(ProviderService(provider_id=pro2.id, service_category_id=cat(c_name).id, price=price))
        for c_name, price in [("Aircon Services", 800), ("Appliance Repair", 650), ("CCTV & Intercom Installation", 900)]:
            db.add(ProviderService(provider_id=pro3.id, service_category_id=cat(c_name).id, price=price))
        db.flush()

        # Seed bookings — completed ones now have payment_status="paid" for demo
        bookings = [
            Booking(
                resident_id=resident1.id, provider_id=pro1.id,
                service_name="Plumbing", booking_date="2026-04-10",
                status="completed", notes="Fix kitchen sink pipe leak", amount=600,
                payment_status="paid",   # ← so earnings show correctly in demo
            ),
            Booking(
                resident_id=resident1.id, provider_id=pro2.id,
                service_name="House Cleaning", booking_date="2026-04-08",
                status="completed", notes="Full house deep clean before Fiesta", amount=500,
                payment_status="paid",   # ← so earnings show correctly in demo
            ),
            Booking(
                resident_id=resident2.id, provider_id=pro1.id,
                service_name="Electrical Work", booking_date="2026-04-12",
                status="confirmed", notes="Install new circuit breaker", amount=700,
            ),
            Booking(
                resident_id=resident2.id, provider_id=pro2.id,
                service_name="Laundry Services", booking_date="2026-04-11",
                status="pending", notes="Weekly laundry pickup", amount=400,
            ),
            Booking(
                resident_id=resident1.id, provider_id=pro1.id,
                service_name="General Repair & Handyman", booking_date="2026-04-15",
                status="pending", notes="Fix broken cabinet door and loose tiles", amount=500,
            ),
        ]
        for b in bookings:
            db.add(b)
        db.flush()

        fb1 = Feedback(
            booking_id=bookings[0].id, resident_id=resident1.id, provider_id=pro1.id,
            rating=5, comment="Pedro was very professional and fixed the leak quickly!", is_complaint=False,
        )
        fb2 = Feedback(
            booking_id=bookings[1].id, resident_id=resident1.id, provider_id=pro2.id,
            rating=4, comment="Ana did a great job cleaning the house. Very thorough!", is_complaint=False,
        )
        db.add(fb1)
        db.add(fb2)

        db.commit()
        return {
            "status": "success",
            "message": "Database reseeded successfully (v2)",
            "seeded": {
                "service_categories": len(categories_data),
                "users": 6,
                "bookings": len(bookings),
                "feedbacks": 2,
            },
        }

    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.post("/signup")
def signup(payload: SignupRequest):
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == payload.email).first()
        if existing_user:
            return {"status": "error", "message": "Email already registered"}
        
        password_error = validate_password(payload.password)
        if password_error:
            return {"status": "error", "message": password_error}

        verification_status = "pending" if payload.role == "pro" else "approved"
        email_verification_token = generate_token()

        new_user = User(
            full_name=payload.full_name, first_name=payload.first_name,
            middle_name=payload.middle_name, last_name=payload.last_name,
            email=payload.email, password=payload.password, role=payload.role,
            phone=payload.phone, address=payload.address, region=payload.region,
            province=payload.province, city=payload.city, barangay=payload.barangay,
            street=payload.street, verification_status=verification_status,
            is_email_verified=False, email_verification_token=email_verification_token,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        verify_link = f"{frontend_url}/verify-email?token={email_verification_token}"

        email_body = f"""
        <html>
        <body style="margin:0;padding:40px 0;background-color:#f8fafc;font-family:Arial,sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <h2 style="margin:0 0 8px 0;color:#0f766e;font-size:22px;">Verify your SerbisyoNear account</h2>
            <p style="margin:0 0 24px 0;color:#64748b;font-size:15px;line-height:1.6;">
            Welcome to SerbisyoNear! Click the button below to verify your email address and activate your account.
            </p>
            <a href="{verify_link}"
            style="display:inline-block;background-color:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:10px;">
            Verify My Email
            </a>
            <p style="margin:32px 0 0 0;color:#94a3b8;font-size:13px;">
            If you did not create this account, you can safely ignore this email.
            </p>
        </div>
        </body>
        </html>
        """

        send_email(to_email=new_user.email, subject="Verify your SerbisyoNear account", body=email_body.strip())

        return {
            "status": "success",
            "message": "User registered successfully. Please check your email to verify your account.",
            "user": {"id": new_user.id, "full_name": new_user.full_name, "email": new_user.email, "role": new_user.role},
        }

    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.post("/login")
def login(payload: LoginRequest):
    db = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter(User.email == payload.email, User.password == payload.password)
            .first()
        )

        if not user:
            return {"status": "error", "message": "Invalid email or password"}

        if user.role != "admin" and not user.is_email_verified:
            return {"status": "error", "message": "Please verify your email before logging in."}

        if user.role == "pro" and user.verification_status != "approved":
            return {"status": "error", "message": "Your provider account is still pending admin approval."}

        return {
            "status": "success",
            "message": "Login successful",
            "user": {"id": user.id, "full_name": user.full_name, "email": user.email, "role": user.role},
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == payload.email).first()

        if not user:
            return {"status": "success", "message": "If that email exists, a reset link has been sent."}

        reset_token = generate_token()
        reset_expiry = datetime.utcnow() + timedelta(minutes=30)

        user.reset_password_token = reset_token
        user.reset_password_expires = reset_expiry
        db.commit()

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        reset_link = f"{frontend_url}/reset-password?token={reset_token}"

        email_body = f"""
        <html>
        <body style="margin:0;padding:40px 0;background-color:#f8fafc;font-family:Arial,sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <h2 style="margin:0 0 8px 0;color:#0f766e;font-size:22px;">Reset your password</h2>
            <p style="margin:0 0 24px 0;color:#64748b;font-size:15px;line-height:1.6;">
            We received a request to reset your SerbisyoNear password. Click the button below to proceed.
            </p>
            <a href="{reset_link}"
            style="display:inline-block;background-color:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:10px;">
            Reset My Password
            </a>
            <p style="margin:32px 0 0 0;color:#94a3b8;font-size:13px;">This link will expire in <strong>30 minutes</strong>.</p>
        </div>
        </body>
        </html>
        """

        send_email(to_email=user.email, subject="Reset your SerbisyoNear password", body=email_body.strip())

        return {"status": "success", "message": "If that email exists, a reset link has been sent."}

    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.reset_password_token == payload.token).first()
        if not user:
            return {"status": "error", "message": "Invalid or expired reset token."}
        if not user.reset_password_expires or user.reset_password_expires < datetime.utcnow():
            return {"status": "error", "message": "Reset token has expired."}

        password_error = validate_password(payload.new_password)
        if password_error:
            return {"status": "error", "message": password_error}

        user.password = payload.new_password
        user.reset_password_token = None
        user.reset_password_expires = None
        db.commit()

        return {"status": "success", "message": "Password reset successfully. You can now log in."}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@app.get("/verify-email")
def verify_email(token: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email_verification_token == token).first()
        if not user:
            return {"status": "error", "message": "Invalid or expired verification token."}
        user.is_email_verified = True
        user.email_verification_token = None
        db.commit()
        return {"status": "success", "message": "Email verified successfully. You can now log in."}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
