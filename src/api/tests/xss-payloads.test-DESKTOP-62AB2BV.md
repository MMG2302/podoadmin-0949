# Pruebas de Payloads XSS

Este documento lista payloads XSS comunes que deben ser bloqueados/escapados por el sistema.

## Payloads a Probar

### 1. Payload Básico
```
"><img src=x onerror=alert('XSS')>
```
**Resultado Esperado**: Escapado a `&quot;&gt;&lt;img src=x onerror=alert(&#039;XSS&#039;)&gt;`

### 2. Script Tag
```
<script>alert('XSS')</script>
```
**Resultado Esperado**: Escapado a `&lt;script&gt;alert(&#039;XSS&#039;)&lt;/script&gt;`

### 3. JavaScript Protocol
```
javascript:alert('XSS')
```
**Resultado Esperado**: Removido o escapado

### 4. Event Handlers
```
onclick=alert('XSS')
onerror=alert('XSS')
onload=alert('XSS')
```
**Resultado Esperado**: Removidos

### 5. Iframe
```
<iframe src="javascript:alert('XSS')"></iframe>
```
**Resultado Esperado**: Escapado

### 6. Img con onerror
```
<img src=x onerror=alert('XSS')>
```
**Resultado Esperado**: Escapado y onerror removido

### 7. SVG con onload
```
<svg onload=alert('XSS')>
```
**Resultado Esperado**: Escapado y onload removido

### 8. Data URI
```
data:text/html,<script>alert('XSS')</script>
```
**Resultado Esperado**: Removido o escapado

### 9. VBScript
```
vbscript:alert('XSS')
```
**Resultado Esperado**: Removido

### 10. Expression (IE)
```
expression(alert('XSS'))
```
**Resultado Esperado**: Removido

## Cómo Probar

### En el Cliente (Formularios)

1. Intentar ingresar payloads en campos de texto
2. Verificar que se escapan correctamente
3. Verificar que no se ejecutan scripts

### En el Servidor (API)

1. Enviar payloads en requests POST/PUT
2. Verificar que se sanitizan en la respuesta
3. Verificar que no se almacenan sin escapar

### Ejemplo de Prueba

```typescript
// En una ruta de prueba
app.post('/test-xss', async (c) => {
  const { input } = await c.req.json();
  
  // Debe estar escapado
  return c.json({ 
    original: input,
    escaped: escapeHtml(input),
    containsXss: containsXssPayload(input)
  });
});
```

## Protecciones Implementadas

1. ✅ Escapado HTML en todos los inputs
2. ✅ Sanitización de strings
3. ✅ Detección de payloads XSS
4. ✅ Content Security Policy
5. ✅ Validación con Zod (incluye transformaciones)

## Notas

- Los payloads se escapan antes de almacenar
- Los payloads se escapan antes de devolver al cliente
- CSP previene ejecución incluso si algo se escapa
- Validación rechaza datos que contienen XSS
