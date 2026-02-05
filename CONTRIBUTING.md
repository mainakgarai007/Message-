# Contributing Guidelines

Thank you for your interest in contributing to the Human-Like Messaging Platform!

## Core Principles

Before contributing, please understand these fundamental principles:

1. **Human-Like Behavior**: Automation must ALWAYS feel human. Never robotic or bot-like.
2. **Invisibility**: Users should never know when they're talking to automation vs. a person.
3. **No Bot UI**: The words "bot", "AI", or "assistant" must NEVER appear in user-facing interfaces.
4. **Per-Chat Independence**: Each DM and Group has independent bot mode settings.
5. **Privacy First**: Users' privacy and data security are paramount.

## How to Contribute

### Reporting Issues

When reporting bugs or issues:

1. Check if the issue already exists
2. Provide detailed steps to reproduce
3. Include screenshots if applicable
4. Specify your environment (OS, Node version, MongoDB version)
5. Include relevant error messages or logs

### Feature Requests

For new features:

1. Explain the use case
2. Describe how it fits the "human-like" philosophy
3. Consider impact on existing features
4. Ensure it doesn't expose automation

### Code Contributions

#### Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit with clear messages
7. Push to your fork
8. Create a Pull Request

#### Code Style

**JavaScript/Node.js:**
- Use ES6+ syntax
- Use async/await over callbacks
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions small and focused

**React:**
- Use functional components with Hooks
- Follow existing component structure
- Use meaningful component and variable names
- Keep components focused on single responsibility
- Use CSS modules or styled-components consistently

**Naming Conventions:**
- camelCase for variables and functions
- PascalCase for components and classes
- UPPER_CASE for constants
- Descriptive names over short names

#### Testing

Before submitting:

1. Test all modified features
2. Test across different browsers
3. Check mobile responsiveness
4. Verify Socket.io real-time features
5. Test all bot modes (ON/MANUAL/AUTO)
6. Verify language detection
7. Test relationship-based behaviors

#### Commit Messages

Follow this format:
```
type: brief description

Detailed explanation if needed

Fixes #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat: add message expiration timer

Added ability to set messages to expire after 24h or 7 days.
Users can select expiration time when sending a message.

Fixes #45
```

### Pull Request Process

1. **Update Documentation**: Update README.md if needed
2. **Add Tests**: Include tests for new features
3. **Check Existing Tests**: Ensure all existing tests pass
4. **Code Review**: Address reviewer feedback promptly
5. **Squash Commits**: Clean up commit history if needed

### Areas for Contribution

#### High Priority

- [ ] Add unit tests for backend services
- [ ] Add integration tests for API endpoints
- [ ] Improve language detection accuracy
- [ ] Add more languages (Spanish, French, etc.)
- [ ] Enhance automation responses
- [ ] Performance optimization
- [ ] Mobile app (React Native)

#### Medium Priority

- [ ] Add message encryption (E2E)
- [ ] File attachment support
- [ ] Voice message support
- [ ] Message forwarding
- [ ] User preferences customization
- [ ] Dark mode theme
- [ ] Notification system

#### Low Priority

- [ ] Export chat history
- [ ] Custom emoji support
- [ ] Message scheduling
- [ ] Advanced search filters
- [ ] Analytics dashboard (admin only)

### What NOT to Contribute

❌ **Do NOT add:**
- Features that expose automation (e.g., "Bot status" indicator)
- Any UI text mentioning "bot", "AI", or "assistant"
- Public user search or discovery features
- Stories, reels, or feed features
- Voice/video calling
- Features that compromise privacy
- Social media-like noise features

### Code Review Criteria

Your PR will be reviewed for:

1. **Functionality**: Does it work as intended?
2. **Code Quality**: Is it clean, readable, and maintainable?
3. **Performance**: Does it impact app performance?
4. **Security**: Are there any security concerns?
5. **Human-Like**: Does it maintain the human-like philosophy?
6. **Testing**: Are there adequate tests?
7. **Documentation**: Is it properly documented?

### Development Setup

See README.md for detailed setup instructions.

Quick start:
```bash
git clone https://github.com/mainakgarai007/Message-.git
cd Message-
npm install
cd frontend && npm install && cd ..
cp .env.example .env
# Edit .env with your settings
npm run dev
```

### Project Structure

```
Message-/
├── backend/
│   ├── server.js              # Main server file
│   └── src/
│       ├── controllers/       # Request handlers
│       ├── models/           # Database models
│       ├── routes/           # API routes
│       ├── middleware/       # Express middleware
│       ├── services/         # Business logic
│       └── utils/            # Helper functions
├── frontend/
│   └── src/
│       ├── components/       # Reusable components
│       ├── pages/           # Page components
│       ├── contexts/        # React contexts
│       ├── services/        # API services
│       └── styles/          # CSS files
└── docs/                    # Documentation
```

### Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Socket.io Documentation](https://socket.io/docs/)

### Questions?

- Open an issue for clarification
- Tag maintainers in discussions
- Be patient and respectful

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome diverse perspectives
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Inappropriate sexual content
- Other conduct that violates community norms

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report violations to the project maintainers.

---

Thank you for contributing to making this platform better while keeping it human-like and privacy-focused! 🎉
