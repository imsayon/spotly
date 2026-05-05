# Spotly Docker Compose

The compose stack exposes nginx on `localhost:80` and routes by hostname:

- `api.spotly.local` -> API
- `merchant.spotly.local` -> merchant frontend
- `app.spotly.local` -> consumer frontend

Add these entries to `/etc/hosts` for local hostname routing:

```text
127.0.0.1 api.spotly.local
127.0.0.1 merchant.spotly.local
127.0.0.1 app.spotly.local
```
