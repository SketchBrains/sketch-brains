# Backend Services Documentation

## Overview

This document describes the comprehensive backend architecture for the crash course platform. The system is built on Supabase with PostgreSQL database, Row Level Security (RLS), and Edge Functions for serverless backend logic.

## Database Architecture

### Core Tables

#### **payment_transactions**
Tracks all payment transactions with complete Razorpay integration.

**Key Fields:**
- `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` - Razorpay identifiers
- `status` - Transaction status: initiated, success, failed, refunded
- `amount`, `currency` - Payment amount details
- `metadata` - JSONB field for flexible data storage

**Security:**
- Users can view their own transactions
- Admins can view all transactions
- RLS policies enforce data isolation

#### **session_attendance**
Tracks student attendance for live 2-hour sessions.

**Key Fields:**
- `check_in_time`, `check_out_time` - Session participation times
- `duration_minutes` - Calculated attendance duration
- `ip_address`, `user_agent` - Device verification data

**Use Cases:**
- Monitoring live session participation
- Generating attendance reports
- Certificate eligibility verification

#### **certificates**
Manages course completion certificates with verification.

**Key Fields:**
- `certificate_number` - Unique human-readable identifier
- `verification_token` - Public verification code
- `pdf_url` - Cloud storage link for certificate PDF
- `revoked_at`, `revoke_reason` - Certificate revocation tracking

**Features:**
- Public verification without authentication
- Blockchain hash for tamper-proof records
- Automatic generation on course completion

#### **notifications_queue**
Queue system for all notifications (email, SMS, in-app).

**Key Fields:**
- `type` - email, sms, in_app
- `channel` - transactional, marketing, alert
- `status` - pending, sent, failed, cancelled
- `priority` - low, medium, high, urgent
- `retry_count` - Automatic retry for failed deliveries

**Features:**
- Scheduled delivery with `scheduled_for` field
- Retry logic with exponential backoff
- User preference checking before sending

#### **in_app_notifications**
Real-time notifications displayed in the application.

**Key Fields:**
- `title`, `message` - Notification content
- `type` - info, success, warning, error
- `action_url` - Optional click-through link
- `read_at` - Read status tracking

#### **analytics_events**
Behavioral analytics and user engagement tracking.

**Key Fields:**
- `event_name` - Action identifier (page_view, button_click, etc.)
- `event_category` - engagement, conversion, navigation, error
- `event_data` - JSONB flexible event data
- `session_id` - Groups events by user session

**Use Cases:**
- Conversion funnel analysis
- User behavior insights
- A/B testing data collection

#### **webhook_logs**
Complete audit trail of all incoming webhooks.

**Key Fields:**
- `source` - External service (razorpay, sendgrid, etc.)
- `event_type` - Webhook event name
- `payload` - Complete webhook payload (JSONB)
- `status` - received, processed, failed

**Features:**
- Debugging failed webhooks
- Payment reconciliation
- Compliance and audit requirements

#### **admin_audit_logs**
Tracks all administrative actions for security and compliance.

**Key Fields:**
- `admin_id` - Who performed the action
- `action` - What was done
- `resource_type`, `resource_id` - What was affected
- `old_values`, `new_values` - Change tracking

#### **session_recordings**
Stores metadata for recorded 2-hour live sessions.

**Key Fields:**
- `video_url` - Cloud storage link
- `duration_minutes`, `file_size_mb` - Video metadata
- `processing_status` - uploading, processing, ready, failed
- `thumbnail_url` - Preview image

**Security:**
- Only registered students with completed payments can access
- Admin-only upload and management

#### **event_waitlist**
Manages waitlist when events reach maximum capacity.

**Key Fields:**
- `position` - Queue position number
- `notified_at` - When user was notified of spot availability
- `expires_at` - Notification expiration time
- `status` - waiting, notified, registered, expired

**Features:**
- Automatic position management
- Spot notification system
- Time-limited spot claims

---

## Edge Functions (Serverless Backend)

### 1. **razorpay-webhook**
**Path:** `/functions/v1/razorpay-webhook`

**Purpose:** Handles Razorpay payment webhooks for automatic payment verification.

**Events Handled:**
- `payment.authorized` - Payment authorized by bank
- `payment.captured` - Payment successfully captured
- `payment.failed` - Payment failed

**Actions:**
- Logs all webhooks to `webhook_logs` table
- Updates `payment_transactions` with payment status
- Updates `registrations` with payment completion
- Sends in-app and email notifications to users
- Handles payment failures with error tracking

**Security:**
- Validates Razorpay signature (X-Razorpay-Signature header)
- Uses service role key for database writes
- CORS configured for Razorpay webhook servers

