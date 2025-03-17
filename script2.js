let name = 0;
var modal = document.getElementById("myModal");
var modalImg = document.getElementById("img01");
var captionText = document.getElementById("caption");

function ShowImage(img) {
    modal.style.display = "block";
    modalImg.src = img.src;
    captionText.innerHTML = img.alt;
}

var span = document.getElementsByClassName("close")[0];

span.onclick = function () {
    modal.style.display = "none";
}


document.addEventListener("DOMContentLoaded", function () {
    initDatabase();
    name = decodeURIComponent(window.location.search.substring(1)).replaceAll("-", " ");

    let request = indexedDB.open("MyDatabase", 1);

    request.onsuccess = function (event) {
        let db = event.target.result;
        let transaction = db.transaction(["people"], "readonly");
        let store = transaction.objectStore("people");

        let getRequest = store.get(name);

        getRequest.onsuccess = function () {
            if (getRequest.result) {
                document.title = "Geburtstagskalender | " + getRequest.result.name;
                document.getElementById("name").innerHTML = getRequest.result.name;
                document.getElementById("picture").src = getRequest.result.picture || "img/NoPerson.png";
                document.getElementById("birthday").innerHTML = formatDate(getRequest.result.birthdate);
                document.getElementById("age").innerHTML = getAge(getRequest.result.birthdate);
                document.getElementById("days").innerHTML = getDuration(getRequest.result.birthdate);
            } else {
                showErrorAndRedirect();
            }
        };

        getRequest.onerror = function () {
            console.log("Fehler beim Abrufen der Person");
        };
    };
});


function formatDate(dateString) {
    let [year, month, day] = dateString.split("-");
    return `${day}.${month}.${year}`;
}


function getAge(birthday) {
    let birthdayDate = new Date(birthday);
    let today = new Date();

    let age = today.getFullYear() - birthdayDate.getFullYear();

    let difference = today.getMonth() - birthdayDate.getMonth();
    if (difference < 0 || (difference === 0 && today.getDate() < birthdayDate.getDate())) {
        age--;
    }

    return age;
}


function getDuration(birthdate) {
    let today = new Date();
    let [year, month, day] = birthdate.split("-").map(Number);

    let nextBirthday = new Date(today.getFullYear(), month - 1, day);

    if (today.getDate() === day && today.getMonth() === month - 1) {
        return 0;
    }

    if (nextBirthday < today) {
        nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }

    let diffTime = nextBirthday - today;
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}


async function DeletePerson() {
    const answer = await showQuestion("Person löschen", "Möchtest du wirklich diese Person löschen?");

    if (answer) {
        let request = indexedDB.open("MyDatabase", 1);

        request.onsuccess = function (event) {
            let db = event.target.result;
            let transaction = db.transaction("people", "readwrite");
            let store = transaction.objectStore("people");

            let deleteRequest = store.delete(name);

            deleteRequest.onsuccess = function () {
                window.location.href = "manage.html";
            };

            deleteRequest.onerror = function () {
                console.log("Fehler beim Löschen der Person.");
            };
        };
    }
}


async function EditPerson() {
    let regex = /[<>\/\\;{}()\[\]=]/;
    let KeyDB = document.getElementById("name").innerHTML;
    let key = document.getElementById("name").innerHTML;
    let name = await Ask("Bitte gebe einen neuen Namen ein:", key);

    if (name) {
        name = name.trim();
    }

    if (!regex.test(name) && name.length > 1 && name.length < 25) {
        key = document.getElementById("birthday").innerHTML;
        let birthday = await Ask("Bitte gebe ein Geburtsdatum ein:", key);

        if (birthday && validateBirthday(birthday)) {
            birthday = convertDateFormat(birthday);
            let picture = await AskPicture("Bitte lade ein Bild hoch:");

            if (picture !== null) {
                let pictureData = null;
                if (picture !== undefined) {
                    pictureData = await convertToBase64(picture);
                }

                let newValues = {
                    name: name,
                    birthdate: birthday,
                    picture: pictureData,
                    pictureType: picture ? picture.type : null
                };

                updatePerson(KeyDB, newValues)
                    .then(window.location.href = "open.html?" + name)
                    .catch(console.error);
            } else {
                showMessage("Ungültige Daten. Bitte überprüfe deine Eingaben.", "error", "fehlerhafte Eingaben");
            }
        } else {
            showMessage("Ungültige Daten. Bitte überprüfe deine Eingaben.", "error", "fehlerhafte Eingaben");
        }
    } else {
        showMessage("Ungültige Daten. Bitte überprüfe deine Eingaben.", "error", "fehlerhafte Eingaben");
    }
}

