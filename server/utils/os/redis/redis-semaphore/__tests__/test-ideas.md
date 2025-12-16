# Test idea
- Generate a txt file with simple 0 value, this will be our critical resource without any locking mechanism protection
# Test cases:
## Test suite 1: 2 process with binary semaphore
Before All:
- Create 1 parent process, 2 slave processes
- Parent process initialize redis client at http://localhost:6379
- Parent process setup a unprotected lock file, file with value 0
- 2 Slave processes each initialize semaphore
Before Each:
- ...
Individual test 1:
- Process 1: wait for 1 second
- Process 2: wait for 2 second
- Process 1: run acquire_write
    - Use semaphore acquire
    - Read the string from file
    - Wait for 2s
    - Append the 'c' chacacter to string
    - Write back to files
- Process 2: run acquire_write (but now append letter 'u')
- Assert that the file content now appended with 'cu'
After All:
- Clean the file content 
- Clean the redis
## Test suite 2: 2 process without binary semaphore
Before All:
- Create 1 parent process, 2 slave processes
- Parent process initialize redis client at http://localhost:6379
- Parent process setup a unprotected lock file, file with value 0
- 2 Slave processes do not initialize semaphore
Before Each:
- ...
Individual test 1:
- Process 1: wait for 1 second
- Process 2: wait for 2 second
- Process 1: run _write
    - Use semaphore acquire
    - Read the string from file
    - Wait for 2s
    - Append the 'c' chacacter to string
    - Write back to files
- Process 2: run _write (but now append letter 'u')
- Assert that the file content now appended with 'u'
After All:
- Clean the file content 
- Clean the redis