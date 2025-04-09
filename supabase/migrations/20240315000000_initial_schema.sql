-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE quotation_status AS ENUM ('draft', 'final');
CREATE TYPE material_category AS ENUM ('structural', 'finishing', 'electrical', 'plumbing');
CREATE TYPE update_frequency AS ENUM ('daily', 'weekly', 'monthly');

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role user_role DEFAULT 'user',
    company_name TEXT,
    contact_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    location TEXT,
    delivery_time TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create materials table
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    category material_category NOT NULL,
    specifications JSONB DEFAULT '{}',
    supplier_id UUID REFERENCES suppliers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create material prices table
CREATE TABLE material_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id),
    supplier_id UUID REFERENCES suppliers(id),
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create price predictions table
CREATE TABLE price_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id),
    predicted_price DECIMAL(10,2) NOT NULL,
    prediction_date TIMESTAMPTZ NOT NULL,
    confidence_score DECIMAL(5,2),
    factors JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quotations table
CREATE TABLE quotations (
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

-- Create update schedules table
CREATE TABLE update_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id),
    frequency update_frequency NOT NULL,
    last_update TIMESTAMPTZ DEFAULT NOW(),
    next_update TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_material_prices_material_id ON material_prices(material_id);
CREATE INDEX idx_material_prices_supplier_id ON material_prices(supplier_id);
CREATE INDEX idx_quotations_user_id ON quotations(user_id);
CREATE INDEX idx_materials_supplier_id ON materials(supplier_id);
CREATE INDEX idx_update_schedules_supplier_id ON update_schedules(supplier_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
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

CREATE TRIGGER update_quotations_updated_at
    BEFORE UPDATE ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_update_schedules_updated_at
    BEFORE UPDATE ON update_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_schedules ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Suppliers policies
CREATE POLICY "Everyone can view suppliers"
    ON suppliers FOR SELECT
    TO authenticated
    USING (true);

-- Materials policies
CREATE POLICY "Everyone can view materials"
    ON materials FOR SELECT
    TO authenticated
    USING (true);

-- Material prices policies
CREATE POLICY "Everyone can view material prices"
    ON material_prices FOR SELECT
    TO authenticated
    USING (true);

-- Quotations policies
CREATE POLICY "Users can view own quotations"
    ON quotations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quotations"
    ON quotations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotations"
    ON quotations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotations"
    ON quotations FOR DELETE
    USING (auth.uid() = user_id); 