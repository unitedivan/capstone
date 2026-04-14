document.addEventListener("DOMContentLoaded", async () => {
    const currentUserRaw = localStorage.getItem("currentUser");
    const logoutButton = document.getElementById("profile-logout-btn");
    const deleteButton = document.getElementById("profile-delete-btn");
    const editButton = document.getElementById("profile-edit-btn");
    const profileImageInput = document.getElementById("profile-image-input");
    const profileAvatarEditor = document.querySelector(".profile-avatar-editor");
    const tabButtons = document.querySelectorAll("[data-profile-tab]");
    const tabPanels = document.querySelectorAll("[data-profile-panel]");
    const addContentButtons = document.querySelectorAll("[data-add-content]");

    if (!currentUserRaw) {
        window.location.href = "auth.html";
        return;
    }

    const currentUser = JSON.parse(currentUserRaw);
    const profileImageStorageKey = `profileImage_${currentUser.id}`;
    const profileDetailsStorageKey = `profileDetails_${currentUser.id}`;
    const savedProfileDetails = JSON.parse(
        localStorage.getItem(profileDetailsStorageKey) || "{}"
    );

    const setActiveTab = (tabName) => {
        tabButtons.forEach((button) => {
            const isActive = button.dataset.profileTab === tabName;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", String(isActive));
        });

        tabPanels.forEach((panel) => {
            panel.classList.toggle("active", panel.dataset.profilePanel === tabName);
        });
    };

    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setActiveTab(button.dataset.profileTab);
        });
    });

    addContentButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const section = button.dataset.addContent;
            const labels = {
                posts: "post",
                commissions: "commission",
                tutorials: "tutorial",
                portfolio: "portfolio piece"
            };

            window.alert(
                `This is where the ${labels[section] || "content"} upload flow can go next.`
            );
        });
    });

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
            const profileDetails = {
                bio: savedProfileDetails.bio || user.bio,
                social: savedProfileDetails.social || "@artist_handle",
                portfolio: savedProfileDetails.portfolio || "Portfolio link"
            };

        const nameTargets = document.querySelectorAll("[data-profile-name]");
        const emailTargets = document.querySelectorAll("[data-profile-email]");
        const bioTargets = document.querySelectorAll("[data-profile-bio]");
        const initialsTargets = document.querySelectorAll("[data-profile-initials]");
        const specialtyList = document.getElementById("profile-specialties");
        const topAvatar = document.getElementById("top-profile-avatar");
        const socialTargets = document.querySelectorAll("[data-profile-social]");
        const portfolioTargets = document.querySelectorAll("[data-profile-portfolio]");
        const emailLink = document.querySelector("[data-profile-email-link]");

        nameTargets.forEach((element) => {
            element.textContent = user.name;
        });

        emailTargets.forEach((element) => {
            element.textContent = user.email;
        });

        bioTargets.forEach((element) => {
            element.textContent = profileDetails.bio;
        });

        initialsTargets.forEach((element) => {
            element.textContent = user.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0].toUpperCase())
                .join("");
        });

        socialTargets.forEach((element) => {
            element.textContent = profileDetails.social;
        });

        portfolioTargets.forEach((element) => {
            element.textContent = profileDetails.portfolio;
        });

        if (specialtyList) {
            specialtyList.innerHTML = user.specialties
                .map((specialty) => `<span class="tag-pill">${specialty}</span>`)
                .join("");
        }

        const avatarUrl =
            localStorage.getItem(profileImageStorageKey) ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`;

        if (topAvatar) {
            topAvatar.src = avatarUrl;
        }

        if (emailLink) {
            emailLink.href = `mailto:${user.email}`;
        }

        if (profileImageInput) {
            profileImageInput.addEventListener("change", () => {
                const [file] = profileImageInput.files || [];

                if (!file) {
                    return;
                }

                const reader = new FileReader();
                reader.onload = () => {
                    const result = typeof reader.result === "string" ? reader.result : "";
                    if (!result) {
                        return;
                    }

                    localStorage.setItem(profileImageStorageKey, result);

                    if (topAvatar) {
                        topAvatar.src = result;
                    }

                    profileAvatarEditor?.classList.add("has-image");

                    initialsTargets.forEach((element) => {
                        element.style.backgroundImage = `url("${result}")`;
                        element.style.backgroundSize = "cover";
                        element.style.backgroundPosition = "center";
                        element.style.color = "transparent";
                    });
                };
                reader.readAsDataURL(file);
            });
        }

        if (editButton) {
            editButton.addEventListener("click", () => {
                const nextBio = window.prompt("Update your profile description:", profileDetails.bio);
                if (nextBio === null) {
                    return;
                }

                const nextSocial = window.prompt("Update your social handle:", profileDetails.social);
                if (nextSocial === null) {
                    return;
                }

                const nextPortfolio = window.prompt("Update your portfolio link label:", profileDetails.portfolio);
                if (nextPortfolio === null) {
                    return;
                }

                const nextProfileDetails = {
                    bio: nextBio.trim() || profileDetails.bio,
                    social: nextSocial.trim() || profileDetails.social,
                    portfolio: nextPortfolio.trim() || profileDetails.portfolio
                };

                localStorage.setItem(
                    profileDetailsStorageKey,
                    JSON.stringify(nextProfileDetails)
                );

                bioTargets.forEach((element) => {
                    element.textContent = nextProfileDetails.bio;
                });

                socialTargets.forEach((element) => {
                    element.textContent = nextProfileDetails.social;
                });

                portfolioTargets.forEach((element) => {
                    element.textContent = nextProfileDetails.portfolio;
                });
            });
        }

        initialsTargets.forEach((element) => {
            element.style.backgroundImage = "";
            element.style.backgroundSize = "";
            element.style.backgroundPosition = "";
            element.style.color = "";
        });

        if (localStorage.getItem(profileImageStorageKey)) {
            profileAvatarEditor?.classList.add("has-image");
            initialsTargets.forEach((element) => {
                element.style.backgroundImage = `url("${avatarUrl}")`;
                element.style.backgroundSize = "cover";
                element.style.backgroundPosition = "center";
                element.style.color = "transparent";
            });
        } else {
            profileAvatarEditor?.classList.remove("has-image");
        }
    } catch (error) {
        localStorage.removeItem("currentUser");
        window.location.href = "auth.html";
    }
});
