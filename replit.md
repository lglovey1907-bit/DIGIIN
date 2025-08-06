# Overview

This project is a Digital Inspection Platform developed for the Northern Railway Delhi Division. It is a full-stack web application aimed at digitizing inspection processes across various domains such as catering, sanitation, publicity, UTS/PRS, and parking. The platform enables authorized personnel to create, submit, and manage inspection reports, incorporating features like photo uploads, smart item verification, and comprehensive observation tracking. The business vision is to streamline and standardize railway inspections, enhancing efficiency, transparency, and compliance, ultimately contributing to improved service quality and operational effectiveness for Northern Railway.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, utilizing Vite for development.
- **UI Components**: Shadcn/ui, built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom Northern Railway branding.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Form Handling**: React Hook Form with Zod validation.

## Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API Design**: RESTful API.
- **File Uploads**: Multer middleware.
- **Session Management**: Express sessions with PostgreSQL storage.

## Authentication & Authorization
- **Provider**: Replit's OpenID Connect (OIDC).
- **Strategy**: Passport.js with OpenID Client.
- **Session Storage**: PostgreSQL-backed sessions.
- **Role-based Access**: Admin and CMI (Commercial Inspector) roles.

## Database Design
- **Database**: PostgreSQL with Drizzle ORM.
- **Connection**: Neon serverless PostgreSQL.
- **Schema Management**: Drizzle Kit for migrations.
- **Key Tables**: `users`, `inspections`, `inspection_assignments`, `shortlisted_items`, `file_uploads`, `sessions`.

## File Management
- **Upload Handling**: Local file system storage.
- **File Types**: Images (JPEG, PNG, GIF) and PDF.
- **Size Limits**: 10MB maximum file size.
- **Organization**: Files linked to specific inspections.

## Smart Search System
- **Item Verification**: Real-time search against a shortlisted items database.
- **Search Fields**: Serial number, brand, item name, flavour, and quantity.
- **Validation**: Automatic verification against approved catalog.

## Multi-Area Inspection System
- **Support**: Single inspection can cover multiple areas (catering, sanitation, parking, publicity, UTS/PRS).
- **Dynamic Management**: Add/remove inspection areas.
- **Individual Tracking**: Each area has its own "Action Taken By" section.
- **Area-Specific Forms**: Specialized form components for each inspection area, with isolated observations and actions.
- **Smart Validation**: 7B validation system works within each area's catering form.

## Catering Form Features
- **Multi-Company Support**: Dynamic addition/removal of companies.
- **Checklist**: Vendor details, documentation, licenses, billing, payments, item verification.
- **Smart Item Verification**: 7A search against shortlisted items.
- **7B Validation**: Automatic validation of unapproved items.
- **Prefixing**: Company names automatically prefixed with "M/s".
- **Overcharging Detection**: MRP vs selling price comparison.

## Offline Mode & Background Sync
- **Service Worker**: Comprehensive offline functionality.
- **Local Storage**: IndexedDB for persistent offline data.
- **Indicator**: Real-time connection status with pending items counter.
- **Background Sync**: Automatic synchronization when online.
- **Offline Forms**: Inspection forms can be saved locally.
- **Smart Caching**: Critical resources cached for offline availability.
- **Conflict Resolution**: Seamless data merging.

## One-Click Report Generation
- **Report Builder**: Interactive dialog for configuring reports.
- **Multi-Format Export**: PDF and Excel with customizable templates (Standard Railway, Executive, Detailed).
- **Compliance**: Official Northern Railway format.
- **Filtering**: Date range, station, and inspection type filters.
- **Visualization**: Charts and graphs (overview, trends, compliance, station comparisons).
- **Professional Layout**: Structured table format.

## PDF Generation & Export
- **Individual Reports**: Server-side PDF creation using PDFKit.
- **Template System**: Northern Railway branded templates.
- **Data Population**: Dynamic population of inspection data.
- **Download Integration**: PDF download buttons in dashboard.

## AI-Powered Report Layout Suggestions
- **OpenAI Integration**: GPT-4o for intelligent layout recommendations.
- **Smart Template Selection**: AI suggests optimal report template.
- **Visualization Recommendations**: AI suggests appropriate charts.
- **Layout Optimization**: AI recommends section prioritization.
- **Key Insights**: AI identifies important findings.
- **Interactive Suggestions**: Users can apply AI recommendations.
- **Trend Analysis**: AI identifies patterns from historical data.
- **Fallback System**: Graceful fallback to rule-based suggestions.

## Document Conversion Feature
- **Word Format**: Generates .docx reports for full Office compatibility.
- **Reliable Operation**: Works without AI dependency using the docx library.
- **Professional Formatting**: Centered Northern Railway header, proper table structure.
- **Dynamic Reference Handling**: "Reference Letter No." field.
- **Smart Data Processing**: Converts checkbox responses and technical data into elaborate English descriptions.
- **Company-wise Organization**: Structures observations by company with "M/s" prefixes.
- **Tabular Format Output**: S.No., Observations, Action Taken By, and Photographs columns.
- **Professional Photo References**: Indicates uploaded photos with "Uploaded Photo:" labels and formatted filenames.
- **Image File Detection**: Processes valid image files only.
- **Multi-File Support**: Handles single or multiple uploaded images.
- **Inspector Signature Table**: Dynamic formatting for single or multiple inspectors.
- **Inspection Management**: Full CRUD for inspections (delete/edit drafts only).
- **Advanced Varied Language System**: Generates unique, sophisticated Railway inspection terminology, randomly selecting from curated professional variants.

## Development Tools
- **Build System**: Vite for fast development and optimized builds.
- **Code Quality**: TypeScript for type safety.
- **Path Aliases**: Organized imports with @ aliases.
- **Hot Reload**: Development server with automatic reload.

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting.
- **@neondatabase/serverless**: For connection pooling.

## Authentication Services
- **Replit OIDC**: OpenID Connect authentication provider.
- **PostgreSQL-backed session storage**.

## UI Framework Dependencies
- **Radix UI**: Primitive component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.

## File Upload & Processing
- **Multer**: Multipart form data handling.
- **Local Storage**: File system-based storage.

## Development & Build Tools
- **Vite**: Modern build tool and development server.
- **TypeScript**: Type-safe JavaScript development.
- **ESBuild**: Fast JavaScript bundler.

## Form & Data Management
- **React Hook Form**: Performant form library.
- **Zod**: TypeScript-first schema validation.
- **TanStack Query**: Data synchronization library.

## PDF & Document Processing
- **PDFKit**: Server-side PDF generation.
- **docx**: Microsoft Word .docx generation.