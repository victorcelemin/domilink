# ============================================================
# DomiLink - API Gateway Dockerfile
# Multi-stage build para imagen ligera en produccion
# ============================================================

# Stage 1: Build
FROM maven:3.9.5-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copiar pom padre y todos los pom de modulos (necesario para resolver el parent)
COPY pom.xml /build/pom.xml
COPY api-gateway/pom.xml /build/api-gateway/pom.xml
COPY auth-service/pom.xml /build/auth-service/pom.xml
COPY company-service/pom.xml /build/company-service/pom.xml
COPY courier-service/pom.xml /build/courier-service/pom.xml
COPY order-service/pom.xml /build/order-service/pom.xml

# Crear estructura minima de src para que Maven no se queje
RUN mkdir -p /build/api-gateway/src/main/java \
    && mkdir -p /build/auth-service/src/main/java \
    && mkdir -p /build/company-service/src/main/java \
    && mkdir -p /build/courier-service/src/main/java \
    && mkdir -p /build/order-service/src/main/java

# Descargar dependencias (se cachea si no cambia el pom)
RUN mvn dependency:go-offline -pl api-gateway --no-transfer-progress || true

# Copiar el codigo fuente del servicio
COPY api-gateway/src /build/api-gateway/src

# Compilar y empaquetar solo este modulo
RUN mvn clean package -pl api-gateway -DskipTests --no-transfer-progress

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="DomiLink"
LABEL service="api-gateway"
LABEL version="1.0.0"

RUN addgroup -S domilink && adduser -S domilink -G domilink

WORKDIR /app

COPY --from=builder /build/api-gateway/target/*.jar app.jar

RUN chown domilink:domilink app.jar

USER domilink

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
