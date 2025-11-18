// Mock the ioredis module
const Redis = require("ioredis");

jest.mock("ioredis", () => {
  return jest.fn();
});

describe('initializeRedisClient', () => {
  let mockOn;
  let mockOnce;
  let mockQuit;
  let mockRedisClient;
  let originalEnv;
  let consoleErrorSpy;
  let consoleLogSpy;
  let readyCallback;
  let errorCallback;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.REDIS_URI;
    
    // Setup console spies
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Setup mock functions
    mockOn = jest.fn().mockReturnThis();
    mockOnce = jest.fn((event, callback) => {
      if (event === 'ready') {
        readyCallback = callback;
      } else if (event === 'error') {
        errorCallback = callback;
      }
      return mockRedisClient;
    });
    mockQuit = jest.fn().mockResolvedValue('OK');
    
    // Create mock Redis client
    mockRedisClient = {
      on: mockOn,
      once: mockOnce,
      quit: mockQuit
    };
    
    // Mock Redis constructor to return our mock client
    Redis.mockImplementation(() => mockRedisClient);
    
    // Clear any previous calls
    jest.clearAllMocks();
    readyCallback = null;
    errorCallback = null;
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.REDIS_URI = originalEnv;
    } else {
      delete process.env.REDIS_URI;
    }
    
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    
    // Clear module cache to reset the redisClient variable
    jest.resetModules();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('should handle first wrong hostname - connection failure', async () => {
    // Set wrong hostname
    process.env.REDIS_URI = 'redis://wrong-hostname1:6379';
    
    // Mock connection failure
    const connectionError = new Error('getaddrinfo ENOTFOUND wrong-hostname1');

    // Import fresh module
    const redisModule = require("../redis");
    
    // Start initialization (will wait for ready/error event)
    const initPromise = redisModule.initializeRedisClient();
    
    // Trigger error callback
    if (errorCallback) {
      errorCallback(connectionError);
    }

    const result = await initPromise;

    // Assertions
    expect(Redis).toHaveBeenCalledWith('redis://wrong-hostname1:6379', expect.objectContaining({
      retryStrategy: expect.any(Function),
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    }));
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockOnce).toHaveBeenCalledWith('ready', expect.any(Function));
    expect(mockOnce).toHaveBeenCalledWith('error', expect.any(Function));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Connection to Redis failed with error:');
    expect(consoleErrorSpy).toHaveBeenCalledWith(connectionError);
    expect(result).toBeUndefined();
    
    // Verify the client creation was attempted
    expect(Redis).toHaveBeenCalledTimes(1);
  });

  test('should handle second wrong hostname - connection timeout', async () => {
    // Set second wrong hostname
    process.env.REDIS_URI = 'redis://invalid-host2:6379';
    
    // Mock connection timeout
    const timeoutError = new Error('Connection timeout');

    // Import fresh module
    const redisModule = require("../redis");
    
    // Start initialization (will wait for ready/error event)
    const initPromise = redisModule.initializeRedisClient();
    
    // Trigger error callback
    if (errorCallback) {
      errorCallback(timeoutError);
    }

    const result = await initPromise;

    // Assertions
    expect(Redis).toHaveBeenCalledWith('redis://invalid-host2:6379', expect.objectContaining({
      retryStrategy: expect.any(Function),
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    }));
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockOnce).toHaveBeenCalledWith('ready', expect.any(Function));
    expect(mockOnce).toHaveBeenCalledWith('error', expect.any(Function));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Connection to Redis failed with error:');
    expect(consoleErrorSpy).toHaveBeenCalledWith(timeoutError);
    expect(result).toBeUndefined();
    
    // Verify the client creation was attempted
    expect(Redis).toHaveBeenCalledTimes(1);
  });

  test('should successfully connect with correct hostname', async () => {
    // Set correct hostname
    process.env.REDIS_URI = 'redis://localhost:6379';

    // Import fresh module
    const redisModule = require("../redis");
    
    // Start initialization (will wait for ready/error event)
    const initPromise = redisModule.initializeRedisClient();
    
    // Trigger ready callback
    if (readyCallback) {
      readyCallback();
    }

    const result = await initPromise;

    // Assertions
    expect(Redis).toHaveBeenCalledWith('redis://localhost:6379', expect.objectContaining({
      retryStrategy: expect.any(Function),
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    }));
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockOnce).toHaveBeenCalledWith('ready', expect.any(Function));
    expect(mockOnce).toHaveBeenCalledWith('error', expect.any(Function));
    expect(consoleLogSpy).toHaveBeenCalledWith('Connected to Redis successfully!');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(result).toBe(mockRedisClient);
    
    // Verify the client creation was successful
    expect(Redis).toHaveBeenCalledTimes(1);
  });

  test('should return undefined when REDIS_URI is not set', async () => {
    // Ensure REDIS_URI is not set
    delete process.env.REDIS_URI;

    // Import fresh module
    const redisModule = require("../redis");
    const result = await redisModule.initializeRedisClient();

    // Assertions
    expect(Redis).not.toHaveBeenCalled();
    expect(mockOnce).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  test('should handle Redis client error event', async () => {
    // Set correct hostname
    process.env.REDIS_URI = 'redis://localhost:6379';

    // Import fresh module
    const redisModule = require("../redis");
    
    // Start initialization
    const initPromise = redisModule.initializeRedisClient();
    
    // Trigger ready callback
    if (readyCallback) {
      readyCallback();
    }
    
    await initPromise;

    // Verify error handler was registered
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    
    // Get the error handler function (first call to mockOn is for 'error' event)
    const errorHandlerCall = mockOn.mock.calls.find(call => call[0] === 'error');
    const errorHandler = errorHandlerCall[1];
    
    // Simulate an error
    const redisError = new Error('Redis connection lost');
    errorHandler(redisError);
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create the Redis client with error:');
    expect(consoleErrorSpy).toHaveBeenCalledWith(redisError);
  });

  test('should test redisClient variable state by testing multiple initialization calls', async () => {
    // This test verifies that the hoisted redisClient variable is properly managed
    
    // First call with correct hostname
    process.env.REDIS_URI = 'redis://localhost:6379';

    // Import fresh module
    const redisModule = require("../redis");
    
    // First initialization
    const initPromise1 = redisModule.initializeRedisClient();
    if (readyCallback) {
      readyCallback();
    }
    const result1 = await initPromise1;
    
    // Should return the client
    expect(result1).toBe(mockRedisClient);
    expect(Redis).toHaveBeenCalledTimes(1);
    
    // Clear mocks but keep the module loaded
    jest.clearAllMocks();
    readyCallback = null;
    
    // Setup mock again for second call
    mockOnce.mockImplementation((event, callback) => {
      if (event === 'ready') {
        readyCallback = callback;
      }
      return mockRedisClient;
    });
    
    // Second call should create a new client (overwriting the previous one)
    const initPromise2 = redisModule.initializeRedisClient();
    if (readyCallback) {
      readyCallback();
    }
    const result2 = await initPromise2;
    
    expect(result2).toBe(mockRedisClient);
    expect(Redis).toHaveBeenCalledTimes(1);
  });

  test('should properly manage hoisted redisClient variable state', async () => {
    // Import fresh module
    const redisModule = require("../redis");
    
    // Initially redisClient should be undefined
    expect(redisModule.getRedisClient()).toBeUndefined();
    
    // Set correct hostname and initialize
    process.env.REDIS_URI = 'redis://localhost:6379';
    
    const initPromise = redisModule.initializeRedisClient();
    if (readyCallback) {
      readyCallback();
    }
    const result = await initPromise;
    
    // After initialization, the hoisted redisClient variable should be set
    expect(redisModule.getRedisClient()).toBe(mockRedisClient);
    expect(result).toBe(mockRedisClient);
    
    // Test with connection failure - client should still be set but connection fails
    jest.clearAllMocks();
    readyCallback = null;
    errorCallback = null;
    
    // Setup mock again
    mockOnce.mockImplementation((event, callback) => {
      if (event === 'ready') {
        readyCallback = callback;
      } else if (event === 'error') {
        errorCallback = callback;
      }
      return mockRedisClient;
    });
    
    process.env.REDIS_URI = 'redis://wrong-host:6379';
    const connectionError = new Error('Connection failed');
    
    const failedInitPromise = redisModule.initializeRedisClient();
    if (errorCallback) {
      errorCallback(connectionError);
    }
    const failedResult = await failedInitPromise;
    
    // Function returns undefined due to connection failure
    expect(failedResult).toBeUndefined();
    // But the hoisted redisClient variable is still set to the client object
    expect(redisModule.getRedisClient()).toBe(mockRedisClient);
  });

  test('should successfully close Redis client', async () => {
    // Set correct hostname
    process.env.REDIS_URI = 'redis://localhost:6379';

    // Import fresh module
    const redisModule = require("../redis");
    
    // Initialize
    const initPromise = redisModule.initializeRedisClient();
    if (readyCallback) {
      readyCallback();
    }
    await initPromise;
    
    // Verify client is set
    expect(redisModule.getRedisClient()).toBe(mockRedisClient);
    
    // Close the client
    await redisModule.closeRedisClient();
    
    // Verify quit was called
    expect(mockQuit).toHaveBeenCalled();
    
    // Verify client is now undefined
    expect(redisModule.getRedisClient()).toBeUndefined();
  });
});