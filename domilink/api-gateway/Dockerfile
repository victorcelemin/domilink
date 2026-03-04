# ============================================================
# DomiLink - API Gateway Dockerfile
# Multi-stage build para imagen ligera en produccion
# ============================================================

# Stage 1: Build
FROM maven:3.9.5-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copiar pom padre y pom del servicio (para cache de dependencias)
COPY pom.xml /build/parent-pom.xml
COPY api-gateway/pom.xml /build/api-gateway/pom.xml

# Crear estructura minima para que Maven pueda resolver el parent
RUN mkdir -p /build/api-gateway/src/main/java

# Descargar dependencias (se cachea si no cambia el pom)
WORKDIR /build
RUN mvn -f parent-pom.xml dependency:go-offline -pl api-gateway --no-transfer-progress || true

# Copiar el codigo fuente
COPY api-gateway/src /build/api-gateway/src

# Compilar y empaquetar
RUN mvn -f parent-pom.xml clean package -pl api-gateway -DskipTests --no-transfer-progress

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

# Metadatos
LABEL maintainer="DomiLink"
LABEL service="api-gateway"
LABEL version="1.0.0"

# Usuario no-root por seguridad
RUN addgroup -S domilink && adduser -S domilink -G domilink

WORKDIR /app

# Copiar el JAR desde el stage de build
COPY --from=builder /build/api-gateway/target/*.jar app.jar

# Cambiar propietario
RUN chown domilink:domilink app.jar

USER domilink

# Puerto expuesto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

# Configuracion JVM optimizada para contenedores
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
