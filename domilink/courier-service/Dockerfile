# ============================================================
# DomiLink - Courier Service Dockerfile
# ============================================================

FROM maven:3.9.5-eclipse-temurin-17-alpine AS builder

WORKDIR /build
COPY pom.xml /build/parent-pom.xml
COPY courier-service/pom.xml /build/courier-service/pom.xml
RUN mkdir -p /build/courier-service/src/main/java
RUN mvn -f parent-pom.xml dependency:go-offline -pl courier-service --no-transfer-progress || true
COPY courier-service/src /build/courier-service/src
RUN mvn -f parent-pom.xml clean package -pl courier-service -DskipTests --no-transfer-progress

FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="DomiLink"
LABEL service="courier-service"
LABEL version="1.0.0"

RUN addgroup -S domilink && adduser -S domilink -G domilink
WORKDIR /app
COPY --from=builder /build/courier-service/target/*.jar app.jar
RUN chown domilink:domilink app.jar
USER domilink

EXPOSE 8083

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8083/actuator/health || exit 1

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
