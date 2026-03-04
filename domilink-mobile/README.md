# DomiLink Mobile

App móvil en React Native (Expo) para la plataforma DomiLink.

## Pantallas

### Sección Empresa (azul marino)
- **Welcome** — Selector de rol (Empresa / Domiciliario)
- **Login / Register** — Con validación y colores por rol
- **CompanyHome** — Dashboard con stats, pedidos activos y botón "Publicar pedido"
- **CreateOrder** — Flujo 3 pasos:
  1. Mapa: seleccionar punto de recogida y entrega (toque directo)
  2. Detalles: tamaño paquete, descripción, destinatario
  3. Pago: **BASE** o **PAGADO** + estimado de precio (Haversine)
- **OrderDetail** — Progreso visual, mapa, info de pago, calificación post-entrega

### Sección Domiciliario (naranja/rojo)
- **CourierHome** — Toggle disponibilidad, stats del día, lista de pedidos disponibles
- **TakeOrder** — Detalle del pedido con **banner prominente BASE vs PAGO**
- **CourierDelivery** — Mapa en tiempo real, actualización GPS automática cada 5s, botones de estado

## Modos de pago

| Modo | Color | Descripción |
|---|---|---|
| **BASE** | Morado | El domiciliario lleva dinero para pagar. Cobra al entregar y queda con su parte. |
| **PAGADO** | Verde | El cliente ya pagó a la empresa. El domiciliario solo entrega. |

Ambos modos son claramente diferenciados con **banners de color** en todas las pantallas relevantes.

## Inicio rápido

```bash
cd domilink-mobile
cp .env.example .env
npm install
npx expo start
```

Para Android Emulator, la URL del API es `http://10.0.2.2:8080` (ya configurada en `src/api/client.ts`).
Para dispositivo físico, cambia a `http://TU_IP_LOCAL:8080`.

## Flujo completo

```
1. Usuario abre app → WelcomeScreen → elige Empresa o Domiciliario
2. [Empresa] Login → CompanyHome → CreateOrder (mapa + detalles + modo BASE/PAGO)
3. [Domiciliario] Login → CourierHome → activa disponibilidad → ve pedido
4. [Domiciliario] TakeOrder → confirma (banner BASE o PAGO) → CourierDelivery
5. [Domiciliario] Recoge → "Ya recogí" → Entrega → "Confirmar entrega"
6. [Empresa] OrderDetail → Califica la entrega (1-5 estrellas)
```
