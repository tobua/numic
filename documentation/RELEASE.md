# Release

## Release for Android

> [!TIP]
> The plugin already takes care of a lot of steps in the release process. In case you run into any issues or the below documenation might be out-of-date consult the [official React Native APK release documentation](https://reactnative.dev/docs/signed-apk-android).

To release a React Native app for Android a few manual steps are currently required. First you need JDK (not just the JRE bundled with Android Studio) downloaded and installed from [Oracle Downloads](https://www.oracle.com/java/technologies/downloads) and linked in `~/.zshrc` with `export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-[DOWNLOADED_VERSION].jdk/Contents/Home/bin/java`, apply changes with `source ~/.zshrc`. Once that's done generate a signing key:

```sh
sudo keytool -genkey -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Add the generated file to `/android/app/my-upload-key.keystore`, no need to commit this file as it will be integrated into the patch (it's fairly short). Once that's also done add the password you just entered as well as the file location to the end of `/android/gradle.properties`:

```sh

MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****
```

The make the following changes to `/android/app/build.gradle`:

```sh
             keyAlias 'androiddebugkey'
             keyPassword 'android'
         }
+        release {
+            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
+                storeFile file(MYAPP_UPLOAD_STORE_FILE)
+                storePassword MYAPP_UPLOAD_STORE_PASSWORD
+                keyAlias MYAPP_UPLOAD_KEY_ALIAS
+                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
+            }
+        }
     }
     buildTypes {
         debug {
             signingConfig signingConfigs.debug
         }
         release {
-            // Caution! In production, you need to generate your own keystore file.
-            // see https://reactnative.dev/docs/signed-apk-android.
-            signingConfig signingConfigs.debug
+            signingConfig signingConfigs.release
             minifyEnabled enableProguardInReleaseBuilds
             proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
         }
```

This will read the keyfile when running the `Distribute` script and build with the release configuration. Don't forget to revert `JAVA_HOME` to the JRE location in Android Studio.
