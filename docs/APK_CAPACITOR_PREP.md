# APK Capacitor Prep

## Estado

CrediOS queda preparado con Capacitor para Android.

Configuracion agregada:

- `capacitor.config.ts`
- `mobile-shell/index.html`
- `android/`
- scripts `mobile:*` en `package.json`

App nativa:

- App ID: `com.bysanvat.credios`
- App name: `CrediOS`
- URL productiva: `https://credios.pages.dev`
- HTTPS obligatorio: `cleartext: false`
- Android min SDK: 24
- Android target SDK: 36

## Por que esta estrategia

La app actual depende de Next.js, Supabase SSR y server actions para flujos criticos. Un APK nativo que carga la app Cloudflare mantiene una unica fuente de verdad y evita duplicar pagos, abonos, auth y RLS.

Capacitor permite agregar una app nativa a un proyecto web existente y sincronizar un proyecto Android. La documentacion oficial recomienda instalar `@capacitor/core`, `@capacitor/cli`, inicializar config y agregar la plataforma Android.

Referencias:

- https://capacitorjs.com/docs/getting-started
- https://capacitorjs.com/docs/android

## Comandos

Instalar dependencias:

```bash
npm install
```

Sincronizar Android:

```bash
npm run mobile:sync
```

Abrir en Android Studio:

```bash
npm run mobile:open
```

Ejecutar en dispositivo/emulador:

```bash
npm run mobile:run:android
```

Diagnostico:

```bash
npm run mobile:doctor
```

## Crear APK debug

Comando recomendado:

```bash
npm run mobile:apk:debug
```

Este script usa el JDK incluido con Android Studio cuando existe. En esta maquina el `java` global apunta a Java 26, que no es compatible con el build Gradle usado por Android; Android Studio trae JDK 21 y ese fue el runtime que compilo correctamente.

Alternativa manual desde Windows PowerShell:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
Set-Location android
.\gradlew.bat assembleDebug
```

Salida esperada:

```txt
android/app/build/outputs/apk/debug/app-debug.apk
```

Ese APK sirve para instalacion manual/test interno. Para Play Store o distribucion formal se necesita un release firmado.

## Crear APK release firmado

1. Abrir Android Studio:

```bash
npm run mobile:open
```

2. Usar:

```txt
Build > Generate Signed Bundle / APK
```

3. Crear o seleccionar keystore.
4. Elegir APK o Android App Bundle.
5. Guardar credenciales de firma fuera del repo.

Nunca commitear:

- keystore;
- passwords;
- `google-services.json` si contiene secretos;
- archivos `.jks`;
- credenciales de Play Console.

## Cuando hay cambios

Cambios solo web:

1. Validar y desplegar Cloudflare.
2. El APK remoto toma la nueva version automaticamente al cargar la URL.

Cambios nativos:

1. Editar config nativa.
2. Ejecutar:

```bash
npm run mobile:sync
```

3. Reconstruir APK.

## Limitaciones conocidas

- El APK depende de conexion a internet porque carga Cloudflare.
- No se agrega cache offline de datos financieros.
- Google Auth debe estar configurado en Supabase para funcionar en web/APK.
- Para OAuth en WebView puede hacer falta revisar redirects permitidos y comportamiento de navegador externo segun pruebas en dispositivo.

## QA minimo en dispositivo

1. Instalar APK.
2. Abrir CrediOS.
3. Confirmar que carga `Mis finanzas`.
4. Iniciar sesion.
5. Crear movimiento ficticio.
6. Abrir simulador.
7. Guardar simulacion.
8. Abrir credito.
9. Registrar pago de prueba.
10. Cerrar sesion desde Configuracion.

Si Google Auth no esta habilitado en Supabase, debe aparecer el mensaje controlado y nunca JSON crudo.
