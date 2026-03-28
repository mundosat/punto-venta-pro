# Usuarios automáticos

## Cómo funciona
Desde la pantalla Usuarios, el administrador crea un usuario indicando nombre, correo, contraseña y rol.
El sistema crea la cuenta en Firebase Authentication y luego crea el perfil en Firestore.

## Requisito
El usuario que hace esto debe tener rol `admin`.

## Nota
El primer administrador todavía debe existir manualmente en Firebase Authentication y en Firestore.