**Example Request:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/razorpay-webhook \
  -H "X-Razorpay-Signature: signature_here" \
  -H "Content-Type: application/json" \
  -d '{"event": "payment.captured", "payload": {...}}'
```

---

### 2. **process-referrals**
**Path:** `/functions/v1/process-referrals`

**Purpose:** Automated referral tracking and reward calculation.

**Actions:**
- Checks pending referrals for payment completion
- Updates referral status from pending → completed
- Calculates referral counts per user per event
- Grants free course access when 2 referrals are completed (technical events only)
- Updates referral status to "rewarded"
- Sends congratulatory notifications

**Scheduling:** Should be triggered every 15 minutes via cron job or manual trigger.

**Example Request:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/process-referrals \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"
```

**Response:**
```json
{
  "success": true,
  "processedReferrals": 5,
  "rewardsGranted": 2,
  "details": {
    "referrals": ["uuid1", "uuid2", ...],
    "rewards": [...]
  }
}
```

---

### 3. **session-management**
**Path:** `/functions/v1/session-management`

**Purpose:** Manages live session attendance tracking.

**Actions:**

**Check-In (POST ?action=checkin)**
- Verifies user registration and payment status
- Records check-in time with IP and user agent
- Creates `session_attendance` record
- Tracks analytics event

**Check-Out (POST ?action=checkout)**
- Updates check-out time
- Calculates session duration
- Updates attendance record
- Tracks analytics event

**History (GET ?action=history)**
- Returns user's complete attendance history
- Includes event details and duration

**Example Requests:**
```bash
# Check-in
curl -X POST 'https://your-project.supabase.co/functions/v1/session-management?action=checkin' \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"registrationId": "uuid", "eventId": "uuid"}'

# Check-out
curl -X POST 'https://your-project.supabase.co/functions/v1/session-management?action=checkout' \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"attendanceId": "uuid"}'

# Get history
curl -X GET 'https://your-project.supabase.co/functions/v1/session-management?action=history' \
  -H "Authorization: Bearer USER_TOKEN"
```

---

### 4. **send-notifications**
**Path:** `/functions/v1/send-notifications`

**Purpose:** Processes notification queue and sends emails, SMS, in-app notifications.

**Actions:**
- Fetches pending notifications (max 100 per run)
- Prioritizes by urgency and schedule time
- Checks user notification preferences
- Sends via appropriate channel (email/SMS/in-app)
- Implements retry logic (max 3 attempts)
- Updates notification status

**Scheduling:** Should run every 5-10 minutes via cron job.

**Integration Points:**
- Email: SendGrid, AWS SES, or similar service
- SMS: Twilio, AWS SNS, or similar service
- In-App: Supabase Realtime for instant delivery

**Example Request:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"
```

**Response:**
```json
{
  "success": true,
  "processed": {
    "email": 15,
    "sms": 3,
    "inApp": 22,
    "failed": 1
  },
  "total": 41
}
```

---

### 5. **generate-certificate**
**Path:** `/functions/v1/generate-certificate`

**Purpose:** Generates and verifies course completion certificates.

**Actions:**

**Generate Certificate (POST)**
- Verifies event completion and payment status
- Generates unique certificate number
- Creates verification token for public verification
- Inserts certificate record
- Sends email and in-app notification

**Get User Certificates (GET)**
- Returns all certificates for authenticated user
- Includes event details

**Verify Certificate (GET ?token=VERIFICATION_TOKEN)**
- Public endpoint (no auth required)
- Validates certificate authenticity
- Returns certificate details and validity status

**Example Requests:**
```bash
# Generate
curl -X POST https://your-project.supabase.co/functions/v1/generate-certificate \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"registrationId": "uuid"}'

# Get user certificates
curl -X GET https://your-project.supabase.co/functions/v1/generate-certificate \
  -H "Authorization: Bearer USER_TOKEN"

# Verify certificate (public)
curl -X GET 'https://your-project.supabase.co/functions/v1/generate-certificate?token=abc123'
```

---

### 6. **analytics-report**
**Path:** `/functions/v1/analytics-report`

**Purpose:** Generates comprehensive analytics reports for admins.

**Report Types:**

**Overview (?type=overview)**
- Total users, events, registrations
- Completed payments count
- Total revenue

**Revenue (?type=revenue)**
- Revenue over time with date filtering
- Transaction count
- Revenue breakdown by date

**Events (?type=events)**
- Event performance metrics
- Registration counts per event
- Revenue per event
- Average ratings and feedback

**Referrals (?type=referrals)**
- Total referral count
- Top referrers leaderboard
- Referral conversion stats

**Example Requests:**
```bash
# Overview
curl -X GET 'https://your-project.supabase.co/functions/v1/analytics-report?type=overview' \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Revenue with date range
curl -X GET 'https://your-project.supabase.co/functions/v1/analytics-report?type=revenue&startDate=2025-01-01&endDate=2025-01-31' \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Events report
curl -X GET 'https://your-project.supabase.co/functions/v1/analytics-report?type=events' \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Referrals report
curl -X GET 'https://your-project.supabase.co/functions/v1/analytics-report?type=referrals' \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Admins have full access to all data
- Public endpoints are explicitly allowed (certificate verification)
- No data leakage between users

