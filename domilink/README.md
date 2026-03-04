# DomiLink - Plataforma tipo Uber para Domiciliarios

Marketplace de domicilios con arquitectura de microservicios en Java/Spring Boot.

## Arquitectura

```
Cliente (Web / App)
        |
        v
+------------------+
|   API Gateway    |  :8080  (Spring Cloud Gateway + JWT Filter)
+------------------+
   |    |    |    |
   v    v    v    v
+------+ +-------+ +--------+ +-------+
| Auth | |Company| |Courier | | Order |
| :8081| | :8082 | | :8083  | | :8084 |
+------+ +-------+ +--------+ +-------+
   |         |          |          |
   +----+----+----------+----------+
        |
        v
  [Firestore / In-Memory]
```

## Microservicios

| Servicio | Puerto | Responsabilidad |
|---|---|---|
| `api-gateway` | 8080 | Enrutamiento y validacion JWT |
| `auth-service` | 8081 | Registro, login, emision de JWT |
| `company-service` | 8082 | CRUD de empresas registradas |
| `courier-service` | 8083 | CRUD de domiciliarios, ubicacion en tiempo real |
| `order-service` | 8084 | Gestion de pedidos, calculo de precio (Haversine) |

## Inicio rapido

### 1. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores (minimo cambiar JWT_SECRET en produccion)
```

### 2. Levantar con Docker Compose

```bash
docker-compose up --build
```

### 3. Verificar que todo esta en pie

```bash
curl http://localhost:8080/actuator/health
```

## Flujo de uso

### Registro de empresa

```bash
# 1. Registrar usuario empresa
POST http://localhost:8080/api/auth/register
{
  "email": "empresa@ejemplo.com",
  "password": "password123",
  "displayName": "Tienda Ejemplo",
  "role": "COMPANY"
}

# Respuesta: { "accessToken": "eyJ...", "role": "COMPANY", ... }

# 2. Crear perfil de empresa (usar el token del paso anterior)
POST http://localhost:8080/api/companies
Authorization: Bearer eyJ...
{
  "name": "Tienda Ejemplo SAS",
  "nit": "9001234560",
  "email": "contacto@tienda.com",
  "phone": "3001234567",
  "address": "Calle 10 # 20-30",
  "city": "Bogota",
  "latitude": 4.6097,
  "longitude": -74.0817,
  "description": "Tienda de ropa"
}
```

### Registro de domiciliario

```bash
# 1. Registrar usuario domiciliario
POST http://localhost:8080/api/auth/register
{
  "email": "domiciliario@ejemplo.com",
  "password": "password123",
  "displayName": "Carlos Domiciliario",
  "role": "COURIER"
}

# 2. Crear perfil de domiciliario
POST http://localhost:8080/api/couriers
Authorization: Bearer eyJ...
{
  "firstName": "Carlos",
  "lastName": "Lopez",
  "documentNumber": "1234567890",
  "phone": "3009876543",
  "email": "carlos@ejemplo.com",
  "vehicleType": "MOTORCYCLE",
  "vehiclePlate": "ABC123",
  "vehicleModel": "Honda CB 2022"
}
```

### Flujo completo de un pedido

```bash
# 1. Empresa crea pedido
POST http://localhost:8080/api/orders
Authorization: Bearer <token-empresa>
X-Company-Id: <id-empresa>
{
  "pickupAddress": "Calle 10 # 20-30, Bogota",
  "pickupLatitude": 4.6097,
  "pickupLongitude": -74.0817,
  "deliveryAddress": "Carrera 15 # 85-20, Bogota",
  "deliveryLatitude": 4.6674,
  "deliveryLongitude": -74.0534,
  "description": "Camiseta talla M",
  "recipientName": "Juan Perez",
  "recipientPhone": "3001111111",
  "packageSize": "SMALL"
}
# El sistema calcula distancia (Haversine) y precio automaticamente

# 2. Domiciliario ve pedidos disponibles
GET http://localhost:8080/api/orders/pending
Authorization: Bearer <token-domiciliario>

# 3. Domiciliario toma el pedido
POST http://localhost:8080/api/orders/{orderId}/assign
Authorization: Bearer <token-domiciliario>
{
  "courierId": "<mi-id-domiciliario>",
  "vehicleType": "MOTORCYCLE"
}

# 4. Domiciliario recoge el paquete
PUT http://localhost:8080/api/orders/{orderId}/in-transit
Authorization: Bearer <token-domiciliario>

# 5. Domiciliario entrega
PUT http://localhost:8080/api/orders/{orderId}/delivered
Authorization: Bearer <token-domiciliario>

