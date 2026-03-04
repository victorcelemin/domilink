#!/usr/bin/env bash
# ============================================================
# DomiLink - Script de Build y Analisis Maestro
# Ejecutar: ./build.sh [opcion]
# ============================================================
# Opciones:
#   ./build.sh              -> Analiza y construye todo
#   ./build.sh backend      -> Solo backend (Maven + Docker)
#   ./build.sh web          -> Solo version web (Expo)
#   ./build.sh mobile       -> Solo APK de Android
#   ./build.sh analyze      -> Solo analisis de codigo
#   ./build.sh start        -> Levantar todo con Docker localmente
#   ./build.sh clean        -> Limpiar artefactos de build
# ============================================================

set -euo pipefail

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/domilink"
MOBILE_DIR="$SCRIPT_DIR/domilink-mobile"
BUILD_LOG="$SCRIPT_DIR/build-$(date +%Y%m%d-%H%M%S).log"
ERRORS=0
WARNINGS=0
START_TIME=$(date +%s)

# ============================================================
# Funciones de utilidad
# ============================================================
log() { echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$BUILD_LOG"; }
ok()  { echo -e "${GREEN}[OK]${NC}   $1" | tee -a "$BUILD_LOG"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$BUILD_LOG"; ((WARNINGS++)) || true; }
err() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$BUILD_LOG"; ((ERRORS++)) || true; }
step(){ echo -e "\n${BOLD}${CYAN}==> $1${NC}" | tee -a "$BUILD_LOG"; }
separator() { echo -e "${CYAN}$(printf '=%.0s' {1..60})${NC}"; }

print_header() {
  separator
  echo -e "${BOLD}${BLUE}"
  echo "  ____                _ _     _       _    "
  echo " |  _ \  ___  _ __ ___ (_) |   (_)_ __ | | __"
  echo " | | | |/ _ \| '_ \` _ \| | |   | | '_ \| |/ /"
  echo " | |_| | (_) | | | | | | | |___| | | | |   < "
  echo " |____/ \___/|_| |_| |_|_|_____|_|_| |_|_|\_\\"
  echo -e "${NC}"
  echo -e "  ${BOLD}Build Script v1.0${NC} - $(date)"
  echo -e "  Log: $BUILD_LOG"
  separator
}

elapsed_time() {
  local end=$(date +%s)
  local diff=$((end - START_TIME))
  echo "$((diff / 60))m $((diff % 60))s"
}

print_summary() {
  local end=$(date +%s)
  separator
  echo -e "${BOLD}RESUMEN DEL BUILD${NC}"
  separator
  echo -e "Tiempo total: $(elapsed_time)"
  echo -e "Errores:   ${RED}$ERRORS${NC}"
  echo -e "Advertencias: ${YELLOW}$WARNINGS${NC}"
  if [ "$ERRORS" -eq 0 ]; then
    echo -e "\nEstado: ${GREEN}${BOLD}BUILD EXITOSO${NC}"
  else
    echo -e "\nEstado: ${RED}${BOLD}BUILD CON ERRORES${NC}"
  fi
  separator
}

check_dependency() {
  local cmd=$1
  local name=${2:-$1}
  local install_hint=${3:-""}
  if command -v "$cmd" &>/dev/null; then
    ok "$name disponible ($(command -v $cmd))"
    return 0
  else
    if [ -n "$install_hint" ]; then
      warn "$name no encontrado. $install_hint"
    else
      warn "$name no encontrado - algunas funciones no estaran disponibles"
    fi
    return 1
  fi
}

# ============================================================
# Verificacion de prerequisitos
# ============================================================
check_prerequisites() {
  step "Verificando prerequisitos del sistema"

  local backend_ok=true
  local mobile_ok=true

  # Backend
  check_dependency java "Java 17+" "Instalar desde https://adoptium.net" || backend_ok=false
  check_dependency mvn "Maven" "Instalar desde https://maven.apache.org" || backend_ok=false
  check_dependency docker "Docker" "Instalar desde https://docker.com" || backend_ok=false

  # Mobile/Web
  check_dependency node "Node.js" "Instalar desde https://nodejs.org" || mobile_ok=false
  check_dependency npm "npm" "Viene con Node.js" || mobile_ok=false

  # Opcional
  check_dependency docker-compose "Docker Compose" || true
  check_dependency npx "npx" || true

  if [ "$backend_ok" = false ]; then
    warn "Backend no se puede construir por prerequisitos faltantes"
  fi
  if [ "$mobile_ok" = false ]; then
    warn "Mobile/Web no se puede construir por prerequisitos faltantes"
  fi

  ok "Verificacion de prerequisitos completada"
}

# ============================================================
# Analisis de Codigo Backend (Maven)
# ============================================================
analyze_backend() {
  step "Analizando codigo backend (Java/Spring Boot)"

  cd "$BACKEND_DIR"

  log "Compilando proyecto Maven..."
  if mvn compile --no-transfer-progress -q 2>>"$BUILD_LOG"; then
    ok "Compilacion exitosa"
  else
    err "Fallo la compilacion Maven"
    return 1
  fi

  log "Verificando tests..."
  if mvn test --no-transfer-progress -q \
    -DJWT_SECRET=test-secret-key-for-local-build-minimum-256-bits \
    2>>"$BUILD_LOG"; then
    ok "Tests pasaron correctamente"
  else
    warn "Algunos tests fallaron - revisar reporte"
  fi

  log "Contando lineas de codigo..."
  local total_lines
  total_lines=$(find . -name "*.java" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "N/A")
  local total_files
  total_files=$(find . -name "*.java" | wc -l || echo "N/A")
  ok "Codigo Java: $total_files archivos, $total_lines lineas"

  cd "$SCRIPT_DIR"
}

# ============================================================
# Build Backend (JAR + Docker)
# ============================================================
build_backend() {
  step "Construyendo Backend (Spring Boot Microservicios)"

  cd "$BACKEND_DIR"

  # Verificar .env
  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    log "Creando .env desde .env.example..."
    cp .env.example .env
    warn "Revisa el archivo .env con tus configuraciones"
  fi

  log "Compilando y empaquetando microservicios..."
  if mvn clean package -DskipTests --no-transfer-progress -q 2>>"$BUILD_LOG"; then
    ok "JARs generados correctamente"

    # Listar JARs generados
    local jar_count=0
    for service in api-gateway auth-service company-service courier-service order-service; do
      if ls "$service/target/"*.jar &>/dev/null 2>&1; then
        local jar_size
        jar_size=$(du -sh "$service/target/"*.jar 2>/dev/null | awk '{print $1}' || echo "?")
        ok "  $service -> $jar_size"
        ((jar_count++)) || true
      else
        warn "  $service -> JAR no generado"
      fi
    done
    ok "$jar_count de 5 servicios construidos"
  else
    err "Fallo el build de Maven"
    cd "$SCRIPT_DIR"
    return 1
  fi

  # Build Docker si esta disponible
  if command -v docker &>/dev/null; then
    log "Construyendo imagenes Docker..."
    if docker-compose build --parallel 2>>"$BUILD_LOG"; then
      ok "Imagenes Docker construidas"
    else
      warn "Fallo build Docker - verificar Docker daemon"
    fi
  fi

  cd "$SCRIPT_DIR"
}

# ============================================================
# Analisis Mobile/Web (TypeScript/ESLint)
# ============================================================
analyze_mobile() {
  step "Analizando codigo mobile/web (TypeScript/React Native)"

  cd "$MOBILE_DIR"

  if [ ! -d "node_modules" ]; then
    log "Instalando dependencias npm..."
    npm ci --silent 2>>"$BUILD_LOG"
    ok "Dependencias instaladas"
  else
    ok "Dependencias ya instaladas"
  fi

  log "Verificando tipos TypeScript..."
  if npx tsc --noEmit 2>>"$BUILD_LOG"; then
    ok "Sin errores de TypeScript"
  else
    warn "TypeScript encontro errores de tipos"
  fi

  log "Contando lineas de codigo TypeScript/TSX..."
  local ts_files
  ts_files=$(find src -name "*.ts" -o -name "*.tsx" | wc -l || echo "N/A")
  local ts_lines
  ts_lines=$(find src -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "N/A")
  ok "Codigo TypeScript: $ts_files archivos, $ts_lines lineas"

  log "Verificando dependencias desactualizadas..."
  npm outdated --depth=0 2>/dev/null | head -10 || true

  cd "$SCRIPT_DIR"
}

# ============================================================
# Build Web (Expo export)
# ============================================================
build_web() {
  step "Construyendo version Web (Expo Web)"

  cd "$MOBILE_DIR"

  if [ ! -d "node_modules" ]; then
    log "Instalando dependencias..."
    npm ci --silent 2>>"$BUILD_LOG"
  fi

  # Crear .env si no existe
  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    log "Archivo .env creado desde ejemplo"
  fi

  log "Exportando build web estatico..."
  if npx expo export --platform web --output-dir dist 2>>"$BUILD_LOG"; then
    local dist_size
    dist_size=$(du -sh dist/ 2>/dev/null | awk '{print $1}' || echo "?")
    local file_count
    file_count=$(find dist -type f | wc -l || echo "?")
    ok "Build web exitoso: $file_count archivos, $dist_size"
    ok "Resultado en: $MOBILE_DIR/dist/"
    echo ""
    echo -e "  Para servir localmente:"
    echo -e "  ${CYAN}npx serve dist/${NC}"
    echo -e "  O para deploy en Vercel:"
    echo -e "  ${CYAN}npx vercel dist/${NC}"
  else
    err "Fallo el build web de Expo"
    cd "$SCRIPT_DIR"
    return 1
  fi

  cd "$SCRIPT_DIR"
}

# ============================================================
# Build Mobile (EAS - APK para pruebas)
# ============================================================
build_mobile() {
  step "Construyendo APK Android (via EAS Build - gratuito)"

  cd "$MOBILE_DIR"

  if [ ! -d "node_modules" ]; then
    log "Instalando dependencias..."
    npm ci --silent 2>>"$BUILD_LOG"
  fi

  # Verificar EAS CLI
  if ! command -v eas &>/dev/null; then
    log "Instalando EAS CLI..."
    npm install -g eas-cli
  fi

  # Verificar autenticacion Expo
  if [ -z "${EXPO_TOKEN:-}" ]; then
    warn "EXPO_TOKEN no configurado"
    echo ""
    echo -e "  Para hacer el build necesitas:"
    echo -e "  1. Crear cuenta en ${CYAN}https://expo.dev${NC}"
    echo -e "  2. Ejecutar: ${CYAN}npx eas-cli login${NC}"
    echo -e "  3. Ejecutar: ${CYAN}npx eas build --platform android --profile preview${NC}"
    echo ""
    echo -e "  O para build local sin Expo (requiere Android SDK):"
    echo -e "  ${CYAN}npx expo run:android${NC}"
    cd "$SCRIPT_DIR"
    return 0
  fi

  log "Iniciando build en EAS Cloud (puede tardar 5-15 min)..."
  if eas build --platform android --profile preview --non-interactive --no-wait; then
    ok "Build iniciado en EAS"
    ok "Ver progreso en: https://expo.dev/accounts/[tu-usuario]/projects/domilink/builds"
  else
    warn "No se pudo iniciar el build en EAS - verificar autenticacion"
  fi

  cd "$SCRIPT_DIR"
}

# ============================================================
# Iniciar todo con Docker (desarrollo local)
# ============================================================
start_services() {
  step "Levantando todos los servicios (Docker Compose)"

  cd "$BACKEND_DIR"

  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    log "Archivo .env creado. Verificar configuraciones antes de produccion."
  fi

  log "Iniciando microservicios..."
  if docker-compose up -d --build 2>>"$BUILD_LOG"; then
    ok "Servicios iniciados"
    echo ""
    echo -e "  ${BOLD}URLs disponibles:${NC}"
    echo -e "  API Gateway:     ${CYAN}http://localhost:8080${NC}"
    echo -e "  Auth Service:    ${CYAN}http://localhost:8081${NC} (debug)"
    echo -e "  Company Service: ${CYAN}http://localhost:8082${NC} (debug)"
    echo -e "  Courier Service: ${CYAN}http://localhost:8083${NC} (debug)"
    echo -e "  Order Service:   ${CYAN}http://localhost:8084${NC} (debug)"
    echo ""
    echo -e "  Para ver logs: ${CYAN}docker-compose logs -f${NC}"
    echo -e "  Para detener:  ${CYAN}docker-compose down${NC}"
  else
    err "Fallo al iniciar Docker Compose"
  fi

  cd "$SCRIPT_DIR"

  # Iniciar web dev server
  echo ""
  log "Para iniciar la version web: ${CYAN}cd domilink-mobile && npx expo start --web${NC}"
}

# ============================================================
# Limpiar artefactos
# ============================================================
clean_all() {
  step "Limpiando artefactos de build"

  # Backend
  cd "$BACKEND_DIR"
  if command -v mvn &>/dev/null; then
    mvn clean --no-transfer-progress -q && ok "Maven clean completado"
  fi
  cd "$SCRIPT_DIR"

  # Mobile/Web
  cd "$MOBILE_DIR"
  if [ -d "dist" ]; then
    rm -rf dist && ok "Directorio dist eliminado"
  fi
  if [ -d ".expo" ]; then
    rm -rf .expo/web-build 2>/dev/null || true
  fi
  cd "$SCRIPT_DIR"

  # Logs viejos (mantener ultimo)
  find "$SCRIPT_DIR" -name "build-*.log" -not -name "$(basename $BUILD_LOG)" -delete 2>/dev/null || true
  ok "Limpieza completada"
}

# ============================================================
# MAIN
# ============================================================
main() {
  print_header

  local target="${1:-all}"

  case "$target" in
    all)
      check_prerequisites
      analyze_backend
      analyze_mobile
      build_backend
      build_web
      ;;
    backend)
      check_prerequisites
      analyze_backend
      build_backend
      ;;
    web)
      check_prerequisites
      analyze_mobile
      build_web
      ;;
    mobile)
      check_prerequisites
      analyze_mobile
      build_mobile
      ;;
    analyze)
      check_prerequisites
      analyze_backend
      analyze_mobile
      ;;
    start)
      check_prerequisites
      start_services
      ;;
    clean)
      clean_all
      ;;
    help|--help|-h)
      echo "Uso: ./build.sh [opcion]"
      echo ""
      echo "Opciones:"
      echo "  (sin args)  Analizar y construir todo"
      echo "  backend     Solo backend Java/Spring Boot"
      echo "  web         Solo version web (Expo Web)"
      echo "  mobile      Solo APK Android (via EAS)"
      echo "  analyze     Solo analisis de codigo"
      echo "  start       Levantar servicios con Docker"
      echo "  clean       Limpiar artefactos de build"
      echo "  help        Mostrar esta ayuda"
      exit 0
      ;;
    *)
      err "Opcion desconocida: $target"
      echo "Usa './build.sh help' para ver opciones disponibles"
      exit 1
      ;;
  esac

  print_summary

  if [ "$ERRORS" -gt 0 ]; then
    exit 1
  fi
}

main "${1:-all}"
