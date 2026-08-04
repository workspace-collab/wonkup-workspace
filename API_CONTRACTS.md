# API Contracts — Entrega 2

La API recibe `POST` con `URLSearchParams`:

- `action`: operación.
- `payload`: JSON serializado.

Respuesta estándar:

```json
{ "ok": true, "data": {} }
```

Error:

```json
{ "ok": false, "error": "Mensaje" }
```

## `auth.exchangeCode`

Entrada:

```json
{ "code": "WONKUP-ADMIN" }
```

Salida: objeto `Session` con token opaco, usuario, rol, alcance y vencimiento.

## `auth.validate`

Entrada:

```json
{ "sessionToken": "token-opaco" }
```

Salida: sesión vigente. Devuelve error cuando está vencida o revocada.

## `auth.revoke`

Entrada:

```json
{ "sessionToken": "token-opaco" }
```

Salida:

```json
{ "revoked": true }
```

## `workspaces.list`

Entrada:

```json
{ "sessionToken": "token-opaco" }
```

Salida: lista de workspaces autorizados.
