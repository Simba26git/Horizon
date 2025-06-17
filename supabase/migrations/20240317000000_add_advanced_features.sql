-- Create enum types
CREATE TYPE weather_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE terrain_type AS ENUM ('flat', 'sloped', 'rocky', 'wetland');
CREATE TYPE contractor_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE document_type AS ENUM ('permit', 'certificate', 'contract', 'invoice');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'overdue');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE timeline_status AS ENUM ('planning', 'in_progress', 'completed', 'delayed');

-- Create project phases table
CREATE TABLE project_phases (
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

-- Weather Impact Analysis
CREATE TABLE weather_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id TEXT NOT NULL,
    forecast_date DATE NOT NULL,
    temperature DECIMAL(4,1),
    precipitation DECIMAL(5,2),
    wind_speed DECIMAL(5,2),
    severity weather_severity,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE construction_delays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    delay_date DATE NOT NULL,
    delay_duration INTEGER NOT NULL, -- in days
    weather_forecast_id UUID REFERENCES weather_forecasts(id),
    impact_description TEXT,
    cost_impact DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material Waste Management
CREATE TABLE waste_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    material_id UUID REFERENCES materials(id),
    quantity DECIMAL(10,2),
    waste_type TEXT,
    recyclable BOOLEAN,
    disposal_cost DECIMAL(10,2),
    recycling_savings DECIMAL(10,2),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sustainability_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    total_waste_volume DECIMAL(10,2),
    recycled_percentage DECIMAL(5,2),
    cost_savings DECIMAL(10,2),
    carbon_footprint DECIMAL(10,2),
    report_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Assessment
CREATE TABLE site_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    location_coordinates POINT,
    terrain_type terrain_type,
    soil_condition TEXT,
    access_routes JSONB,
    parking_space DECIMAL(10,2),
    storage_space DECIMAL(10,2),
    site_photos TEXT[],
    assessment_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor Marketplace
CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    company_name TEXT NOT NULL,
    license_number TEXT,
    specializations TEXT[],
    experience_years INTEGER,
    rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    status contractor_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contractor_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id UUID REFERENCES contractors(id),
    reviewer_id UUID REFERENCES auth.users(id),
    project_id UUID,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Documentation
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    document_type document_type,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    expiry_date TIMESTAMPTZ,
    status TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3D Visualization
CREATE TABLE visualization_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    model_type TEXT,
    asset_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Planning
CREATE TABLE payment_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    milestone_name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date TIMESTAMPTZ,
    status payment_status DEFAULT 'pending',
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Assurance
CREATE TABLE quality_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    phase_id UUID REFERENCES project_phases(id),
    inspector_id UUID REFERENCES auth.users(id),
    inspection_date TIMESTAMPTZ NOT NULL,
    checklist_items JSONB,
    defects_found JSONB,
    resolution_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Energy Efficiency
CREATE TABLE energy_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    total_r_value DECIMAL(6,2),
    annual_energy_cost DECIMAL(10,2),
    energy_rating TEXT,
    recommendations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Assessment
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    risk_category TEXT,
    risk_level risk_level,
    probability DECIMAL(3,2),
    impact_score DECIMAL(3,2),
    mitigation_measures JSONB,
    insurance_requirements JSONB,
    assessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_weather_forecasts_location ON weather_forecasts(location_id);
CREATE INDEX idx_construction_delays_project ON construction_delays(project_id);
CREATE INDEX idx_waste_records_project ON waste_records(project_id);
CREATE INDEX idx_site_assessments_project ON site_assessments(project_id);
CREATE INDEX idx_contractors_status ON contractors(status);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_payment_schedules_project ON payment_schedules(project_id);
CREATE INDEX idx_quality_inspections_project ON quality_inspections(project_id);
CREATE INDEX idx_risk_assessments_project ON risk_assessments(project_id);
CREATE INDEX idx_project_phases_project_id ON project_phases(project_id);

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_phases_updated_at
    BEFORE UPDATE ON project_phases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_buying_opportunities_updated_at
    BEFORE UPDATE ON group_buying_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
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
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for authenticated users
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

-- Add policies for project phases
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

-- Add similar policies for other tables... 