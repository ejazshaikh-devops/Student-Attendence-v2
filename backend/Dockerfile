# ── Stage 1: BUILD ──────────────────────────────────────────
# This image already has BOTH Maven AND JDK 21 installed
# No need to install anything manually
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml first
# Docker caches this layer — only re-downloads dependencies
# if pom.xml changes, not every time you change Java code
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Now copy source code and build the JAR
COPY src ./src
RUN mvn clean package -DskipTests

# ── Stage 2: RUN ─────────────────────────────────────────────
# Only JRE needed to run — no Maven, no JDK
# Result: ~200MB image instead of ~600MB
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=builder /app/target/attendance-backend-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]