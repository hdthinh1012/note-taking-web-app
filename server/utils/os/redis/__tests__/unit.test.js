const { createClient } = require("redis");

// Mock the redis module
jest.mock("redis", () => ({
  createClient: jest.fn()
}));

describe('initializeRedisClient', () => {
  let mockConnect;
  let mockOn;
  let mockRedisClient;
  let originalEnv;
  let consoleErrorSpy;
  let consoleLogSpy;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.REDIS_URI;
    
    // Setup console spies
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Setup mock functions
    mockConnect = jest.fn();
    mockOn = jest.fn().mockReturnThis();
    
    // Create mock Redis client
    mockRedisClient = {
      connect: mockConnect,
      on: mockOn
    };
    
    // Mock createClient to return our mock client
    require("redis").createClient.mockReturnValue(mockRedisClient);
    
    // Clear any previous calls
    jest.clearAllMocks();
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
    mockConnect.mockRejectedValue(connectionError);

    // Import fresh module
    const redisModule = require("../redis");
    const result = await redisModule.initializeRedisClient();

    // Assertions
    expect(require("redis").createClient).toHaveBeenCalledWith({ url: 'redis://wrong-hostname1:6379' });
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockConnect).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Connection to Redis failed with error:');
    expect(consoleErrorSpy).toHaveBeenCalledWith(connectionError);
    expect(result).toBeUndefined();
    
    // Verify the client creation was attempted
    expect(require("redis").createClient).toHaveBeenCalledTimes(1);
  });

  test('should handle second wrong hostname - connection timeout', async () => {
    // Set second wrong hostname
    process.env.REDIS_URI = 'redis://invalid-host2:6379';
    
    // Mock connection timeout
    const timeoutError = new Error('Connection timeout');
    mockConnect.mockRejectedValue(timeoutError);

    // Import fresh module
    const redisModule = require("../redis");
    const result = await redisModule.initializeRedisClient();

    // Assertions
    expect(require("redis").createClient).toHaveBeenCalledWith({ url: 'redis://invalid-host2:6379' });
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockConnect).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Connection to Redis failed with error:');
    expect(consoleErrorSpy).toHaveBeenCalledWith(timeoutError);
    expect(result).toBeUndefined();
    
    // Verify the client creation was attempted
    expect(require("redis").createClient).toHaveBeenCalledTimes(1);
  });

  test('should successfully connect with correct hostname', async () => {
    // Set correct hostname
    process.env.REDIS_URI = 'redis://localhost:6379';
    
    // Mock successful connection
    mockConnect.mockResolvedValue();

    // Import fresh module
    const redisModule = require("../redis");
    const result = await redisModule.initializeRedisClient();

    // Assertions
    expect(require("redis").createClient).toHaveBeenCalledWith({ url: 'redis://localhost:6379' });
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockConnect).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('Connected to Redis successfully!');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(result).toBe(mockRedisClient);
    
    // Verify the client creation was successful
    expect(require("redis").createClient).toHaveBeenCalledTimes(1);
  });

  test('should return undefined when REDIS_URI is not set', async () => {
    // Ensure REDIS_URI is not set
    delete process.env.REDIS_URI;

    // Import fresh module
    const redisModule = require("../redis");
    const result = await redisModule.initializeRedisClient();

    // Assertions
    expect(require("redis").createClient).not.toHaveBeenCalled();
    expect(mockConnect).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  test('should handle Redis client error event', async () => {
    // Set correct hostname
    process.env.REDIS_URI = 'redis://localhost:6379';
    
    // Mock successful connection
    mockConnect.mockResolvedValue();

    // Import fresh module
    const redisModule = require("../redis");
    await redisModule.initializeRedisClient();

    // Verify error handler was registered
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    
    // Get the error handler function
    const errorHandler = mockOn.mock.calls[0][1];
    
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
    mockConnect.mockResolvedValue();

    // Import fresh module
    const redisModule = require("../redis");
    const result1 = await redisModule.initializeRedisClient();
    
    // Should return the client
    expect(result1).toBe(mockRedisClient);
    expect(require("redis").createClient).toHaveBeenCalledTimes(1);
    
    // Clear mocks but keep the module loaded
    jest.clearAllMocks();
    mockConnect.mockResolvedValue();
    
    // Second call should create a new client (overwriting the previous one)
    const result2 = await redisModule.initializeRedisClient();
    
    expect(result2).toBe(mockRedisClient);
    expect(require("redis").createClient).toHaveBeenCalledTimes(1);
  });

  test('should properly manage hoisted redisClient variable state', async () => {
    // Import fresh module
    const redisModule = require("../redis");
    
    // Initially redisClient should be undefined
    expect(redisModule.getRedisClient()).toBeUndefined();
    
    // Set correct hostname and initialize
    process.env.REDIS_URI = 'redis://localhost:6379';
    mockConnect.mockResolvedValue();
    
    const result = await redisModule.initializeRedisClient();
    
    // After initialization, the hoisted redisClient variable should be set
    expect(redisModule.getRedisClient()).toBe(mockRedisClient);
    expect(result).toBe(mockRedisClient);
    
    // Test with connection failure - client should still be set but connection fails
    jest.clearAllMocks();
    process.env.REDIS_URI = 'redis://wrong-host:6379';
    const connectionError = new Error('Connection failed');
    mockConnect.mockRejectedValue(connectionError);
    
    const failedResult = await redisModule.initializeRedisClient();
    
    // Function returns undefined due to connection failure
    expect(failedResult).toBeUndefined();
    // But the hoisted redisClient variable is still set to the client object
    expect(redisModule.getRedisClient()).toBe(mockRedisClient);
  });
});