# 6. Empresa califica la entrega
POST http://localhost:8080/api/orders/{orderId}/rate
Authorization: Bearer <token-empresa>
{
  "rating": 5,
  "comment": "Excelente servicio, entrega rapida"
}
```

### Estimacion de precio antes de crear pedido

```bash
GET http://localhost:8080/api/orders/estimate?pickupLat=4.6097&pickupLon=-74.0817&deliveryLat=4.6674&deliveryLon=-74.0534&packageSize=SMALL
Authorization: Bearer <cualquier-token>

# Respuesta:
{
  "distanceKm": 8.76,
  "motorcyclePrice": 16140.0,
  "bicyclePrice": 12912.0,
  "carPrice": 22596.0
}
```

## Calculo de precio

Formula usada:

```
precio = max(MIN, min(MAX, (precioBase + distancia * precioPorKm) * multiplicadorVehiculo * multiplicadorPaquete))
```

Valores por defecto (configurables via variables de entorno):

| Variable | Valor | Descripcion |
|---|---|---|
| `PRICING_BASE_PRICE` | 3000 COP | Precio fijo base |
| `PRICING_PRICE_PER_KM` | 1500 COP | Por kilometro adicional |
| `PRICING_MINIMUM_PRICE` | 5000 COP | Precio minimo |
| `PRICING_MAXIMUM_PRICE` | 80000 COP | Precio maximo |

Multiplicadores de vehiculo: Moto=1.0, Bicicleta=0.8, A pie=0.6, Carro=1.4

La distancia se calcula con **formula Haversine** con factor de correccion 1.25x para rutas urbanas.

## Roles y permisos

| Rol | Puede hacer |
|---|---|
| `COMPANY` | Registrar empresa, crear pedidos, ver sus pedidos, calificar domiciliarios |
| `COURIER` | Registrar perfil, ver pedidos disponibles, tomar pedidos, actualizar ubicacion |
| `ADMIN` | Todo lo anterior + aprobar/rechazar empresas y domiciliarios, ver todo |

## Estructura del proyecto

```
domilink/
├── pom.xml                    # POM padre (multi-module Maven)
├── docker-compose.yml
├── .env.example
├── api-gateway/               # Puerto 8080
│   ├── src/main/java/com/domilink/gateway/
│   │   └── filter/JwtAuthFilter.java
│   └── src/main/resources/application.yml
├── auth-service/              # Puerto 8081
│   ├── src/main/java/com/domilink/auth/
│   │   ├── controller/AuthController.java
│   │   ├── service/AuthService.java
│   │   ├── service/FirebaseService.java
│   │   ├── security/JwtTokenProvider.java
│   │   ├── security/SecurityConfig.java
│   │   ├── model/User.java
│   │   └── dto/
├── company-service/           # Puerto 8082
│   ├── src/main/java/com/domilink/company/
│   │   ├── controller/CompanyController.java
│   │   ├── service/CompanyService.java
│   │   ├── repository/CompanyRepository.java  (interfaz)
│   │   ├── repository/InMemoryCompanyRepository.java
│   │   └── model/Company.java
├── courier-service/           # Puerto 8083
│   └── src/main/java/com/domilink/courier/
│       ├── controller/CourierController.java
│       ├── service/CourierService.java
│       └── model/Courier.java
└── order-service/             # Puerto 8084
    └── src/main/java/com/domilink/order/
        ├── controller/OrderController.java
        ├── service/OrderService.java
        ├── service/HaversineService.java    # Calculo distancia
        ├── service/PricingService.java      # Calculo precio
        └── model/Order.java
```

## Patrones implementados

- **API Gateway**: Punto de entrada unico, validacion JWT centralizada
- **Repository Pattern**: Interfaz `CompanyRepository` / `CourierRepository` / `OrderRepository` desacoplada de la implementacion (facil swap a Firestore)
- **JWT stateless**: El gateway valida e inyecta claims como headers internos (`X-User-Id`, `X-User-Role`)
- **Multi-stage Docker build**: Imagen final ligera sin Maven ni JDK completo
- **Haversine + Urban Correction**: Calculo de distancia 100% gratuito

## Para agregar Firebase/Firestore en produccion

1. Crear proyecto en Firebase Console
2. Generar Service Account Key (JSON)
3. Subir el JSON a Google Secret Manager
4. Montar el secret como variable de entorno en Cloud Run:
   ```
   FIREBASE_CREDENTIALS_PATH=/secrets/firebase-key.json
   FIREBASE_PROJECT_ID=tu-proyecto-firebase
   ```
5. Implementar `FirestoreCompanyRepository` implementando `CompanyRepository`

## Proximas fases

- **Fase 2**: Geo Service, Pricing Service independiente, Pub/Sub events
- **Fase 3**: Notification Service, Identity Verification Service
- **Fase 4**: Observabilidad (Cloud Logging, Tracing), deploy CI/CD