### Authentication

- Uses Supabase Auth with JWT tokens
- Email/password authentication
- Session management with automatic expiration
- Refresh token rotation

### Payment Security

- Webhook signature verification
- Payment reconciliation with Razorpay
- Transaction audit logging
- Fraud detection via IP and device tracking

---

## Database Migrations

All migrations are stored in `supabase/migrations/` directory:

1. `001_add_payment_transactions.sql` - Payment tracking
2. `002_add_attendance_tracking.sql` - Session attendance
3. `003_add_certificates.sql` - Certificate management
4. `004_add_notifications.sql` - Notification system
5. `005_add_analytics.sql` - Analytics and logging
6. `006_add_session_recordings.sql` - Recordings and waitlist

**To apply migrations:**
Apply these migrations through Supabase dashboard or CLI when database is accessible.

---

## Recommended Cron Jobs

Set up these scheduled tasks for automation:

1. **process-referrals** - Every 15 minutes
2. **send-notifications** - Every 5 minutes
3. **update-event-status** - Daily at midnight (checks dates and updates event status)
4. **payment-reconciliation** - Daily at 2 AM (matches Razorpay settlements)
5. **generate-certificates** - Hourly (auto-generates for completed events)

---

## Integration Guidelines

### Razorpay Setup

1. Configure webhook URL in Razorpay dashboard: `https://your-project.supabase.co/functions/v1/razorpay-webhook`
2. Enable events: `payment.authorized`, `payment.captured`, `payment.failed`
3. Save webhook secret for signature verification

### Email Service (SendGrid/AWS SES)

Configure in `send-notifications` function:
- API key in environment variables
- From email address
- Email templates

### SMS Service (Twilio)

Configure in `send-notifications` function:
- Account SID and Auth Token
- From phone number
- Message templates

---

## Monitoring and Maintenance

### Key Metrics to Monitor

- Payment success rate (target: >95%)
- Webhook processing time (target: <2 seconds)
- Notification delivery rate (target: >98%)
- Certificate generation success (target: 100%)
- Database query performance

### Logs Location

- Edge Function logs: Supabase Dashboard → Edge Functions
- Database logs: Supabase Dashboard → Logs
- Webhook logs: `webhook_logs` table
- Admin actions: `admin_audit_logs` table

---

## Performance Optimization

- All foreign keys have indexes
- Composite indexes on frequently queried columns
- JSONB indexes on metadata fields where needed
- Connection pooling enabled
- Query result caching for analytics

---

## Backup and Recovery

- Automated daily backups by Supabase
- Point-in-time recovery available
- Critical tables: `payment_transactions`, `registrations`, `certificates`
- Regular backup testing recommended

---

## Future Enhancements

Potential improvements to consider:
- Push notifications via FCM/APNs
- Advanced analytics with machine learning
- Multi-currency support
- Installment payment plans
- Video streaming integration (WebRTC/Agora)
- Mobile app with deep linking
- Social media integration
- Automated marketing campaigns

---

## Support and Troubleshooting

### Common Issues

**Webhook not processing:**
- Check Razorpay webhook configuration
- Verify CORS headers
- Check webhook_logs table for errors

**Notifications not sending:**
- Verify email/SMS service credentials
- Check notification_preferences table
- Review notifications_queue for failed items

**Certificate generation failing:**
- Verify event status is "completed"
- Check payment status is "completed" or "free"
- Review generate-certificate function logs

---

## API Reference Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/functions/v1/razorpay-webhook` | POST | Webhook | Payment webhooks |
| `/functions/v1/process-referrals` | POST | Service | Process referrals |
| `/functions/v1/session-management` | POST/GET | User | Attendance tracking |
| `/functions/v1/send-notifications` | POST | Service | Send notifications |
| `/functions/v1/generate-certificate` | POST/GET | User/Public | Certificates |
| `/functions/v1/analytics-report` | GET | Admin | Analytics reports |

---

## Conclusion

This backend architecture provides a production-ready, scalable foundation for your crash course platform. The system handles payments, notifications, certificates, analytics, and referrals with full automation and security.

For questions or issues, refer to Supabase documentation or contact your development team.
