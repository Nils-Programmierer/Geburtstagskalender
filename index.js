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



document.addEventListener("DOMContentLoaded", function() {
    let request = indexedDB.open("MyDatabase", 1);

    request.onsuccess = function (event) {
        let db = event.target.result;
        let transaction = db.transaction("people", "readonly");
        let objectStore = transaction.objectStore("people");
        let getAllRequest = objectStore.getAll();


        getAllRequest.onsuccess = function () {
            const todayContainer = document.getElementById("today");
            const soonContainer = document.getElementById("soon");
            todayContainer.innerHTML = "";
            soonContainer.innerHTML = "";

            getAllRequest.result.forEach(person => {
                const diffDays = getDuration(person.birthdate);

                if (diffDays === 0) {
                    todayContainer.innerHTML += `
                    <div class="container" onclick="window.location.href='open.html?${person.name.replaceAll(" ", "-")}'">
                        <div class="flex">
                            <img src="${person.picture && person.picture.trim() !== '' ? person.picture : 'img/NoPerson.png'}" alt="${person.name}" class="Profile-Picture" onclick="event.stopPropagation(); ShowImage(this);">
                            <div class="flex">
                                <div class="block">
                                    <h4>${person.name}</h4>
                                    <div class="text">
                                        Heute
                                    </div>
                                </div>
                            </div>
                            <div class="Align-Middle">
                                <div class="age">
                                    ${getAge(person.birthdate)}
                                </div>
                            </div>
                        </div>
                    </div>`;
                } else if (diffDays <= 14) {
                    soonContainer.innerHTML += `
                    <div class="container" onclick="window.location.href='open.html?${person.name.replaceAll(" ", "-")}'" id="${diffDays}">
                        <div class="flex">
                            <img src="${person.picture && person.picture.trim() !== '' ? person.picture : 'img/NoPerson.png'}" alt="${person.name}" class="Profile-Picture" onclick="event.stopPropagation(); ShowImage(this);">
                            <div class="flex">
                                <div class="block">
                                    <h4>${person.name}</h4>
                                    <div class="text">
                                        In ${diffDays} ${diffDays === 1 ? "Tag" : "Tagen"}
                                    </div>
                                </div>
                            </div>
                            <div class="Align-Middle">
                                <div class="age">
                                    ${getAge(person.birthdate)}
                                </div>
                            </div>
                        </div>
                    </div>`;
                }
            });
            sortContainersById();
        };

        getAllRequest.onerror = function () {
            console.error("Fehler beim Abrufen der Daten");
        };
    };
});

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

function sortContainersById() {
    let content = document.getElementById("soon");
    let containers = Array.from(content.children);

    containers.sort((a, b) => {
        let idA = parseInt(a.id.replace(/\D/g, "")) || 0;
        let idB = parseInt(b.id.replace(/\D/g, "")) || 0;
        return idA - idB;
    });

    containers.forEach(container => content.appendChild(container));
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
