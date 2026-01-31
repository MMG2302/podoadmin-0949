# Renderizado seguro (headless / sandbox)

Cuándo tiene sentido un **renderizado seguro** (navegador headless aislado, ejecución de JS en sandbox, captura de DOM final, screenshot) y si PodoAdmin lo necesita.

---

## ¿Qué es el “renderizado seguro”?

- **Headless browser aislado**: ejecutar una instancia de navegador (Puppeteer, Playwright, etc.) en un contenedor/sandbox para renderizar contenido no confiable.
- **Ejecución de JS en sandbox**: permitir o no que la página ejecute JavaScript; si se permite, debe estar limitada (sin acceso a red arbitraria, sin escape del sandbox).
- **Captura de DOM final / screenshot**: obtener el HTML renderizado o una imagen para mostrarla como “vista previa” sin ejecutar ese contenido en el frontend real.

Sirve para: **vista previa de enlaces** (fetch de una URL y mostrar thumbnail/snippet), **generación de PDF/HTML a partir de contenido de usuario**, o **renderizar HTML de usuario en el servidor** antes de mostrarlo.

---

## ¿Es aplicable o necesario en PodoAdmin hoy?

**No es necesario** con el diseño actual:

| Funcionalidad actual | Cómo se trata | ¿Headless/sandbox? |
|----------------------|---------------|--------------------|
| **Cuerpo de mensajes** | Texto plano; en el frontend se muestra con `{msg.body}` (React escapa por defecto). No se inserta HTML crudo. | No |
| **Vista previa al redactar** | Solo muestra subject/body/recipients en la UI; no se hace fetch a URLs externas. | No |
| **Logos (clínica/profesional)** | Imagen en base64 subida por el usuario; se muestra como `<img src={base64}>`. No se renderiza HTML de terceros. | No |
| **Sin “preview de enlace”** | No existe una función “vista previa de este enlace” que pida al servidor que cargue una URL y devuelva DOM/screenshot. | No |

Por tanto: **no hay renderizado de HTML no confiable en el servidor** ni **preview de URLs externas**. El checklist de “sandbox que escapa bien, limita llamadas externas, detecta fingerprinting” aplica cuando **sí** tengas ese tipo de flujo.

---

## Cuándo sí aplicaría

Sería **aplicable y recomendable** si añadieras algo como:

1. **Vista previa de enlaces**  
   El usuario pega una URL y la app muestra thumbnail/snippet. Ese flujo implica que el backend (o un worker) haga fetch a una URL no confiable. Ahí tendría sentido:
   - No hacer el fetch en el mismo proceso que sirve la API (riesgo SSRF, contenido malicioso).
   - Usar un servicio/worker aislado que, por ejemplo:
     - Haga fetch limitado (solo HTTP/HTTPS, timeouts, tamaño máximo).
     - Opcionalmente use un headless en sandbox para obtener DOM/screenshot y no ejecutar ese HTML/JS en el frontend.
   - Revisar: **escapado en el sandbox**, **límite de llamadas externas** (red), **detección de fingerprinting** si el contenido enlazado intenta identificar al servidor.

2. **Renderizado en servidor de HTML de usuario**  
   Por ejemplo: cuerpo del mensaje en HTML rico y el backend genera PDF o email HTML. Ahí el “renderizado seguro” sería:
   - Ejecutar el motor de render (headless o librería) en un entorno aislado.
   - Alimentar solo el HTML ya sanitizado (p. ej. lista blanca de etiquetas) y sin URLs arbitrarias o scripts.
   - No permitir que ese HTML abra conexiones arbitrarias ni haga fingerprinting del host.

En ambos casos, el checklist que comentas es el adecuado:

- **¿Tu sandbox escapa bien?**  
  El contenido que sale del sandbox (HTML, texto, imagen) debe estar escapado/sanitizado antes de guardarlo o enviarlo al cliente.

- **¿Limitas llamadas externas?**  
  El headless/sandbox no debe poder hacer requests arbitrarios (bloquear red o permitir solo dominios concretos).

- **¿Detectas fingerprinting?**  
  Si el contenido renderizado es de terceros (p. ej. página enlazada), valorar si quieres detectar o bloquear scripts/recursos que intenten identificar el entorno (navegador, IP, etc.).

---

## Resumen

- **Hoy en PodoAdmin**: no es necesario implementar headless/sandbox ni “renderizado seguro” en servidor; los mensajes son texto y se muestran sin interpretar HTML.
- **Si más adelante** añades vista previa de enlaces o generación de PDF/HTML desde contenido de usuario, entonces sí aplica y conviene diseñar el flujo con sandbox, límite de red y el checklist anterior (escapado, llamadas externas, fingerprinting).

Para medidas ya aplicadas en la app (escapado de entradas, detección de URLs ofuscadas, Safe Browsing en mensajes, etc.), ver **INPUT_SECURITY.md** y **PHISHING_PROTECTION.md**.
