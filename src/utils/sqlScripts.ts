/**
 * MT- DEVELOPER ASSIGNMENT – INNER EYE CONSULTANCY SERVICES LLP
 * Complete Production Database Schema, DDL Scripts, Triggers & Architecture Documentation
 */

export const SQL_SCHEMA_SCRIPT = `-- =========================================================================
-- INNER EYE CONSULTANCY SERVICES LLP - EMPLOYEE ATTENDANCE MANAGEMENT SYSTEM
-- Relational Database DDL Scripts (PostgreSQL / MySQL compatible)
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
CREATE TYPE user_role AS ENUM ('employee', 'hr_admin');
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'half_day', 'absent', 'on_leave', 'holiday', 'overtime');
CREATE TYPE leave_type AS ENUM ('Casual Leave', 'Sick Leave', 'Privilege Leave', 'Loss of Pay');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE work_location AS ENUM ('In-Office', 'Remote (WFH)', 'Client Site');

-- 3. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'IEC-101'
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    shift_start TIME NOT NULL DEFAULT '09:00:00',
    shift_end TIME NOT NULL DEFAULT '18:00:00',
    joining_date DATE NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. LEAVE BALANCES TABLE
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(32) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INT NOT NULL,
    casual_leave_quota NUMERIC(4, 1) NOT NULL DEFAULT 12.0,
    casual_leave_used NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    sick_leave_quota NUMERIC(4, 1) NOT NULL DEFAULT 8.0,
    sick_leave_used NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    privilege_leave_quota NUMERIC(4, 1) NOT NULL DEFAULT 15.0,
    privilege_leave_used NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    loss_of_pay_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, year)
);

-- 5. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(32) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    gross_hours NUMERIC(5, 2) DEFAULT 0.00,
    break_hours NUMERIC(5, 2) DEFAULT 0.00,
    net_work_hours NUMERIC(5, 2) DEFAULT 0.00,
    overtime_hours NUMERIC(5, 2) DEFAULT 0.00,
    deficit_hours NUMERIC(5, 2) DEFAULT 0.00,
    status attendance_status NOT NULL DEFAULT 'present',
    work_location work_location NOT NULL DEFAULT 'In-Office',
    is_late BOOLEAN DEFAULT FALSE,
    late_minutes INT DEFAULT 0,
    check_in_notes TEXT,
    check_out_notes TEXT,
    is_regularized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- 6. BREAK LOGS TABLE
CREATE TABLE IF NOT EXISTS break_logs (
    id VARCHAR(64) PRIMARY KEY,
    attendance_id VARCHAR(64) NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME,
    duration_minutes INT DEFAULT 0,
    reason VARCHAR(100) DEFAULT 'Lunch/Tea Break',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. LEAVE APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS leave_applications (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(32) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count NUMERIC(4, 1) NOT NULL,
    reason TEXT NOT NULL,
    status request_status NOT NULL DEFAULT 'pending',
    applied_on DATE NOT NULL DEFAULT CURRENT_DATE,
    reviewed_by VARCHAR(32) REFERENCES employees(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. AUTOMATED LEAVE DEDUCTIONS AUDIT LOG
CREATE TABLE IF NOT EXISTS leave_deductions (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(32) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_id VARCHAR(64) REFERENCES attendance_records(id),
    date DATE NOT NULL,
    reason VARCHAR(50) NOT NULL, -- '3_LATE_ARRIVALS', 'HALF_DAY_SHORTFALL', 'UNEXCUSED_ABSENCE'
    deducted_days NUMERIC(4, 1) NOT NULL,
    leave_type_affected leave_type NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. ATTENDANCE REGULARIZATION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS attendance_regularizations (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(32) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_id VARCHAR(64) REFERENCES attendance_records(id),
    date DATE NOT NULL,
    requested_check_in TIME NOT NULL,
    requested_check_out TIME NOT NULL,
    reason TEXT NOT NULL,
    status request_status NOT NULL DEFAULT 'pending',
    applied_on DATE NOT NULL DEFAULT CURRENT_DATE,
    reviewed_by VARCHAR(32) REFERENCES employees(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. INDEXES FOR RAPID REPORTING & TIME-SERIES QUERIES
CREATE INDEX idx_attendance_emp_date ON attendance_records(employee_id, date);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_leaves_emp_status ON leave_applications(employee_id, status);
CREATE INDEX idx_deductions_emp_date ON leave_deductions(employee_id, date);

-- 11. TRIGGER FUNCTION: AUTOMATIC WORKING HOURS & LATE CHECK CALCULATION
CREATE OR REPLACE FUNCTION trg_calculate_attendance_hours()
RETURNS TRIGGER AS $$
DECLARE
    v_diff_minutes INT;
    v_net_minutes INT;
    v_shift_start_min INT := 9 * 60; -- 09:00 AM
    v_checkin_min INT;
    v_grace_threshold INT := 9 * 60 + 15; -- 09:15 AM
BEGIN
    IF NEW.check_in_time IS NOT NULL THEN
        v_checkin_min := EXTRACT(HOUR FROM NEW.check_in_time) * 60 + EXTRACT(MINUTE FROM NEW.check_in_time);
        IF v_checkin_min > v_grace_threshold THEN
            NEW.is_late := TRUE;
            NEW.late_minutes := v_checkin_min - v_shift_start_min;
            NEW.status := 'late';
        ELSE
            NEW.is_late := FALSE;
            NEW.late_minutes := 0;
            IF NEW.status = 'late' THEN
                NEW.status := 'present';
            END IF;
        END IF;
    END IF;

    IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
        v_diff_minutes := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
        NEW.gross_hours := ROUND((v_diff_minutes / 60.0)::numeric, 2);
        NEW.net_work_hours := GREATEST(0, ROUND(((v_diff_minutes - (NEW.break_hours * 60)) / 60.0)::numeric, 2));

        IF NEW.net_work_hours >= 8.0 THEN
            NEW.overtime_hours := ROUND((NEW.net_work_hours - 8.0)::numeric, 2);
            NEW.deficit_hours := 0;
            IF NEW.overtime_hours >= 0.5 THEN
                NEW.status := 'overtime';
            END IF;
        ELSIF NEW.net_work_hours > 0 AND NEW.net_work_hours < 4.0 THEN
            NEW.status := 'half_day';
            NEW.deficit_hours := ROUND((8.0 - NEW.net_work_hours)::numeric, 2);
        ELSE
            NEW.deficit_hours := ROUND((8.0 - NEW.net_work_hours)::numeric, 2);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_attendance_insert_update
BEFORE INSERT OR UPDATE ON attendance_records
FOR EACH ROW
EXECUTE FUNCTION trg_calculate_attendance_hours();
`;

