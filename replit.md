# Overview

This is a Digital Inspection Platform built for the Northern Railway Delhi Division. It's a full-stack web application designed to digitize inspection processes across various areas including catering, sanitation, publicity, UTS/PRS, and parking. The application allows authorized personnel to create, submit, and manage inspection reports with photo uploads, smart item verification, and comprehensive observation tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## Password Reset Functionality (August 6, 2025)
- Added complete forgot password and reset password functionality
- Created password reset tokens database table with expiry mechanism
- Implemented secure password reset flow with token validation
- Added forgot password link to login page
- Created user-friendly forgot password and reset password pages
- Backend API routes for password reset process with proper security measures
- Token-based password reset with 1-hour expiry for security

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and build tooling
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Northern Railway branding variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route handlers
- **File Uploads**: Multer middleware for handling multipart form data
- **Session Management**: Express sessions with PostgreSQL storage

## Authentication & Authorization
- **Provider**: Replit's OpenID Connect (OIDC) authentication
- **Strategy**: Passport.js with OpenID Client strategy
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Role-based Access**: Admin and CMI (Commercial Inspector) roles

## Database Design
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Key Tables**:
  - `users` - User profiles and roles
  - `inspections` - Main inspection records with JSONB observations
  - `inspection_assignments` - Assignment tracking
  - `shortlisted_items` - Approved items catalog for verification
  - `file_uploads` - Photo and document attachments
  - `sessions` - User session storage

## File Management
- **Upload Handling**: Local file system storage with configurable upload directory
- **File Types**: Images (JPEG, PNG, GIF) and PDF documents
- **Size Limits**: 10MB maximum file size
- **Organization**: Files linked to specific inspections via database relations

## Smart Search System
- **Item Verification**: Real-time search against shortlisted items database
- **Search Fields**: Serial number, brand, item name, flavour, and quantity
- **Validation**: Automatic verification of items against approved catalog

## Multi-Area Inspection System
- **Multi-Area Support**: Single inspection can cover multiple areas (catering, sanitation, parking, publicity, UTS/PRS)
- **Dynamic Area Management**: Add/remove inspection areas within the same inspection
- **Individual Action Tracking**: Each area has its own "Action Taken By" section after observations
- **Area-Specific Forms**: Specialized form components for each inspection area
- **Form Isolation**: Each area maintains independent observations and actions
- **Smart Validation Integration**: 7B validation system works within each area's catering form

## Catering Form Features
- **Multi-Company Support**: Add/remove companies dynamically with minimum of 1 company required
- **Complete Inspection Checklist**: Vendor details, documentation, licenses, billing, payments, item verification
- **Smart Item Verification**: 7A search against 210+ shortlisted items database
- **7B Validation System**: Automatically validates unapproved items against approved catalog
- **M/s Prefix**: Company names automatically prefixed with "M/s"
- **Overcharging Detection**: MRP vs selling price comparison per company

## Offline Mode & Background Sync
- **Service Worker**: Comprehensive offline functionality with background sync capabilities
- **Local Storage**: IndexedDB integration for persistent offline data storage
- **Offline Indicator**: Real-time connection status with pending items counter
- **Background Sync**: Automatic synchronization when connection is restored
- **Offline Forms**: Complete inspection forms can be saved locally when offline
- **Smart Caching**: Critical resources cached for offline availability
- **Conflict Resolution**: Seamless data merging when back online
- **Progress Tracking**: Visual feedback for sync status and pending operations

## One-Click Report Generation
- **Custom Report Builder**: Interactive dialog for configuring comprehensive reports with visualization options
- **Multi-Format Export**: PDF and Excel report generation with customizable templates (Standard Railway Format, Executive, Detailed)
- **Official Format Compliance**: Standard template matches official Northern Railway inspection document structure with proper headers, structured tables, and signature sections
- **Advanced Filtering**: Date range, station, and inspection type filters for targeted reporting
- **Visualization Options**: Charts and graphs including overview statistics, trend analysis, compliance metrics, station comparisons
- **Professional Layout**: Structured table format with SN, Deficiencies/Observations, and Action Taken By columns
- **One-Click Generation**: Streamlined report creation process from dashboard with instant download

## PDF Generation & Export
- **Individual Reports**: Server-side PDF creation using PDFKit library for single inspection reports
- **Template System**: Northern Railway branded PDF templates with professional formatting
- **Data Population**: Dynamic population of inspection data, observations, and metadata
- **Download Integration**: PDF download buttons integrated into dashboard inspection listings
- **Export Route**: `/api/inspections/:id/export-pdf` endpoint for authenticated PDF generation

## AI-Powered Report Layout Suggestions
- **OpenAI Integration**: GPT-4o powered analysis of inspection data for intelligent layout recommendations
- **Smart Template Selection**: AI analyzes inspection complexity and suggests optimal report template (Standard/Executive/Detailed)
- **Visualization Recommendations**: Suggests appropriate charts and graphs based on data patterns and content
- **Layout Optimization**: AI recommends which sections to prioritize and what visualizations to include
- **Key Insights Generation**: Automatically identifies and highlights important findings from inspection data
- **Interactive Suggestions**: Users can apply AI recommendations with one-click integration into report generation
- **Trend Analysis**: AI analyzes historical inspection data to identify patterns and provide recommendations
- **Fallback System**: Graceful fallback to rule-based suggestions when AI service is unavailable

