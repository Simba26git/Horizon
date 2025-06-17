# Horizon Construction - Quotation System

A modern construction quotation system that provides accurate cost estimates, real-time material pricing, and professional quotation generation.

## Features

- **Smart Cost Estimation**
  - Real-time material price tracking
  - Supplier price comparison
  - Multi-currency support
  - Automated price updates

- **Material Management**
  - Comprehensive material database
  - Real-time supplier pricing
  - Price trend analysis
  - Supplier comparison tools

- **Quotation Generation**
  - Professional PDF quotations
  - Multi-currency support
  - Email delivery
  - Detailed cost breakdowns

- **User Interface**
  - Modern, responsive design
  - Interactive material selection
  - Real-time cost calculations
  - AI chatbot for assistance

## Tech Stack

- Next.js
- TypeScript
- Chakra UI
- Supabase
- Puppeteer
- jsPDF

## Prerequisites

- Node.js 16.x or later
- npm or yarn
- A Supabase account

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/horizon-construction.git
   cd horizon-construction
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up Supabase:
   - Create a new project in Supabase
   - Run the SQL migration in `supabase/migrations/20240315000000_initial_schema.sql`
   - Copy your project URL and anon key

4. Configure environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Update the Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/             # Shared utilities
│   ├── services/        # Business logic
│   └── views/           # Page layouts
├── public/              # Static assets
├── supabase/           # Database migrations
└── types/              # TypeScript definitions
```

## Key Services

- **AuthService**: User authentication and profile management
- **MaterialService**: Material pricing and management
- **SupplierService**: Supplier comparison and tracking
- **QuotationService**: Quotation generation and management
- **WebScrapingService**: Automated price updates
- **NotificationService**: Email notifications
- **CostEstimationService**: Price predictions and analysis

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
