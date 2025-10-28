# UserService Testing Documentation

## Overview

The UserService has been refactored to separate business logic from routes, enabling comprehensive unit testing with Jest.

## Architecture

### Controller Pattern

- **File**: `controllers/userController.js`
- **Pattern**: Factory function with dependency injection
- **Dependencies**: `pool`, `bcrypt`, `jwt`, `otpStore`, `sendEmail`
- **Handlers**: 17 functions covering authentication, user management, password reset, and employee management

### Routes

- **File**: `routes/userRoutes.js`
- **Pattern**: Factory function accepting controller and middleware
- **Endpoints**: Authentication, user CRUD, password management, employee management

### Main Application

- **File**: `index.js`
- **Responsibilities**:
  - Initialize dependencies
  - Create controller instance
  - Mount routes
  - Start server

## Test Suite

### Coverage Statistics

- **Statements**: 91.94%
- **Branches**: 81.81%
- **Functions**: 100%
- **Lines**: 91.78%
- **Total Tests**: 47 passed

### Test Categories

#### 1. Authentication (9 tests)

- **signup**: User registration with validation

  - Default role assignment
  - Custom role specification
  - Duplicate email detection
  - Duplicate phone detection
  - Generic error handling

- **login**: User authentication
  - Successful login with JWT token generation
  - Email not found
  - Incorrect password
  - Database errors

#### 2. User Management (11 tests)

- **getAllUsers**: Retrieve all users with role "user"

  - Successful retrieval
  - Error handling

- **getUserById**: Get specific user details

  - User found
  - User not found
  - Database errors

- **updateUser**: Update user information

  - Successful update
  - User not found
  - Duplicate email
  - Duplicate phone

- **changePassword**: Password change functionality
  - Successful password change
  - Unauthorized access (different user)
  - User not found
  - Incorrect old password

#### 3. Password Reset (13 tests)

- **sendOTP**: Send OTP to email

  - Successful OTP generation and email sending
  - Missing email
  - Email not found
  - Email service errors

- **verifyOTP**: Validate OTP

  - Successful verification
  - Missing fields
  - OTP not found
  - Expired OTP
  - Incorrect OTP

- **resetPassword**: Reset password with OTP
  - Successful password reset
  - Missing required fields
  - OTP not found
  - Expired OTP
  - Incorrect OTP
  - User not found

#### 4. Employee Management (14 tests)

- **createEmployee**: Create new employee account

  - Successful creation
  - Invalid role (non-employee)
  - Duplicate email

- **updateEmployee**: Update employee information

  - Successful update
  - Employee not found

- **deleteEmployee**: Remove employee

  - Successful deletion
  - Employee not found
  - Database errors

- **getAllEmployees**: Retrieve all employees
  - Successful retrieval
  - Error handling

## Running Tests

### Run all tests

```powershell
npm test
```

### Run tests in watch mode

```powershell
npm run test:watch
```

### Run tests with coverage report

```powershell
npm run test:coverage
```

## Mocking Strategy

### Database (pg Pool)

```javascript
mockPool = {
  query: jest.fn(),
};
```

- Mocks SQL queries
- Returns configurable result sets
- Simulates errors (constraint violations, connection issues)

### Bcrypt

```javascript
mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};
```

- Mocks password hashing
- Mocks password comparison

### JWT

```javascript
mockJwt = {
  sign: jest.fn(),
};
```

- Mocks token generation

### OTP Store

```javascript
mockOtpStore = new Map();
```

- Real Map instance for OTP storage
- Tests OTP expiration logic

### Email Service

```javascript
mockSendEmail = jest.fn();
```

- Mocks email sending
- Tests email service failures

## Key Testing Patterns

### 1. Success Path Testing

Tests verify that handlers return correct responses with proper status codes when operations succeed.

### 2. Error Handling Testing

Tests verify that handlers:

- Return appropriate HTTP status codes (400, 401, 403, 404, 500)
- Return descriptive error messages
- Handle database constraint violations
- Handle service failures

### 3. Authorization Testing

Tests verify that:

- Users can only change their own password
- Role-based restrictions are enforced

### 4. Validation Testing

Tests verify:

- Required field validation
- Email/phone uniqueness constraints
- Role validation for employee creation
- OTP expiration and validation

### 5. State Management Testing

Tests verify:

- OTP storage and cleanup
- Multiple query operations (SELECT then UPDATE)
- Transaction-like operations

## Benefits

1. **Testability**: Factory pattern with dependency injection allows full isolation
2. **Coverage**: 91.94% statement coverage ensures code reliability
3. **Maintainability**: Clear separation of concerns
4. **Documentation**: Tests serve as living documentation
5. **Confidence**: 47 tests covering all critical paths

## Uncovered Lines

Lines 143, 181, 276, 328-334, 374-383 are not covered. These are minor edge cases in error handling that could be added in future test iterations.

## Future Enhancements

- Test email content validation
- Test OTP cleanup mechanisms
- Test concurrent OTP requests
- Integration tests with real database
- Performance testing for bulk operations
