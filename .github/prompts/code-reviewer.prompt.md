---
description: Analyze code changes (diff) and generate actionable code review comments aligned with team standards
tools: ['search/codebase']
---

# /code-reviewer

Analyze code changes (diff) and generate actionable code review comments aligned with team standards.

## Purpose

Assist code reviewers by:

- Identifying potential bugs, security issues, and performance problems
- Flagging violations of team coding standards and architectural patterns
- Suggesting improvements for readability and maintainability
- Highlighting risks that require extra scrutiny

## Usage

Invoke this command when reviewing a pull request or code changes:

```txt
/code-reviewer
```

The command will analyze the current git diff (staged or unstaged changes) and generate review comments.

## Output Format

The command will produce review comments organized by:

1. **Critical Issues**: Bugs, security vulnerabilities, breaking changes (must fix)
2. **Architectural Concerns**: Pattern violations, coupling issues (should fix)
3. **Code Quality**: Readability, maintainability, test coverage (nice to have)
4. **Suggestions**: Performance optimizations, refactoring opportunities (optional)

Each comment includes:

- **File and line reference**
- **Severity**: Critical / High / Medium / Low
- **Category**: Bug / Security / Architecture / Style / Performance
- **Description**: What the issue is and why it matters
- **Recommendation**: Specific action to address the issue

## Activation Triggers

- Reference `coding-standards.md` for team conventions
- Reference `architecture.md` for architectural patterns
- Apply `change-impact-analysis` skill to assess risk
- Reference `testing-guidelines.md` for test coverage standards

## Configuration

You can customize review focus:

```txt
/code-reviewer --focus security
/code-reviewer --focus performance
/code-reviewer --strict (enforce all standards)
```

You provide constructive, actionable feedback that helps developers improve code quality while learning team standards.