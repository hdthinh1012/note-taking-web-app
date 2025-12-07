FROM redis:latest

# Podman-compatible: Use standard user (redis runs as root by default in container)
USER root

# Expose port 6379
EXPOSE 6379

# Use custom redis.conf
COPY redis.conf /usr/local/etc/redis/redis.conf

# Ensure proper permissions for Podman
RUN chmod 644 /usr/local/etc/redis/redis.conf

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]