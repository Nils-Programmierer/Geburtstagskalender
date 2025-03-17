let deferredPrompt;

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
});


document.getElementById("install").addEventListener("click", async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();

        let choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
            showMessage("App wurde erfolgreich installiert!", "success", "Erfolgreich");
        }
        deferredPrompt = null;
    }
});


document.addEventListener("DOMContentLoaded", () => {
    initDatabase();
    const layoutElements = [...document.querySelectorAll("h3"), document.querySelector(".mdl-layout"), ...document.querySelectorAll(".text"), document.querySelector(".mdl-switch__label"), document.querySelector(".mdl-layout__drawer"), ...document.querySelectorAll(".mdl-layout-title"), ...document.querySelectorAll(".mdl-navigation__link")];
    const switchElement = document.getElementById("switch-1");

    const savedState = localStorage.getItem("darkModeEnabled");
    if (savedState === "true") {
        switchElement.checked = true;
        activateDarkMode(layoutElements);
    }

    switchElement.addEventListener("change", () => {
        const isChecked = switchElement.checked;
        localStorage.setItem("darkModeEnabled", isChecked);

        if (isChecked) {
            activateDarkMode(layoutElements);
        } else {
            deactivateDarkMode(layoutElements);
        }
    });
});


function activateDarkMode(layoutElements) {
    layoutElements.forEach(layoutElement => {
        if (layoutElement) {
            layoutElement.classList.add("dark-mode");
        }
    });
}

function deactivateDarkMode(layoutElements) {
    layoutElements.forEach(layoutElement => {
        if (layoutElement) {
            layoutElement.classList.remove("dark-mode");
        }
    });
}


async function DeleteAll() {
    const result = await showQuestion("Alle Daten löschen", "Möchtest du wirklich alle Daten löschen?");

    if (result) {
        let request = indexedDB.open("MyDatabase", 1);

        request.onerror = function (event) {
            console.error("Fehler beim Öffnen der Datenbank: ", event.target.error);
        };

        request.onsuccess = function (event) {
            let db = event.target.result;
            let transaction = db.transaction(["people"], "readwrite");
            let objectStore = transaction.objectStore("people");

            let clearRequest = objectStore.clear();

            clearRequest.onsuccess = function () {
                showMessage("Alle Daten wurden erfolgreich gelöscht.", "success", "Erfolgreich gelöscht!");
            };

            clearRequest.onerror = function (event) {
                console.error("Fehler beim Löschen der Daten:", event.target.error);
            };
        };
    }
}

function showMessage(message, icon, title) {
    Swal.fire({
        title: title,
        text: message,
        icon: icon,
        confirmButtonText: "Okay"
    });
}

async function showQuestion(title, text) {
    const result = await Swal.fire({
        title: title,
        text: text,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ja",
        cancelButtonText: "Nein"
    });
    return result.isConfirmed;
}

function initDatabase() {
    let request = indexedDB.open("MyDatabase", 2);

    request.onerror = function (event) {
        console.error("Datenbank konnte nicht geöffnet werden: ", event.target.error);
    };

    request.onsuccess = function (event) {
        let db = event.target.result;
    };

    request.onupgradeneeded = function (event) {
        let db = event.target.result;

        if (!db.objectStoreNames.contains("people")) {
            db.createObjectStore("people", { keyPath: "name" });
        }
    };
}
