# ---- Build stage ----
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# ---- Run stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Cloud Run injects PORT (default 8080); server.port=${PORT:8080} reads it.
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod

# MaxRAMPercentage makes the JVM respect the container memory limit (e.g. 512Mi
# on Cloud Run) instead of guessing, preventing OOM kills on small instances.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
