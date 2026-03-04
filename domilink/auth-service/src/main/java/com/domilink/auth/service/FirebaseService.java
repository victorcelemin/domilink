package com.domilink.auth.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Servicio para interactuar con Firebase Authentication.
 * Si no hay credenciales configuradas, opera en modo local (sin Firebase).
 */
@Service
public class FirebaseService {

    private static final Logger log = LoggerFactory.getLogger(FirebaseService.class);

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @Value("${firebase.project-id:domilink-dev}")
    private String projectId;

    private boolean firebaseEnabled = false;

    @PostConstruct
    public void initializeFirebase() {
        if (credentialsPath == null || credentialsPath.isBlank()) {
            log.warn("Firebase no configurado. Operando en modo local sin Firebase.");
            log.warn("Para habilitar Firebase, configure FIREBASE_CREDENTIALS_PATH y FIREBASE_PROJECT_ID");
            return;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = new FileInputStream(credentialsPath);
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .setProjectId(projectId)
                        .build();
                FirebaseApp.initializeApp(options);
                firebaseEnabled = true;
                log.info("Firebase inicializado correctamente para proyecto: {}", projectId);
            }
        } catch (IOException e) {
            log.error("Error al inicializar Firebase: {}", e.getMessage());
            log.warn("Continuando en modo local sin Firebase.");
        }
    }

    /**
     * Crea un usuario en Firebase Authentication.
     * Solo se ejecuta si Firebase esta habilitado.
     */
    public String createFirebaseUser(String email, String password, String displayName) {
        if (!firebaseEnabled) {
            log.debug("Firebase deshabilitado. Omitiendo creacion de usuario en Firebase.");
            return null;
        }

        try {
            UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                    .setEmail(email)
                    .setPassword(password)
                    .setDisplayName(displayName)
                    .setEmailVerified(false);

            UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
            log.info("Usuario creado en Firebase con UID: {}", userRecord.getUid());
            return userRecord.getUid();
        } catch (FirebaseAuthException e) {
            log.error("Error al crear usuario en Firebase: {}", e.getMessage());
            throw new RuntimeException("Error al crear usuario en Firebase: " + e.getMessage(), e);
        }
    }

    /**
     * Verifica un token de Firebase (para login con Firebase Client SDK).
     */
    public String verifyFirebaseToken(String idToken) {
        if (!firebaseEnabled) {
            throw new RuntimeException("Firebase no esta habilitado en este entorno");
        }

        try {
            com.google.firebase.auth.FirebaseToken decodedToken =
                    FirebaseAuth.getInstance().verifyIdToken(idToken);
            return decodedToken.getUid();
        } catch (FirebaseAuthException e) {
            throw new RuntimeException("Token de Firebase invalido: " + e.getMessage(), e);
        }
    }

    /**
     * Elimina un usuario de Firebase.
     */
    public void deleteFirebaseUser(String uid) {
        if (!firebaseEnabled) return;

        try {
            FirebaseAuth.getInstance().deleteUser(uid);
            log.info("Usuario eliminado de Firebase: {}", uid);
        } catch (FirebaseAuthException e) {
            log.error("Error al eliminar usuario de Firebase: {}", e.getMessage());
        }
    }

    public boolean isFirebaseEnabled() {
        return firebaseEnabled;
    }
}
