document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("commission-grid");
    const addButton = document.getElementById("add-commission-btn");
    const message = document.getElementById("commission-message");

    if (!grid) return;

    const setMessage = (text, type = "") => {
        if (!message) return;
        message.textContent = text;
        message.className = `commission-message ${type}`.trim();
    };

    const renderCommission = (commission) => `
        <article class="commission-card glass-panel" data-commission-id="${commission.id}">
            <img src="${commission.image}" alt="${commission.title}">
            <h3>${commission.title}</h3>
            <p>Artist: ${commission.artist}</p>
            <p>$${Number(commission.price).toFixed(2)}</p>
            <button class="btn btn-secondary commission-delete-btn" data-commission-id="${commission.id}" type="button">
                Remove
            </button>
        </article>
    `;

    const loadCommissions = async () => {
        try {
            const response = await fetch("/api/commissions");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Could not load commissions.");
            }

            if (!data.commissions.length) {
                grid.innerHTML = `
                    <div class="glass-panel commission-empty-state">
                        No commissions yet. Add the first one.
                    </div>
                `;
                return;
            }

            grid.innerHTML = data.commissions.map(renderCommission).join("");
        } catch (error) {
            setMessage(error.message, "error");
        }
    };

    const addCommission = async () => {
        const title = prompt("Commission Title");
        if (!title) return;

        const artist = prompt("Artist Name");
        if (!artist) return;

        const price = prompt("Price");
        if (!price) return;

        const image = prompt("Image URL (optional)") || "";

        setMessage("Saving commission...", "info");

        try {
            const response = await fetch("/api/commissions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ title, artist, price, image })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Could not save commission.");
            }

            setMessage("Commission added.", "success");
            await loadCommissions();
        } catch (error) {
            setMessage(error.message, "error");
        }
    };

    const deleteCommission = async (commissionId) => {
        try {
            const response = await fetch(`/api/commissions/${commissionId}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Could not delete commission.");
            }

            setMessage("Commission removed.", "success");
            await loadCommissions();
        } catch (error) {
            setMessage(error.message, "error");
        }
    };

    addButton?.addEventListener("click", addCommission);

    grid.addEventListener("click", (event) => {
        const deleteButton = event.target.closest(".commission-delete-btn");
        if (!deleteButton) return;

        deleteCommission(deleteButton.dataset.commissionId);
    });

    loadCommissions();
});
