FROM redis:latest

# Expose port 6380 instead of default 6379
EXPOSE 6380

# Use custom redis.conf
COPY redis.conf /usr/local/etc/redis/redis.conf

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]