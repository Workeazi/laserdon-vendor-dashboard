-- VENDORS
create table vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  categories text[],           -- ['Laser Cutting','CNC Machining','Sheet Metal']
  gst_number text,
  city text,
  state text,
  rating numeric(3,2) default 0,
  is_verified boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- USERS (customers)
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz default now()
);

-- PROJECTS
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  title text not null,
  description text,
  status text default 'pending',   -- pending | quoted | approved | rejected | completed
  created_at timestamptz default now()
);

-- PROJECT_FILES (drawing uploads)
create table project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  vendor_id uuid references vendors(id),
  file_name text not null,
  file_url text not null,
  file_type text,                  -- pdf | dwg | jpg | png
  storage_path text,
  uploaded_at timestamptz default now()
);

-- QUOTATIONS
create table quotations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  vendor_id uuid references vendors(id),
  user_id uuid references users(id),
  price numeric(12,2) not null,
  estimated_days integer not null,
  notes text,
  status text default 'pending',   -- pending | accepted | rejected
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ORDERS
create table orders (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid references quotations(id),
  project_id uuid references projects(id),
  vendor_id uuid references vendors(id),
  user_id uuid references users(id),
  status text default 'active',    -- active | completed | cancelled | disputed
  payment_status text default 'pending',
  total_amount numeric(12,2),
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- PAYMENTS
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  vendor_id uuid references vendors(id),
  amount numeric(12,2),
  method text,
  status text default 'pending',
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table notifications (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id),
  type text not null,              -- new_request | quotation_accepted | order_completed | payment_received
  title text not null,
  body text,
  is_read boolean default false,
  meta jsonb,
  created_at timestamptz default now()
);

-- ACTIVITY_LOGS
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id),
  action text not null,
  entity text,
  entity_id uuid,
  created_at timestamptz default now()
);

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('drawings', 'drawings', false);
insert into storage.buckets (id, name, public) values ('vendor-documents', 'vendor-documents', false);
insert into storage.buckets (id, name, public) values ('vendor-logos', 'vendor-logos', true);

-- ENABLE RLS on all tables
alter table vendors enable row level security;
alter table users enable row level security;
alter table projects enable row level security;
alter table project_files enable row level security;
alter table quotations enable row level security;
alter table orders enable row level security;
alter table payments enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;
