function loginWithVK() {
    if ('VKIDSDK' in window) {
        const VKID = window.VKIDSDK;

        VKID.Config.init({
            app: 53025022, // Your VK App ID
            redirectUrl: 'http://localhost:3000/auth/vk/callback',
            responseMode: VKID.ConfigResponseMode.Callback,
            source: VKID.ConfigSource.LOWCODE,
        });

        VKID.Auth.login()
            .then(vkidOnSuccess)
            .catch(vkidOnError);
    }
}

function vkidOnSuccess(data) {
    console.log('Login successful:', data);
    // Handle successful login
    window.location.href = '/dashboard'; // Redirect to dashboard or home page
}

function vkidOnError(error) {
    console.error('Login error:', error);
    window.location.href = `/error?error=${encodeURIComponent('Ошибка входа: ' + error.message)}`;
} 