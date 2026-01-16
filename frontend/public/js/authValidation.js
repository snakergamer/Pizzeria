function validateRegister() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const usernameError = document.getElementById('usernameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    let isValid = true;

    const usernameRegex = /^[a-zA-Z]{3,20}$/;
    if (!usernameRegex.test(username)) {
        usernameError.style.display = 'block';
        usernameError.innerText = 'El nombre de usuario debe tener entre 3 y 20 caracteres y contener solo letras.';
        isValid = false;
    } else {
        usernameError.style.display = 'none';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com)$/;
    if (!emailRegex.test(email)) {
        emailError.style.display = 'block';
        emailError.innerText = 'El correo electrónico debe ser una dirección válida de @gmail.com o @hotmail.com.';
        isValid = false;
    } else {
        emailError.style.display = 'none';
    }

    // Password Validation
    // Min 8, Max 12
    if (password.length < 8 || password.length > 12) {
        passwordError.style.display = 'block';
        passwordError.innerText = 'La contraseña debe tener entre 8 y 12 caracteres.';
        isValid = false;
    } else {
        passwordError.style.display = 'none';
    }

    return isValid;
}

function validateLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert("Por favor, rellene todos los campos.");
        return false;
    }
    return true;
}
