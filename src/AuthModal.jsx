import React, { useState } from 'react';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';

export default function AuthScreen({ isVisible, onBack, onLoginSuccess, theme }) {
  const [isRegister, setIsRegister] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  if (!isVisible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    const url = isRegister 
      ? 'https://sneaker-x-backend-production.up.railway.ap' 
      : 'git add .://sneaker-x-backend-production.up.railway.app';

    const bodyData = isRegister 
      ? { nombre, email, password } 
      : { email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.mensaje || 'Algo salió mal');

      if (isRegister) {
        setMensaje('¡Registro exitoso! Ya puedes iniciar sesión.');
        setIsRegister(false);
        setNombre('');
      } else {
        onLoginSuccess(data.nombre);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Botón Volver */}
      <button onClick={onBack} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', marginBottom: '30px', color: theme.black }}>
        <ArrowLeft size={16} /> Volver a la tienda
      </button>

      <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
        {isRegister ? 'Crear Cuenta' : 'Ingresar'}
      </h2>
      <p style={{ color: theme.textLight, fontSize: '14px', margin: '0 0 30px 0' }}>
        {isRegister ? 'Únete para gestionar tus compras.' : 'Introduce tus credenciales para continuar.'}
      </p>

      {error && <div style={{ backgroundColor: '#FDF2F2', color: '#DE350B', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '15px', fontWeight: '500', textAlign: 'center' }}>{error}</div>}
      {mensaje && <div style={{ backgroundColor: '#F3FAF7', color: '#00875A', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '15px', fontWeight: '500', textAlign: 'center' }}>{mensaje}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {isRegister && (
          <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', left: '12px', top: '15px', color: '#999' }} size={18} />
            <input
              type="text"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              style={{ width: '100%', padding: '15px 15px 15px 42px', boxSizing: 'border-box', border: '1px solid #E5E5E5', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <Mail style={{ position: 'absolute', left: '12px', top: '15px', color: '#999' }} size={18} />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '15px 15px 15px 42px', boxSizing: 'border-box', border: '1px solid #E5E5E5', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <Lock style={{ position: 'absolute', left: '12px', top: '15px', color: '#999' }} size={18} />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '15px 15px 15px 42px', boxSizing: 'border-box', border: '1px solid #E5E5E5', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <button type="submit" style={{ width: '100%', backgroundColor: theme.black, color: theme.white, padding: '16px', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', textTransform: 'uppercase', marginTop: '10px' }}>
          {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
        </button>
      </form>

      <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px', color: theme.textLight }}>
        {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
        <button onClick={() => { setIsRegister(!isRegister); setError(''); setMensaje(''); }} style={{ background: 'none', border: 'none', color: theme.orange, fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px', textDecoration: 'underline' }}>
          {isRegister ? 'Inicia sesión' : 'Regístrate aquí'}
        </button>
      </div>
    </div>
  );
}