function checkEnter(event) {
    if (event.key === "Enter") {
        const contentContainer = document.getElementById("content");
        let search = document.getElementById("waterfall-exp").value.trim();;

        if (search.length > 0) {
            const searchLower = search.toLowerCase();
            const containers = Array.from(contentContainer.children);

            containers.sort((a, b) => {
                const nameA = a.getAttribute("name")?.toLowerCase() || "";
                const nameB = b.getAttribute("name")?.toLowerCase() || "";
                const matchA = nameA.includes(searchLower);
                const matchB = nameB.includes(searchLower);

                return matchB - matchA;
            });

            containers.forEach(container => contentContainer.appendChild(container));
        } else {
            sortContainersById();
        }
    }
}


function Show() {
    let request = indexedDB.open("MyDatabase", 1);

    request.onsuccess = function (event) {
        let db = event.target.result;
        let transaction = db.transaction("people", "readonly");
        let objectStore = transaction.objectStore("people");
        let getAllRequest = objectStore.getAll();


        getAllRequest.onsuccess = function () {
            const content = document.getElementById("content");

            getAllRequest.result.forEach(person => {
                let age = getAge(person.birthdate);
                let duration = getDuration(person.birthdate);

                content.innerHTML += `
                    <div class="container" onclick="window.location.href='open.html?${person.name.replaceAll(" ", "-")}'" id="${duration}" name="${person.name}">
                        <div class="flex">
                            <img src="${person.picture && person.picture.trim() !== '' ? person.picture : 'img/NoPerson.png'}" alt="${person.name}" class="Picture">
                            <div class="flex">
                                <div class="block">
                                    <h4>${person.name}</h4>
                                    <div class="text">
                                        In ${duration} ${duration === 1 ? "Tag" : "Tagen"}
                                    </div>
                                </div>
                            </div>
                            <div class="Align-Middle">
                                <div class="age">
                                    ${age}
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
            sortContainersById();
            document.getElementById("loading").innerHTML = "";
        };

        getAllRequest.onerror = function () {
            console.error("Fehler beim Abrufen der Daten");
        };
    };
}


function sortContainersById() {
    let content = document.getElementById("content");
    let containers = Array.from(content.children);

    containers.sort((a, b) => {
        let idA = parseInt(a.id.replace(/\D/g, "")) || 0;
        let idB = parseInt(b.id.replace(/\D/g, "")) || 0;
        return idA - idB;
    });

    containers.forEach(container => content.appendChild(container));
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


function Add() {
    let name = document.getElementById("name").value.trim();
    let birthdate = document.getElementById("birthdate").value;
    let fileInput = document.getElementById("picture");
    let file = fileInput.files[0];
    let isValidFile = !file || (file && file.type.startsWith("image/"));
    let regex = /[<>\/\\;{}()\[\]=]/;


    if (!regex.test(name) && name.length > 1 && name.length < 25 && birthdate && isValidFile) {
        let person = {
            name: name,
            birthdate: birthdate,
            picture: null,
            pictureType: file ? file.type : null
        };

        if (file) {
            let reader = new FileReader();
            reader.onloadend = function () {
                person.picture = reader.result;
                checkIfNameExists(name, person);
            };
            reader.readAsDataURL(file);
        } else {
            checkIfNameExists(name, person);
        }
    } else {
        showMessage("Ungültige Daten. Bitte überprüfe deine Eingaben.", "error", "fehlerhafte Eingaben");
    }
}



function checkIfNameExists(name, person) {
    let request = indexedDB.open("MyDatabase", 1);

    request.onsuccess = function (event) {
        let db = event.target.result;
        let transaction = db.transaction(["people"], "readonly");
        let objectStore = transaction.objectStore("people");

        let getRequest = objectStore.get(name);

        getRequest.onsuccess = function () {
            if (getRequest.result) {
                showMessage("Dieser Name existiert bereits in der Datenbank. Bitte wähle einen anderen.", "error", "Fehler beim Speichern!");
            } else {
                saveToIndexedDB(person);
            }
        };

        getRequest.onerror = function () {
            console.error("Fehler beim Abrufen des Eintrags:", getRequest.error);
        };
    };

    request.onerror = function (event) {
        console.error("Datenbank konnte nicht geöffnet werden: ", event.target.error);
    };
}



function saveToIndexedDB(person) {
    let request = indexedDB.open("MyDatabase", 1);

    request.onerror = function (event) {
        console.error("Datenbank konnte nicht geöffnet werden: ", event.target.error);
    };

    request.onsuccess = function (event) {
        let db = event.target.result;

        let transaction = db.transaction(["people"], "readwrite");
        let objectStore = transaction.objectStore("people");

        let addRequest = objectStore.add(person);
        addRequest.onsuccess = function () {
            showMessage("Daten wurden erfolgreich gespeichert!", "success", "Erfolgreich gespeichert!");
            document.getElementById("name").value = "";
            document.getElementById("birthdate").value = "";
            document.getElementById("picture").value = "";
        };

        addRequest.onerror = function (event) {
            console.error("Fehler beim Speichern der Daten:", event.target.error);
        };
    };

    request.onupgradeneeded = function (event) {
        let db = event.target.result;

        if (!db.objectStoreNames.contains("people")) {
            db.createObjectStore("people", { keyPath: "name" });
        }
    };
}



function showMessage(message, icon, title) {
    Swal.fire({
        title: title,
        text: message,
        icon: icon,
        confirmButtonText: "Okay"
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const layoutElements = [...document.querySelectorAll("input"), ...document.querySelectorAll("h3"), document.querySelector(".mdl-layout"), ...document.querySelectorAll(".text"), document.querySelector(".mdl-switch__label"), document.querySelector(".mdl-layout__drawer"), ...document.querySelectorAll(".mdl-layout-title"), ...document.querySelectorAll(".mdl-navigation__link")];

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