import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, ChevronRight, Zap, User, Lock, Calendar, Phone, MapPin } from 'lucide-react';
// Cambiamos la importación al nuevo diseño de pantalla
import AuthScreen from './AuthModal'; 

const theme = {
  black: '#111111',
  white: '#FFFFFF',
  orange: '#FA5400',
  gray: '#F5F5F5',
  textLight: '#666666',
};

const imagenesRespaldo = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60", 
  "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=60", 
  "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=60"  
];

export default function App() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [categoriaActual, setCategoriaActual] = useState('Novedades');

  // Manejo de pantallas fijas sin encimarse: 'tienda', 'login' o 'perfil'
  const [vistaActual, setVistaActual] = useState('tienda'); 
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  // Estado dinámico para guardar los datos editables del usuario
  const [datosPerfil, setDatosPerfil] = useState({
    password: 'password123',
    fechaNacimiento: '',
    telefono: '',
    direccion: '',
    tallaCalzado: '27'
  });

  useEffect(() => {
    fetch('https://sneaker-x-backend-production.up.railway.app')
      .then(res => res.json())
      .then(data => {
        const datosCorregidos = data.map((tenis, index) => {
          const tieneImagenInvalida = !tenis.imagenUrl || tenis.imagenUrl.startsWith('C:') || tenis.imagenUrl.startsWith('/');
          return {
            ...tenis,
            imagenUrl: tieneImagenInvalida ? imagenesRespaldo[index % imagenesRespaldo.length] : tenis.imagenUrl,
            genero: index % 2 === 0 ? 'Hombre' : 'Mujer' 
          };
        });
        setProducts(datosCorregidos);
        setFilteredProducts(datosCorregidos); 
      })
      .catch(err => console.error("Error al conectar con Spring Boot:", err));
  }, []);

  const filtrarCategoria = (categoria) => {
    setVistaActual('tienda'); 
    setCategoriaActual(categoria);
    if (categoria === 'Novedades' || categoria === 'Hombre') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.genero === 'Mujer'));
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? {...i, qty: i.qty + 1} : i);
      return [...prev, {...product, qty: 1}];
    });
    setIsCartOpen(true);
  };

  const total = cart.reduce((acc, item) => acc + (item.precio * item.qty), 0);
  const cantidadTotalProductos = cart.reduce((acc, item) => acc + item.qty, 0);

  // 🔥 NUEVA FUNCIÓN OPTIMIZADA: Checkout inteligente con detector de propiedades JSON de Stripe
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    try {
      const productoAPagar = cart[0];

      const response = await fetch('https://sneaker-x-backend-production.up.railway.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenisId: productoAPagar.id, 
          cantidad: productoAPagar.qty
        })
      });
      
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        
        // 🔍 RASTREADOR DE URL: Busca el enlace de Stripe sin importar cómo lo llame tu Backend
        if (data.url) {
          window.location.href = data.url;
        } else if (data.urlCheckout) {
          window.location.href = data.urlCheckout;
        } else if (data.stripeUrl) {
          window.location.href = data.stripeUrl;
        } else {
          // Imprime en la consola (F12) la respuesta exacta por si las llaves anteriores no coinciden
          console.log("Estructura recibida del Backend:", data);
          
          // Escaneo de propiedades del JSON buscando un string de redirección que empiece con http
          const valores = Object.values(data);
          const urlEncontrada = valores.find(val => typeof val === 'string' && val.startsWith('http'));
          
          if (urlEncontrada) {
            window.location.href = urlEncontrada;
          } else {
            alert("Error: El JSON del servidor no contiene ninguna URL de pago. Abre la consola (F12) para inspeccionar la respuesta.");
          }
        }
      } else {
        // Por si tu controlador responde directamente con texto plano en vez de JSON
        const urlTexto = await response.text();
        if (urlTexto && urlTexto.startsWith('http')) {
          window.location.href = urlTexto;
        } else {
          alert("Error: El servidor respondió con texto plano, pero no contiene una URL de pago válida.");
        }
      }
    } catch (error) {
      console.error("Error en el checkout:", error);
      alert("Error crítico al intentar conectar con la pasarela de pagos.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatosPerfil(prev => ({ ...prev, [name]: value }));
  };

  const guardarCambiosPerfil = (e) => {
    e.preventDefault();
    alert("¡Perfil actualizado con éxito de forma local!");
    setVistaActual('tienda');
  };

  // 🛠️ ¡CORREGIDO AQUÍ!: Nombre de variable sincronizado correctamente para evitar pantalla negra
  const productosAgrupadosPorMarca = filteredProducts.reduce((grupos, producto) => {
    const marca = producto.marca || 'Otras Marcas';
    if (!grupos[marca]) {
      grupos[marca] = [];
    }
    grupos[marca].push(producto);
    return grupos;
  }, {});

  return (
    <div style={{ backgroundColor: theme.white, minHeight: '100vh', fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', color: theme.black }}>
      
      {/* NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid #E5E5E5`, position: 'sticky', top: 0, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 50 }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-1px', cursor: 'pointer', color: theme.black }} onClick={() => filtrarCategoria('Novedades')}>
          SNEAKER<span style={{color: theme.orange}}>X</span>
        </h1>
        
        <div style={{ display: 'flex', gap: '30px', fontWeight: 'bold', fontSize: '14px', alignItems: 'center' }}>
          <span onClick={() => filtrarCategoria('Novedades')} style={{ cursor: 'pointer', color: vistaActual === 'tienda' && categoriaActual === 'Novedades' ? theme.orange : theme.black }}>Novedades</span>
          <span onClick={() => filtrarCategoria('Hombre')} style={{ cursor: 'pointer', color: vistaActual === 'tienda' && categoriaActual === 'Hombre' ? theme.orange : theme.black }}>Hombre</span>
          <span onClick={() => filtrarCategoria('Mujer')} style={{ cursor: 'pointer', color: vistaActual === 'tienda' && categoriaActual === 'Mujer' ? theme.orange : theme.black }}>Mujer</span>
          
          {usuarioLogueado ? (
            <span 
              onClick={() => setVistaActual('perfil')}
              style={{ fontSize: '13px', fontWeight: 'bold', backgroundColor: vistaActual === 'perfil' ? '#EAEAEA' : theme.gray, padding: '8px 16px', borderRadius: '20px', border: vistaActual === 'perfil' ? `1px solid ${theme.orange}` : '1px solid #E5E5E5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: '0.2s ease' }}
            >
              👟 Hola, <span style={{ color: theme.orange }}>{usuarioLogueado}</span>
            </span>
          ) : (
            <button 
              onClick={() => setVistaActual('login')}
              style={{ backgroundColor: vistaActual === 'login' ? theme.orange : theme.black, color: theme.white, padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase' }}
            >
              Iniciar Sesión
            </button>
          )}

          <button onClick={() => setIsCartOpen(!isCartOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', color: theme.black }}>
            <ShoppingBag size={22} />
            {cantidadTotalProductos > 0 && (
              <span style={{ position: 'absolute', top: -8, right: -8, background: theme.orange, color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {cantidadTotalProductos}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* RENDERIZADO CONDICIONAL DE LAS PESTAÑAS */}
      {vistaActual === 'tienda' && (
        <>
          {/* HERO SECTION */}
          <header style={{ padding: '60px 40px', textAlign: 'center', backgroundColor: theme.gray }}>
            <h2 style={{ fontSize: '64px', margin: 0, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, color: theme.black }}>HAZ QUE OCURRA</h2>
            <p style={{ fontSize: '16px', maxWidth: '600px', margin: '15px auto', color: theme.textLight, fontWeight: '500' }}>
              Explorando la sección: <strong style={{ color: theme.orange, textTransform: 'uppercase' }}>{categoriaActual}</strong>
            </p>
          </header>

          {/* CATÁLOGO DE PRODUCTOS AGRUPADO POR SECCIONES DE MARCA */}
          <main style={{ padding: '40px' }}>
            {filteredProducts.length === 0 ? (
              <p style={{ color: theme.textLight, textAlign: 'center', fontSize: '16px', fontWeight: '500', marginTop: '40px' }}>
                No hay tenis disponibles o el servidor está apagado.
              </p>
            ) : (
              Object.keys(productosAgrupadosPorMarca).map(marca => (
                <div key={marca} style={{ marginBottom: '60px' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: '2px solid #F0F0F0', paddingBottom: '10px' }}>
                    <h3 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', textTransform: 'uppercase', color: theme.black }}>
                      {marca}
                    </h3>
                    <span style={{ backgroundColor: theme.orange, color: theme.white, fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px' }}>
                      {productosAgrupadosPorMarca[marca].length} modelos
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
                    {productosAgrupadosPorMarca[marca].map(shoe => (
                      <div key={shoe.id} style={{ padding: '10px' }}>
                        <div style={{ backgroundColor: theme.gray, width: '100%', height: '350px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                          <img src={shoe.imagenUrl} alt={shoe.modelo} style={{ width: '90%', height: 'auto', objectFit: 'contain', mixBlendMode: 'darken' }} />
                        </div>
                        <div style={{ marginTop: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: theme.black }}>{shoe.modelo}</h4>
                              <p style={{ margin: '3px 0', color: theme.textLight, fontSize: '14px' }}>Calzado para {shoe.genero}</p>
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '16px', color: theme.black }}>${shoe.precio.toFixed(2)} USD</span>
                          </div>
                          <button 
                            onClick={() => addToCart(shoe)}
                            style={{ background: 'none', border: 'none', color: theme.orange, fontWeight: 'bold', cursor: 'pointer', padding: 0, marginTop: '12px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                            Añadir a la bolsa <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))
            )}
          </main>
        </>
      )}

      {vistaActual === 'login' && (
        <AuthScreen 
          isVisible={vistaActual === 'login'} 
          onBack={() => setVistaActual('tienda')} 
          onLoginSuccess={(nombre) => {
            setUsuarioLogueado(nombre);
            setVistaActual('tienda');
          }} 
          theme={theme}
        />
      )}

      {/* 👤 APARTADO: MI CUENTA / PERFIL DEL SNEAKERHEAD */}
      {vistaActual === 'perfil' && (
        <div style={{ maxWidth: '650px', margin: '50px auto', padding: '40px', backgroundColor: theme.white, border: '1px solid #E5E5E5', borderRadius: '12px' }}>
          
          <div style={{ borderBottom: `2px solid ${theme.black}`, paddingBottom: '15px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>CONFIGURACIÓN DE LA CUENTA</h2>
            <button 
              onClick={() => setVistaActual('tienda')}
              style={{ background: 'none', border: 'none', color: theme.textLight, fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
            >
              Volver a la tienda
            </button>
          </div>

          <form onSubmit={guardarCambiosPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', color: theme.black }}>
                <User size={14} /> Nombre Completo
              </label>
              <input 
                type="text" 
                value={usuarioLogueado || ''} 
                disabled 
                style={{ width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #CCCCCC', backgroundColor: '#EFEFEF', color: theme.textLight, fontSize: '14px', boxSizing: 'border-box', cursor: 'not-allowed' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', color: theme.black }}>
                <Lock size={14} /> Modificar Contraseña
              </label>
              <input 
                type="password" 
                name="password"
                value={datosPerfil.password} 
                onChange={handleInputChange}
                required
                placeholder="Nueva contraseña"
                style={{ width: '100%', padding: '12px 15px', borderRadius: '6px', border: `1px solid #CCCCCC`, fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', color: theme.black }}>
                  <Calendar size={14} /> Fecha de Nacimiento
                </label>
                <input 
                  type="date" 
                  name="fechaNacimiento"
                  value={datosPerfil.fechaNacimiento} 
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #CCCCCC', fontSize: '14px', boxSizing: 'border-box', color: theme.black, backgroundColor: theme.white }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', color: theme.black }}>
                  <Phone size={14} /> Teléfono Móvil
                </label>
                <input 
                  type="tel" 
                  name="telefono"
                  placeholder="+52 55 1234 5678"
                  value={datosPerfil.telefono} 
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #CCCCCC', fontSize: '14px', boxSizing: 'border-box', color: theme.black, backgroundColor: theme.white }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', color: theme.black }}>
                  <MapPin size={14} /> Dirección de Envío
                </label>
                <input 
                  type="text" 
                  name="direccion"
                  placeholder="Calle, Número, Colonia y Código Postal"
                  value={datosPerfil.direccion} 
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #CCCCCC', fontSize: '14px', boxSizing: 'border-box', color: theme.black, backgroundColor: theme.white }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', color: theme.black }}>
                  👟 Talla Preferida
                </label>
                <select 
                  name="tallaCalzado"
                  value={datosPerfil.tallaCalzado}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '12px 15px', 
                    borderRadius: '6px', 
                    border: `1px solid ${theme.black}`, 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    boxSizing: 'border-box', 
                    backgroundColor: theme.white, 
                    color: theme.black, 
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="25" style={{ color: theme.black, backgroundColor: theme.white }}>25 CM</option>
                  <option value="26" style={{ color: theme.black, backgroundColor: theme.white }}>26 CM</option>
                  <option value="27" style={{ color: theme.black, backgroundColor: theme.white }}>27 CM</option>
                  <option value="28" style={{ color: theme.black, backgroundColor: theme.white }}>28 CM</option>
                  <option value="29" style={{ color: theme.black, backgroundColor: theme.white }}>29 CM</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
              <button 
                type="submit"
                style={{ flex: 1, backgroundColor: theme.black, color: theme.white, padding: '15px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', letterSpacing: '0.5px', textTransform: 'uppercase' }}
              >
                Guardar Cambios
              </button>
              <button 
                type="button"
                onClick={() => {
                  setUsuarioLogueado(null);
                  setVistaActual('tienda');
                }}
                style={{ backgroundColor: '#FFEDED', color: '#D93838', padding: '15px 25px', borderRadius: '30px', border: '1px solid #F5C6C6', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                Cerrar Sesión
              </button>
            </div>

          </form>
        </div>
      )}

      {/* SIDEBAR DEL CARRITO */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: '400px', height: '100%', backgroundColor: theme.white, zIndex: 100, boxShadow: '-10px 0 40px rgba(0,0,0,0.15)', transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)', transition: '0.3s ease-in-out', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.gray}` }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: theme.black }}>Bolsa ({cantidadTotalProductos})</h2>
          <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.black }}><X size={24} /></button>
        </div>

        <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <p style={{ color: theme.textLight, textAlign: 'center', marginTop: '40px', fontSize: '15px', fontWeight: '500' }}>Tu bolsa está vacía.</p>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: `1px solid ${theme.gray}`, paddingBottom: '15px' }}>
                <img src={item.imagenUrl} alt={item.modelo} style={{ width: '80px', height: '80px', backgroundColor: theme.gray, objectFit: 'contain', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: theme.black }}>{item.modelo}</h4>
                  <p style={{ margin: '3px 0', fontSize: '13px', color: theme.textLight }}>Cantidad: {item.qty}</p>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: theme.black }}>${(item.precio * item.qty).toFixed(2)} USD</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '30px', borderTop: `1px solid ${theme.gray}`, backgroundColor: theme.white }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '18px', fontWeight: '800', color: theme.black }}>
            <span>Total</span>
            <span>${total.toFixed(2)} USD</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            style={{ width: '100%', backgroundColor: cart.length === 0 ? '#CCCCCC' : theme.black, color: theme.white, padding: '18px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px' }}>
            Pasar por Caja <Zap size={18} fill="white" />
          </button>
        </div>
      </div>

    </div>
  );
}