$(document).ready(function() {
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        const username = $('#username').val().toLowerCase();
        const password = $('#password').val();
        
        // Kullanıcı bilgileri
        const users = {
            'ozan': 'EDSXasxI3k1qqD',
            'emine': 'nNXCRZLBdNBt25'
        };
        
        // Giriş kontrolü
        if (users[username] && users[username] === password) {
            // Başarılı giriş
            localStorage.setItem('currentUser', username);
            showSuccessMessage(`Hoş geldin ${username.charAt(0).toUpperCase() + username.slice(1)}! 💕`);
            
            setTimeout(() => {
                window.location.href = 'diary.html';
            }, 1500);
        } else {
            // Hatalı giriş
            showErrorMessage('Kullanıcı adı veya şifre hatalı! 😔');
        }
    });
});

function showSuccessMessage(message) {
    $('#errorMessage').removeClass('error').addClass('success').text(message).fadeIn();
    setTimeout(() => {
        $('#errorMessage').fadeOut();
    }, 3000);
}

function showErrorMessage(message) {
    $('#errorMessage').removeClass('success').addClass('error').text(message).fadeIn();
    setTimeout(() => {
        $('#errorMessage').fadeOut();
    }, 3000);
}