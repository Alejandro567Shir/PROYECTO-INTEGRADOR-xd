function Sidebar({
  nombre,
  rolTexto,
  onCerrarSesion,
  onIrPanelPrincipal,
  children,
}) {
  return (
    <aside className="sidebar">
      <div>
        <h2>SGT ESPOCH</h2>

        <div className="sidebar-user">
          <h3>{nombre}</h3>
          <p>{rolTexto}</p>
        </div>

        <button className="sidebar-menu-btn" onClick={onIrPanelPrincipal}>
          Mi Panel Principal
        </button>

        {children}
      </div>

      <button className="logout-btn" onClick={onCerrarSesion}>
        Cerrar Sesión
      </button>
    </aside>
  );
}

export default Sidebar;