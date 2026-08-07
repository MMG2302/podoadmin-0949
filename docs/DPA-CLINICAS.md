# Acuerdo de Tratamiento de Datos (DPA) — Podoraa

**Borrador para revisión legal.** Este documento describe con precisión lo que el
sistema hace hoy, pero **no es un contrato válido hasta que un abogado lo revise y
adapte** a la jurisdicción de operación y a cada mercado de destino. Los campos entre
corchetes deben completarse antes de cualquier firma.

---

**Entre:**

- **[RAZÓN SOCIAL], [tipo de sociedad], con domicilio en [DOMICILIO]** — en adelante
  **el Encargado** (opera la plataforma Podoraa).
- **[NOMBRE DE LA CLÍNICA O PROFESIONAL]** — en adelante **el Responsable**.

**Fecha:** [FECHA] · **Versión:** 1.0

---

## 1. Roles de las partes

El Responsable determina los fines y medios del tratamiento de los datos de sus
pacientes. El Encargado los trata **únicamente por cuenta y bajo instrucciones** del
Responsable, para prestar el servicio contratado.

Esta asignación de roles no es una formalidad: el Responsable conserva las obligaciones
frente a sus pacientes (información, consentimiento, atención de derechos y conservación
del expediente clínico conforme a la normativa sanitaria que le resulte aplicable).

## 2. Objeto y duración

El Encargado tratará datos personales para prestar el servicio de gestión clínica
podológica: agenda, expediente clínico, adjuntos de laboratorio, comunicaciones con
pacientes, cobros y analíticas.

El tratamiento dura mientras exista contrato de servicio, más los plazos de conservación
de la cláusula 9.

## 3. Categorías de datos y de interesados

**Interesados:** pacientes del Responsable; personal del Responsable con acceso al
sistema (podólogos, recepción, administración).

**Datos de pacientes:**

| Categoría | Ejemplos |
|---|---|
| Identificativos | nombre, documento, fecha de nacimiento, sexo |
| Contacto | teléfono, correo electrónico |
| **Salud (categoría especial)** | antecedentes médicos y podológicos, exploraciones, diagnósticos, tratamientos, consentimientos, adjuntos de laboratorio, imágenes |
| Económicos | tratamientos facturados, pagos registrados, estado de cuenta |
| Uso | registros de acceso y auditoría asociados a la actividad clínica |

Los datos de salud son **categoría especial / dato sensible**. Ambas partes reconocen
que su tratamiento exige medidas reforzadas y que el Responsable es quien debe
recabar la base de licitud frente al paciente.

## 4. Instrucciones del Responsable

El Encargado tratará los datos solo conforme a las instrucciones documentadas del
Responsable, que son: (a) este acuerdo, (b) el contrato de servicio, y (c) las
operaciones que el Responsable ejecute a través de la propia aplicación.

El Encargado **no utiliza los datos de pacientes para fines propios**, no los cede a
terceros salvo los subencargados de la cláusula 6, y **no los emplea para entrenar
modelos de inteligencia artificial**.

Si el Encargado considera que una instrucción infringe la normativa aplicable, lo
comunicará al Responsable.

## 5. Medidas de seguridad

El Encargado aplica, como mínimo, las siguientes medidas técnicas y organizativas:

**Aislamiento entre clientes.** Toda lectura o escritura de datos ligados a un paciente
verifica que el registro pertenece al ámbito del solicitante, antes de devolver
información. Los listados se acotan por ámbito del usuario; un parámetro de filtro
puede restringir el alcance, nunca ampliarlo.

**Cifrado.** En tránsito mediante TLS. En reposo mediante el cifrado de la
infraestructura del subencargado de alojamiento.

**Autenticación.** Contraseñas almacenadas con función de derivación de clave (bcrypt),
nunca en claro. Tokens de sesión de vida corta en cookies `HttpOnly` y `Secure`, con
invalidación inmediata al cerrar sesión. Segundo factor (TOTP) disponible.

**Control de acceso.** Permisos por rol. El personal de recepción no accede a datos
clínicos sensibles.

**Resistencia a abuso.** Límite progresivo de intentos de inicio de sesión por
combinación de correo e IP, con bloqueo temporal; protección CSRF en toda operación
que modifica estado; validación y saneamiento de entradas; consultas parametrizadas.

**Trazabilidad.** Registro de auditoría de solo escritura para las acciones sensibles
(altas, bajas, cambios de permisos, exportaciones, accesos administrativos).

**Gestión de secretos.** Credenciales fuera del código, en almacén de secretos del
proveedor de infraestructura. La aplicación no arranca si faltan.

**Copias de seguridad.** Respaldo periódico automatizado de la base de datos.

El Encargado podrá modificar estas medidas siempre que **no reduzcan** el nivel de
protección.

## 6. Subencargados

