# Contributing to WA-Module

First off, thank you for considering contributing to WA-Module! 🎉

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots if possible**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and explain which behavior you expected to see instead**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the TypeScript styleguide
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a branch: `git checkout -b my-feature`
4. Make your changes
5. Run tests: `npm test`
6. Run linter: `npm run lint`
7. Build: `npm run build`
8. Commit your changes: `git commit -am 'Add some feature'`
9. Push to the branch: `git push origin my-feature`
10. Submit a pull request

## Styleguide

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### TypeScript Styleguide

* Use TypeScript strict mode
* Prefer `const` over `let`
* Use meaningful variable names
* Add JSDoc comments for public APIs
* Follow the existing code style
* Use Prettier for formatting

### Testing

* Write tests for new features
* Ensure all tests pass before submitting PR
* Aim for high test coverage
* Use descriptive test names

## Project Structure

```
wa-module/
├── src/
│   ├── core/          # Core classes
│   ├── services/      # Service implementations
│   ├── storage/       # Storage adapters
│   ├── cache/         # Cache implementations
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── examples/          # Usage examples
├── tests/             # Test files
└── docs/              # Documentation
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! ❤️
