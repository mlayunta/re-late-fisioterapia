# Re-Late · Fisioterapia

**Prototipo de demostración** para la gestión clínica y la prescripción de ejercicio
terapéutico, orientado a rehabilitación cardiaca.

| | |
| :--- | :--- |
| **Autor** | Miguel Ángel Layunta López |
| **Entidad** | Asociación de Enfermos de Rehabilitación Cardiaca |
| **Versión de la app** | 5.1 |
| **Capa de mejoras** | 2.0 (`mejoras.js` + `mejoras.css`) |
| **Base de datos** | `relate_db` v5 (IndexedDB, con respaldo en LocalStorage) |
| **Estado** | Prototipo · **no validado para uso clínico** |
| **Tipo** | PWA de archivo único, ejecución local en el navegador |

---

## Aviso importante

> **Esta versión es una demostración** con datos ficticios. No está validada para
> atención clínica, no garantiza la protección de datos reales y no debe usarse para
> tomar decisiones sanitarias. La presencia de una función en la interfaz **no**
> implica que esté validada para uso asistencial.

---

## 1. Descripción

Re-Late explora funciones de organización, registro y seguimiento en fisioterapia, con
atención especial al paciente cardiometabólico. Todo el sistema funciona en el
navegador: interfaz, lógica y almacenamiento. No hay servidor propio ni base de datos
remota.

- **Interfaz y lógica:** `index.html` (HTML + CSS + JavaScript en un solo archivo).
- **Capa de mejoras:** `mejoras.js` + `mejoras.css`, integrados con dos etiquetas.
- **Estilos:** Tailwind CSS 3.4.16 · **Gráficas:** Chart.js 4.4.1.
- **Cifrado en cliente:** AES-256-GCM con PBKDF2-HMAC-SHA256 (600.000 iteraciones).
- **Ejercicios externos:** API de Wger (CC-BY-SA).

## 2. Estado de los módulos

| Módulo | Estado |
| :--- | :--- |
| Panel, Pacientes, Agenda, Bonos, Ejercicios, Rutinas, Adherencia | Activo |
| Portal del paciente, Consentimientos, Firma, Chat, Videoteca | Activo |
| Auditoría, Ajustes, Exportación / importación, Informes | Activo |
| **Valoración** (goniómetro) | **Activo · con aviso de trazabilidad** |
| **Atlas anatómico** (puntos gatillo y tests) | **Activo · con aviso de trazabilidad** |
| **Cardiometabólico** (zonas, constantes, pruebas, escalas) | **Activo · en revisión clínica** |

Los tres últimos muestran un aviso permanente que declara su nivel de evidencia. Sus
fórmulas, cortes y umbrales tienen fuente bibliográfica, pero **no han sido validados
por un profesional de rehabilitación cardiaca**.

## 3. Capa de mejoras v2.0

Se integra envolviendo las funciones de `index.html` desde un archivo externo: no se ha
reescrito la aplicación.

### Correcciones clínicas
- **Panel:** el indicador de abandono incluye ahora a los pacientes **sin ningún
  registro**; la EVA media se calcula sobre los últimos 30 días y se añade la EVA máxima.
- **Ficha de paciente** ampliada con **sexo, altura, peso, fase de rehabilitación
  cardiaca, clase NYHA, betabloqueo, anticoagulación y dispositivo**.
- **6MWT:** interpretación en **% del predicho** (Enright & Sherrill, *Eur Respir J*
  1998) con MCC de 26-33 m (ATS/ERS 2002).
- **Prensión manual:** cortes **EWGSOP2 por sexo** (<27 kg varones / <16 kg mujeres).
- **STS-30:** referencia por edad y sexo (Jones et al., *Phys Ther* 2007; aproximación
  lineal declarada en la propia interfaz).
- **TUG:** cortes 10 / 13,5 / 20 s con fuente.
- **Velocidad de marcha:** cortes 0,8 y 1,0 m/s (Studenski, *JAMA* 2011).
- **Oswestry:** opción **N/C** y **prorrateo oficial** del índice.
- **Berg:** corte ≤45/56 documentado.
- **Constantes:** alertas coherentes con la guía ESC/ESH y con las contraindicaciones
  de ACSM; corregido el caso de tensión sistólica aislada y añadido el **RPP = FC × TAS**.
- **Checklist de parada:** escala de **Borg CR10** explícita (con equivalencia 6-20) y
  criterios de desaturación y arritmia.
- **Zonas de entrenamiento:** comparación Tanaka / fórmula clásica, opción de FCmáx real
  de prueba de esfuerzo y aviso automático de betabloqueo.
- **Validación de rangos fisiológicos** en todos los campos numéricos.

### Correcciones técnicas
- **Contención de errores:** un fallo en un módulo muestra un aviso en lugar de dejar la
  pantalla en blanco, y se registra en consola y en auditoría.
