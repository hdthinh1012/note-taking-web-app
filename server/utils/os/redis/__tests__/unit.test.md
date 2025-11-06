# Redis Client Unit Tests Documentation

## Overview
This document explains the intention and purpose of all 7 test cases for the `initializeRedisClient` function in the Redis utility module.

## Test Cases

### 1. First Wrong Hostname - Connection Failure
**Test Name:** `should handle first wrong hostname - connection failure`

**Intention:**
- Test the function's behavior when provided with an invalid hostname that causes DNS resolution failure
- Verify that the function gracefully handles `ENOTFOUND` errors (host not found)
- Ensure proper error logging occurs when connection fails
- Confirm that the function returns `undefined` when connection fails
- Validate that Redis client creation is attempted even with wrong hostname

**Scenario:**
- Sets `REDIS_URI` to `redis://wrong-hostname1:6379`
- Mocks `connect()` to reject with DNS resolution error
- Expects error messages to be logged to console
- Expects function to return `undefined`

### 2. Second Wrong Hostname - Connection Timeout
**Test Name:** `should handle second wrong hostname - connection timeout`

**Intention:**
- Test the function's behavior with a different type of connection failure (timeout)
- Verify that the function handles various types of connection errors consistently
- Ensure error handling is robust across different failure scenarios
- Confirm proper error logging for timeout scenarios

**Scenario:**
- Sets `REDIS_URI` to `redis://invalid-host2:6379`
- Mocks `connect()` to reject with connection timeout error
- Expects timeout error messages to be logged
- Expects function to return `undefined`

### 3. Successful Connection with Correct Hostname
**Test Name:** `should successfully connect with correct hostname`

**Intention:**
- Test the happy path when Redis connection is successful
- Verify that the function works correctly with a valid Redis URL
- Ensure success message is logged when connection succeeds
- Confirm that the function returns the Redis client instance on success
- Validate that no error messages are logged during successful connection

**Scenario:**
- Sets `REDIS_URI` to `redis://localhost:6379` (correct hostname)
- Mocks `connect()` to resolve successfully
- Expects success message to be logged
- Expects function to return the mock Redis client
- Expects no error logs

### 4. Missing Environment Variable
**Test Name:** `should return undefined when REDIS_URI is not set`

**Intention:**
- Test the function's behavior when the required environment variable is missing
- Verify that the function fails gracefully when configuration is incomplete
- Ensure no Redis client creation attempts are made without proper configuration
- Confirm that no console messages are logged when REDIS_URI is absent

**Scenario:**
- Deletes/unsets the `REDIS_URI` environment variable
- Expects no Redis client creation attempts
- Expects no console output
- Expects function to return `undefined`

### 5. Redis Client Error Event Handling
**Test Name:** `should handle Redis client error event`

**Intention:**
- Test the error event handler that's attached to the Redis client
- Verify that runtime Redis errors (after initial connection) are properly logged
- Ensure the error handler function is correctly registered with the Redis client
- Validate that Redis client errors are captured and logged appropriately

**Scenario:**
- Sets up successful connection
- Verifies error handler registration with `client.on('error', handler)`
- Simulates a Redis runtime error by calling the error handler
- Expects error messages to be logged when Redis client encounters errors

### 6. Multiple Initialization Calls
**Test Name:** `should test redisClient variable state by testing multiple initialization calls`

**Intention:**
- Test the function's behavior when called multiple times
- Verify that subsequent calls properly overwrite the previous client instance
- Ensure the function can be called repeatedly without issues
- Test the module's state management across multiple function invocations

**Scenario:**
- Calls `initializeRedisClient()` twice with successful connection setup
- Verifies that each call creates a new Redis client
- Ensures function works correctly on repeated invocations

### 7. Hoisted Variable State Management
**Test Name:** `should properly manage hoisted redisClient variable state`

**Intention:**
- **Primary Test for Hoisted Variable:** Test the module-level `redisClient` variable state
- Verify that the hoisted variable is properly updated when the function runs
- Test different scenarios (success, failure) and their impact on the variable state
- Ensure the variable starts as `undefined` and gets updated appropriately
- Validate that even failed connections still set the client object (as per original code logic)

**Scenario:**
- Tests initial state (should be `undefined`)
- Tests state after successful initialization (should be set to client)
- Tests state after failed connection (client object is still set, but connection fails)
- Uses `getRedisClient()` helper function to access the current state of the hoisted variable

## Key Testing Strategies

### Mock Usage
- **Redis Module Mocking:** Uses Jest to mock the entire `redis` module
- **Function Mocking:** Mocks `createClient`, `connect`, and `on` methods
- **Console Mocking:** Mocks `console.log` and `console.error` to verify logging behavior

### Environment Management
- **Environment Variable Testing:** Manipulates `process.env.REDIS_URI` for different scenarios
- **Clean State:** Each test starts with a clean environment and fresh module imports

### Error Simulation
- **Different Error Types:** Tests various error scenarios (DNS failure, timeout, runtime errors)
- **Error Propagation:** Verifies errors are properly caught and logged

### State Verification
- **Return Values:** Tests function return values for all scenarios
- **Side Effects:** Verifies console logging and variable state changes
- **Module State:** Tests the hoisted `redisClient` variable using a getter function

## Testing Philosophy

These tests follow the **AAA pattern** (Arrange, Act, Assert):
- **Arrange:** Set up environment variables, mocks, and test data
- **Act:** Call the `initializeRedisClient()` function
- **Assert:** Verify return values, console output, and state changes

The tests provide comprehensive coverage of:
- ✅ Happy path (successful connection)
- ✅ Error paths (various failure scenarios)
- ✅ Edge cases (missing configuration)
- ✅ State management (hoisted variable behavior)
- ✅ Event handling (Redis client error events)
- ✅ Repeated usage (multiple function calls)
