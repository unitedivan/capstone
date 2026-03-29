document.addEventListener("DOMContentLoaded", async () => {
    const currentUserRaw = localStorage.getItem("currentUser");
    const logoutButton = document.getElementById("profile-logout-btn");
    const deleteButton = document.getElementById("profile-delete-btn");

    if (!currentUserRaw) {
        window.location.href = "auth.html";
        return;
    }

    const currentUser = JSON.parse(currentUserRaw);

    logoutButton?.addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        window.location.href = "auth.html";
    });

    deleteButton?.addEventListener("click", async () => {
        const confirmed = window.confirm(
            "Delete this account's saved data? This removes the account from db.json."
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(`/api/users/${currentUser.id}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Could not delete account data.");
            }

            localStorage.removeItem("currentUser");
            window.location.href = "auth.html";
        } catch (error) {
            window.alert(error.message);
        }
    });

    try {
        const response = await fetch(`/api/users/${currentUser.id}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not load profile.");
        }

        const user = data.user;

        const nameTargets = document.querySelectorAll("[data-profile-name]");
        const emailTargets = document.querySelectorAll("[data-profile-email]");
        const bioTargets = document.querySelectorAll("[data-profile-bio]");
        const initialsTargets = document.querySelectorAll("[data-profile-initials]");
        const specialtyList = document.getElementById("profile-specialties");
        const topAvatar = document.getElementById("top-profile-avatar");

        nameTargets.forEach((element) => {
            element.textContent = user.name;
        });

        emailTargets.forEach((element) => {
            element.textContent = user.email;
        });

        bioTargets.forEach((element) => {
            element.textContent = user.bio;
        });

        initialsTargets.forEach((element) => {
            element.textContent = user.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0].toUpperCase())
                .join("");
        });

        if (specialtyList) {
            specialtyList.innerHTML = user.specialties
                .map((specialty) => `<span class="tag-pill">${specialty}</span>`)
                .join("");
        }

        if (topAvatar) {
            topAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`;
        }
    } catch (error) {
        localStorage.removeItem("currentUser");
        window.location.href = "auth.html";
    }
});
