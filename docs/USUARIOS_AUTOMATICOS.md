# Usuarios automáticos

## Qué hace esta versión

- Crea usuarios directamente desde la pantalla **Usuarios**
- Ya no necesitas copiar el UID manualmente
- El perfil se guarda automáticamente en la colección `usuarios`

## Requisitos

1. Haber iniciado sesión con un usuario `admin`
2. Tener Authentication > Email/Password activado
3. Tener Firestore activo

## Uso

1. Entra a **Usuarios**
2. Haz clic en **Nuevo usuario automático**
3. Escribe nombre, correo, contraseña, rol y estado
4. Guarda

## Resultado

- Firebase Authentication crea el usuario
- Firestore crea `usuarios/{uid}`
- El usuario ya puede iniciar sesión
