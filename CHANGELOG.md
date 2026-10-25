# Changelog

All notable changes to AEVORIX will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial monorepo structure with frontend and backend workspaces
- Frontend: React 19 + Vite + Tailwind CSS + Lucide React
- Backend: Node.js + Express + Supabase (PostgreSQL)
- Custom Tailwind design tokens (background, card, primary, verification, alert)
- Complete database schema with 7 tables and RLS policies
- PostgreSQL triggers for automatic blockchain ledger population
- Seed data for test patient Rahul Sharma (AEV-2026-8941)
- Mock NFC/biometric authentication endpoints
- XAI explainability endpoint (/api/ai/explain)
- RAG-based medical query endpoint (/api/ai/query)
- Blockchain verification endpoint (/api/blockchain/verify)
- Access logging with audit trail
- Docker Compose for local development
- ESLint, Prettier, EditorConfig configurations
- Contributing guidelines and MIT License

### Security
- Row Level Security policies for all tables
- JWT-based authentication ready
- bcrypt password hashing
- Parameterized queries to prevent SQL injection

## [0.1.0] - 2026-10-25

### Added
- Project initialization
- Monorepo structure with npm workspaces
- Frontend and backend scaffolding
- Database schema with blockchain integrity
- Core API endpoints
- Development tooling

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | 2026-10-25 | Initial release |

---

## Migration Guide

### 0.1.0 → Future Versions

When upgrading, check for:
- Database schema changes (run new migrations)
- Breaking API changes (check CHANGELOG)
- Environment variable updates
- Dependency updates

## Contributors

- AEVORIX Team
- Open source contributors

See [GitHub Contributors](https://github.com/neeraj-k-r/AEVORIX/graphs/contributors) for full list.