El Responsable autoriza a los siguientes subencargados. La distinción sobre qué datos
recibe cada uno es material y se declara con precisión:

### Acceden a datos de pacientes

| Subencargado | Función | Datos |
|---|---|---|
| **Cloudflare, Inc.** | Alojamiento, base de datos, almacenamiento de adjuntos, red | La totalidad de los datos del servicio |
| **Meta Platforms, Inc.** (WhatsApp Business) | Envío de recordatorios y mensajes al paciente | Nombre, teléfono y datos de la cita |

### No acceden a datos de pacientes

| Subencargado | Función | Alcance |
|---|---|---|
| **Resend / proveedor de correo** | Correo transaccional | Solo usuarios del sistema (personal del Responsable) |
| **Stripe, Inc.** | Cobro de la suscripción | Solo facturación del Responsable |
| **Twilio, Inc.** | Verificación por SMS en el alta | Solo titular de la cuenta |
| **Sentry** | Registro de errores | Configurado sin datos personales (`sendDefaultPii: false`) |

El uso de WhatsApp es **opcional y lo activa el Responsable**. Si no lo configura, no
se transmite ningún dato de paciente a Meta.

El Encargado informará de cualquier alta o sustitución de subencargado con al menos
**[30] días** de antelación. El Responsable podrá oponerse por motivos razonables; de
no alcanzarse una solución, podrá resolver el contrato sin penalización.

## 7. Transferencias internacionales

La infraestructura de alojamiento puede procesar y almacenar datos **fuera del país del
Responsable**, incluidos centros de datos en Estados Unidos.

> **Pendiente de definir con asesoría legal:** el mecanismo de transferencia aplicable
> (cláusulas contractuales tipo u otro instrumento) según la normativa del país de cada
> clínica. Este punto debe cerrarse antes de firmar con clientes fuera del país de
> constitución del Encargado.

## 8. Derechos de los interesados

Los pacientes ejercen sus derechos **ante el Responsable**, que es su interlocutor.

El Encargado asiste al Responsable con las funciones de la plataforma: exportación de
datos, rectificación, y supresión sujeta a la cláusula 9. Si un paciente se dirige
directamente al Encargado, este no atenderá la solicitud por sí mismo y la remitirá al
Responsable sin demora.

## 9. Conservación, bloqueo legal y supresión

El sistema aplica un motor de retención que ejecuta la purga de datos vencidos de forma
automática y programada.

**Bloqueo legal.** Antes de cualquier supresión se comprueba si existe un bloqueo activo
sobre el registro. Un bloqueo vigente **impide el borrado sin excepción**, incluida la
purga automática.

> **Pendiente de configurar por jurisdicción:** los plazos mínimos de conservación del
> expediente clínico son **obligatorios y varían por país**. El Responsable debe
> indicar el plazo aplicable a su normativa sanitaria, y el Encargado configurarlo. No
> deben usarse valores por defecto para este punto.

Al terminar el contrato, y salvo obligación legal de conservación, el Encargado
suprimirá o devolverá los datos según elija el Responsable, en un plazo de **[30] días**
desde su solicitud.

## 10. Violaciones de seguridad

El Encargado notificará al Responsable **sin dilación indebida y a más tardar en
[24] horas** desde que tenga conocimiento de una violación que afecte a datos tratados
por cuenta del Responsable.

La notificación incluirá: naturaleza del incidente, categorías y volumen aproximado de
datos e interesados afectados, consecuencias probables, medidas adoptadas y punto de
contacto.

El plazo se fija en 24 horas de forma deliberada: el Responsable es quien debe notificar
a la autoridad —en varias jurisdicciones dentro de 72 horas— y necesita margen para
hacerlo.

## 11. Confidencialidad

El Encargado garantiza que quien accede a los datos está sujeto a deber de
confidencialidad, subsistente tras el fin de la relación.

## 12. Auditoría

El Encargado pondrá a disposición del Responsable la información necesaria para
acreditar el cumplimiento de este acuerdo y permitirá auditorías, con preaviso
razonable, sin comprometer la seguridad ni la confidencialidad de otros clientes.

## 13. Responsabilidad y ley aplicable

> **Pendiente de definir con asesoría legal:** régimen de responsabilidad y su
> eventual límite, ley aplicable y fuero. Debe coordinarse con los Términos de Servicio
> para que no se contradigan.

---

## Anexo — Pendientes antes de firmar

1. Razón social, domicilio y representante del Encargado
2. Mecanismo de transferencia internacional (cláusula 7)
3. Plazos de conservación del expediente por jurisdicción (cláusula 9)
4. Responsabilidad, ley aplicable y fuero (cláusula 13)
5. Revisión completa por abogado con experiencia en protección de datos de salud
6. Si se vende a Estados Unidos: evaluar HIPAA y sustituir o complementar este
   documento por un *Business Associate Agreement*
