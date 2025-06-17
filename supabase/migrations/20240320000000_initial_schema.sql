-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quotation_status AS ENUM ('draft', 'final');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE material_category AS ENUM ('structural', 'finishing', 'electrical', 'plumbing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opportunity_status AS ENUM ('open', 'closed', 'fulfilled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create core tables
DO $$ BEGIN
    -- User profiles
    CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id),
        role user_role DEFAULT 'user',
        company_name TEXT,
        contact_number TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Suppliers
    CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        location TEXT,
        delivery_time TEXT,
        website_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Materials
    CREATE TABLE IF NOT EXISTS materials (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        category material_category NOT NULL,
        specifications JSONB DEFAULT '{}',
        supplier_id UUID REFERENCES suppliers(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Material prices
    CREATE TABLE IF NOT EXISTS material_prices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        material_id UUID REFERENCES materials(id),
        supplier_id UUID REFERENCES suppliers(id),
        price DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Projects
    CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        name TEXT NOT NULL,
        description TEXT,
        location TEXT,
        estimated_budget DECIMAL(12,2),
        start_date TIMESTAMPTZ,
        estimated_end_date TIMESTAMPTZ,
        status project_status DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Quotations
    CREATE TABLE IF NOT EXISTS quotations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        project_id UUID REFERENCES projects(id),
        quotation_number TEXT UNIQUE NOT NULL,
        specifications JSONB NOT NULL,
        materials JSONB NOT NULL,
        total_cost DECIMAL(12,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        status quotation_status DEFAULT 'draft',
        valid_until TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Price alerts
    CREATE TABLE IF NOT EXISTS price_alerts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        material_id UUID REFERENCES materials(id),
        target_price DECIMAL(10,2) NOT NULL,
        notification_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Group buying opportunities
    CREATE TABLE IF NOT EXISTS group_buying_opportunities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        material_id UUID REFERENCES materials(id),
        target_quantity INTEGER NOT NULL,
        current_quantity INTEGER DEFAULT 0,
        price_per_unit DECIMAL(10,2) NOT NULL,
        minimum_participants INTEGER NOT NULL,
        current_participants INTEGER DEFAULT 0,
        expiry_date TIMESTAMPTZ NOT NULL,
        status opportunity_status DEFAULT 'open',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Group buying participations
    CREATE TABLE IF NOT EXISTS group_buying_participations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        opportunity_id UUID REFERENCES group_buying_opportunities(id),
        quantity INTEGER NOT NULL,
        committed_at TIMESTAMPTZ DEFAULT NOW()
    );
END $$;

-- Create indexes
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
    CREATE INDEX IF NOT EXISTS idx_materials_supplier_id ON materials(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_material_prices_material_id ON material_prices(material_id);
    CREATE INDEX IF NOT EXISTS idx_material_prices_supplier_id ON material_prices(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
    CREATE INDEX IF NOT EXISTS idx_quotations_project_id ON quotations(project_id);
    CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
    CREATE INDEX IF NOT EXISTS idx_price_alerts_material_id ON price_alerts(material_id);
    CREATE INDEX IF NOT EXISTS idx_group_buying_material_id ON group_buying_opportunities(material_id);
    CREATE INDEX IF NOT EXISTS idx_group_buying_status ON group_buying_opportunities(status);
    CREATE INDEX IF NOT EXISTS idx_group_buying_participations_user_id ON group_buying_participations(user_id);
END $$;

-- Create triggers
DO $$ BEGIN
    CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_suppliers_updated_at
        BEFORE UPDATE ON suppliers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_materials_updated_at
        BEFORE UPDATE ON materials
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_projects_updated_at
        BEFORE UPDATE ON projects
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_quotations_updated_at
        BEFORE UPDATE ON quotations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_group_buying_opportunities_updated_at
        BEFORE UPDATE ON group_buying_opportunities
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buying_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buying_participations ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Everyone can view suppliers"
    ON suppliers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Everyone can view materials"
    ON materials FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Everyone can view material prices"
    ON material_prices FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own projects"
    ON projects FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quotations"
    ON quotations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own quotations"
    ON quotations FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own price alerts"
    ON price_alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own price alerts"
    ON price_alerts FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view group buying opportunities"
    ON group_buying_opportunities FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can view own group buying participations"
    ON group_buying_participations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create group buying participations"
    ON group_buying_participations FOR INSERT
    WITH CHECK (auth.uid() = user_id); 