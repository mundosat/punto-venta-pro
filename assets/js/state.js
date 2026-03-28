export const state = {
  currentUser: null,
  userProfile: null,
  cachedUsers: [],
  config: {
    nombreTienda: "Punto de Venta PRO",
    ruc: "",
    telefono: "",
    direccion: "",
    moneda: "$",
    impuesto: 15,
    imprimirAutomatico: false,
    logoMode: "url",
    logoValue: "",
    ticketFooter: "Gracias por su compra"
  },
  currentView: "inicio",
  products: [],
  clients: [],
  selectedClientId: "final",
  cart: [],
  activeCashSession: null,
  saleSearchQuery: "",
  salesSearchFocusedIndex: 0
};