function convertDateFormat(dateString) {
    const parts = dateString.split(".");
    if (parts.length !== 3) return null;

    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];

    return `${year}-${month}-${day}`;
}

function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}

function updatePerson(KeyDB, newValues) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("MyDatabase", 1);

        request.onerror = () => reject("Fehler beim Öffnen der IndexedDB");

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(["people"], "readwrite");
            const store = transaction.objectStore("people");

            const getRequest = store.get(KeyDB);

            getRequest.onsuccess = () => {
                let person = getRequest.result;

                if (!person) {
                    reject("Kein Eintrag mit diesem Schlüssel gefunden");
                    return;
                }

                const deleteRequest = store.delete(KeyDB);

                deleteRequest.onsuccess = () => {
                    Object.assign(person, newValues);
                    const addRequest = store.add(person);

                    addRequest.onsuccess = () => resolve("Daten erfolgreich aktualisiert");
                    addRequest.onerror = () => reject("Fehler beim Speichern der neuen Daten");
                };

                deleteRequest.onerror = () => reject("Fehler beim Entfernen des alten Eintrags");
            };

            getRequest.onerror = () => reject("Fehler beim Abrufen des Eintrags");
        };
    });
}


function validateBirthday(birthday) {
    const regex = /^\d{2}\.\d{2}\.\d{4}$/;
    if (!regex.test(birthday)) {
        return false;
    }

    const [day, month, year] = birthday.split('.').map(num => parseInt(num, 10));
    const birthdayDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birthdayDate > today) {
        return false;
    }

    return true;
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

async function Ask(title, key) {
    const placeholder = key;

    const { value } = await Swal.fire({
        title: title,
        input: "text",
        inputPlaceholder: placeholder,
        inputValue: key,
        showCancelButton: true,
        confirmButtonText: "Speichern",
        cancelButtonText: "Abbrechen"
    });

    return value;
}


async function AskPicture(title) {
    const { value } = await Swal.fire({
        title: title,
        input: "file",
        showCancelButton: true,
        confirmButtonText: "Speichern",
        cancelButtonText: "Abbrechen",
        inputAttributes: {
            accept: "image/*",
            "aria-label": "Wähle ein Bild"
        }
    });

    if (value instanceof File) {
        if (value.type.startsWith("image/")) {
            return value;
        } else {
            return null;
        }
    } else {
        return undefined;
    }
}

async function showErrorAndRedirect() {
    await Swal.fire({
        title: "Fehler",
        text: "Diese Person konnte nicht gefunden werden.",
        icon: "error",
        confirmButtonText: "OK"
    });

    window.location.href = "manage.html";
}

document.addEventListener("DOMContentLoaded", () => {
    initDatabase();
    const layoutElements = [...document.querySelectorAll("img"), ...document.querySelectorAll("h3"), document.querySelector(".mdl-layout"), ...document.querySelectorAll(".text"), document.querySelector(".mdl-switch__label"), document.querySelector(".mdl-layout__drawer"), ...document.querySelectorAll(".mdl-layout-title"), ...document.querySelectorAll(".mdl-navigation__link")];

    const savedState = localStorage.getItem("darkModeEnabled");
    if (savedState === "true") {
        activateDarkMode(layoutElements);
    }
});

function activateDarkMode(layoutElements) {
    layoutElements.forEach(layoutElement => {
        if (layoutElement) {
            layoutElement.classList.add("dark-mode");
        }
    });
}

function initDatabase() {
    let request = indexedDB.open("MyDatabase", 1);

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
