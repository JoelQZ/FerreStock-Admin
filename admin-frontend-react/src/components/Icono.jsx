const TRAZOS = {
  descargar: <path d="M12 4v11M7 10l5 5 5-5M4 19h16" />,
  imprimir: (
    <>
      <path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  caja: (
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </>
  ),
  capas: (
    <>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  grafico: <path d="M3 20h18M6 16v-5M11 16V6M16 16v-8M21 16v-3" />,
  chispa: (
    <path d="M12 3c.4 4.6 2.4 6.6 7 7-4.6.4-6.6 2.4-7 7-.4-4.6-2.4-6.6-7-7 4.6-.4 6.6-2.4 7-7zM19 16c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5z" />
  ),
  usuarios: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  ajustes: (
    <>
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  salir: (
    <>
      <path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5" />
      <path d="m9 8-4 4 4 4M5 12h11" />
    </>
  ),
  buscar: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" />,
  editar: <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4" />,
  apagar: <path d="M12 3v8M6.3 6.8a8 8 0 1 0 11.4 0" />,
  atras: <path d="M15 5l-7 7 7 7" />,
  alerta: <path d="M12 3 2 20h20zM12 10v4M12 17v.5" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  tuerca: (
    <>
      <path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5z" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
}

export default function Icono({ nombre, tamano = 18 }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {TRAZOS[nombre]}
    </svg>
  )
}