export const ARCHITECTURE_DOCUMENTATION = `# INNER EYE CONSULTANCY SERVICES LLP
## Employee Attendance Management System - Technical Architecture & Solution Design

### 1. Architectural Overview
The solution follows a multi-tier modular architecture adhering to Clean Architecture principles:
- **Presentation Layer**: High-performance React 19 + TypeScript + Tailwind CSS with responsive layout for Desktop & Mobile.
- **Business Logic Layer**: Centralized rule calculation engines for:
  1. Real-time Punctuality & Grace Period Detection (09:00 AM Shift, 15m Grace threshold).
  2. Net Productive Hours vs Break deductions.
  3. Overtime calculation (> 8.0 hours).
  4. Automated Leave Deduction Engine (3 Late check-ins = 0.5 Day deduction; Half-Day < 4 hrs = 0.5 Day deduction; Unexcused Absence = 1.0 Day LOP).
- **Data Persistence Layer**: Fully normalized relational schema with foreign key constraints, time-series indexing, and audit logging.

### 2. Core Modules
1. **Authentication & Role-Based Access Control (RBAC)**:
   - \`hr_admin\`: Full enterprise visibility, company-wide KPI dashboard, department breakdown, leave approval hub, attendance regularizations, CSV report exports, leave deduction audits.
   - \`employee\`: Self-service portal, interactive punch card, live break timer, personal calendar tracking, leave quota visualization, and application requests.

2. **Attendance Punch & Clock Engine**:
   - Live real-time clock with sub-second precision.
   - Work mode classification (In-Office, Remote WFH, Client Site).
   - Break Tracker: Pauses work duration, records start/end timestamps and reason.

3. **Leave Deduction Matrix**:
   | Trigger Event | Condition | Automated Penalty / Deduction |
   | :--- | :--- | :--- |
   | **3 Late Arrivals** | Cumulative 3 late check-ins (>09:15 AM) in a month | **0.5 Day Casual Leave** (or Loss of Pay if exhausted) |
   | **Half Day** | Net working hours between 0.1h and 3.99h | **0.5 Day Leave Deduction** |
   | **Unexcused Absence** | No check-in record and no pre-approved leave | **1.0 Day Loss of Pay (LOP)** |
   | **Approved Leave** | HR approves Leave Application | Deducted from respective quota (CL/SL/PL) |

4. **Reporting & Payroll Exports**:
   - CSV generator formatted for payroll and attendance register compliance.
`;

export const SETUP_INSTRUCTIONS = `# Setup & Run Instructions

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm or yarn
- Modern web browser (Chrome, Edge, Firefox, Safari)

### Quick Start
\`\`\`bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open application
Visit http://localhost:3000
\`\`\`

### Testing Credentials (Pre-seeded Demo Accounts)
- **HR Manager**: \`hr@innereye.com\` / Password: \`password123\` (Full company-wide oversight)
- **Senior Developer**: \`rahul.sharma@innereye.com\` / Password: \`password123\` (Late check-in & overtime testing)
- **UI/UX Designer**: \`priya.verma@innereye.com\` / Password: \`password123\` (Remote WFH punch testing)
- **Systems Architect**: \`arjun.nair@innereye.com\` / Password: \`password123\` (Half-day & regularization testing)
`;
