# Cluster NodeJS multi process with race condition problem
The problem presides in note-taking-web-app/server folder.

The express server is run in NodeJS cluster mode, meaning there is 1 master node and N child node, each child is identical and handle incoming request similarly

In a scenario, 2 child node simultaneously access an database table to modify a value (I know the source is using Postgres which has its mutex lock to handle concurrent access, but let assume our external shared resource does not have any lock protection mechanism yet (Cassandra, Redis, Shared excel file)).

Now the prevalent method for handling race condition for NodeJS will be implementing Semaphore using Atomic API (Atomic.wait(...), Atomic.notify(...), Atomic.compareExchange(...)).

But NodeJS clusters is multi-process, meaning no shared memory whatsoever (no SharedMemoryBuffer). So one potential solution I am exploring is implementing a Semaphore with a shared memory pointing to a Redis key-value pair. 

A fast searching with keywords Redis, distribute lock managment, nodejs cluster leads me to redlock algorithm.

It seems that redlock is concerned about using redis as cache when there is multiple redis replica. 

But currently I only use one redis instance, so redlock is overkill

But now is the important question:

Given express js server using ioredis library for redis connection, for the semaphore with redis as shared memory buffer to works, nodejs must provide ability to halt the execution of a process (not just thread as with Atomic.wait(...) for stopping and Atomic.notify(...) for waking threads and append it back to event queue).
Plus there must be mechanism provide by nodejs for its cluster process to listen for Signal/Events from redis, wake up process to continue execution.

Now add an Section 1: Halting & Wakeup NodeJS process in ai-insight.md to provide research output for this question.