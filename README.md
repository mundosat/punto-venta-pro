# Punto de Venta PRO TOTAL - GitHub Pages + Firebase Spark

Sistema web estático listo para subir a **GitHub** y conectar con **Firebase** sin usar servicios que normalmente disparan cobros.
Está pensado para funcionar con:

- GitHub Pages
- Firebase Authentication (correo y contraseña)
- Cloud Firestore
- Impresión local de ticket desde el navegador
- Logo de tienda guardado en Firestore como **URL** o **Base64**
- Sin Firebase Storage
- Sin Cloud Functions

## Módulos incluidos

- Login
- Dashboard
- Caja (apertura, ingreso, egreso, cierre)
- Ventas
- Productos
- Kardex
- Usuarios
- Reportes
- Configuración de tienda
- Ticket con opción:
  - Cobrar e imprimir
  - Cobrar sin imprimir

## 1) Crear proyecto Firebase

1. Entra a Firebase Console
2. Crea un proyecto
3. Activa:
   - Authentication > Email/Password
   - Firestore Database (modo de producción o pruebas mientras configuras)
4. Copia la configuración web del proyecto

## 2) Pegar tu configuración

Abre:

`assets/js/firebase-config.js`

y pega los datos de tu proyecto.

## 3) Crear primer usuario administrador

1. En Authentication crea el usuario administrador.
2. Copia su `uid`.
3. En Firestore crea el documento:

Colección: `usuarios`
Documento: `UID_DEL_USUARIO`

Campos sugeridos:
- nombre: "Administrador"
- email: "tu_correo@ejemplo.com"
- rol: "admin"
- activo: true
- creadoEn: fecha actual

## 4) Crear configuración inicial

Colección: `configuracion`
Documento: `general`

Campos sugeridos:
- nombreTienda: "Mi Tienda"
- ruc: ""
- telefono: ""
- direccion: ""
- moneda: "$"
- impuesto: 0
- imprimirAutomatico: false
- logoMode: "url"
- logoValue: ""
- ticketFooter: "Gracias por su compra"

## 5) Reglas Firestore

Publica el archivo:

`firestore.rules`

## 6) Subir a GitHub

Sube todo este proyecto a tu repositorio.

Luego activa GitHub Pages desde:
Settings > Pages

Usa la rama principal y la carpeta raíz.

## 7) Importante para GitHub Pages

Si tu repositorio no está en el dominio raíz, esta app detecta la base del proyecto automáticamente.
No necesita build ni npm.

## Colecciones que usa

- usuarios
- configuracion
- productos
- cajas_sesiones
- movimientos_caja
- ventas
- kardex

## Notas

- El logo se guarda en Firestore como URL o Base64. No usa Storage.
- El ticket se imprime con `window.print()`.
- El reporte exporta CSV.
- La importación de productos permite CSV simple.

## Estructura CSV para importar productos

Encabezados:

codigo,nombre,categoria,precio,stock,minimo,activo

Ejemplo:

P001,Arroz 5kg,Granos,24.50,10,2,true
P002,Azúcar 1kg,Abarrotes,2.10,30,5,true

## Usuario y roles

Roles soportados:
- admin
- cajero

Permisos:
- admin: acceso total
- cajero: ventas, caja, dashboard, reportes básicos

## Recomendación para plan gratuito

Mantener:
- pocos usuarios simultáneos
- no guardar imágenes pesadas en base64
- no subir archivos grandes
- no usar Storage ni Functions

