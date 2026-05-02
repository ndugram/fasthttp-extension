# Security Policy

## 🔒 Reporting Security Vulnerabilities

We take the security of FastHTTP Extension seriously. If you discover a security vulnerability, please report it responsibly.

### 📧 How to Report

**Do NOT** create public GitHub issues for security vulnerabilities.

Instead, please email us directly at: **n7for8572@gmail.com**

### 📝 What to Include

Please include the following information in your report:

- **Description** - A clear description of the vulnerability
- **Reproduction** - Steps to reproduce the issue
- **Impact** - Potential impact of the vulnerability
- **Environment** - VS Code version, OS, extension version
- **Proof of Concept** - If applicable, provide a proof of concept

### 🕐 Response Timeline

- **Initial Response** - Within 48 hours
- **Investigation** - Within 7 days
- **Resolution** - Timeline depends on complexity, typically 30-90 days
- **Public Disclosure** - Coordinated disclosure after fix

## 🛡️ Security Measures

### Extension Security

- **Input Validation** - All user inputs (project name, folder path) are validated before use
- **No Remote Code Execution** - Extension only creates files locally; no network requests are made
- **No Credential Storage** - Extension stores no secrets, tokens, or credentials
- **Filesystem Scope** - Only writes to the user-selected folder

### Dependencies

We monitor our dependencies for security vulnerabilities:

- **@types/vscode** - VS Code API types (dev only)
- **typescript** - TypeScript compiler (dev only)

No runtime dependencies with network access.

## 🔍 Security Best Practices

### For Users

#### 1. Keep Updated

Search **FastHTTP** in the Extensions panel and update to the latest version.

#### 2. Review Generated Files

The extension generates `main.py`, `requirements.txt`, and `pyproject.toml`. Always review generated files before running them.

#### 3. Secure Your FastHTTP Projects

```python
# ✅ Good: Use environment variables
import os
app = FastHTTP(
    get_request={
        "headers": {"Authorization": f"Bearer {os.getenv('API_TOKEN')}"},
        "timeout": 10,
    },
)

# ❌ Bad: Hardcoded credentials
app = FastHTTP(
    get_request={
        "headers": {"Authorization": "Bearer my-secret-token"},
    },
)
```

#### 4. Disable Debug in Production

```python
# Production
app = FastHTTP(debug=False)

# Development only
app = FastHTTP(debug=True)
```

### For Developers

#### 1. Development Environment

```bash
git clone https://github.com/ndugram/fasthttp-extension
cd fasthttp-extension
npm install
```

#### 2. Security Testing

```bash
npm audit
```

#### 3. Code Review Checklist

- [ ] No hardcoded credentials
- [ ] Input validation present for all user-provided values
- [ ] No arbitrary file writes outside the user-selected folder
- [ ] Dependencies are up to date and audited

## 🚨 Known Security Considerations

### 1. Project Name Validation

**Constraint**: Project names are validated with `/^[a-zA-Z0-9_-]+$/` to prevent path traversal.

**Do not** modify this validation when contributing.

### 2. Folder Selection

**Constraint**: The extension only writes files inside the folder explicitly selected by the user via the native OS dialog.

### 3. No Arbitrary Command Execution

The extension does not execute any shell commands or scripts. It only creates files.

## 🔄 Security Updates

Watch the GitHub repository or subscribe to releases to receive notifications about security updates.

## 📊 Security Audit

### Last Audit Date

- **Date**: May 2026
- **Scope**: Extension logic, input validation, filesystem access
- **Result**: No critical vulnerabilities found
- **Next Audit**: November 2026

### Audit Scope

- [x] Input validation
- [x] Filesystem access scope
- [x] Dependency security
- [x] No network requests from extension itself

## 🆘 Emergency Procedures

### Critical Vulnerability Response

1. **Immediate Assessment** - Within 4 hours
2. **Emergency Patch** - Within 24 hours
3. **Security Advisory** - Within 48 hours
4. **Public Disclosure** - After patch deployment

### Contact Information

- **Security Email**: n7for8572@gmail.com
- **Maintainer**: @ndugram (GitHub)
- **Response Time**: 48 hours maximum

## 📋 Security Checklist

### For Contributors

- [ ] No credentials in code
- [ ] Input validation implemented
- [ ] No new filesystem writes outside user-selected folder
- [ ] No new network requests added
- [ ] Dependencies audited with `npm audit`

### For Users

- [ ] Using latest extension version
- [ ] Generated project reviewed before running
- [ ] Environment variables used for secrets in FastHTTP apps
- [ ] `debug=False` set in production FastHTTP apps

## 🔗 Useful Resources

### Security Tools

- **npm audit** - Dependency vulnerability scanner
- **VS Code Extension Security** - [Extension security best practices](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#security)

### Best Practices

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

---

**Thank you for helping keep FastHTTP Extension secure!** 🔒

If you have questions about this security policy, please contact us at n7for8572@gmail.com
