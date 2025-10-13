# 🤝 Contributing to BitCurrent

Thank you for your interest in contributing to BitCurrent! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Process](#development-process)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)

---

## 📜 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report inappropriate behavior to support@bitcurrent.com

---

## 🚀 Getting Started

### 1. Fork & Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/Bitcurrent.git
cd bitcurrent1
```

### 2. Set Up Environment

```bash
# Backend setup
cd backend-broker
npm install
cp .env.example .env
# Edit .env with your credentials

# Frontend setup
cd ../frontend
npm install
cp .env.local.example .env.local
# Edit .env.local
```

### 3. Create Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

---

## 🔄 Development Process

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

**Examples:**
- `feature/limit-order-ui`
- `fix/stripe-webhook-timeout`
- `docs/api-endpoint-examples`

### Development Workflow

1. Create feature branch from `main`
2. Make your changes
3. Write/update tests
4. Run linter and tests
5. Commit with clear messages
6. Push to your fork
7. Create Pull Request

---

## 💻 Coding Standards

### TypeScript/JavaScript

```typescript
// ✅ Good
export async function getUserBalance(userId: number): Promise<Balance> {
  const balance = await db.select('balances', { user_id: userId });
  return balance;
}

// ❌ Bad
function getBalance(id) {
  return db.query(`SELECT * FROM balances WHERE user_id = ${id}`);
}
```

**Rules:**
- Use TypeScript for frontend
- Use JSDoc for backend JavaScript
- No `any` types without justification
- Descriptive variable names
- Functions < 50 lines
- Files < 500 lines

### React Components

```tsx
// ✅ Good
interface Props {
  amount: number;
  currency: string;
}

export default function PriceDisplay({ amount, currency }: Props) {
  return (
    <div className="text-2xl font-bold">
      {currency} {amount.toFixed(2)}
    </div>
  );
}

// ❌ Bad
function PriceDisplay(props) {
  return <div>{props.currency + props.amount}</div>;
}
```

**Rules:**
- Functional components only
- TypeScript interfaces for props
- Descriptive component names
- Extract logic into custom hooks
- Use Tailwind CSS classes

### Backend API

```javascript
// ✅ Good
router.post('/orders',
  authMiddleware,
  validateTradeRequest,
  async (req, res, next) => {
    try {
      const order = await OrderService.createOrder(req.userId, req.body);
      res.status(201).json({ success: true, order });
    } catch (error) {
      next(error);
    }
  }
);

// ❌ Bad
router.post('/orders', async (req, res) => {
  const order = await db.query('INSERT INTO orders...');
  res.send(order);
});
```

**Rules:**
- Use service layer for business logic
- Always use middleware for auth
- Proper error handling
- Structured responses
- Input validation

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Test additions
- `chore`: Maintenance

### Examples

```bash
# Good commits
feat(trading): Add limit order functionality
fix(auth): Resolve JWT expiration bug
docs(api): Update deposit endpoint examples
refactor(orders): Extract service layer

# Bad commits
update stuff
fixed bug
changes
```

### Commit Rules

- Present tense ("Add feature" not "Added feature")
- Imperative mood ("Move cursor" not "Moves cursor")
- First line < 72 characters
- Reference issues: "Fixes #123"

---

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Linter passes
- [ ] Documentation updated
- [ ] Branch is up-to-date with `main`

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Review Process

1. Automated checks must pass
2. At least 1 approving review required
3. No unresolved conversations
4. Branch must be up-to-date
5. Squash and merge

---

## 🧪 Testing Requirements

### Unit Tests

```javascript
describe('OrderService', () => {
  it('should create order with valid input', async () => {
    const order = await OrderService.createOrder(userId, orderData);
    expect(order).toHaveProperty('id');
    expect(order.status).toBe('pending');
  });

  it('should throw error for insufficient balance', async () => {
    await expect(
      OrderService.createOrder(userId, largeOrderData)
    ).rejects.toThrow('Insufficient balance');
  });
});
```

### E2E Tests

```typescript
test('User can place market order', async ({ page }) => {
  await page.goto('/trade/BTCUSD');
  await page.fill('[name="amount"]', '0.001');
  await page.click('button:has-text("Buy")');
  await expect(page.locator('text=Order Placed')).toBeVisible();
});
```

### Testing Commands

```bash
# Backend unit tests
cd backend-broker
npm test

# Frontend unit tests
cd frontend
npm test

# E2E tests
cd frontend
npx playwright test

# Test coverage
npm run test:coverage
```

### Coverage Requirements

- Minimum 70% code coverage
- All new features must have tests
- Critical paths must have E2E tests

---

## 🐛 Reporting Bugs

### Bug Report Template

**Title:** Clear, descriptive title

**Description:**
- What happened?
- What should have happened?

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Environment:**
- OS: [e.g., macOS 14]
- Browser: [e.g., Chrome 118]
- Version: [e.g., 1.0.0]

**Screenshots:**
If applicable, add screenshots

---

## ✨ Feature Requests

### Feature Request Template

**Title:** Feature name

**Problem:**
What problem does this solve?

**Proposed Solution:**
How should it work?

**Alternatives:**
Other solutions considered?

**Additional Context:**
Mockups, diagrams, examples

---

## 📚 Resources

- [API Documentation](docs/API.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT_CHECKLIST.md)
- [Security Audit](SECURITY_AUDIT.md)

---

## 💬 Getting Help

- **Discord:** https://discord.gg/bitcurrent
- **Email:** dev@bitcurrent.com
- **Docs:** https://docs.bitcurrent.com

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to BitCurrent! 🚀**

