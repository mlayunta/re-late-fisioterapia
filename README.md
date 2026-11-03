<div align="center">

# Re-Late · FISIOTERAPIA

**Aplicación clínica de gestión y prescripción de ejercicio terapéutico**

*Asociación de Enfermos de Rehabilitación Cardiaca*

**Autor: Miguel Ángel Layunta López**

---

![Versión](https://img.shields.io/badge/versión-5.0-0f766e?style=flat-square)
![Archivo único](https://img.shields.io/badge/formato-archivo%20único-14b8a6?style=flat-square)
![Sin instalación](https://img.shields.io/badge/sin%20instalación-100%25-10b981?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-instalable-f59e0b?style=flat-square)
![Idioma](https://img.shields.io/badge/idioma-español-3b82f6?style=flat-square)

</div>

---

## 📖 Sobre el proyecto

**Re-Late · Fisioterapia** es una aplicación web pensada para la práctica diaria de la fisioterapia, con especial atención a la **rehabilitación cardiaca y respiratoria**.

Nace con una idea sencilla: que el fisioterapeuta disponga de **toda su herramienta de trabajo en un solo archivo** —historia clínica, agenda, valoración, prescripción de ejercicio, adherencia, facturación y un atlas anatómico completo— sin necesidad de instalar nada ni contratar un servidor.

> ⚠️ **Este proyecto es una herramienta de apoyo al profesional. No sustituye en ningún caso el juicio clínico ni el diagnóstico médico.**

---

## ✨ Módulos incluidos

| Módulo | Qué permite |
|---|---|
| 📊 **Panel** | Resumen de citas del día, alertas de riesgo, mensajes sin leer, EVA medio y cobros pendientes |
| 🧑‍⚕️ **Pacientes** | Historia clínica, diagnóstico, alergias, factores de riesgo, etiquetas y fisioterapeuta asignado |
| 🗺️ **Mapa corporal** | Marcado interactivo de zonas de dolor, restricción y puntos gatillo sobre silueta |
| 📅 **Agenda** | Calendario mensual, citas, recordatorios automáticos y consumo de bonos |
| 📐 **Valoración** | Goniómetro digital interactivo, registro de ROM y análisis postural |
| 🏋️ **Ejercicios** | Biblioteca propia + importación desde fuentes externas |
| 📋 **Rutinas** | Constructor por arrastrar y soltar, con series, repeticiones y notas |
| 📈 **Adherencia** | Registro de EVA y Borg, detección de abandono y gráficas de evolución |
| 💳 **Bonos y pagos** | Control de sesiones consumidas, cobros y facturación |
| ✍️ **Consentimientos** | Plantillas legales y **firma digital** en pantalla |
| 🎥 **Videoteca** | Recursos oficiales y vídeos de sesión protegidos por consentimiento |
| 💬 **Chat** | Comunicación profesional–paciente centralizada |
| 🫀 **Atlas** | Mapa anatómico exhaustivo de puntos gatillo y tests |
| ❤️ **Cardiometabólico** | Zonas de entrenamiento, constantes, pruebas funcionales y escalas |
| 🖨️ **Informes** | Informe de evolución listo para imprimir o guardar en PDF |
| 🔒 **Auditoría** | Registro de trazabilidad de todas las acciones |
| ⚙️ **Ajustes** | Copias de seguridad, cifrado y aviso legal |

---

## 🫀 Atlas anatómico

La pestaña de Atlas reúne tres bloques de referencia clínica:

- **🗺️ Mapa de puntos gatillo** — Figura anterior y posterior con **143 puntos** distribuidos por 8 regiones. Al seleccionar un punto se muestra el músculo, su **dolor referido**, el **test asociado** y una nota clínica. Filtros por región y buscador.
- **🧪 Tests neurológicos y ortopédicos** — **58 pruebas** con indicación de qué exploran, cómo se realizan y cuál es el signo positivo. Filtro por región: cervical, hombro, codo, muñeca, lumbar, cadera, rodilla, tobillo y pie.
- **📚 Guía de referencia** — Tablas de **dermatomas**, **miotomas**, **reflejos osteotendinosos** y escalas de valoración de fuerza y reflejos.

---

## ❤️ Pack cardiometabólico

Módulo específico para rehabilitación cardiaca:

| Submódulo | Contenido |
|---|---|
| **Zonas de entrenamiento** | Cálculo por método de **Karvonen** (FC de reserva), fórmulas de Tanaka y clásica, con escala de Borg objetivo por zona |
| **Constantes** | TA, FC, SpO₂ y glucemia con **alertas automáticas** de seguridad antes de la sesión |
| **Pruebas funcionales** | TUG, marcha de 6 minutos, sentadilla 30 s, velocidad de marcha y fuerza de prensión, con interpretación |
| **Escalas validadas** | Disnea **MRC**, **Índice de Oswestry**, **Escala de Berg** |
| **Informe** | Documento de evolución imprimible con valoraciones, adherencia, plan y notas |

---

## 📱 Portal del paciente

El paciente accede con un **código de 4 dígitos** asignado al crear su historia y puede:

- Ver sus rutinas y lanzarlas con un **reproductor guiado** (trabajo / descanso, temporizador y avance automático)
- Registrar su dolor y esfuerzo al finalizar
- Consultar la gráfica de su evolución y su racha de días activos
- Chatear con su fisioterapeuta
- Consultar sus bonos y **firmar consentimientos** desde el móvil

---

## 🛠️ Stack técnico

- **Un único `index.html`** — sin build, sin dependencias locales, sin instalación
- **Tailwind CSS** (CDN) — interfaz y modo oscuro
- **Chart.js** (CDN) — gráficas de evolución
- **IndexedDB** con respaldo automático a `localStorage`
- **Canvas API** — goniómetro, mapa corporal y firma digital
- **Web Crypto API** — cifrado opcional AES-256-GCM con clave derivada por PBKDF2
- **Web Speech API** — dictado de notas clínicas
- **Service Worker + Manifest** — PWA instalable y funcionamiento sin conexión
- **Notificaciones Web** — recordatorios de cita

---

## 📂 Estructura del proyecto

```
relate-fisioterapia/
├── index.html        ← la aplicación completa
├── manifest.json     ← metadatos de la PWA
├── sw.js             ← service worker (modo sin conexión)
├── icon.svg          ← icono de la aplicación
└── README.md         ← este documento
```

---

## 🚀 Uso local

1. Descarga los 4 archivos de este repositorio
2. Colócalos en una misma carpeta
3. Haz **doble clic** sobre `index.html`

Listo: la aplicación se abre en el navegador y funciona sin conexión.

> 💡 Para que la **instalación como app (PWA)** funcione es necesario servirla por `http://` o `https://`. En local con `file://` la app funciona, pero no se podrá instalar.

---

## 🌐 Publicación en GitHub Pages

1. Crea un repositorio **público** llamado `relate-fisioterapia`
2. Sube los 4 archivos a la **raíz** del repositorio
3. Ve a **Settings → Pages**
4. En *Source* elige **Deploy from a branch** → rama `main` → carpeta `/ (root)` → **Save**
5. Espera un par de minutos y abre `https://tu-usuario.github.io/relate-fisioterapia/`

### Instalar como aplicación

- **Android (Chrome):** menú ⋮ → *Añadir a pantalla de inicio* / *Instalar aplicación*
- **iPhone (Safari):** botón Compartir → *Añadir a pantalla de inicio*

---

## 🔑 Accesos de demostración

Estos usuarios se crean automáticamente al abrir la aplicación por primera vez:

| Perfil | PIN | Alcance |
|---|---|---|
| **Miguel Ángel Layunta** (administrador) | `1234` | Todos los módulos |
| **Fisio. Ana Ruiz** | `1111` | Clínico completo sin auditoría |
| **Fisio. Carlos Soto** | `2222` | Clínico completo sin auditoría |
| **Recepción** | `0000` | Panel, agenda, bonos y chat |
| **Portal del paciente** | `0000` | Rutinas, chat y plan |

> ⚠️ Son credenciales **exclusivamente de demostración**. No las uses con datos reales.

---

## 🔐 Privacidad, seguridad y RGPD

- Los datos se almacenan **únicamente en el dispositivo** del profesional. **No se envía nada a ningún servidor.**
- Cada usuario ve solo lo que permite su **rol**.
- Todas las acciones quedan reflejadas en el **registro de auditoría**, incluida la consulta de historias clínicas.
- Los vídeos de sesión exigen **consentimiento de grabación firmado**.
- El **aviso legal y la política de privacidad** se muestran y aceptan en el primer acceso.
- Cierre automático de sesión por **inactividad** (15 minutos).
- **Cifrado opcional** de todos los registros con AES-256-GCM.

### ⚠️ Límites que hay que conocer

Esta es una aplicación de **una sola persona y un solo dispositivo**. Antes de usarla con datos reales de pacientes es imprescindible:

- Servirla siempre bajo **HTTPS**
- Sustituir el PIN por autenticación robusta
- Configurar **copias de seguridad** periódicas
- Implantar un **backend** con base de datos cifrada si varios profesionales deben compartir la historia
- Realizar la **evaluación de impacto** y el registro de tratamiento exigidos por el RGPD

> 🚫 **Nunca introduzcas datos identificativos reales de pacientes en esta versión de demostración.**

---

## 🗺️ Hoja de ruta

- [ ] Backend con API y base de datos (varios profesionales, datos compartidos)
- [ ] Autenticación real y gestión de sesiones
- [ ] Sincronización multidispositivo
- [ ] Recordatorios por correo y SMS
- [ ] Tele-rehabilitación por videollamada
- [ ] Conexión con pulsómetros y wearables
- [ ] Más escalas validadas (DASH, KOOS, SF-36, IPAQ)
- [ ] Protocolos clínicos por patología
- [ ] Exportación a FHIR / HL7

---

## 👤 Autoría

**Re-Late** — Asociación de Enfermos de Rehabilitación Cardiaca

**Autor: Miguel Ángel Layunta López**

Proyecto desarrollado para apoyar la labor diaria del fisioterapeuta y mejorar el seguimiento del paciente durante su rehabilitación.

---

<div align="center">

### Re-Late · Fisioterapia
*Autor: Miguel Ángel Layunta López*

Herramienta de apoyo clínico. No sustituye el juicio profesional.

</div>