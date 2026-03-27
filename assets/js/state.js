export const state = {
  currentUser: null,
  userProfile: null,
  config: {
    nombreTienda: "Punto de Venta PRO",
    ruc: "",
    telefono: "",
    direccion: "",
    moneda: "$",
    impuesto: 0,
    imprimirAutomatico: false,
    logoMode: "url",
    logoValue: "",
    ticketFooter: "Gracias por su compra"
  },
  currentView: "inicio",
  products: [],
  cart: [],
  activeCashSession: null
};
