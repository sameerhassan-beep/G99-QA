-- Enable Row Level Security (optional but recommended, currently open for simplicity in migration)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT[],
    status TEXT DEFAULT 'Active'
);

-- Create Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    head TEXT,
    head_id TEXT,
    employee_count INTEGER DEFAULT 0,
    budget NUMERIC,
    budget_spent NUMERIC,
    status TEXT DEFAULT 'Active',
    location TEXT,
    description TEXT,
    created_at DATE,
    last_updated TIMESTAMP WITH TIME ZONE,
    projects INTEGER,
    team_leads TEXT[]
);

-- Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- Using TEXT to match 'USR001' format, or UUID if integrating with Auth
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT REFERENCES public.roles(name), -- Linking by name as per current logic, or remove FK if loose
    status TEXT DEFAULT 'Active',
    department TEXT REFERENCES public.departments(name), -- Linking by name
    join_date DATE,
    last_active TIMESTAMP WITH TIME ZONE,
    phone TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Roles Data
INSERT INTO public.roles (id, name, description, permissions, status) VALUES
(1, 'Admin', 'Full system access', ARRAY['users.manage', 'roles.manage', 'reports.view'], 'Active'),
(2, 'Manager', 'Team management access', ARRAY['users.view', 'reports.view', 'reports.create'], 'Active'),
(3, 'Employee', 'Basic access', ARRAY['reports.view'], 'Active')
ON CONFLICT (id) DO NOTHING;

-- Insert Departments Data
INSERT INTO public.departments (id, name, head, head_id, employee_count, budget, budget_spent, status, location, description, created_at, last_updated, projects, team_leads) VALUES
('DEP001', 'IT', 'Rajesh Kumar', 'USR001', 15, 7500000, 4250000, 'Active', 'Bangalore, India', 'Information Technology and Systems', '2023-01-15', '2024-01-10T09:30:00', 8, ARRAY['Amit Patel', 'Priya Sharma']),
('DEP002', 'HR', 'Deepika Singh', 'USR004', 8, 4000000, 2250000, 'Active', 'Mumbai, India', 'Human Resources Management', '2023-02-20', '2024-01-09T14:20:00', 4, ARRAY['Neha Gupta']),
('DEP003', 'Sales', 'Vikram Malhotra', 'USR006', 20, 10000000, 8000000, 'Active', 'Delhi, India', 'Sales and Business Development', '2023-03-10', '2024-01-08T11:45:00', 12, ARRAY['Arjun Reddy', 'Ananya Desai']),
('DEP004', 'Marketing', 'Meera Verma', 'USR008', 12, 6000000, 4500000, 'Active', 'Hyderabad, India', 'Marketing and Brand Management', '2023-04-05', '2024-01-07T16:30:00', 6, ARRAY['Karthik Iyer']),
('DEP005', 'Finance', 'Arun Joshi', 'USR010', 10, 9000000, 6000000, 'Active', 'Chennai, India', 'Financial Planning and Analysis', '2023-05-15', '2024-01-06T13:15:00', 5, ARRAY['Ravi Shankar', 'Pooja Mehta']),
('DEP006', 'Operations', 'Sanjay Kapoor', 'USR012', 25, 12500000, 9000000, 'Active', 'Pune, India', 'Operations and Logistics', '2023-06-20', '2024-01-05T10:45:00', 10, ARRAY['Rahul Khanna', 'Sneha Patel'])
ON CONFLICT (id) DO NOTHING;

-- Insert Users Data
INSERT INTO public.users (id, name, email, role, status, department, join_date, last_active, phone, location) VALUES
('USR001', 'Rajesh Kumar', 'rajesh@vrv.com', 'Admin', 'Active', 'IT', '2023-01-15', '2024-01-10T09:30:00', '9876543210', 'Bangalore, India'),
('USR002', 'Priya Sharma', 'priya@vrv.com', 'Manager', 'Active', 'Sales', '2023-03-20', '2024-01-10T10:15:00', '9876543211', 'Mumbai, India'),
('USR003', 'Amit Patel', 'amit@vrv.com', 'Manager', 'Active', 'HR', '2023-02-15', '2024-01-09T14:20:00', '9876543212', 'Delhi, India'),
('USR004', 'Deepika Singh', 'deepika@vrv.com', 'Manager', 'Active', 'Marketing', '2023-04-10', '2024-01-08T11:45:00', '9876543213', 'Hyderabad, India'),
('USR005', 'Arjun Reddy', 'arjun@vrv.com', 'Employee', 'Active', 'IT', '2023-05-01', '2024-01-07T16:30:00', '9876543214', 'Chennai, India'),
('USR006', 'Neha Gupta', 'neha@vrv.com', 'Employee', 'Active', 'Sales', '2023-06-15', '2024-01-06T13:15:00', '9876543215', 'Pune, India'),
('USR007', 'Vikram Malhotra', 'vikram@vrv.com', 'Manager', 'Active', 'Finance', '2023-07-01', '2024-01-05T10:45:00', '9876543216', 'Kolkata, India'),
('USR008', 'Ananya Desai', 'ananya@vrv.com', 'Employee', 'Active', 'HR', '2023-08-20', '2024-01-04T15:20:00', '9876543217', 'Ahmedabad, India')
ON CONFLICT (id) DO NOTHING;

-- Grant permissions (if needed, usually public access is restricted but for this demo we assume anon key has access or policies are set)
-- GRANT ALL ON public.users TO anon;
-- GRANT ALL ON public.roles TO anon;
-- GRANT ALL ON public.departments TO anon;
