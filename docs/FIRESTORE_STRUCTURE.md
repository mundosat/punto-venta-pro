# Estructura de Firestore

## usuarios/{uid}

```json
{
  "nombre": "Administrador",
  "email": "admin@tienda.com",
  "rol": "admin",
  "activo": true,
  "creadoEn": "timestamp"
}
```

## configuracion/general

```json
{
  "nombreTienda": "Mi Tienda",
  "ruc": "",
  "telefono": "",
  "direccion": "",
  "moneda": "$",
  "impuesto": 0,
  "imprimirAutomatico": false,
  "logoMode": "url",
  "logoValue": "",
  "ticketFooter": "Gracias por su compra"
}
```

## productos/{id}

```json
{
  "codigo": "P001",
  "nombre": "Producto ejemplo",
  "categoria": "General",
  "precio": 10,
  "stock": 50,
  "minimo": 5,
  "activo": true,
  "creadoEn": "timestamp",
  "actualizadoEn": "timestamp"
}
```

## ventas/{id}

```json
{
  "numero": 1,
  "fecha": "timestamp",
  "usuarioId": "uid",
  "usuarioNombre": "Administrador",
  "cliente": "Consumidor Final",
  "subtotal": 10,
  "impuesto": 0,
  "total": 10,
  "pagadoCon": 20,
  "cambio": 10,
  "imprimir": true,
  "items": [
    {
      "productoId": "abc123",
      "codigo": "P001",
      "nombre": "Producto ejemplo",
      "cantidad": 1,
      "precio": 10,
      "total": 10
    }
  ]
}
```

## cajas_sesiones/{id}

```json
{
  "estado": "abierta",
  "fechaApertura": "timestamp",
  "fechaCierre": null,
  "montoInicial": 100,
  "totalVentas": 0,
  "ingresos": 0,
  "egresos": 0,
  "montoFinal": 0,
  "usuarioId": "uid",
  "usuarioNombre": "Administrador"
}
```

## movimientos_caja/{id}

```json
{
  "sesionId": "id_sesion",
  "tipo": "ingreso",
  "concepto": "Vuelto",
  "monto": 5,
  "fecha": "timestamp",
  "usuarioId": "uid",
  "usuarioNombre": "Administrador"
}
```

## kardex/{id}

```json
{
  "productoId": "abc123",
  "codigo": "P001",
  "nombre": "Producto ejemplo",
  "tipo": "venta",
  "cantidad": -1,
  "stockAnterior": 10,
  "stockNuevo": 9,
  "referencia": "venta_000001",
  "fecha": "timestamp",
  "usuarioId": "uid",
  "usuarioNombre": "Administrador"
}
```
