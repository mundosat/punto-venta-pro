
// REEMPLAZA TU renderProductos
function renderProductos(lista) {
  const contenedor = document.getElementById("listaProductos");
  contenedor.innerHTML = "";

  lista.forEach(p => {
    const item = document.createElement("div");
    item.className = "producto-item";
    item.innerHTML = `
      <div><strong>${p.nombre}</strong><br><small>${p.codigo}</small></div>
      <div class="precio">$${p.precio}</div>
    `;
    item.onclick = () => agregarAlCarrito({
      nombre: p.nombre,
      precio: p.precio,
      cantidad: 1
    });
    contenedor.appendChild(item);
  });
}

// BUSCADOR
document.getElementById("busquedaProducto").addEventListener("input", function(e) {
  const texto = e.target.value.toLowerCase().trim();
  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(texto) ||
    p.codigo.toLowerCase().includes(texto)
  );
  renderProductos(filtrados);
});

// ESCANER
document.getElementById("busquedaProducto").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    const texto = e.target.value.toLowerCase();
    const encontrado = productos.find(p =>
      p.codigo.toLowerCase() === texto ||
      p.nombre.toLowerCase() === texto
    );
    if (encontrado) {
      agregarAlCarrito({
        nombre: encontrado.nombre,
        precio: encontrado.precio,
        cantidad: 1
      });
      e.target.value = "";
    }
  }
});
