let first = true
document.addEventListener('DOMContentLoaded', () => {
    const memberList = document.getElementById('memberList');
    const isPhoneScreen = window.matchMedia("(max-width: 767px)").matches;
    if (isPhoneScreen) {
        document.getElementById('memberlistcard').style.display = "none"
        document.getElementById('chatbox').style.flex = "0 0 100%"
    }
    setInterval(() => {
        fetch('/api/users')
            .then(response => response.json())
            .then(result => {
                if(first) {
                    document.getElementById('memberLoading').style.display = 'none'; 
                    first = false   
                }
                document.getElementById('memberCount').textContent = result.result.length + " Members Listed";
                memberList.innerHTML = '';
                result.result.forEach(user => {
                    const li = document.createElement('li');
                    li.textContent = user.username;
                    memberList.appendChild(li);
                });
            });
    }, 10000);
});

