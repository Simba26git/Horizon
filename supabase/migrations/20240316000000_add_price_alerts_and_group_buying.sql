-- Create enum types
CREATE TYPE opportunity_status AS ENUM ('open', 'closed', 'fulfilled');
CREATE TYPE delivery_status AS ENUM ('scheduled', 'delivered', 'delayed');
CREATE TYPE timeline_status AS ENUM ('planning', 'in_progress', 'completed', 'delayed');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- Create projects table first
CREATE TABLE projects (
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

-- Create price alerts table
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    material_id UUID REFERENCES materials(id),
    target_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2),
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bulk pricing table
CREATE TABLE bulk_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id),
    supplier_id UUID REFERENCES suppliers(id),
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    minimum_order INTEGER NOT NULL,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create group buying opportunities table
CREATE TABLE group_buying_opportunities (
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

-- Create group buying participations table
CREATE TABLE group_buying_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES group_buying_opportunities(id),
    user_id UUID REFERENCES auth.users(id),
    quantity INTEGER NOT NULL,
    committed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (opportunity_id, user_id)
);

-- Create project phases table
CREATE TABLE project_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- in days
    dependencies TEXT[] DEFAULT '{}',
    materials TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timelines table
CREATE TABLE timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    phases UUID[] NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    estimated_end_date TIMESTAMPTZ NOT NULL,
    actual_end_date TIMESTAMPTZ,
    status timeline_status DEFAULT 'planning',
    weather_delays INTEGER DEFAULT 0,
    current_phase_id UUID REFERENCES project_phases(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create material deliveries table
CREATE TABLE material_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timeline_id UUID REFERENCES timelines(id),
    material_id UUID REFERENCES materials(id),
    supplier_id UUID REFERENCES suppliers(id),
    phase_id UUID REFERENCES project_phases(id),
    quantity INTEGER NOT NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    status delivery_status DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_material_id ON price_alerts(material_id);
CREATE INDEX idx_bulk_pricing_material_id ON bulk_pricing(material_id);
CREATE INDEX idx_bulk_pricing_supplier_id ON bulk_pricing(supplier_id);
CREATE INDEX idx_group_buying_material_id ON group_buying_opportunities(material_id);
CREATE INDEX idx_group_buying_status ON group_buying_opportunities(status);
CREATE INDEX idx_group_buying_participations_user_id ON group_buying_participations(user_id);
CREATE INDEX idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX idx_timelines_project_id ON timelines(project_id);
CREATE INDEX idx_material_deliveries_timeline_id ON material_deliveries(timeline_id);

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_buying_opportunities_updated_at
    BEFORE UPDATE ON group_buying_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_phases_updated_at
    BEFORE UPDATE ON project_phases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timelines_updated_at
    BEFORE UPDATE ON timelines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_deliveries_updated_at
    BEFORE UPDATE ON material_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buying_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buying_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_deliveries ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- Price alerts policies
CREATE POLICY "Users can view own price alerts"
    ON price_alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own price alerts"
    ON price_alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Bulk pricing policies
CREATE POLICY "Everyone can view bulk pricing"
    ON bulk_pricing FOR SELECT
    TO authenticated
    USING (true);

-- Group buying policies
CREATE POLICY "Everyone can view group buying opportunities"
    ON group_buying_opportunities FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can participate in group buying"
    ON group_buying_participations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Project phases policies
CREATE POLICY "Users can view project phases"
    ON project_phases FOR SELECT
    TO authenticated
    USING (true);

-- Timelines policies
CREATE POLICY "Users can view timelines"
    ON timelines FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own timelines"
    ON timelines FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = timelines.project_id
        AND projects.user_id = auth.uid()
    ));