## Document Conversion Feature
- **Modern Word Format**: Generates inspection reports in latest Microsoft Word .docx format for full Office compatibility
- **Reliable Operation**: Works without AI dependency for consistent document generation using the docx library
- **Professional Formatting**: Centered Northern Railway header with underline, proper table structure with precise column alignment
- **Dynamic Reference Handling**: Uses "Reference Letter No." field from inspection form; displays "Ref: NIL" when empty
- **Smart Data Processing**: Converts checkbox responses and technical data into elaborate English descriptions
- **Company-wise Organization**: Structures observations by company with proper M/s prefixes and unit/platform details
- **Tabular Format Output**: S.No., Observations, Action Taken By, and Photographs columns with content properly aligned
- **Professional Photo References**: Uploaded inspection photos are clearly indicated in Word documents with "Uploaded Photo:" labels and formatted filenames
- **Image File Detection**: Automatically detects and processes only valid image files (PNG, JPG, JPEG, GIF, BMP, WebP) for professional referencing
- **Multi-File Support**: Handles single or multiple uploaded images with clear, underlined filename references
- **Reliable Document Generation**: Ensures Word documents always generate successfully without corruption across all Microsoft Office versions
- **Consistent Formatting**: Professional photo reference format that works reliably in Word, LibreOffice, and Google Docs
- **Inspector Signature Table**: Dynamic formatting at document end - single inspector displays name and designation as stacked paragraphs (right-aligned), two or more inspectors use multi-column borderless table with each column containing stacked name/designation (all center-aligned), column widths automatically calculated based on number of inspectors, no heading, comprehensive border removal (table-level and inside borders set to NONE), fixed to properly pass inspector data from database to document converter
- **Inspection Management**: Full CRUD operations for inspections with delete and edit functionality
  - Delete functionality: Available for draft inspections with confirmation dialog and proper authorization checks
  - Edit functionality: Available for draft inspections, redirects to inspection form with edit mode
  - Role-based access: Both CMI and admin users can delete/edit their own inspections or admin can manage all
  - UI Integration: Edit and delete buttons appear in both CMI and admin dashboards for draft inspections only
  - Backend API: DELETE /api/inspections/:id route with proper authentication and authorization
  - Database operations: deleteInspection method in storage layer with soft delete protection
- **Advanced Varied Language System**: Intelligent language transformation system that generates unique, sophisticated Railway inspection terminology for each report while maintaining professional standards
  - Language Variety: Multiple professional alternatives for each phrase to ensure unique expressions ("working" can become "operational and functioning as per specifications", "functional and performing within established parameters", "active and operating in accordance with requirements", or "serviceable and executing prescribed functions")
  - Dynamic Expression Generation: Random selection from curated professional variants ensures no two reports use identical language even for similar findings
  - Regulatory Authority: Incorporates proper railway commercial protocol references with varied authoritative expressions
  - Technical Precision: Multiple sophisticated alternatives for technical terminology (EPOS system descriptions vary across "infrastructure", "apparatus", "mechanism")
  - Varied Opening Paragraphs: Four different professional opening statement templates with randomized selection
  - Enhanced Observation Diversity: Each observation type has 3-4 professional alternatives to prevent repetitive language across multiple users
  - Context-Aware Enhancement: Sophisticated phrase replacement system that maintains meaning while adding linguistic variety
- **Microsoft Office Compatibility**: Native .docx format ensures seamless opening in Microsoft Word, LibreOffice, and Google Docs
- **Image Processing Debugging**: Comprehensive logging and error handling for image embedding troubleshooting

## Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Code Quality**: TypeScript for type safety across frontend and backend
- **Path Aliases**: Organized imports with @ aliases for cleaner code structure
- **Hot Reload**: Development server with automatic reload capabilities

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting
- **Connection Pooling**: @neondatabase/serverless for optimized connections

## Authentication Services
- **Replit OIDC**: OpenID Connect authentication provider
- **Session Management**: PostgreSQL-backed session storage

## UI Framework Dependencies
- **Radix UI**: Comprehensive primitive component library
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

## File Upload & Processing
- **Multer**: Multipart form data handling for file uploads
- **Local Storage**: File system-based storage with configurable paths

## Development & Build Tools
- **Vite**: Modern build tool and development server
- **TypeScript**: Type-safe JavaScript development
- **ESBuild**: Fast JavaScript bundler for production builds

## Form & Data Management
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation
- **TanStack Query**: Powerful data synchronization for React

## PDF & Document Processing
- **PDF Generation**: Server-side PDF creation for inspection reports
- **Template Processing**: Dynamic content insertion into PDF templates