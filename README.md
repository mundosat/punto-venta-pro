# Punto de Venta PRO TOTAL

Versión mejorada para GitHub Pages + Firebase.

## Mejoras incluidas
- creación automática de usuarios desde el panel Usuarios
- corrección de apertura de caja evitando consultas que suelen pedir índices extra en Firestore
- control de acceso por rol
- reportes más completos
- comprobante de venta estilo Ecuador
- PWA básica para instalar en celular

## Importante sobre facturación Ecuador
Esta versión deja el comprobante y la base comercial listos, pero **no** implementa firma electrónica ni envío al SRI. Eso requiere un backend o servicio adicional.

## Cómo usar
1. Configura `assets/js/firebase-config.js` con los datos reales de Firebase.
2. Activa Email/Password en Authentication.
3. Crea tu primer admin en Authentication.
4. Crea en Firestore el documento `usuarios/{UID}` para ese primer admin.
5. Crea `configuracion/general`.
6. Publica `firestore.rules`.
7. Sube a GitHub Pages.

## Colecciones
- usuarios
- configuracion
- productos
- cajas_sesiones
- movimientos_caja
- ventas
- kardex