- **Agenda:** detección de **solapamiento de citas** y aviso de fecha pasada.
- **Pacientes:** DNI duplicado bloqueado y **código de portal único**.
- **RGPD:** exportación **opcionalmente cifrada** (AES-256-GCM) con aviso explícito al
  exportar en claro, y **copia de seguridad automática antes de importar**.
- **Auditoría:** filtro en vivo y exportación **CSV**.
- **Recordatorios:** rechequeo cada 60 s (un `setTimeout` puro se pierde si el equipo se
  suspende).
- **Modo sin conexión:** `sw.js` v3 con precache de la estructura y caché
  *stale-while-revalidate* de los recursos, incluido el CDN. Requiere servirse por
  HTTP o HTTPS.
- **Accesibilidad:** foco visible, áreas táctiles, alto contraste (Alt+A), modo legible
  (Alt+F), foco atrapado en modales y cabecera/pie al imprimir.
- **Atajos del manifiesto** operativos mediante navegación por hash (`#cardio`, etc.).

### Fichas de evidencia
Al pasar el ratón sobre Karvonen, Tanaka, TUG, 6MWT, STS-30, Berg, Oswestry, mMRC, EVA,
Borg, SpO₂, tensión arterial, RPP, glucemia, goniometría, punción seca, Wger, PBKDF2 o
hash SHA-256, la app muestra una ficha con **fórmula, fuente primaria y limitación**.

### Atajos de teclado
`Alt+H` ayuda · `Alt+M` estado técnico · `Alt+A` alto contraste · `Alt+F` modo legible ·
`Alt+E` exportar copia cifrada · `Alt+P` imprimir con cabecera

## 4. Roles y credenciales de demostración

| Rol | PIN demo | Acceso |
| :--- | :--- | :--- |
| Administrador/a | `1234` | Todos los módulos, auditoría y ajustes |
| Fisioterapeuta | `1111` · `2222` | Módulos clínicos |
| Recepción | `0000` | Panel, agenda, bonos, chat y ajustes |
| Paciente | `0000` | Portal personal |

Los PIN son **valores de demostración**. La sesión se cierra tras 15 minutos de
inactividad y el acceso se bloquea 5 minutos tras 5 intentos fallidos.

## 5. Reproducir la demostración

1. Abre la URL publicada (GitHub Pages) en Chrome o Edge.
2. Entra como Administrador/a con el PIN `1234`.
3. Crea un paciente en **Pacientes**: la app genera su código de portal de 4 dígitos y
   rellena los datos que permiten interpretar las pruebas (sexo, altura, peso).
4. Monta una rutina en **Rutinas** y asígnala a ese paciente.
5. Registra constantes y una prueba funcional en **Cardio** y comprueba el RPP y las
   alertas de seguridad.
6. Vuelve al login, pestaña *Paciente*, y entra con el código para ver el portal.
7. Pulsa **Alt+M** para el estado técnico y **Alt+H** para la ayuda de la capa.

## 6. Requisitos y puesta en marcha

- Navegador actualizado (Chromium recomendado para el dictado por voz).
- **Internet en el primer arranque**, porque Tailwind y Chart.js se cargan del CDN. Si
  la carpeta `vendor/` está presente y el `index.html` apunta a ella, la app puede
  cargarse sin conexión desde el primer momento.
- Debe servirse por **HTTP o HTTPS**.

Opciones para ejecutarla:

1. **GitHub Pages** (recomendado): sube el repositorio, activa *Settings → Pages* y abre
   la URL publicada. Obtienes HTTPS real, service worker y modo sin conexión.
2. **Extensión Live Server** de Visual Studio Code.
3. `python -m http.server 8080`, si ya tienes Python instalado.

> ⚠️ **Abrir `index.html` con doble clic (`file://`) funciona de forma degradada.**
> Chrome bloquea IndexedDB en ese protocolo —la app avisa y cae al respaldo de
> LocalStorage— y el service worker no llega a registrarse, por lo que el modo sin
> conexión no existe. Los datos creados en `file://` no son los mismos que los del
> entorno servido.

## 7. Estructura de archivos

```text
relate-fisioterapia/
├── index.html                   # Aplicación (HTML + CSS + JavaScript)
├── mejoras.js                   # Capa de mejoras v2.0 (integración clínica y técnica)
├── mejoras.css                  # Capa de mejoras (accesibilidad e impresión)
├── sw.js                        # Service worker con precache y modo sin conexión
├── sw.js.orig                   # Service worker provisional anterior (trazabilidad)
├── manifest.json                # Manifiesto PWA
├── LICENSE                      # MIT · titular: Miguel Ángel Layunta López
├── README.md                    # Este documento
├── vendor/                      # Librerías locales (opcionales)
│   ├── tailwind-3.4.16.js
│   ├── chart-4.4.1.umd.min.js
│   ├── LICENSE-tailwind.txt     # Aviso MIT original (obligatorio al redistribuir)
│   └── LICENSE-chartjs.txt      # Aviso MIT original
└── icon.svg · icon-180.png · icon-192.png · icon-512.png · icon-maskable-512.png
