document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Por favor, preencha o e-mail e a senha.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.token && result.user) {
        // ✅ Salvando dados no localStorage
        localStorage.setItem("token", result.token);
        localStorage.setItem("userName", result.user.name);
        localStorage.setItem("userId", result.user.id);

        // ✅ Redirecionamento inteligente:
        if (result.user.isAdmin) {
          window.location.href = "PaginaAdmin.html";
        } else if (!result.user.hasDetails) {
          window.location.href = "Pagina3_InfoAdicionais.html";
        } else {
          window.location.href = "Pagina4_Arquivos.html"; // ou "Painelusuario.html"
        }
      } else {
        alert(
          "Erro: " +
            (result.error || result.details || "Resposta inválida do servidor.")
        );
      }
    } catch (err) {
      alert("Erro ao fazer login: " + err.message);
    }
  });
