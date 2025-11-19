FROM redis:latest

# Podman-compatible: Use standard user (redis runs as root by default in container)
USER root

# Expose port 6380 instead of default 6379
EXPOSE 6380

# Use custom redis.conf
COPY redis.conf /usr/local/etc/redis/redis.conf

# Ensure proper permissions for Podman
RUN chmod 644 /usr/local/etc/redis/redis.conf

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]