# Contributing to AEVORIX

Thank you for your interest in contributing to AEVORIX! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AEVORIX.git
   cd AEVORIX
   ```
3. **Install dependencies**:
   ```bash
   npm run install:all
   ```
4. **Set up environment**:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   # Edit with your Supabase credentials
   ```
5. **Run the database schema** in Supabase SQL Editor (copy from `backend/schema.sql`)
6. **Start development servers**:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming
- `feature/short-description` - New features
- `fix/short-description` - Bug fixes
- `docs/short-description` - Documentation updates
- `config/short-description` - Configuration changes
- `refactor/short-description` - Code refactoring

### Commit Messages
Follow conventional commits format:
```
type(scope): short description

Longer description if needed

Closes #issue-number
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `config`

### Pull Request Process
1. Create a branch from `master`
2. Make your changes with small, focused commits
3. Run linting: `npm run lint` (in frontend/backend)
4. Test your changes locally
5. Push to your fork and open a PR against `master`
6. Ensure CI passes
7. Request review from maintainers

## Code Style

### Frontend (React + TypeScript)
- Use functional components with hooks
- Follow React best practices
- Use Tailwind CSS for styling
- TypeScript for type safety
- ESLint + Prettier configured

### Backend (Node.js + Express)
- Use async/await for async operations
- Proper error handling with try/catch
- Input validation on all endpoints
- Parameterized queries (no string concatenation)
- JSDoc comments for functions

### Database
- Use UUIDs for primary keys
- Add indexes for foreign keys and frequently queried columns
- Use JSONB for flexible data (allergies, etc.)
- Row Level Security for multi-tenant access
- Triggers for audit trails (blockchain_ledger)

## Testing

### Frontend
```bash
cd frontend
npm run test
```

### Backend
```bash
cd backend
npm run test
```

## Database Migrations

For schema changes:
1. Create a new migration file in `backend/migrations/`
2. Test locally with `docker-compose up postgres`
3. Apply to Supabase via SQL Editor
4. Document breaking changes

## Hardware Integration

When working on NFC/biometric features:
- Use mock endpoints in `backend/index.js` for development
- Document hardware requirements in `/docs/hardware.md`
- Keep hardware-specific code in separate modules

## AI Features

For XAI/RAG improvements:
- Update mock responses in `backend/index.js`
- Document prompt engineering in `/docs/ai-prompts.md`
- Version model configurations

## Reporting Issues

Use GitHub Issues with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, browser)
- Screenshots if applicable

## Security

- Report security vulnerabilities privately to security@aevorix.com
- Never commit secrets or API keys
- Use environment variables for all configuration
- Rotate keys regularly

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

For questions, open a GitHub Discussion or contact the maintainers.