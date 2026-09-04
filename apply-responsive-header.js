// Script generado por Claude: añade flex-wrap a SiteHeader.tsx para pantallas muy estrechas.
// Ejecutar con: node apply-responsive-header.js  (desde la raiz del proyecto lego-inventory)
const fs = require('fs');
const path = require('path');

const files = [
  {
    rel: "src/components/SiteHeader.tsx",
    b64: "aW1wb3J0IExpbmsgZnJvbSAibmV4dC9saW5rIjsKCmV4cG9ydCBmdW5jdGlvbiBTaXRlSGVhZGVyKCkgewogIHJldHVybiAoCiAgICA8aGVhZGVyIGNsYXNzTmFtZT0iYm9yZGVyLWIgYm9yZGVyLWxpbmUgYmctcGFwZXIiPgogICAgICA8ZGl2IGNsYXNzTmFtZT0ibXgtYXV0byBmbGV4IG1heC13LTV4bCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC14LTYgZ2FwLXktMiBweC01IHB5LTMuNSI+CiAgICAgICAgPExpbmsKICAgICAgICAgIGhyZWY9Ii8iCiAgICAgICAgICBjbGFzc05hbWU9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGZvbnQtZGlzcGxheSB0ZXh0LVsxNXB4XSBmb250LXNlbWlib2xkIHRleHQtaW5rIgogICAgICAgID4KICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0iaW5saW5lLWJsb2NrIGgtMi41IHctMi41IHJvdW5kZWQtc20gYmctYnJpY2siIGFyaWEtaGlkZGVuPSJ0cnVlIiAvPgogICAgICAgICAgTWkgQ29sZWNjacOzbiBMRUdPCiAgICAgICAgPC9MaW5rPgogICAgICAgIDxuYXYgY2xhc3NOYW1lPSJmbGV4IGdhcC0xIHRleHQtc20iPgogICAgICAgICAgPExpbmsgaHJlZj0iLyIgY2xhc3NOYW1lPSJidG4tZ2hvc3QiPgogICAgICAgICAgICBJbmljaW8KICAgICAgICAgIDwvTGluaz4KICAgICAgICAgIDxMaW5rIGhyZWY9Ii9waWV6YXMiIGNsYXNzTmFtZT0iYnRuLWdob3N0Ij4KICAgICAgICAgICAgUGllemFzCiAgICAgICAgICA8L0xpbms+CiAgICAgICAgPC9uYXY+CiAgICAgIDwvZGl2PgogICAgPC9oZWFkZXI+CiAgKTsKfQo=",
  },
];


for (const f of files) {
  const fullPath = path.join(__dirname, f.rel);
  const dir = path.dirname(fullPath);
  fs.mkdirSync(dir, { recursive: true });
  const content = Buffer.from(f.b64, 'base64').toString('utf-8');
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log('Escrito:', f.rel);
}
console.log('Listo. Ahora ejecuta: npm run build');
