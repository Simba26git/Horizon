-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types first (outside of DO block to ensure they are committed)
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
    CREATE TYPE update_frequency AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opportunity_status AS ENUM ('open', 'closed', 'fulfilled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('scheduled', 'delivered', 'delayed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE timeline_status AS ENUM ('planning', 'in_progress', 'completed', 'delayed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE weather_severity AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE terrain_type AS ENUM ('flat', 'sloped', 'rocky', 'wetland');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contractor_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('permit', 'certificate', 'contract', 'invoice');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
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

-- Create all tables
DO $$ BEGIN
    -- Core tables
    CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id),
        role user_role DEFAULT 'user',
        company_name TEXT,
        contact_number TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        name TEXT NOT NULL,
        description TEXT,
        location TEXT,
        estimated_budget DECIMAL(12,2),
        start_date TIMESTAMPTZ,
        estimated_end_date TIMESTAMPTZ,
        actual_end_date TIMESTAMPTZ,
        status project_status DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

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

    CREATE TABLE IF NOT EXISTS material_prices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        material_id UUID REFERENCES materials(id),
        supplier_id UUID REFERENCES suppliers(id),
        price DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quotations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
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

    -- Project Management Tables
    CREATE TABLE IF NOT EXISTS project_phases (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id),
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL,
        dependencies UUID[] DEFAULT '{}',
        materials JSONB DEFAULT '{}',
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        actual_start_date TIMESTAMPTZ,
        actual_end_date TIMESTAMPTZ,
        status timeline_status DEFAULT 'planning',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS weather_forecasts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        location_id TEXT NOT NULL,
        forecast_date DATE NOT NULL,
        temperature DECIMAL(4,1),
        precipitation DECIMAL(5,2),
        wind_speed DECIMAL(5,2),
        severity weather_severity,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS construction_delays (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id),
        delay_date DATE NOT NULL,
        delay_duration INTEGER NOT NULL,
        weather_forecast_id UUID REFERENCES weather_forecasts(id),
        impact_description TEXT,
        cost_impact DECIMAL(10,2),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS waste_records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id),
        material_id UUID REFERENCES materials(id),
        quantity DECIMAL(10,2),
        waste_type TEXT,
        recyclable BOOLEAN DEFAULT false,
        disposal_cost DECIMAL(10,2),
        recycling_savings DECIMAL(10,2),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sustainability_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id),
        total_waste_volume DECIMAL(10,2),
        recycled_percentage DECIMAL(5,2),
        cost_savings DECIMAL(10,2),
        carbon_footprint DECIMAL(10,2),
        report_date DATE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS site_assessments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id),
        location_coordinates POINT,
        terrain_type terrain_type,
        soil_condition TEXT,
        access_routes JSONB,
        parking_space INTEGER,
        storage_space INTEGER,
        site_photos TEXT[],
        assessment_date TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contractors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        company_name TEXT NOT NULL,
        license_number TEXT,
        specializations TEXT[],
        experience_years INTEGER,
        rating DECIMAL(2,1),
        total_reviews INTEGER DEFAULT 0,
        status contractor_status DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contractor_reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        contractor_id UUID REFERENCES contractors(id),
        reviewer_id UUID REFERENCES auth.users(id),
        project_id UUID REFERENCES projects(id),
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        review_text TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id),
        name TEXT NOT NULL,
        type document_type NOT NULL,
        file_url TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        uploaded_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS visualization_assets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id),
        name TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        file_url TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payment_schedules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id),
        amount DECIMAL(12,2) NOT NULL,
        due_date TIMESTAMPTZ NOT NULL,
        description TEXT,
        status payment_status DEFAULT 'pending',
        payment_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quality_inspections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id),
        inspector_id UUID REFERENCES auth.users(id),
        inspection_date TIMESTAMPTZ NOT NULL,
        category TEXT NOT NULL,
        findings TEXT,
        recommendations TEXT,
        status TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS energy_assessments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id),
        energy_rating TEXT,
        consumption_estimate DECIMAL(10,2),
        recommendations JSONB,
        assessment_date TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS risk_assessments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id),
        risk_category TEXT NOT NULL,
        description TEXT NOT NULL,
        likelihood INTEGER CHECK (likelihood BETWEEN 1 AND 5),
        impact INTEGER CHECK (impact BETWEEN 1 AND 5),
        risk_level risk_level,
        mitigation_strategy TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Price Management Tables
    CREATE TABLE IF NOT EXISTS price_alerts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        material_id UUID REFERENCES materials(id),
        target_price DECIMAL(10,2) NOT NULL,
        notification_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bulk_pricing (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        material_id UUID REFERENCES materials(id),
        supplier_id UUID REFERENCES suppliers(id),
        quantity INTEGER NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        minimum_order INTEGER,
        valid_until TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

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
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_materials_supplier_id ON materials(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_material_prices_material_id ON material_prices(material_id);
    CREATE INDEX IF NOT EXISTS idx_material_prices_supplier_id ON material_prices(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
    CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON project_phases(project_id);
    CREATE INDEX IF NOT EXISTS idx_weather_forecasts_location ON weather_forecasts(location_id);
    CREATE INDEX IF NOT EXISTS idx_construction_delays_project ON construction_delays(project_id);
    CREATE INDEX IF NOT EXISTS idx_waste_records_project ON waste_records(project_id);
    CREATE INDEX IF NOT EXISTS idx_site_assessments_project ON site_assessments(project_id);
    CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);
    CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
    CREATE INDEX IF NOT EXISTS idx_payment_schedules_project ON payment_schedules(project_id);
    CREATE INDEX IF NOT EXISTS idx_quality_inspections_project ON quality_inspections(project_id);
    CREATE INDEX IF NOT EXISTS idx_risk_assessments_project ON risk_assessments(project_id);
    CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
    CREATE INDEX IF NOT EXISTS idx_price_alerts_material_id ON price_alerts(material_id);
    CREATE INDEX IF NOT EXISTS idx_bulk_pricing_material_id ON bulk_pricing(material_id);
    CREATE INDEX IF NOT EXISTS idx_bulk_pricing_supplier_id ON bulk_pricing(supplier_id);
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

    CREATE TRIGGER update_projects_updated_at
        BEFORE UPDATE ON projects
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

    CREATE TRIGGER update_quotations_updated_at
        BEFORE UPDATE ON quotations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_project_phases_updated_at
        BEFORE UPDATE ON project_phases
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_contractors_updated_at
        BEFORE UPDATE ON contractors
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_documents_updated_at
        BEFORE UPDATE ON documents
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_payment_schedules_updated_at
        BEFORE UPDATE ON payment_schedules
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_risk_assessments_updated_at
        BEFORE UPDATE ON risk_assessments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_group_buying_opportunities_updated_at
        BEFORE UPDATE ON group_buying_opportunities
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualization_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buying_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buying_participations ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own projects"
    ON projects FOR ALL
    USING (auth.uid() = user_id);

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

CREATE POLICY "Users can view own quotations"
    ON quotations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own quotations"
    ON quotations FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their project phases"
    ON project_phases FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_phases.project_id
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can modify their project phases"
    ON project_phases FOR ALL
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_phases.project_id
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Authenticated users can view weather forecasts"
    ON weather_forecasts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can view their project data"
    ON construction_delays FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = construction_delays.project_id
        AND projects.user_id = auth.uid()
    )); 