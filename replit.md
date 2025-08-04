# Overview

This is a Digital Inspection Platform built for the Northern Railway Delhi Division. It's a full-stack web application designed to digitize inspection processes across various areas including catering, sanitation, publicity, UTS/PRS, and parking. The application allows authorized personnel to create, submit, and manage inspection reports with photo uploads, smart item verification, and comprehensive observation tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

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
- **Role-based Access**: Admin and CMI (Chief Metropolitan Inspector) roles

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

## Area-Specific Forms
- **Modular Design**: Specialized form components for each inspection area
- **Dynamic Observations**: JSONB storage allows flexible observation structures
- **Photo Integration**: Each observation point can include photo evidence
- **Validation Rules**: Area-specific validation and required fields

## PDF Generation & Export
- **Report Generation**: Server-side PDF creation using PDFKit library for inspection reports
- **Template System**: Northern Railway branded PDF templates with professional formatting
- **Data Population**: Dynamic population of inspection data, observations, and metadata
- **Download Integration**: PDF download buttons integrated into dashboard inspection listings
- **Export Route**: `/api/inspections/:id/export-pdf` endpoint for authenticated PDF generation

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