const messageTranslations = {
    'These credentials do not match our records.': 'Ces identifiants ne correspondent pas à nos enregistrements.',
    'The given data was invalid.': 'Les informations saisies sont invalides.',
    'The email field is required.': "L'adresse email est obligatoire.",
    'The email must be a valid email address.': "L'adresse email doit être valide.",
    'The password field is required.': 'Le mot de passe est obligatoire.',
    'Unauthenticated.': 'Vous devez être connecté pour accéder à cette page.',
    'CSRF token mismatch.': 'Votre session a expiré. Rechargez la page puis réessayez.',
    'Too Many Attempts.': 'Trop de tentatives. Veuillez patienter avant de réessayer.',
    'We have emailed your password reset link.': 'Nous vous avons envoyé le lien de réinitialisation du mot de passe par email.',
    "We can't find a user with that email address.": 'Aucun utilisateur n’a été trouvé avec cette adresse email.',
};

export function translateApiMessage(message, fallback = 'Une erreur est survenue.') {
    if (!message) return fallback;
    return messageTranslations[message] ?? message;
}

export function translateApiErrors(errors = {}) {
    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
            field,
            Array.isArray(messages)
                ? messages.map(message => translateApiMessage(message))
                : translateApiMessage(messages),
        ])
    );
}

export function getFirstApiError(errors = {}) {
    const firstField = Object.values(errors)[0];

    if (Array.isArray(firstField)) {
        return firstField[0];
    }

    return firstField;
}

export function getApiErrorMessage(err, fallback = 'Une erreur est survenue.') {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const translatedErrors = translateApiErrors(data?.errors ?? {});
    const firstError = getFirstApiError(translatedErrors);

    if (firstError) {
        return firstError;
    }

    if (status === 419) {
        return 'Votre session a expiré. Rechargez la page puis réessayez.';
    }

    if (status === 429) {
        return 'Trop de tentatives. Veuillez patienter avant de réessayer.';
    }

    if (!err?.response) {
        return 'Une erreur réseau est survenue. Vérifiez votre connexion.';
    }

    return translateApiMessage(data?.message, fallback);
}
