# Project Rules and Memories Summary

## Overview
This document consolidates the established rules, preferences, and memories for the CBC3 project based on user interactions and project patterns.

## Development Workflow Rules

### Build and Deployment Process
- **Always run `npm run build`** before committing any changes
- **Iteratively fix all build issues** before proceeding
- **Commit with detailed comments** describing what was changed
- **Push to repository** after successful build
- **Ask user to test and verify** by listing out pages in the UI after deployment
- **Use Vercel deployments** - triggered by git push (no need for `npx vercel --prod`)
- **Check deployments** with `npx vercel ls` after pushing

### Code Quality Standards
- **No mock or placeholder implementations** - all code must be fully implemented and testable
- **Complete all items** in implementation plans before testing
- **No deferring or parking work** without explicit user agreement
- **Follow Service-Oriented Architecture (SOA) principles** - this is non-negotiable
- **Remove excessive logging** that may reveal undesired information
- **Clean up unused imports and variables** after changes

## User Preferences

### Communication Style
- **Ask clarifying questions** when something is missing or uncertain
- **Check if components need to be created** before proceeding
- **Summarize everything** you will do and wait for user confirmation before proceeding
- **Ask for user's point of view** before making major application-wide or radical changes
- **Perform deep, nested codebase analysis** with meaty validation details rather than superficial analysis
- **Work iteratively, one item at a time** rather than making bulk changes

### Data and Security
- **Ask before showing or accessing data from tables**
- **File management interfaces** should always show only metadata and defer file previews to later
- **Never hard-code credentials** - use environment variables or secure storage
- **Never check runtime logs** - user prefers not to access them
- **Ask before changing any configuration** without checking first

### Testing Approach
- **All testing is manual end-to-end UI-based testing** - no unit or integration tests
- **Wait for user confirmation** before proceeding with testing
- **Test on production server** at `cbc3.vercel.com` instead of localhost
- **Check with user** after completing each item to test and confirm it works before marking complete

## Project-Specific Conventions

### Architecture Patterns
- **Service-Oriented Architecture (SOA)** - mandatory for all services
- **Dependency injection** for service initialization
- **Singleton pattern** for service instances
- **Centralized ServiceFactory** for service management

### File Management
- **Document which files are being changed** when creating migration to-do files
- **Do not delete to-do files** at the end of migrations
- **Use absolute paths** when possible for tool call arguments

### Nostr Implementation
- **Follow NIP standards** for Nostr protocol implementation
- **Use proper event kinds** (0 for profiles, 3 for contact lists, 23 for long-form content, 1111 for comments)
- **Implement proper event signing** and validation
- **Use RelayManager** for all relay communications

## Error Handling and Debugging

### Investigation Approach
- **Investigate underlying issues** and avoid short-term fixes when diagnosing problems
- **Ask clarifying questions** when something is missing or uncertain
- **Check if components need to be created** before proceeding

### Build and Runtime Issues
- **Kill previous instances** before running `npm run dev` each time
- **Fix all build issues iteratively** before committing
- **Use production URLs** for testing API endpoints instead of localhost

## Code Organization

### Component Structure
- **Reusable components** for common UI patterns (UserDisplay, UserDisplayCompact)
- **Custom hooks** for data fetching and state management
- **Service layer** for business logic and external API calls
- **Type definitions** for all data structures

### Documentation
- **Create comprehensive documentation** for complex features
- **Include implementation details** and usage examples
- **Document NIP implementations** and protocol compliance
- **Maintain up-to-date architecture documentation**

## Quality Assurance

### Code Review Process
- **Clearly state which functionalities** have been implemented and which are still missing
- **Provide detailed validation** for each implementation item
- **Show evidence** of NIP compliance and protocol adherence
- **Verify all changes** work as expected before marking complete

### Testing Verification
- **Manual UI testing** on production deployment
- **Verify all pages** are accessible and functional
- **Test API endpoints** using production URLs
- **Confirm user workflows** work end-to-end

## Security Considerations

### Authentication and Authorization
- **Use secure authentication methods** (nsec, signer)
- **Implement proper session management**
- **Validate all user inputs** and event data
- **Use environment variables** for sensitive configuration

### Data Protection
- **Encrypt sensitive data** in transit and at rest
- **Implement proper access controls**
- **Use secure storage** for private keys and credentials
- **Follow privacy best practices** for user data

## Maintenance and Updates

### Regular Tasks
- **Review and update** this document as new patterns emerge
- **Clean up unused code** and dependencies
- **Update documentation** when making significant changes
- **Monitor production deployments** for issues

### Version Control
- **Use descriptive commit messages** that explain what was changed
- **Create feature branches** for major changes
- **Tag releases** with meaningful version numbers
- **Maintain clean git history**

## Emergency Procedures

### Critical Issues
- **Immediately investigate** any production issues
- **Provide detailed error analysis** and proposed solutions
- **Test fixes thoroughly** before deploying
- **Communicate status** to user throughout resolution process

### Rollback Procedures
- **Maintain ability to rollback** to previous working state
- **Document rollback procedures** for each major feature
- **Test rollback procedures** regularly
- **Keep backup of critical data** and configurations

---

*This document is maintained by the development team and should be updated as new patterns and preferences are established through user interactions.*
